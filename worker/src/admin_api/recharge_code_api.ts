import { Context } from 'hono';
import { HonoCustomType } from '../types';
import { Model } from '../models';
import { jsonResponse } from '../utils';
import { generateRandomString } from '../common';

export async function adminCreateRechargeCode(c: Context<HonoCustomType>): Promise<Response> {
    const { value, count } = await c.req.json();
    if (!value || typeof value !== 'number' || value <= 0 || !count || typeof count !== 'number' || count <= 0) {
        return jsonResponse({ message: 'Invalid value or count' }, 400);
    }

    const model = new Model(c.env.DB);
    const now = Math.floor(Date.now() / 1000);
    const codes = [];
    
    for (let i = 0; i < count; i++) {
        codes.push({
            code: generateRandomString(12),
            value: value,
            created_at: now,
        });
    }

    // 批量插入
    const promises = codes.map(code => model.insertRechargeCode(code));
    await Promise.all(promises);

    return jsonResponse({ message: `Successfully created ${count} codes.` });
}

export async function adminListRechargeCodes(c: Context<HonoCustomType>): Promise<Response> {
    const { limit, offset } = c.req.query();
    const limitNum = parseInt(limit || '10');
    const offsetNum = parseInt(offset || '0');

    const model = new Model(c.env.DB);
    const codes = await model.getRechargeCodes(limitNum, offsetNum);
    const count = await model.countRechargeCodes();

    return jsonResponse({ results: codes, count });
}

export async function adminDeleteRechargeCode(c: Context<HonoCustomType>): Promise<Response> {
    const { code } = await c.req.json();
    if (!code) {
        return jsonResponse({ message: 'Code is required' }, 400);
    }

    const model = new Model(c.env.DB);
    const result = await model.deleteRechargeCode(code);

    if (result.success) {
        return jsonResponse({ message: 'Code deleted successfully' });
    } else {
        return jsonResponse({ message: 'Failed to delete code' }, 500);
    }
}