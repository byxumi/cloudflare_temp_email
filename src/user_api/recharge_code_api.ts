import { Context } from 'hono';
import { HonoCustomType } from '../types';
import { Model } from '../models';
import { jsonResponse } from '../utils';

export async function userUseRechargeCode(c: Context<HonoCustomType>): Promise<Response> {
    const user = c.get('userPayload');
    if (!user) {
        return jsonResponse({ message: 'Unauthorized' }, 401);
    }
    
    const { code } = await c.req.json();
    if (!code) {
        return jsonResponse({ message: 'Recharge code is required' }, 400);
    }

    const model = new Model(c.env.DB);
    const rechargeCode = await model.getRechargeCode(code);

    if (!rechargeCode) {
        return jsonResponse({ message: 'Invalid recharge code' }, 404);
    }

    if (rechargeCode.used_at !== null) {
        return jsonResponse({ message: 'Recharge code has already been used' }, 400);
    }
    
    const dbUser = await model.getUser(user.user_id.toString());
    if (!dbUser) {
        return jsonResponse({ message: 'User not found' }, 404);
    }

    const now = Math.floor(Date.now() / 1000);
    const userUpdate = { ...dbUser };
    
    // 计算过期时间
    let currentExpiry = userUpdate.free_email_time_expire || now;
    if (currentExpiry < now) {
        currentExpiry = now;
    }
    
    const daysInSeconds = rechargeCode.value * 86400;
    userUpdate.free_email_time_expire = currentExpiry + daysInSeconds;
    
    // 标记卡密已使用
    const codeUpdateResult = await model.useRechargeCode(code, user.user_id.toString(), now);
    
    if (!codeUpdateResult.success) {
         return jsonResponse({ message: 'Failed to use recharge code (Race condition)' }, 500);
    }

    // 更新用户时间
    const userUpdateResult = await model.updateUser(userUpdate);

    if (userUpdateResult.success) {
        return jsonResponse({ 
            success: true,
            message: `Recharge successful! Added ${rechargeCode.value} days.`
        });
    } else {
        return jsonResponse({ message: 'Database error during user update' }, 500);
    }
}