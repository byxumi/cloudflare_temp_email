import { Context } from 'hono';
import { Jwt } from 'hono/utils/jwt';
import { newAddress } from '../common';
import { getDomainPrice } from '../billing/index';
import { HonoCustomType } from '../types'; 
import { CONSTANTS } from '../constants'; 
import { getJsonSetting } from '../utils'; 
import { UserSettings } from '../models'; 

// 辅助函数：显式绑定地址到用户
const explicitBindAddress = async (c: Context<HonoCustomType>, userId: number, addressName: string) => {
    try {
        const address = await c.env.DB.prepare(
            `SELECT id FROM address WHERE name = ?`
        ).bind(addressName).first<{ id: number }>();

        if (address && address.id) {
            // 先尝试插入
            const { success } = await c.env.DB.prepare(
                `INSERT OR IGNORE INTO users_address(user_id, address_id) VALUES(?, ?)`
            ).bind(userId, address.id).run();

            // 如果插入没生效（说明已存在），则强制更新归属权（因为是刚创建的，肯定归当前用户）
            if (!success) {
                await c.env.DB.prepare(
                    `UPDATE users_address SET user_id = ? WHERE address_id = ?`
                ).bind(userId, address.id).run();
            }
        }
    } catch (e) {
        console.error(`Explicit bind failed for ${addressName}:`, e);
    }
}

export default {
    bind: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.get('userPayload');
        const currentUserId = Number(user_id); // 确保是数字类型
        
        let body: any = {};
        try {
            body = await c.req.json();
        } catch (e) {
            // Body 为空，忽略错误
        }
        
        const { name, domain } = body;

        // 1. 创建新邮箱模式
        if (name && domain) {
            const res = await newAddress(c, {
                name, domain,
                checkLengthByConfig: true,
                enableCheckNameRegex: true,
                checkAllowDomains: true,
                addressPrefix: null,
                userId: currentUserId
            });

            if (res.address) {
                await explicitBindAddress(c, currentUserId, res.address);
            }
            return res;
        }

        // 2. 绑定已有邮箱模式 (通过 Header JWT)
        const authHeader = c.req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const payload = await Jwt.verify(token, c.env.JWT_SECRET, "HS256");
                const addressId = Number(payload.address_id);
                const addressName = payload.address as string;

                if (!addressId) {
                    return c.text("Invalid token payload", 400);
                }

                // 检查现有绑定
                const existingBinding = await c.env.DB.prepare(
                    `SELECT user_id FROM users_address WHERE address_id = ?`
                ).bind(addressId).first<{ user_id: number }>();

                if (existingBinding) {
                    const boundUserId = Number(existingBinding.user_id);
                    if (boundUserId === currentUserId) {
                        return c.json({ success: true, address: addressName, message: "Already bound to you" });
                    } else {
                        // [关键修复]：如果已绑定给别人，但当前用户持有有效 JWT，则强制抢占/修复绑定关系
                        console.log(`Re-binding address ${addressId} from user ${boundUserId} to ${currentUserId} using valid credential`);
                        
                        const { success } = await c.env.DB.prepare(
                            `UPDATE users_address SET user_id = ? WHERE address_id = ?`
                        ).bind(currentUserId, addressId).run();

                        if (!success) return c.text("Failed to update binding", 500);

                        return c.json({ 
                            success: true, 
                            address: addressName, 
                            message: "Binding updated successfully" 
                        });
                    }
                } else {
                    // 没有绑定记录，直接插入
                    const { success } = await c.env.DB.prepare(
                        `INSERT INTO users_address(user_id, address_id) VALUES(?, ?)`
                    ).bind(currentUserId, addressId).run();

                    if (!success) return c.text("Failed to create binding", 500);

                    return c.json({ 
                        success: true, 
                        address: addressName, 
                        message: "Bound successfully" 
                    });
                }

            } catch (e) {
                console.error("Bind JWT Verify Error:", e);
                return c.text("Invalid token or signature", 401);
            }
        }

        return c.text("Invalid parameters or missing credentials", 400);
    },

    getBindedAddresses: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.get('userPayload');
        const results = await getBindedAddressesById(c, Number(user_id));
        return c.json({ results: results || [] });
    },

    getBindedAddressesById: async (c: Context<HonoCustomType>, user_id: number) => {
        return await getBindedAddressesById(c, user_id);
    },

    getBindedAddressJwt: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.get('userPayload');
        const { address_id } = c.req.param();
        const address = await c.env.DB.prepare(
            `SELECT a.* FROM address a`
            + ` JOIN users_address ua ON a.id = ua.address_id`
            + ` WHERE ua.user_id = ? AND a.id = ?`
        ).bind(user_id, address_id).first<{ id: number, name: string }>();
        
        if (!address) {
            return c.text("Address not found", 404);
        }
        
        const jwt = await Jwt.sign({
            address: address.name,
            address_id: address.id
        }, c.env.JWT_SECRET, "HS256");
        
        return c.json({
            jwt: jwt
        })
    },

    unbind: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.get('userPayload');
        const { address_id } = await c.req.json();
        const { success } = await c.env.DB.prepare(
            `DELETE FROM users_address WHERE user_id = ? AND address_id = ?`
        ).bind(user_id, address_id).run();
        
        if (!success) {
            return c.text("Failed to unbind address", 500)
        }
        return c.json({ success: true })
    },

    transferAddress: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.get('userPayload');
        const { address_id, target_user_email } = await c.req.json();
        
        if (!address_id || !target_user_email) {
            return c.text("Invalid parameters", 400);
        }
        
        const targetUser = await c.env.DB.prepare(
            `SELECT id FROM users WHERE user_email = ?`
        ).bind(target_user_email).first<{ id: number }>();
        
        if (!targetUser) {
            return c.text("Target user not found", 404);
        }
        
        const sourceAddress = await c.env.DB.prepare(
            `SELECT id FROM users_address WHERE user_id = ? AND address_id = ?`
        ).bind(user_id, address_id).first();
        
        if (!sourceAddress) {
            return c.text("Address not belongs to you", 403);
        }
        
        const { success } = await c.env.DB.prepare(
            `UPDATE users_address SET user_id = ? WHERE address_id = ? AND user_id = ?`
        ).bind(targetUser.id, address_id, user_id).run();
        
        if (!success) {
            return c.text("Failed to transfer address", 500);
        }
        
        return c.json({ success: true })
    },

    updateAddressRemark: async (c: Context<HonoCustomType>, user_id: number, address_id: number, remark: string) => {
        const { success } = await c.env.DB.prepare(
            `UPDATE users_address SET remark = ? WHERE user_id = ? AND address_id = ?`
        ).bind(remark, user_id, address_id).run();
        
        if (!success) return c.text("Failed", 500);
        return c.json({ success: true });
    }
}

// 辅助函数
export const getBindedAddressesById = async (c: Context<HonoCustomType>, user_id: number) => {
    const { results } = await c.env.DB.prepare(
        `SELECT a.id, a.name, ua.remark FROM address a`
        + ` JOIN users_address ua ON a.id = ua.address_id`
        + ` WHERE ua.user_id = ?`
        + ` ORDER BY ua.id DESC`
    ).bind(user_id).all<{ id: number, name: string, remark: string }>();
    return results || [];
}