import { Context } from "hono";
import { HonoCustomType } from "./types";
import { CONSTANTS } from "./constants";
import { getJsonSetting } from "./utils";

export type AffSettings = {
    rate: number;         // 百分比 (0-100)
    minWithdraw: number;  // 最小提现金额 (分)
    enabled: boolean;
}

export const getAffSettings = async (c: Context<HonoCustomType>): Promise<AffSettings> => {
    const settings = await getJsonSetting<AffSettings>(c, CONSTANTS.AFF_SETTINGS_KEY);
    return {
        rate: settings?.rate || 10, // 默认 10%
        minWithdraw: settings?.minWithdraw || 100, // 默认 1元
        enabled: settings?.enabled ?? true
    };
}

export const processAffRebate = async (c: Context<HonoCustomType>, userId: number, amount: number) => {
    try {
        // 1. 检查设置
        const settings = await getAffSettings(c);
        if (!settings.enabled || settings.rate <= 0) return;

        // 2. 查找邀请人
        const user = await c.env.DB.prepare(
            `SELECT invited_by FROM users WHERE id = ?`
        ).bind(userId).first<{ invited_by: number }>();

        if (!user || !user.invited_by) return;

        // 3. 计算返利
        const rebate = Math.floor(amount * (settings.rate / 100));
        if (rebate <= 0) return;

        // 4. 更新邀请人余额并记录日志
        // 注意：这里更新的是 aff_balance，不是主余额
        await c.env.DB.batch([
            c.env.DB.prepare(
                `UPDATE users SET aff_balance = aff_balance + ? WHERE id = ?`
            ).bind(rebate, user.invited_by),
            c.env.DB.prepare(
                `INSERT INTO aff_history (user_id, source_user_id, amount, type) VALUES (?, ?, ?, 'rebate')`
            ).bind(user.invited_by, userId, rebate)
        ]);

        console.log(`Processed rebate: User ${userId} spent ${amount}, Inviter ${user.invited_by} got ${rebate}`);
    } catch (e) {
        console.error("Failed to process affiliate rebate", e);
    }
}