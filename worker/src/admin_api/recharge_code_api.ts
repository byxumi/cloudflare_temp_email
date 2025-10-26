// worker/src/admin_api/recharge_code_api.ts (新文件)
import { Context } from "hono";
import { generateRandomPassword } from "../common"; // 假设这个函数可以生成随机字符串
import { RechargeCode } from "../models";
import { handleListQuery } from "../common"; // 假设 handleListQuery 可用

const generateCode = (): string => {
    // 生成一个 16 位的随机卡密
    return generateRandomPassword() + generateRandomPassword();
}

export default {
    /**
     * Admin: 创建新的卡密
     */
    createCode: async (c: Context<HonoCustomType>): Promise<Response> => {
        const { value, days, count } = await c.req.json(); // value: 增加的余额, days: 有效期天数, count: 生成数量
        const userPayload = c.get("userPayload");
        const lang = c.get("lang") || c.env.DEFAULT_LANG;
        const msgs = i18n.getMessages(lang);

        if (typeof value !== 'number' || value <= 0 || typeof count !== 'number' || count <= 0 || count > 100) {
            return c.text("Invalid value or count", 400);
        }

        const createdBy = userPayload ? `User:${userPayload.user_id}` : 'Admin';
        let expiresAt: string | null = null;
        if (typeof days === 'number' && days > 0) {
            expiresAt = `datetime('now', '+${days} day')`;
        }

        const codes = [];
        for (let i = 0; i < count; i++) {
            codes.push(generateCode());
        }

        const placeholders = codes.map(code => `(?, ?, ?, ?)`).join(', ');
        const bindings: (string | number)[] = [];
        
        codes.forEach(code => {
            bindings.push(code, value, createdBy, expiresAt ? expiresAt : null);
        });

        // 批量插入
        const sql = `INSERT INTO recharge_codes (code, value, created_by, expires_at) VALUES ${placeholders}`;
        
        try {
            const { success } = await c.env.DB.prepare(sql).bind(...bindings).run();
            if (!success) {
                return c.text("Failed to create codes", 500);
            }
        } catch (e) {
            console.error(e);
            return c.text("Failed to create codes (DB error)", 500);
        }

        return c.json({ success: true, count: count, codes: codes });
    },

    /**
     * Admin: 获取卡密列表
     */
    getCodes: async (c: Context<HonoCustomType>): Promise<Response> => {
        const { limit, offset, used } = c.req.query();
        let condition = "1=1";
        const params: string[] = [];

        if (used === 'true') {
            condition = "used_at IS NOT NULL";
        } else if (used === 'false') {
            condition = "used_at IS NULL";
        }

        return await handleListQuery(c,
            `SELECT * FROM recharge_codes WHERE ${condition}`,
            `SELECT count(*) as count FROM recharge_codes WHERE ${condition}`,
            params, limit, offset
        );
    }
}
