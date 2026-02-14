import { Context, Hono } from "hono";
import { HonoCustomType } from "../types";
import { saveSetting } from "../utils";
import { CONSTANTS } from "../constants";
import { getAffSettings } from "../aff_utils";

const api = new Hono<HonoCustomType>();

// 获取设置
api.get('/settings', async (c) => {
    return c.json(await getAffSettings(c));
});

// 保存设置
api.post('/settings', async (c) => {
    const settings = await c.req.json();
    await saveSetting(c, CONSTANTS.AFF_SETTINGS_KEY, JSON.stringify(settings));
    return c.json({ success: true });
});

// 获取提现列表
api.get('/withdrawals', async (c) => {
    const { status, limit, offset } = c.req.query();
    let sql = `SELECT w.*, u.user_email FROM aff_withdrawals w JOIN users u ON w.user_id = u.id`;
    const params: any[] = [];
    if (status) {
        sql += ` WHERE w.status = ?`;
        params.push(status);
    }
    sql += ` ORDER BY w.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit || 20, offset || 0);

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json(results);
});

// 审批提现
api.post('/withdrawals/:id/approve', async (c) => {
    const { id } = c.req.param();
    const record = await c.env.DB.prepare(`SELECT * FROM aff_withdrawals WHERE id = ? AND status = 'pending'`).bind(id).first<any>();
    if (!record) return c.text("Record not found or processed", 404);

    try {
        await c.env.DB.batch([
            c.env.DB.prepare(`UPDATE aff_withdrawals SET status = 'approved', updated_at = datetime('now') WHERE id = ?`).bind(id),
            // 假设 users 表有 balance 字段用于主余额
            c.env.DB.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).bind(record.amount, record.user_id)
        ]);
    } catch(e) {
        return c.text("Failed to approve, check DB schema for balance column", 500);
    }

    return c.json({ success: true });
});

// 拒绝提现
api.post('/withdrawals/:id/reject', async (c) => {
    const { id } = c.req.param();
    const record = await c.env.DB.prepare(`SELECT * FROM aff_withdrawals WHERE id = ? AND status = 'pending'`).bind(id).first<any>();
    if (!record) return c.text("Record not found or processed", 404);

    await c.env.DB.batch([
        // 1. 更新状态
        c.env.DB.prepare(`UPDATE aff_withdrawals SET status = 'rejected', updated_at = datetime('now') WHERE id = ?`).bind(id),
        // 2. 退回 AFF 余额
        c.env.DB.prepare(`UPDATE users SET aff_balance = aff_balance + ? WHERE id = ?`).bind(record.amount, record.user_id),
        // 3. 记录历史 (退款)
        c.env.DB.prepare(`INSERT INTO aff_history (user_id, amount, type) VALUES (?, ?, 'refund')`).bind(record.user_id, record.amount)
    ]);

    return c.json({ success: true });
});

// [新增] 获取邀请人列表 (统计)
api.get('/inviters', async (c) => {
    const { limit, offset, query } = c.req.query();
    let sql = `
        SELECT u.id, u.user_email, u.invitation_code, u.aff_balance, COUNT(i.id) as invite_count 
        FROM users u 
        JOIN users i ON u.id = i.invited_by 
    `;
    const params: any[] = [];
    if (query) {
        sql += ` WHERE u.user_email LIKE ? OR u.invitation_code LIKE ? `;
        params.push(`%${query}%`, `%${query}%`);
    }
    sql += ` GROUP BY u.id ORDER BY invite_count DESC LIMIT ? OFFSET ?`;
    params.push(limit || 20, offset || 0);

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json(results);
});

// [新增] 获取某人的受邀者列表
api.get('/inviters/:id/invitees', async (c) => {
    const { id } = c.req.param();
    const { results } = await c.env.DB.prepare(
        `SELECT id, user_email, created_at FROM users WHERE invited_by = ? ORDER BY created_at DESC`
    ).bind(id).all();
    return c.json(results);
});

export default api;