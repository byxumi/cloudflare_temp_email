import { Hono } from 'hono'
import { Context } from 'hono';
import { handleListQuery, commonGetUserRole } from '../common';
import { purchaseAddress } from './purchase';

// 辅助函数：元转分
const toCents = (yuan: number | string) => Math.round(parseFloat(yuan.toString()) * 100);

// 辅助函数：生成随机卡密
const generateCode = (length = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const api = new Hono<HonoCustomType>();

// --- 管理员 API ---

// 1. 生成卡密
api.post('/admin/billing/cards/generate', async (c) => {
    const { amount, count, starts_at, expires_at, max_uses } = await c.req.json();
    const adminId = c.get('jwtPayload')?.user_id || 0;
    
    const amountInCents = toCents(amount);

    const stmt = c.env.DB.prepare(`
        INSERT INTO redemption_codes (code, amount, starts_at, expires_at, max_uses, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const codes = [];
    const batch = [];
    for (let i = 0; i < (count || 1); i++) {
        const code = generateCode();
        codes.push(code);
        batch.push(stmt.bind(
            code, 
            amountInCents, 
            starts_at || null, 
            expires_at || null, 
            max_uses || 1, 
            adminId
        ));
    }
    
    try {
        await c.env.DB.batch(batch);
        return c.json({ success: true, codes });
    } catch (e) {
        return c.text(`Generate failed: ${(e as Error).message}`, 500);
    }
});

// 2. 获取卡密列表
api.get('/admin/billing/cards', async (c) => {
    const { limit, offset } = c.req.query();
    return await handleListQuery(c, 
        `SELECT * FROM redemption_codes`, 
        `SELECT count(*) as count FROM redemption_codes`, 
        [], limit, offset
    );
});

// 3. 设置域名价格
api.post('/admin/billing/prices', async (c) => {
    const { domain, role_text, price } = await c.req.json();
    const priceInCents = toCents(price);

    await c.env.DB.prepare(`
        INSERT INTO domain_prices (domain, role_text, price) 
        VALUES (?, ?, ?) 
        ON CONFLICT(domain, role_text) DO UPDATE SET price = ?, updated_at = datetime('now')
    `).bind(domain, role_text || 'default', priceInCents, priceInCents).run();
    return c.json({ success: true });
});

// 4. 获取域名价格列表
api.get('/admin/billing/prices', async (c) => {
    return await handleListQuery(c, `SELECT * FROM domain_prices`, `SELECT count(*) as count FROM domain_prices`, [], 100, 0);
});

// --- 批量操作 API ---

// 批量删除卡密
api.post('/admin/billing/cards/batch_delete', async (c) => {
    const { ids } = await c.req.json<{ ids: number[] }>();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return c.text("Invalid IDs", 400);
    }
    const placeholders = ids.map(() => '?').join(',');
    const { success } = await c.env.DB.prepare(
        `DELETE FROM redemption_codes WHERE id IN (${placeholders})`
    ).bind(...ids).run();
    return c.json({ success });
});

// 批量更新状态
api.post('/admin/billing/cards/batch_status', async (c) => {
    const { ids, status } = await c.req.json<{ ids: number[], status: string }>();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return c.text("Invalid IDs", 400);
    }
    if (!['active', 'disabled'].includes(status)) {
        return c.text("Invalid status", 400);
    }

    const placeholders = ids.map(() => '?').join(',');
    const { success } = await c.env.DB.prepare(
        `UPDATE redemption_codes SET status = ? WHERE id IN (${placeholders})`
    ).bind(status, ...ids).run();
    
    return c.json({ success });
});

// 单个删除
api.delete('/admin/billing/cards/:id', async (c) => {
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(
        `DELETE FROM redemption_codes WHERE id = ?`
    ).bind(id).run();
    return c.json({ success });
});

// 单个更新状态
api.post('/admin/billing/cards/:id/status', async (c) => {
    const { id } = c.req.param();
    const { status } = await c.req.json();
    if (!['active', 'disabled'].includes(status)) return c.text("Invalid status", 400);
    const { success } = await c.env.DB.prepare(
        `UPDATE redemption_codes SET status = ? WHERE id = ?`
    ).bind(status, id).run();
    return c.json({ success });
});

// [新增] 管理员获取交易流水 (总账单)
api.get('/admin/billing/transactions', async (c) => {
    const { limit, offset } = c.req.query();
    return await handleListQuery(c, 
        `SELECT t.*, u.user_email FROM transactions t LEFT JOIN users u ON t.user_id = u.id`, 
        `SELECT count(*) as count FROM transactions`, 
        [], limit, offset
    );
});


// --- 用户 API ---

// 5. 用户查询余额
api.get('/user_api/billing/balance', async (c) => {
    const { user_id } = c.get('userPayload');
    const user = await c.env.DB.prepare(`SELECT balance FROM users WHERE id = ?`).bind(user_id).first();
    return c.json({ balance: user?.balance || 0 });
});

// 6. 用户查询特定域名价格
api.get('/user_api/billing/price', async (c) => {
    const { domain } = c.req.query();
    const { user_id } = c.get('userPayload');
    
    const userRoleObj = await commonGetUserRole(c, user_id);
    const roleText = userRoleObj?.role || 'default';

    let priceRecord = await c.env.DB.prepare(`
        SELECT price FROM domain_prices WHERE domain = ? AND role_text = ?
    `).bind(domain, roleText).first<{ price: number }>();

    if (!priceRecord && roleText !== 'default') {
        priceRecord = await c.env.DB.prepare(`
            SELECT price FROM domain_prices WHERE domain = ? AND role_text = 'default'
        `).bind(domain).first<{ price: number }>();
    }

    const priceInCents = priceRecord ? priceRecord.price : 0;
    
    return c.json({ 
        domain, 
        price_cents: priceInCents, 
        price_yuan: (priceInCents / 100).toFixed(2)
    });
});

// 7. 用户充值卡密
api.post('/user_api/billing/redeem', async (c) => {
    let { code } = await c.req.json();
    const { user_id } = c.get('userPayload');

    if (!code || typeof code !== 'string') return c.text("Invalid code format", 400);
    code = code.trim();

    const card = await c.env.DB.prepare(`SELECT * FROM redemption_codes WHERE code = ?`).bind(code).first();
    
    if (!card) return c.text("Invalid code", 400);
    if (card.status === 'disabled') return c.text("Code is paused", 400);
    if (card.status !== 'active') return c.text("Code is not active", 400);
    if (card.used_count >= card.max_uses) return c.text("Code fully used", 400);

    const now = new Date();
    if (card.starts_at && new Date(card.starts_at) > now) {
        return c.text("Code not yet active", 400);
    }
    if (card.expires_at && new Date(card.expires_at) < now) {
        return c.text("Code expired", 400);
    }

    try {
        await c.env.DB.batch([
            c.env.DB.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).bind(card.amount, user_id),
            c.env.DB.prepare(`UPDATE redemption_codes SET used_count = used_count + 1, status = CASE WHEN used_count + 1 >= max_uses THEN 'used' ELSE status END WHERE id = ?`).bind(card.id),
            c.env.DB.prepare(`INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'redeem', ?)`).bind(user_id, card.amount, `Redeem code ${code}`)
        ]);
        return c.json({ success: true, amount: card.amount });
    } catch (e) {
        return c.text("Redemption failed", 500);
    }
});

// 8. 用户交易记录 (个人账单)
api.get('/user_api/billing/transactions', async (c) => {
    const { user_id } = c.get('userPayload');
    const { limit, offset } = c.req.query();
    return await handleListQuery(c, 
        `SELECT * FROM transactions WHERE user_id = ?`, 
        `SELECT count(*) as count FROM transactions WHERE user_id = ?`, 
        [user_id], limit, offset
    );
});

// 9. 购买邮箱
api.post('/user_api/billing/buy_address', purchaseAddress);

export { api };