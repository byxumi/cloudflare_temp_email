import { Hono } from 'hono'
import { Context } from 'hono';
import { handleListQuery, commonGetUserRole, clearCacheByPrefix } from '../common';
import { purchaseAddress } from './purchase';
// [新增] 引入 AFF 处理函数
import { processAffRebate } from '../aff_utils';

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

// 内存缓存价格表 (60秒) - 纯内存，不写 KV
const PriceCache = new Map<string, { data: any, expiry: number }>();
const getPriceCache = (key: string) => {
    const item = PriceCache.get(key);
    if (item && item.expiry > Date.now()) return item.data;
    return null;
}
const setPriceCache = (key: string, data: any) => {
    PriceCache.set(key, { data, expiry: Date.now() + 60000 });
}
// 清除价格缓存
const clearPriceCache = () => {
    PriceCache.clear();
}

// 导出获取价格函数
export const getDomainPrice = async (c: Context<HonoCustomType>, domain: string, roleText: string = 'default'): Promise<number> => {
    // 1. 查询指定角色的价格
    let priceRecord = await c.env.DB.prepare(`
        SELECT price FROM domain_prices WHERE domain = ? AND role_text = ?
    `).bind(domain, roleText).first<{ price: number }>();

    // 2. 如果没找到且角色不是默认，则查询默认价格
    if (!priceRecord && roleText !== 'default') {
        priceRecord = await c.env.DB.prepare(`
            SELECT price FROM domain_prices WHERE domain = ? AND role_text = 'default'
        `).bind(domain).first<{ price: number }>();
    }

    return priceRecord ? priceRecord.price : 0;
}

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
        batch.push(stmt.bind(code, amountInCents, starts_at || null, expires_at || null, max_uses || 1, adminId));
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

// 3. 设置域名价格 (更新时清除缓存)
api.post('/admin/billing/prices', async (c) => {
    const { domain, role_text, price } = await c.req.json();
    const priceInCents = toCents(price);

    await c.env.DB.prepare(`
        INSERT INTO domain_prices (domain, role_text, price) 
        VALUES (?, ?, ?) 
        ON CONFLICT(domain, role_text) DO UPDATE SET price = ?, updated_at = datetime('now')
    `).bind(domain, role_text || 'default', priceInCents, priceInCents).run();
    
    clearPriceCache(); // 清除缓存
    return c.json({ success: true });
});

// 4. 获取域名价格列表
api.get('/admin/billing/prices', async (c) => {
    const { limit, offset, query } = c.req.query();
    let sql = `SELECT * FROM domain_prices`;
    let countSql = `SELECT count(*) as count FROM domain_prices`;
    const params: string[] = [];
    if (query) {
        sql += ` WHERE domain LIKE ?`;
        countSql += ` WHERE domain LIKE ?`;
        params.push(`%${query}%`);
    }
    return await handleListQuery(c, sql, countSql, params, limit, offset);
});

// 删除单个定价
api.delete('/admin/billing/prices/:id', async (c) => {
    const { id } = c.req.param();
    await c.env.DB.prepare(`DELETE FROM domain_prices WHERE id = ?`).bind(id).run();
    clearPriceCache();
    return c.json({ success: true });
});

// 批量删除定价
api.post('/admin/billing/prices/batch_delete', async (c) => {
    const { ids } = await c.req.json<{ ids: number[] }>();
    if (!ids || ids.length === 0) return c.text("Invalid IDs", 400);
    const placeholders = ids.map(() => '?').join(',');
    await c.env.DB.prepare(`DELETE FROM domain_prices WHERE id IN (${placeholders})`).bind(...ids).run();
    clearPriceCache();
    return c.json({ success: true });
});

// --- 批量操作 API (卡密) ---
api.post('/admin/billing/cards/batch_delete', async (c) => {
    const { ids } = await c.req.json<{ ids: number[] }>();
    if (!ids || ids.length === 0) return c.text("Invalid IDs", 400);
    const placeholders = ids.map(() => '?').join(',');
    const { success } = await c.env.DB.prepare(`DELETE FROM redemption_codes WHERE id IN (${placeholders})`).bind(...ids).run();
    return c.json({ success });
});

