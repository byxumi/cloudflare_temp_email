import { Env, User } from '../types';
import { Model } from '../models';
import { jsonResponse } from '../utils';

export async function userUseRechargeCode(request: Request, env: Env, user: User): Promise<Response> {
    const { code } = await request.json();
    if (!code) {
        return jsonResponse({ message: 'Recharge code is required' }, 400);
    }

    const model = new Model(env.DB);
    const rechargeCode = await model.getRechargeCode(code);

    if (!rechargeCode) {
        return jsonResponse({ message: 'Invalid recharge code.' }, 404);
    }

    if (rechargeCode.used_at !== null) {
        return jsonResponse({ message: 'Recharge code has already been used.' }, 400);
    }

    const now = Math.floor(Date.now() / 1000);
    const userUpdate = { ...user };
    
    // 增加用户的免费邮箱时间
    let currentExpiry = user.free_email_time_expire || now;
    if (currentExpiry < now) {
        currentExpiry = now;
    }
    
    // 计算新的到期时间：当前到期时间 + 充值天数 * 86400 秒
    const daysInSeconds = rechargeCode.value * 86400;
    userUpdate.free_email_time_expire = currentExpiry + daysInSeconds;
    
    // 使用事务确保原子性 (简化为 Promise.all)
    const codeUpdatePromise = model.useRechargeCode(code, user.user_id, now);
    const userUpdatePromise = model.updateUser(userUpdate);

    const [codeResult, userResult] = await Promise.all([codeUpdatePromise, userUpdatePromise]);

    if (codeResult.success && userResult.success) {
        return jsonResponse({ 
            message: `Recharge successful! Added ${rechargeCode.value} days.`,
            user: userUpdate
        });
    } else {
        return jsonResponse({ message: 'Recharge failed due to a database error.' }, 500);
    }
}
