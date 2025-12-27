import { Context } from 'hono';
import { Jwt } from 'hono/utils/jwt'

import { UserSettings, RoleAddressConfig } from "../models";
import { getJsonSetting, jsonMessage } from "../utils" // 引入 jsonMessage
import { CONSTANTS } from "../constants";
import { unbindTelegramByAddress } from '../telegram_api/common';
import i18n from '../i18n';
import { updateAddressUpdatedAt, commonGetUserRole } from '../common';

const getMaxAddressCount = async (
    c: Context<HonoCustomType>,
    userRole: string | null | undefined,
    settings: UserSettings
): Promise<number> => {
    if (!userRole) return settings.maxAddressCount;
    const roleConfigs = await getJsonSetting<RoleAddressConfig>(c, CONSTANTS.ROLE_ADDRESS_CONFIG_KEY);
    if (!roleConfigs) return settings.maxAddressCount;
    const roleMaxCount = roleConfigs[userRole]?.maxAddressCount;
    if (typeof roleMaxCount !== 'number') return settings.maxAddressCount;
    if (roleMaxCount <= 0) return settings.maxAddressCount;
    return roleMaxCount;
};

const UserBindAddressModule = {
    bind: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.get("userPayload");
        const { address_id } = c.get("jwtPayload");
        return await UserBindAddressModule.bindByID(c, user_id, address_id)
    },
    bindByID: async (
        c: Context<HonoCustomType>,
        user_id: number | string, address_id: number | string
    ) => {
        if (!address_id || !user_id) {
            return c.text("No address or user token", 400)
        }
        // check if address exists
        const db_address_id = await c.env.DB.prepare(
            `SELECT id FROM address where id = ?`
        ).bind(address_id).first("id");
        if (!db_address_id) {
            return c.text("Address not found", 400)
        }
        // check if user exists
        const db_user_id = await c.env.DB.prepare(
            `SELECT id FROM users where id = ?`
        ).bind(user_id).first("id");
        if (!db_user_id) {
            return c.text("User not found", 400)
        }
        
        // 1. 检查是否已经绑定到当前用户
        const db_user_address_id = await c.env.DB.prepare(
            `SELECT user_id FROM users_address where user_id = ? and address_id = ?`
        ).bind(user_id, address_id).first("user_id");
        if (db_user_address_id) return c.json({ success: true })
        
        // check if binded address count
        const value = await getJsonSetting(c, CONSTANTS.USER_SETTINGS_KEY);
        const settings = new UserSettings(value);
        // get user role
        const userRole = c.get("userRolePayload");
        const maxAddressCount = await getMaxAddressCount(c, userRole, settings);
        if (maxAddressCount > 0) {
            const { count } = await c.env.DB.prepare(
                `SELECT COUNT(*) as count FROM users_address where user_id = ?`
            ).bind(user_id).first<{ count: number }>() || { count: 0 };
            if (count >= maxAddressCount) {
                return c.text("Max address count reached", 400)
            }
        }

        // 强制绑定逻辑：先删除可能存在的其他绑定
        await c.env.DB.prepare(
            `DELETE FROM users_address WHERE address_id = ?`
        ).bind(address_id).run();

        // bind
        try {
            const { success } = await c.env.DB.prepare(
                `INSERT INTO users_address (user_id, address_id) VALUES (?, ?)`
            ).bind(user_id, address_id).run();
            if (!success) {
                return c.text("Failed to bind", 500)
            }
        } catch (e) {
            return c.text("Failed to bind", 500)
        }
        return c.json({ success: true })
    },
    unbind: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.get("userPayload");
        const { address_id } = await c.req.json();
        if (!address_id || !user_id) {
            return c.text("Invalid address or user token", 400)
        }
        // check if address exists
        const db_address_id = await c.env.DB.prepare(
            `SELECT id FROM address where id = ?`
        ).bind(address_id).first("id");
        if (!db_address_id) {
            return c.text("Address not found", 400)
        }
        // check if user exists
        const db_user_id = await c.env.DB.prepare(
            `SELECT id FROM users where id = ?`
        ).bind(user_id).first("id");
        if (!db_user_id) {
            return c.text("User not found", 400)
        }
        try {
            const { success } = await c.env.DB.prepare(
                `DELETE FROM users_address where user_id = ? and address_id = ?`
            ).bind(user_id, address_id).run();
            if (!success) {
                return c.text("Failed to unbind", 500)
            }
        } catch (e) {
            return c.text("Failed to unbind", 500)
        }
        return c.json({ success: true })
    },
    getBindedAddresses: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.get("userPayload");
        const results = await UserBindAddressModule.getBindedAddressesById(c, user_id);
        return c.json({
            results: results,
        });
    },
    getBindedAddressListById: async (
        c: Context<HonoCustomType>, user_id: number | string
    ): Promise<string[]> => {
        const bindedAddressList = await UserBindAddressModule.getBindedAddressesById(c, user_id);
        return bindedAddressList.map((item) => item.name);
    },
    getBindedAddressesById: async (
        c: Context<HonoCustomType>, user_id: number | string
    ): Promise<{
        id: number;
        name: string;
        mail_count: number;
        send_count: number;
        created_at: string;
        updated_at: string;
        remark: string; // [新增]
    }[]> => {
        const msgs = i18n.getMessagesbyContext(c);
        if (!user_id) {
            throw new Error(msgs.UserNotFoundMsg);
        }
        // [修改] 查询中加入 remark
        const { results } = await c.env.DB.prepare(
            `SELECT a.*, ua.remark,`
            + ` (SELECT COUNT(*) FROM raw_mails WHERE address = a.name) AS mail_count,`
            + ` (SELECT COUNT(*) FROM sendbox WHERE address = a.name) AS send_count`
            + ` FROM address a `
            + ` JOIN users_address ua `
            + ` ON ua.address_id = a.id `
            + ` WHERE ua.user_id = ?`
            + ` ORDER BY a.id DESC`
        ).bind(user_id).all<{
            id: number;
            name: string;
            mail_count: number;
            send_count: number;
            created_at: string;
            updated_at: string;
            remark: string;
        }>();
        return results || [];
    },
    // [新增] 更新备注
    updateAddressRemark: async (
        c: Context<HonoCustomType>,
        user_id: number,
        address_id: number,
        remark: string
    ) => {
        try {
            await c.env.DB.prepare(
                `UPDATE users_address SET remark = ? WHERE user_id = ? AND address_id = ?`
            ).bind(remark, user_id, address_id).run();
            return c.json({ success: true });
        } catch (e) {
            console.error(e);
            return jsonMessage("Failed to update remark", 500);
        }
    },
    getBindedAddressJwt: async (c: Context<HonoCustomType>) => {
        const { address_id } = c.req.param();
        const { user_id } = c.get("userPayload");
        if (!address_id || !user_id) {
            return c.text("Invalid address or user token", 400)
        }
        const db_user_id = await c.env.DB.prepare(
            `SELECT user_id FROM users_address WHERE address_id = ? and user_id = ?`
        ).bind(address_id, user_id).first("user_id");
        if (!db_user_id) {
            return c.text("Address not binded", 400)
        }
        const name = await c.env.DB.prepare(
            `SELECT name FROM address WHERE id = ? `
        ).bind(address_id).first("name");
        const jwt = await Jwt.sign({
            address: name,
            address_id: address_id
        }, c.env.JWT_SECRET, "HS256")
        return c.json({
            jwt: jwt
        })
    },
    transferAddress: async (c: Context<HonoCustomType>) => {
        const { user_id } = c.get("userPayload");
        const { address_id, target_user_email } = await c.req.json();
        const address = await c.env.DB.prepare(
            `SELECT name FROM address where id = ?`
        ).bind(address_id).first<string>("name");
        if (!address) {
            return c.text("Address not found", 400)
        }
        const db_user_id = await c.env.DB.prepare(
            `SELECT id FROM users where id = ?`
        ).bind(user_id).first("id");
        if (!db_user_id) {
            return c.text("User not found", 400)
        }
        const target_user_id = await c.env.DB.prepare(
            `SELECT id FROM users where user_email = ?`
        ).bind(target_user_email).first<number>("id");
        if (!target_user_id) {
            return c.text("Target user not found", 400)
        }
        const value = await getJsonSetting(c, CONSTANTS.USER_SETTINGS_KEY);
        const settings = new UserSettings(value);
        const userRoleObj = await commonGetUserRole(c, target_user_id);
        const maxAddressCount = await getMaxAddressCount(c, userRoleObj?.role, settings);
        if (maxAddressCount > 0) {
            const { count } = await c.env.DB.prepare(
                `SELECT COUNT(*) as count FROM users_address where user_id = ?`
            ).bind(target_user_id).first<{ count: number }>() || { count: 0 };
            if (count >= maxAddressCount) {
                return c.text("Target User Max address count reached", 400)
            }
        }
        const db_user_address_id = await c.env.DB.prepare(
            `SELECT user_id FROM users_address where user_id = ? and address_id = ?`
        ).bind(user_id, address_id).first("user_id");
        if (!db_user_address_id) return c.text("Address not binded", 400)
        
        await unbindTelegramByAddress(c, address);
        
        try {
            await c.env.DB.prepare(
                `DELETE FROM users_address where user_id = ? and address_id = ?`
            ).bind(user_id, address_id).run();
        } catch (e) {
            return c.text("Failed to unbind user", 500)
        }
        await c.env.DB.prepare(
            `DELETE FROM address WHERE id = ? `
        ).bind(address_id).run();
        
        const { success: newAddressSuccess } = await c.env.DB.prepare(
            `INSERT INTO address(name) VALUES(?)`
        ).bind(address).run();
        if (!newAddressSuccess) {
            throw new Error("Failed to create address")
        }
        await updateAddressUpdatedAt(c, address);
        const new_address_id = await c.env.DB.prepare(
            `SELECT id FROM address WHERE name = ?`
        ).bind(address).first<number | null | undefined>("id");
        if (!new_address_id) {
            throw new Error("Failed to find new address id")
        }
        try {
            const { success } = await c.env.DB.prepare(
                `INSERT INTO users_address (user_id, address_id) VALUES (?, ?)`
            ).bind(target_user_id, new_address_id).run();
            if (!success) {
                return c.text("Failed to bind", 500)
            }
        } catch (e) {
            return c.text("Failed to bind", 500)
        }
        return c.json({ success: true })
    }
}

export default UserBindAddressModule;