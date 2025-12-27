import { Context } from 'hono';
import { jsonMessage } from '../utils';

// 用户签到接口
export const checkin = async (c: Context<HonoCustomType>) => {
    const { user_id } = c.get('userPayload');

    // 1. 检查今日是否已签到 (使用 SQLite 的 date 函数比较日期)
    const existing = await c.env.DB.prepare(
        `SELECT id FROM checkin_history WHERE user_id = ? AND date(created_at) = date('now')`
    ).bind(user_id).first();

    if (existing) {
        // [修改] 返回 200 状态码，success: false，前端根据 message 提示
        return c.json({ success: false, message: "今天已经签到过了" });
    }

    // 2. 随机金额 1~3 分钱 (0.01 ~ 0.03 元)
    const amount = Math.floor(Math.random() * 3) + 1;

    // 3. 计算过期时间 (当前时间 + 3天)
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    try {
        await c.env.DB.batch([
            // 记录签到历史
            c.env.DB.prepare(
                `INSERT INTO checkin_history (user_id, amount, remaining_amount, expires_at) VALUES (?, ?, ?, ?)`
            ).bind(user_id, amount, amount, expiresAt),
            // 增加用户签到余额
            c.env.DB.prepare(
                `UPDATE users SET checkin_balance = ifnull(checkin_balance, 0) + ? WHERE id = ?`
            ).bind(amount, user_id),
            // 记录交易流水
            c.env.DB.prepare(
                `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'checkin', ?)`
            ).bind(user_id, amount, `每日签到奖励: ${(amount/100).toFixed(2)} 元`)
        ]);
    } catch (e) {
        return jsonMessage("签到失败: " + (e as Error).message, 500);
    }

    return c.json({ success: true, amount: amount, balance_type: 'checkin' });
};

// 清理过期签到余额逻辑 (供 scheduled.ts 调用)
export const cleanupExpiredCheckins = async (c: Context<HonoCustomType>) => {
    console.log("Starting check-in expiration cleanup...");
    
    // 1. 查找所有已过期且仍有剩余金额的记录
    const { results } = await c.env.DB.prepare(
        `SELECT user_id, SUM(remaining_amount) as total_expired 
         FROM checkin_history 
         WHERE expires_at < datetime('now') AND remaining_amount > 0 
         GROUP BY user_id`
    ).all<{ user_id: number, total_expired: number }>();

    if (!results || results.length === 0) {
        console.log("No expired check-ins found.");
        return;
    }

    const statements = [];

    // 2. 构建批量更新语句
    for (const row of results) {
        if (row.total_expired > 0) {
            // 扣除用户表中的签到余额
            statements.push(c.env.DB.prepare(
                `UPDATE users SET checkin_balance = MAX(0, checkin_balance - ?) WHERE id = ?`
            ).bind(row.total_expired, row.user_id));
            
            // 记录过期流水
            statements.push(c.env.DB.prepare(
                `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'checkin_expire', ?)`
            ).bind(row.user_id, -row.total_expired, `签到余额过期: -${(row.total_expired/100).toFixed(2)} 元`));
        }
    }

    // 3. 将历史表中的过期记录标记为已耗尽
    statements.push(c.env.DB.prepare(
        `UPDATE checkin_history SET remaining_amount = 0 WHERE expires_at < datetime('now') AND remaining_amount > 0`
    ));

    if (statements.length > 0) {
        await c.env.DB.batch(statements);
        console.log(`Cleaned up expired check-ins for ${results.length} users.`);
    }
};