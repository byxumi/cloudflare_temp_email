import { Hono } from 'hono'
import { Context } from 'hono';
import { handleListQuery, commonGetUserRole } from '../common';
import { purchaseAddress } from './purchase';

// 辅助函数：元转分 (确保精度，比如 1.00 -> 100, 0.5 -> 50)
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

// 1. 生成卡密 (Admin) - 输入单位：元
api.post('/admin/billing/cards/generate', async (c) => {
    const { amount, count, expires_at, max_uses } = await c.req.json();
    const adminId = c.get('jwtPayload')?.user_id || 0;
    
    // 将元转换为分存储
    const amountInCents = toCents(amount);

    const stmt = c.env.DB.prepare(`
        INSERT INTO redemption_codes (code, amount, expires_at, max_uses, created_by) 
        VALUES (?, ?, ?, ?, ?)
    `);

    const codes = [];
    const batch = [];
    for (let i = 0; i < (count || 1); i++) {
        const code = generateCode();
        codes.push(code);
        batch.push(stmt.bind(code, amountInCents, expires_at, max_uses || 1, adminId));
    }
    
    await c.env.DB.batch(batch);
    return c.json({ success: true, codes });
});

// 2. 获取卡密列表 (Admin)
api.get('/admin/billing/cards', async (c) => {
    const { limit, offset } = c.req.query();
    // 返回数据库原始数据 (分)，前端如需显示元请自行 /100
    return await handleListQuery(c, 
        `SELECT * FROM redemption_codes`, 
        `SELECT count(*) as count FROM redemption_codes`, 
        [], limit, offset
    );
});

// 3. 设置域名价格 (Admin) - 输入单位：元
api.post('/admin/billing/prices', async (c) => {
    const { domain, role_text, price } = await c.req.json();
    
    // 将元转换为分存储
    const priceInCents = toCents(price);

    await c.env.DB.prepare(`
        INSERT INTO domain_prices (domain, role_text, price) 
        VALUES (?, ?, ?) 
        ON CONFLICT(domain, role_text) DO UPDATE SET price = ?, updated_at = datetime('now')
    `).bind(domain, role_text || 'default', priceInCents, priceInCents).run();
    return c.json({ success: true });
});

// 4. 获取域名价格列表 (Admin)
api.get('/admin/billing/prices', async (c) => {
    return await handleListQuery(c, `SELECT * FROM domain_prices`, `SELECT count(*) as count FROM domain_prices`, [], 100, 0);
});

// --- 用户 API ---

// 5. 用户查询余额 (User) - 返回单位：分
api.get('/user_api/billing/balance', async (c) => {
    const { user_id } = c.get('userPayload');
    const user = await c.env.DB.prepare(`SELECT balance FROM users WHERE id = ?`).bind(user_id).first();
    // 前端展示时需 /100
    return c.json({ balance: user?.balance || 0 });
});

// 6. 用户查询特定域名价格 (User) - 新增接口，用于前端弹窗实时显示
api.get('/user_api/billing/price', async (c) => {
    const { domain } = c.req.query();
    const { user_id } = c.get('userPayload');
    
    // 获取用户角色
    const userRoleObj = await commonGetUserRole(c, user_id);
    const roleText = userRoleObj?.role || 'default';

    // 查询价格 (分)
    let priceRecord = await c.env.DB.prepare(`
        SELECT price FROM domain_prices WHERE domain = ? AND role_text = ?
    `).bind(domain, roleText).first<{ price: number }>();

    // 如果特定角色没配置，查默认角色
    if (!priceRecord && roleText !== 'default') {
        priceRecord = await c.env.DB.prepare(`
            SELECT price FROM domain_prices WHERE domain = ? AND role_text = 'default'
        `).bind(domain).first<{ price: number }>();
    }

    const priceInCents = priceRecord ? priceRecord.price : 0;
    
    return c.json({ 
        domain, 
        price_cents: priceInCents, 
        price_yuan: (priceInCents / 100).toFixed(2) // 方便前端显示
    });
});

// 7. 用户充值卡密 (User)
api.post('/user_api/billing/redeem', async (c) => {
    const { code } = await c.req.json();
    const { user_id } = c.get('userPayload');

    // 查找卡密
    const card = await c.env.DB.prepare(`SELECT * FROM redemption_codes WHERE code = ?`).bind(code).first();
    
    if (!card) return c.text("Invalid code", 400);
    if (card.status !== 'active') return c.text("Code is not active", 400);
    if (card.used_count >= card.max_uses) return c.text("Code fully used", 400);
    if (card.expires_at && new Date(card.expires_at) < new Date()) return c.text("Code expired", 400);

    // 事务处理：增加余额 (单位分)，更新卡密状态，记录交易
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

// 8. 用户交易记录 (User)
api.get('/user_api/billing/transactions', async (c) => {
    const { user_id } = c.get('userPayload');
    const { limit, offset } = c.req.query();
    return await handleListQuery(c, 
        `SELECT * FROM transactions WHERE user_id = ?`, 
        `SELECT count(*) as count FROM transactions WHERE user_id = ?`, 
        [user_id], limit, offset
    );
});

// 9. 购买邮箱 (User)
api.post('/user_api/billing/buy_address', purchaseAddress);

export { api };