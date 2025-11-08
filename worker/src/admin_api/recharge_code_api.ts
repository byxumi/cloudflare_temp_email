import { Env, RechargeCode } from '../types';
import { Model } from '../models';
import { jsonResponse } from '../utils';
import { generateRandomString } from '../common';

export async function adminCreateRechargeCode(request: Request, env: Env): Promise<Response> {
    const { value, count } = await request.json();
    if (!value || typeof value !== 'number' || value <= 0 || !count || typeof count !== 'number' || count <= 0) {
        return jsonResponse({ message: 'Invalid value or count' }, 400);
    }

    const model = new Model(env.DB);
    const now = Math.floor(Date.now() / 1000);
    const codes = [];
    
    for (let i = 0; i < count; i++) {
        codes.push({
            code: generateRandomString(12),
            value: value,
            created_at: now,
        });
    }

    const promises = codes.map(code => model.insertRechargeCode(code));
    await Promise.all(promises);

    return jsonResponse({ message: `Successfully created ${count} codes.` });
}

export async function adminListRechargeCodes(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const model = new Model(env.DB);
    const codes = await model.getRechargeCodes(limit, offset);
    const count = await model.countRechargeCodes();

    return jsonResponse({ codes, count });
}

export async function adminDeleteRechargeCode(request: Request, env: Env): Promise<Response> {
    const { code } = await request.json();
    if (!code) {
        return jsonResponse({ message: 'Code is required' }, 400);
    }

    const model = new Model(env.DB);
    const result = await model.deleteRechargeCode(code);

    if (result.success) {
        return jsonResponse({ message: 'Code deleted successfully' });
    } else {
        return jsonResponse({ message: 'Failed to delete code or code not found' }, 404);
    }
}
