import { Context } from 'hono';

import { CONSTANTS } from '../constants';
import { getJsonSetting, saveSetting, checkUserPassword, getUserRoles } from '../utils';
import { UserSettings, GeoData, UserInfo, RoleAddressConfig } from "../models";
import { handleListQuery, clearUserRoleCache } from '../common'
import UserBindAddressModule from '../user_api/bind_address';
import i18n from '../i18n';

const toCents = (yuan: number | string) => Math.round(parseFloat(yuan.toString()) * 100);

const safeSave = async (c: any, key: string, value: any) => {
    if (!key) {
        console.error("Missing key for safeSave");
        return;
    }
    if (value === undefined || value === null) return;
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    await saveSetting(c, key, strValue);
}

export default {
    getSetting: async (c: Context<HonoCustomType>) => {
        const userSettings = await getJsonSetting<UserSettings>(c, CONSTANTS.USER_SETTINGS_KEY);
        const settings = new UserSettings(userSettings);

        const blockList = await getJsonSetting(c, CONSTANTS.ADDRESS_BLOCK_LIST_KEY) || [];
        const sendBlockList = await getJsonSetting(c, CONSTANTS.SEND_ADDRESS_BLOCK_LIST_KEY) || [];
        const verifiedAddressList = await getJsonSetting(c, CONSTANTS.VERIFIED_ADDRESS_LIST_KEY) || [];
        const fromBlockList = await getJsonSetting(c, CONSTANTS.FROM_BLOCK_LIST_KEY) || [];
        const noLimitSendAddressList = await getJsonSetting(c, CONSTANTS.NO_LIMIT_SEND_ADDRESS_LIST_KEY) || [];
        const emailRuleSettings = await getJsonSetting(c, CONSTANTS.EMAIL_RULE_SETTINGS_KEY) || {
            blockReceiveUnknowAddressEmail: false,
            emailForwardingList: []
        };

        return c.json({
            ...settings,
            blockList,
            sendBlockList,
            verifiedAddressList,
            fromBlockList,
            noLimitSendAddressList,
            emailRuleSettings,
            frontendVersion: settings.frontendVersion
        })
    },

    saveSetting: async (c: Context<HonoCustomType>) => {
        const body = await c.req.json();
        
        if (body.blockList) await safeSave(c, CONSTANTS.ADDRESS_BLOCK_LIST_KEY, body.blockList);
        if (body.sendBlockList) await safeSave(c, CONSTANTS.SEND_ADDRESS_BLOCK_LIST_KEY, body.sendBlockList);
        if (body.verifiedAddressList) await safeSave(c, CONSTANTS.VERIFIED_ADDRESS_LIST_KEY, body.verifiedAddressList);
        if (body.fromBlockList) await safeSave(c, CONSTANTS.FROM_BLOCK_LIST_KEY, body.fromBlockList);
        if (body.noLimitSendAddressList) await safeSave(c, CONSTANTS.NO_LIMIT_SEND_ADDRESS_LIST_KEY, body.noLimitSendAddressList);
        if (body.emailRuleSettings) await safeSave(c, CONSTANTS.EMAIL_RULE_SETTINGS_KEY, body.emailRuleSettings);

        const oldSettings = await getJsonSetting<UserSettings>(c, CONSTANTS.USER_SETTINGS_KEY);
        
        const frontendVersion = body.frontendVersion !== undefined 
            ? body.frontendVersion 
            : (oldSettings?.frontendVersion || "");

        const newSettings = new UserSettings({
            ...oldSettings,
            ...body,
            frontendVersion: frontendVersion
        });
        
        if (newSettings.enableMailVerify && !c.env.KV) {
            return c.text("Please enable KV first if you want to enable mail verify", 403)
        }
        if (newSettings.enableMailVerify && !newSettings.verifyMailSender) {
            return c.text("Please provide verifyMailSender", 400)
        }
        
        await safeSave(c, CONSTANTS.USER_SETTINGS_KEY, newSettings);
        
        return c.json({ success: true })
    },

    getUsers: async (c: Context<HonoCustomType>) => {
        const { limit, offset, query } = c.req.query();
        // [修改] 移除了 allow_batch 字段
        const sqlFields = `SELECT u.id as id, u.user_email, u.balance, u.created_at, u.updated_at,`
            + ` ur.role_text as role_text,`
            + ` (SELECT COUNT(*) FROM users_address WHERE user_id = u.id) AS address_count`
            + ` FROM users u`
            + ` LEFT JOIN user_roles ur ON u.id = ur.user_id`;
            
        if (query) {
            return await handleListQuery(c,
                `${sqlFields} where u.user_email like ?`,
                `SELECT count(*) as count FROM users where user_email like ?`,
                [`%${query}%`], limit, offset
            );
        }
        return await handleListQuery(c,
            sqlFields,
            `SELECT count(*) as count FROM users`,
            [], limit, offset
        );
    },
    createUser: async (c: Context<HonoCustomType>) => {
        const { email, password } = await c.req.json();
        if (!email || !password) {
            return c.text("Invalid email or password", 400)
        }
        const reqIp = c.req.raw.headers.get("cf-connecting-ip")
        const geoData = new GeoData(reqIp, c.req.raw.cf as any);
        const userInfo = new UserInfo(geoData, email);
        try {
            checkUserPassword(password);
            const { success } = await c.env.DB.prepare(
                `INSERT INTO users (user_email, password, user_info)`
                + ` VALUES (?, ?, ?)`
            ).bind(
                email, password, JSON.stringify(userInfo)
            ).run();
            if (!success) {
                return c.text("Failed to register", 500)
            }
        } catch (e) {
            const errorMsg = (e as Error).message;
            if (errorMsg && errorMsg.includes("UNIQUE")) {
                return c.text("User already exists", 400)
            }
            return c.text(`Failed to register: ${errorMsg}`, 500)
        }
        return c.json({ success: true })
    },
    deleteUser: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.req.param();
        const msgs = i18n.getMessagesbyContext(c);
        if (!user_id) return c.text(msgs.UserNotFoundMsg, 400);
        const { success } = await c.env.DB.prepare(
            `DELETE FROM users WHERE id = ?`
        ).bind(user_id).run();
        const { success: addressSuccess } = await c.env.DB.prepare(
            `DELETE FROM users_address WHERE user_id = ?`
        ).bind(user_id).run();
        await clearUserRoleCache(c, parseInt(user_id));
        if (!success || !addressSuccess) {
            return c.text("Failed to delete user", 500)
        }
        return c.json({ success: true })
    },
    resetPassword: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.req.param();
        const { password } = await c.req.json();
        const msgs = i18n.getMessagesbyContext(c);
        if (!user_id) return c.text(msgs.UserNotFoundMsg, 400);
        try {
            checkUserPassword(password);
            const { success } = await c.env.DB.prepare(
                `UPDATE users SET password = ? WHERE id = ?`
            ).bind(password, user_id).run();
            if (!success) {
                return c.text("Failed to reset password", 500)
            }
        } catch (e) {
            return c.text(`Failed to reset password: ${(e as Error).message}`, 500)
        }
        return c.json({ success: true });
    },
    updateUserRoles: async (c: Context<HonoCustomType>) => {
        const { user_id, role_text } = await c.req.json();
        if (!user_id) return c.text("Invalid user_id", 400);
        await clearUserRoleCache(c, user_id);
        if (!role_text) {
            const { success } = await c.env.DB.prepare(
                `DELETE FROM user_roles WHERE user_id = ?`
            ).bind(user_id).run();
            if (!success) {
                return c.text("Failed to update user roles", 500)
            }
            return c.json({ success: true })
        }
        const user_roles = getUserRoles(c);
        if (!user_roles.find((r) => r.role === role_text)) {
            return c.text("Invalid role_text", 400)
        }
        const { success } = await c.env.DB.prepare(
            `INSERT INTO user_roles (user_id, role_text)`
            + ` VALUES (?, ?)`
            + ` ON CONFLICT(user_id) DO UPDATE SET role_text = ?, updated_at = datetime('now')`
        ).bind(user_id, role_text, role_text).run();
        if (!success) {
            return c.text("Failed to update user roles", 500)
        }
        return c.json({ success: true })
    },
    bindAddress: async (c: Context<HonoCustomType>) => {
        const { user_email, address, user_id, address_id } = await c.req.json();
        const db_user_id = user_id ?? await c.env.DB.prepare(
            `SELECT id FROM users WHERE user_email = ?`
        ).bind(user_email).first<number | undefined | null>("id");
        const db_address_id = address_id ?? await c.env.DB.prepare(
            `SELECT id FROM address WHERE name = ?`
        ).bind(address).first<number | undefined | null>("id");
        return await UserBindAddressModule.bindByID(c, db_user_id, db_address_id);
    },
    getBindedAddresses: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.req.param();
        const results = await UserBindAddressModule.getBindedAddressesById(c, user_id);
        return c.json({ results: results });
    },
    getRoleAddressConfig: async (c: Context<HonoCustomType>) => {
        const value = await getJsonSetting<RoleAddressConfig>(c, CONSTANTS.ROLE_ADDRESS_CONFIG_KEY);
        const configs = value || {};
        return c.json({ configs });
    },
    saveRoleAddressConfig: async (c: Context<HonoCustomType>) => {
        const { configs } = await c.req.json<{ configs: RoleAddressConfig }>();
        await safeSave(c, CONSTANTS.ROLE_ADDRESS_CONFIG_KEY, configs);
        return c.json({ success: true });
    },
    topUpUser: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.req.param();
        const { amount } = await c.req.json();
        const amountInCents = toCents(amount);
        const adminId = c.get('jwtPayload')?.user_id || 0;
        if (!user_id || isNaN(amountInCents)) {
            return c.text("Invalid parameters", 400);
        }
        try {
            await c.env.DB.batch([
                c.env.DB.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).bind(amountInCents, user_id),
                c.env.DB.prepare(`INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'admin_topup', ?)`)
                    .bind(user_id, amountInCents, `Admin Topup by AdminID:${adminId}`)
            ]);
            return c.json({ success: true });
        } catch (e) {
            return c.text(`Top up failed: ${(e as Error).message}`, 500);
        }
    }
}