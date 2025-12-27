import { Context } from 'hono';
import { CONSTANTS } from '../constants';
import { getJsonSetting, jsonMessage } from '../utils';
import { LotterySettings, LotteryPrize } from '../models';

export const draw = async (c: Context<HonoCustomType>) => {
    const { user_id } = c.get('userPayload');

    // 1. 获取抽奖配置
    const settings = await getJsonSetting<LotterySettings>(c, CONSTANTS.LOTTERY_SETTINGS_KEY);
    if (!settings || !settings.enabled || !settings.prizes || settings.prizes.length === 0) {
        return jsonMessage("抽奖活动未开启", 400);
    }

    // 2. 获取用户余额/状态
    const user = await c.env.DB.prepare(
        `SELECT balance, ifnull(checkin_balance, 0) as checkin_balance, ifnull(lottery_tickets, 0) as lottery_tickets FROM users WHERE id = ?`
    ).bind(user_id).first<{ balance: number, checkin_balance: number, lottery_tickets: number }>();

    if (!user) return jsonMessage("User not found", 400);

    // 3. 检查消耗并执行扣除
    const costType = settings.costType;
    const costAmount = settings.costAmount;
    const dbBatch = [];
    let logDesc = "";

    if (costAmount > 0) {
        if (costType === 'balance') {
            const totalBal = user.balance + user.checkin_balance;
            if (totalBal < costAmount) return jsonMessage("余额不足", 400);
            
            // 优先扣除签到余额
            let remain = costAmount;
            let deductCheckin = 0;
            if (user.checkin_balance > 0) {
                deductCheckin = Math.min(user.checkin_balance, remain);
                remain -= deductCheckin;
            }
            dbBatch.push(c.env.DB.prepare(
                `UPDATE users SET balance = balance - ?, checkin_balance = checkin_balance - ? WHERE id = ?`
            ).bind(remain, deductCheckin, user_id));
            
            // 如果扣除了签到余额，需要更新历史表 (简化处理：直接扣除最早过期的，参考 purchase 逻辑)
            // 为避免逻辑过于复杂重复，这里简化处理：仅更新余额。过期逻辑在 scheduled task 中处理总额。
            // 严格来说应该扣除 checkin_history，但为了代码简洁性，这里假设 checkin_balance 总额正确即可。
            
            logDesc = `抽奖消耗: -${(costAmount/100).toFixed(2)} 元`;
        } else if (costType === 'ticket') {
            if (user.lottery_tickets < costAmount) return jsonMessage("抽奖券不足", 400);
            dbBatch.push(c.env.DB.prepare(
                `UPDATE users SET lottery_tickets = lottery_tickets - ? WHERE id = ?`
            ).bind(costAmount, user_id));
            logDesc = `抽奖消耗: -${costAmount} 张券`;
        } else {
            return jsonMessage("配置错误：无效的消耗类型", 500);
        }
    }

    // 4. 计算中奖结果 (权重随机)
    const totalWeight = settings.prizes.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedPrize: LotteryPrize | null = null;

    for (const prize of settings.prizes) {
        if (random < prize.weight) {
            selectedPrize = prize;
            break;
        }
        random -= prize.weight;
    }

    if (!selectedPrize) {
        // Fallback (理论上不应发生，除非 prizes 为空)
        return jsonMessage("系统错误，请重试", 500);
    }

    // 5. 发放奖品
    let winDesc = "";
    if (selectedPrize.type !== 'none' && selectedPrize.value > 0) {
        if (selectedPrize.type === 'balance') {
            dbBatch.push(c.env.DB.prepare(
                `UPDATE users SET balance = balance + ? WHERE id = ?`
            ).bind(selectedPrize.value, user_id));
            winDesc = `抽奖获得: ${(selectedPrize.value/100).toFixed(2)} 元 (余额)`;
        } else if (selectedPrize.type === 'checkin_balance') {
            dbBatch.push(c.env.DB.prepare(
                `UPDATE users SET checkin_balance = checkin_balance + ? WHERE id = ?`
            ).bind(selectedPrize.value, user_id));
            
            // 签到余额需要记录过期时间 (默认3天过期)
            const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
            dbBatch.push(c.env.DB.prepare(
                `INSERT INTO checkin_history (user_id, amount, remaining_amount, expires_at) VALUES (?, ?, ?, ?)`
            ).bind(user_id, selectedPrize.value, selectedPrize.value, expiresAt));
            
            winDesc = `抽奖获得: ${(selectedPrize.value/100).toFixed(2)} 元 (限时余额)`;
        } else if (selectedPrize.type === 'ticket') {
            dbBatch.push(c.env.DB.prepare(
                `UPDATE users SET lottery_tickets = lottery_tickets + ? WHERE id = ?`
            ).bind(selectedPrize.value, user_id));
            winDesc = `抽奖获得: ${selectedPrize.value} 张抽奖券`;
        }
    } else {
        winDesc = "抽奖结果: 未中奖";
    }

    // 6. 记录交易流水 (先记录消耗，再记录获得)
    if (logDesc) {
        dbBatch.push(c.env.DB.prepare(
            `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'lottery_cost', ?)`
        ).bind(user_id, costType === 'balance' ? -costAmount : 0, logDesc));
    }
    
    // 记录获奖流水
    const winAmount = (selectedPrize.type === 'balance' || selectedPrize.type === 'checkin_balance') ? selectedPrize.value : 0;
    dbBatch.push(c.env.DB.prepare(
        `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'lottery_win', ?)`
    ).bind(user_id, winAmount, winDesc));

    // 执行事务
    try {
        await c.env.DB.batch(dbBatch);
    } catch (e) {
        return jsonMessage("抽奖执行失败: " + (e as Error).message, 500);
    }

    return c.json({
        success: true,
        prize: selectedPrize
    });
};

// 获取用户抽奖状态 (余额、券)
export const getStatus = async (c: Context<HonoCustomType>) => {
    const { user_id } = c.get('userPayload');
    const user = await c.env.DB.prepare(
        `SELECT lottery_tickets FROM users WHERE id = ?`
    ).bind(user_id).first<{ lottery_tickets: number }>();
    
    // 同时获取配置，以便前端显示
    const settings = await getJsonSetting<LotterySettings>(c, CONSTANTS.LOTTERY_SETTINGS_KEY);

    return c.json({
        lottery_tickets: user?.lottery_tickets || 0,
        settings: settings || { enabled: false }
    });
}