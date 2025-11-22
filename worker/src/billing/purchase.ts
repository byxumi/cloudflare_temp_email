import { Context } from 'hono';
import { newAddress, commonGetUserRole } from '../common';

export const purchaseAddress = async (c: Context<HonoCustomType>) => {
    const { name, domain } = await c.req.json();
    const { user_id } = c.get('userPayload');

    // 1. 获取角色
    const userRoleObj = await commonGetUserRole(c, user_id);
    const roleText = userRoleObj?.role || 'default';

    // 2. 查询价格 (数据库存的是分)
    let priceRecord = await c.env.DB.prepare(`
        SELECT price FROM domain_prices WHERE domain = ? AND role_text = ?
    `).bind(domain, roleText).first<{ price: number }>();

    if (!priceRecord && roleText !== 'default') {
        priceRecord = await c.env.DB.prepare(`
            SELECT price FROM domain_prices WHERE domain = ? AND role_text = 'default'
        `).bind(domain).first<{ price: number }>();
    }

    // 默认为 0 (免费)
    const price = priceRecord ? priceRecord.price : 0;

    // 3. 检查余额
    const user = await c.env.DB.prepare(`SELECT balance FROM users WHERE id = ?`).bind(user_id).first<{ balance: number }>();
    const currentBalance = user?.balance || 0;

    // 如果价格大于0且余额不足
    if (price > 0 && currentBalance < price) {
        return c.json({ 
            success: false, 
            message: `余额不足。需要 ${ (price/100).toFixed(2) } 元，当前余额 ${ (currentBalance/100).toFixed(2) } 元` 
        }, 402);
    }

    // 4. 创建地址
    try {
        // 复用 newAddress，注意：这里根据需求决定是否开启前缀
        // 通常付费/自主创建建议允许自定义，enablePrefix 设为 false
        const result = await newAddress(c, {
            name, 
            domain, 
            enablePrefix: false, 
            checkAllowDomains: true,
            enableCheckNameRegex: true
        });

        // 5. 扣费 (如果是免费的，就不扣)
        if (price > 0) {
            const addressIdRecord = await c.env.DB.prepare(`SELECT id FROM address WHERE name = ?`).bind(result.address).first<{ id: number }>();
            
            await c.env.DB.batch([
                c.env.DB.prepare(`UPDATE users SET balance = balance - ? WHERE id = ?`).bind(price, user_id),
                c.env.DB.prepare(`INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'purchase', ?)`).bind(user_id, -price, `购买邮箱: ${result.address}`),
                // 确保绑定
                c.env.DB.prepare(`INSERT INTO users_address (user_id, address_id) VALUES (?, ?) ON CONFLICT DO NOTHING`).bind(user_id, addressIdRecord?.id)
            ]);
        } else {
             // 即使免费也要确保绑定
             const addressIdRecord = await c.env.DB.prepare(`SELECT id FROM address WHERE name = ?`).bind(result.address).first<{ id: number }>();
             await c.env.DB.prepare(`INSERT INTO users_address (user_id, address_id) VALUES (?, ?) ON CONFLICT DO NOTHING`).bind(user_id, addressIdRecord?.id).run();
        }

        return c.json({ success: true, ...result });
    } catch (e) {
        return c.text((e as Error).message, 400);
    }
};