api.post('/admin/billing/cards/batch_status', async (c) => {
    const { ids, status } = await c.req.json<{ ids: number[], status: string }>();
    if (!ids || ids.length === 0) return c.text("Invalid IDs", 400);
    const placeholders = ids.map(() => '?').join(',');
    const { success } = await c.env.DB.prepare(`UPDATE redemption_codes SET status = ? WHERE id IN (${placeholders})`).bind(status, ...ids).run();
    return c.json({ success });
});

api.delete('/admin/billing/cards/:id', async (c) => {
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(`DELETE FROM redemption_codes WHERE id = ?`).bind(id).run();
    return c.json({ success });
});

api.post('/admin/billing/cards/:id/status', async (c) => {
    const { id } = c.req.param();
    const { status } = await c.req.json();
    const { success } = await c.env.DB.prepare(`UPDATE redemption_codes SET status = ? WHERE id = ?`).bind(status, id).run();
    return c.json({ success });
});

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
    const user = await c.env.DB.prepare(`SELECT balance, ifnull(checkin_balance, 0) as checkin_balance FROM users WHERE id = ?`).bind(user_id).first();
    return c.json({ 
        balance: user?.balance || 0,
        checkin_balance: user?.checkin_balance || 0 
    });
});

// 6. 用户查询特定域名价格
api.get('/user_api/billing/price', async (c) => {
    const { domain } = c.req.query();
    const { user_id } = c.get('userPayload');
    
    // 这里调用了 commonGetUserRole，它现在只使用 Memory+DB，不写 KV
    const userRoleObj = await commonGetUserRole(c, user_id); 
    const roleText = userRoleObj?.role || 'default';

    const priceInCents = await getDomainPrice(c, domain, roleText);
    
    return c.json({ 
        domain, 
        price_cents: priceInCents, 
        price_yuan: (priceInCents / 100).toFixed(2)
    });
});

// 7. 用户查询所有域名价格表 (使用缓存)
api.get('/user_api/billing/prices-list', async (c) => {
    const { user_id } = c.get('userPayload');
    const userRoleObj = await commonGetUserRole(c, user_id); 
    const roleText = userRoleObj?.role || 'default';

    const cacheKey = `PRICES:${roleText}`;
    const cached = getPriceCache(cacheKey);
    if (cached) return c.json({ results: cached });

    // 查询该角色和 default 的所有价格配置
    const { results } = await c.env.DB.prepare(`
        SELECT domain, price, role_text 
        FROM domain_prices 
        WHERE role_text = ? OR role_text = 'default'
    `).bind(roleText).all<any>();

    const priceMap = new Map<string, number>();
    results.filter(r => r.role_text === 'default').forEach(r => priceMap.set(r.domain, r.price));
    results.filter(r => r.role_text === roleText).forEach(r => priceMap.set(r.domain, r.price));

    const finalPrices = Array.from(priceMap.entries()).map(([domain, price]) => ({
        domain,
        price,
        price_yuan: (price / 100).toFixed(2)
    }));

    setPriceCache(cacheKey, finalPrices); // 写入内存缓存

    return c.json({ results: finalPrices });
});

// 8. 用户充值卡密
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
    if (card.starts_at && new Date(card.starts_at) > now) return c.text("Code not yet active", 400);
    if (card.expires_at && new Date(card.expires_at) < now) return c.text("Code expired", 400);

    try {
        await c.env.DB.batch([
            c.env.DB.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).bind(card.amount, user_id),
            c.env.DB.prepare(`UPDATE redemption_codes SET used_count = used_count + 1, status = CASE WHEN used_count + 1 >= max_uses THEN 'used' ELSE status END WHERE id = ?`).bind(card.id),
            c.env.DB.prepare(`INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'redeem', ?)`).bind(user_id, card.amount, `Redeem code ${code}`)
        ]);

        // [新增] 处理 AFF 返利 (放在数据库操作成功后)
        await processAffRebate(c, user_id, card.amount);

        return c.json({ success: true, amount: card.amount });
    } catch (e) {
        console.error("Redemption error:", e);
        return c.text("Redemption failed", 500);
    }
});

// 9. 用户交易记录
api.get('/user_api/billing/transactions', async (c) => {
    const { user_id } = c.get('userPayload');
    const { limit, offset } = c.req.query();
    return await handleListQuery(c, 
        `SELECT * FROM transactions WHERE user_id = ?`, 
        `SELECT count(*) as count FROM transactions WHERE user_id = ?`, 
        [user_id], limit, offset
    );
});

// 10. 购买邮箱
api.post('/user_api/billing/buy_address', purchaseAddress);

export { api };