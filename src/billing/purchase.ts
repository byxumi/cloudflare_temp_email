import { Context } from 'hono';
import { newAddress, commonGetUserRole, getAddressPrefix } from '../common'; // [关键] 引入 getAddressPrefix

export const purchaseAddress = async (c: Context<HonoCustomType>) => {
    const { name, domain } = await c.req.json();
    const { user_id } = c.get('userPayload');

    if (!name || !domain) {
        return c.text("Name and domain are required", 400);
    }

    // 1. 获取用户角色
    const userRoleObj = await commonGetUserRole(c, user_id);
    const roleText = userRoleObj?.role || 'default';

    // 2. 查询价格
    let priceRecord = await c.env.DB.prepare(`
        SELECT price FROM domain_prices WHERE domain = ? AND role_text = ?
    `).bind(domain, roleText).first<{ price: number }>();

    if (!priceRecord && roleText !== 'default') {
        priceRecord = await c.env.DB.prepare(`
            SELECT price FROM domain_prices WHERE domain = ? AND role_text = 'default'
        `).bind(domain).first<{ price: number }>();
    }

    const price = priceRecord ? priceRecord.price : 0;

    // 3. 检查余额
    const user = await c.env.DB.prepare(`SELECT balance FROM users WHERE id = ?`).bind(user_id).first<{ balance: number }>();
    const currentBalance = user?.balance || 0;

    if (price > 0 && currentBalance < price) {
        return c.json({ 
            success: false, 
            message: `余额不足。需要 ${(price/100).toFixed(2)} 元，当前余额 ${(currentBalance/100).toFixed(2)} 元` 
        }, 402);
    }

    // 4. [关键修复] 获取该用户的角色前缀
    const addressPrefix = await getAddressPrefix(c);

    // 5. 创建地址
    try {
        const result = await newAddress(c, {
            name, 
            domain, 
            enablePrefix: true, // 开启前缀逻辑
            addressPrefix: addressPrefix, // [关键] 传入系统计算出的角色前缀
            checkAllowDomains: true,
            enableCheckNameRegex: true
        });

        // 6. 扣费 & 记录 & 绑定
        const addressIdRecord = await c.env.DB.prepare(`SELECT id FROM address WHERE name = ?`).bind(result.address).first<{ id: number }>();
        
        if (!addressIdRecord) throw new Error("Address created but id not found");

        if (price > 0) {
            await c.env.DB.batch([
                c.env.DB.prepare(`UPDATE users SET balance = balance - ? WHERE id = ?`).bind(price, user_id),
                c.env.DB.prepare(`INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'purchase', ?)`).bind(user_id, -price, `购买邮箱: ${result.address}`),
                c.env.DB.prepare(`INSERT INTO users_address (user_id, address_id) VALUES (?, ?) ON CONFLICT DO NOTHING`).bind(user_id, addressIdRecord.id)
            ]);
        } else {
             await c.env.DB.prepare(`INSERT INTO users_address (user_id, address_id) VALUES (?, ?) ON CONFLICT DO NOTHING`).bind(user_id, addressIdRecord.id).run();
        }

        return c.json({ success: true, ...result });
    } catch (e) {
        return c.text((e as Error).message, 400);
    }
};