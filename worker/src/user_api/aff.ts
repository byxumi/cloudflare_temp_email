import { Context, Hono } from "hono";
import { HonoCustomType } from "../types";
import { getAffSettings } from "../aff_utils";

const api = new Hono<HonoCustomType>();

// 获取 AFF 信息
api.get('/info', async (c) => {
    const user = c.get("userPayload");
    const { invitation_code, aff_balance } = await c.env.DB.prepare(
        `SELECT invitation_code, aff_balance FROM users WHERE id = ?`
    ).bind(user.user_id).first<any>() || {};

    const { count } = await c.env.DB.prepare(
        `SELECT count(*) as count FROM users WHERE invited_by = ?`
    ).bind(user.user_id).first<{ count: number }>() || { count: 0 };

    const settings = await getAffSettings(c);

    return c.json({
        invitation_code,
        aff_balance: aff_balance || 0,
        invite_count: count,
        settings
    });
});

// 生成/重置邀请码
api.post('/generate_code', async (c) => {
    const user = c.get("userPayload");
    // 生成 8 位大写字母+数字
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
    let code = "";
    for (let i = 0; i < 8; i++) code += charset.charAt(Math.floor(Math.random() * charset.length));

    try {
        await c.env.DB.prepare(
            `UPDATE users SET invitation_code = ? WHERE id = ? AND invitation_code IS NULL`
        ).bind(code, user.user_id).run();
        
        // 返回最新的
        const { invitation_code } = await c.env.DB.prepare(
            `SELECT invitation_code FROM users WHERE id = ?`
        ).bind(user.user_id).first<any>();
        
        return c.json({ invitation_code });
    } catch (e) {
        return c.text("Failed to generate code (might duplicate or already exists), please try again", 500);
    }
});

// 申请转入钱包
api.post('/withdraw', async (c) => {
    const user = c.get("userPayload");
    const { amount } = await c.req.json();
    const settings = await getAffSettings(c);

    if (!settings.enabled) return c.text("Affiliate program disabled", 403);
    if (amount < settings.minWithdraw) return c.text(`Minimum withdrawal is ${(settings.minWithdraw/100).toFixed(2)}`, 400);

    // 检查余额
    const userData = await c.env.DB.prepare(
        `SELECT aff_balance FROM users WHERE id = ?`
    ).bind(user.user_id).first<{ aff_balance: number }>();

    if (!userData || userData.aff_balance < amount) {
        return c.text("Insufficient affiliate balance", 400);
    }

    // 事务：扣除余额 -> 创建申请
    try {
        await c.env.DB.batch([
            c.env.DB.prepare(`UPDATE users SET aff_balance = aff_balance - ? WHERE id = ?`).bind(amount, user.user_id),
            c.env.DB.prepare(`INSERT INTO aff_withdrawals (user_id, amount) VALUES (?, ?)`).bind(user.user_id, amount),
            c.env.DB.prepare(`INSERT INTO aff_history (user_id, amount, type) VALUES (?, ?, 'withdraw')`).bind(user.user_id, amount)
        ]);
        return c.json({ success: true });
    } catch (e) {
        return c.text("Transaction failed", 500);
    }
});

// 获取记录
api.get('/history', async (c) => {
    const user = c.get("userPayload");
    const { limit, offset } = c.req.query();
    const { results } = await c.env.DB.prepare(
        `SELECT * FROM aff_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(user.user_id, limit || 20, offset || 0).all();
    return c.json(results);
});

export default api;