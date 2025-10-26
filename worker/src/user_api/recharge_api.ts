import { Context } from "hono";
import { RechargeCode } from "../models";
import i18n from "../i18n"; // 确保导入 i18n

export default {
    /**
     * User: 兑换卡密
     */
    redeemCode: async (c: Context<HonoCustomType>): Promise<Response> => {
        const { code } = await c.req.json();
        const userPayload = c.get("userPayload");
        const lang = c.get("lang") || c.env.DEFAULT_LANG;
        const msgs = i18n.getMessages(lang);

        if (!userPayload || !userPayload.user_id) {
            return c.text(msgs.UserNotLoginMsg || "Unauthorized", 401);
        }
        if (!code) {
            return c.text(msgs.InvalidRechargeCodeMsg || "Code is required", 400);
        }

        // 1. 查找卡密并校验状态
        const rechargeCode = await c.env.DB.prepare(
            `SELECT * FROM recharge_codes WHERE code = ?`
        ).bind(code).first<RechargeCode>();

        if (!rechargeCode) {
            return c.text(msgs.InvalidRechargeCodeMsg || "Invalid recharge code", 400);
        }
        if (rechargeCode.used_at) {
            return c.text(msgs.RechargeCodeUsedMsg || "Recharge code has already been used", 400);
        }
        if (rechargeCode.expires_at && new Date(rechargeCode.expires_at) < new Date()) {
            return c.text(msgs.RechargeCodeExpiredMsg || "Recharge code has expired", 400);
        }
        if (rechargeCode.value <= 0) {
            return c.text(msgs.InvalidRechargeCodeValueMsg || "Invalid recharge code value", 400);
        }

        const userId = userPayload.user_id;

        // 2. 兑换逻辑：更新用户余额并标记卡密已使用 (事务操作，确保原子性)
        try {
            const batchResult = await c.env.DB.batch([
                // 更新用户余额
                c.env.DB.prepare(
                    `UPDATE users SET balance = balance + ? WHERE id = ?`
                ).bind(rechargeCode.value, userId),

                // 标记卡密已使用，防止重复使用
                c.env.DB.prepare(
                    `UPDATE recharge_codes SET used_by = ?, used_at = datetime('now') WHERE id = ? AND used_at IS NULL`
                ).bind(userId, rechargeCode.id)
            ]);

            // 检查卡密是否真的被标记为使用了 (防止并发问题)
            if (!batchResult[1].success || batchResult[1].changes === 0) {
                 return c.text(msgs.RechargeCodeUsedMsg || "Recharge code has already been used", 400);
            }

        } catch (e) {
            console.error("Recharge failed in transaction", e);
            return c.text(msgs.ServerOperationFailedMsg || "Recharge failed due to a server error", 500);
        }
        
        // 3. 兑换成功，返回新的余额
        const newBalance = await c.env.DB.prepare(
            `SELECT balance FROM users WHERE id = ?`
        ).bind(userId).first<number>("balance");

        return c.json({ 
            success: true, 
            message: msgs.RechargeSuccessMsg || `Successfully redeemed ${rechargeCode.value} units.`,
            new_balance: newBalance 
        });
    }
}
