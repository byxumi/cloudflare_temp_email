import { Context } from 'hono';
import { newAddress, commonGetUserRole, getAddressPrefix } from '../common';

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

    // 3. 检查余额 (主余额 + 签到余额)
    const user = await c.env.DB.prepare(`SELECT balance, ifnull(checkin_balance, 0) as checkin_balance FROM users WHERE id = ?`).bind(user_id).first<{ balance: number, checkin_balance: number }>();
    const currentBalance = user?.balance || 0;
    const currentCheckinBalance = user?.checkin_balance || 0;
    const totalBalance = currentBalance + currentCheckinBalance;

    if (price > 0 && totalBalance < price) {
        return c.json({ 
            success: false, 
            message: `余额不足。需要 ${(price/100).toFixed(2)} 元，当前总余额 ${(totalBalance/100).toFixed(2)} 元` 
        }, 402);
    }

    // 4. 获取前缀
    const addressPrefix = await getAddressPrefix(c);

    // 5. 创建地址
    try {
        const result = await newAddress(c, {
            name, 
            domain, 
            enablePrefix: true,
            addressPrefix: addressPrefix,
            checkAllowDomains: true,
            enableCheckNameRegex: true
        });

        // 6. 扣费逻辑 (优先扣除签到余额)
        const addressIdRecord = await c.env.DB.prepare(`SELECT id FROM address WHERE name = ?`).bind(result.address).first<{ id: number }>();
        if (!addressIdRecord) throw new Error("Address created but id not found");

        const dbBatch = [];

        if (price > 0) {
            let remainPriceToPay = price;
            let deductCheckin = 0;
            let deductMain = 0;

            // A. 计算扣除额度
            if (currentCheckinBalance > 0) {
                if (currentCheckinBalance >= remainPriceToPay) {
                    deductCheckin = remainPriceToPay;
                    remainPriceToPay = 0;
                } else {
                    deductCheckin = currentCheckinBalance;
                    remainPriceToPay -= currentCheckinBalance;
                }
            }
            deductMain = remainPriceToPay;

            // B. 如果扣除了签到余额，需要更新 checkin_history 表 (扣除最早过期的)
            if (deductCheckin > 0) {
                // 查出该用户所有有效签到记录，按过期时间升序排列 (优先消耗快过期的)
                const { results: validCheckins } = await c.env.DB.prepare(
                    `SELECT id, remaining_amount FROM checkin_history WHERE user_id = ? AND remaining_amount > 0 ORDER BY expires_at ASC`
                ).bind(user_id).all<{ id: number, remaining_amount: number }>();

                let tempDeduct = deductCheckin;
                for (const record of validCheckins || []) {
                    if (tempDeduct <= 0) break;
                    const toDeductFromThis = Math.min(record.remaining_amount, tempDeduct);
                    
                    dbBatch.push(c.env.DB.prepare(
                        `UPDATE checkin_history SET remaining_amount = remaining_amount - ? WHERE id = ?`
                    ).bind(toDeductFromThis, record.id));
                    
                    tempDeduct -= toDeductFromThis;
                }
            }

            // C. 更新用户主表余额
            dbBatch.push(c.env.DB.prepare(
                `UPDATE users SET balance = balance - ?, checkin_balance = checkin_balance - ? WHERE id = ?`
            ).bind(deductMain, deductCheckin, user_id));

            // D. 记录交易流水
            dbBatch.push(c.env.DB.prepare(
                `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'purchase', ?)`
            ).bind(user_id, -price, `购买邮箱: ${result.address} (签到抵扣: ${(deductCheckin/100).toFixed(2)})`));
        }

        // 绑定地址
        dbBatch.push(c.env.DB.prepare(`INSERT INTO users_address (user_id, address_id) VALUES (?, ?) ON CONFLICT DO NOTHING`).bind(user_id, addressIdRecord.id));

        // 执行所有数据库操作
        await c.env.DB.batch(dbBatch);

        return c.json({ success: true, ...result });
    } catch (e) {
        return c.text((e as Error).message, 400);
    }
};