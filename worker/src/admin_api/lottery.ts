import { Context } from 'hono';
import { CONSTANTS } from '../constants';
import { getJsonSetting, saveSetting, jsonMessage } from '../utils';
import { LotterySettings } from '../models';

export default {
    getSettings: async (c: Context<HonoCustomType>) => {
        const settings = await getJsonSetting<LotterySettings>(c, CONSTANTS.LOTTERY_SETTINGS_KEY);
        // 默认配置
        const defaultSettings: LotterySettings = {
            enabled: false,
            costType: 'balance',
            costAmount: 100, // 1元
            prizes: []
        };
        return c.json(settings || defaultSettings);
    },

    saveSettings: async (c: Context<HonoCustomType>) => {
        const body = await c.req.json<LotterySettings>();
        if (!body) return jsonMessage("Invalid body", 400);

        // 简单校验
        if (body.costAmount < 0) return jsonMessage("Cost amount must be >= 0", 400);
        if (!Array.isArray(body.prizes)) return jsonMessage("Prizes must be an array", 400);

        await saveSetting(c, CONSTANTS.LOTTERY_SETTINGS_KEY, JSON.stringify(body));
        return c.json({ success: true });
    }
}