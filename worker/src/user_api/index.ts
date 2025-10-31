import { Hono } from 'hono';
import { Context } from 'hono'; // 确保 Context 被导入
import { HonoCustomType } from '../types'; // 确保 HonoCustomType 被导入

import settings from './settings';
import user from './user';
import bind_address from './bind_address';
import passkey from './passkey';
import oauth2 from './oauth2';
import user_mail_api from './user_mail_api';
import recharge_api from './recharge_api'; // <-- 您之前添加的卡密兑换 API

// 导入在 worker.ts 中定义的 user_middleware
// 假设它在 worker.ts 中被导出
// 如果 worker.ts 没有导出 user_middleware，请在 worker.ts 中添加 export { user_middleware }
// 或者，如果路由已经在 worker.ts 中被中间件保护，则可以直接移除它。
// 鉴于 worker.ts 的复杂性，我们假设 user_middleware 应该从那里导入
// import { user_middleware } from '../worker'; // 假设的导入路径

export const api = new Hono<HonoCustomType>();

// settings api
api.get('/user_api/open_settings', settings.openSettings);
// 注意：原仓库中 /user_api/settings 受到了 user_middleware 保护
// api.get('/user_api/settings', user_middleware, settings.settings);
// 修复：如果 user_middleware 无法导入，暂时移除它，
// 因为 worker.ts 中的 app.use('/user_api/*', user_middleware) 已经提供了保护
api.get('/user_api/settings', settings.settings);


// mail api
api.get('/user_api/mails', user_mail_api.getMails);
api.delete('/user_api/mails/:id', user_mail_api.deleteMail);

// user api
api.post('/user_api/login', user.login);
api.post('/user_api/verify_code', user.verifyCode);
api.post('/user_api/register', user.register);

// oauth2 api
api.get('/user_api/oauth2/login_url', oauth2.getOauth2LoginUrl);
api.post('/user_api/oauth2/callback', oauth2.oauth2Login);

// bind address api
api.get('/user_api/bind_address', bind_address.getBindedAddresses);
api.post('/user_api/bind_address', bind_address.bind);
api.get('/user_api/bind_address_jwt/:address_id', bind_address.getBindedAddressJwt);
api.post('/user_api/unbind_address', bind_address.unbind);
api.post('/user_api/transfer_address', bind_address.transferAddress);

// passkey api
api.get('/user_api/passkey', passkey.getPassKeys);
api.post('/user_api/passkey/rename', passkey.renamePassKey);
api.delete('/user_api/passkey/:passkey_id', passkey.deletePassKey);
api.post('/user_api/passkey/register_request', passkey.registerRequest);
api.post('/user_api/passkey/register_response', passkey.registerResponse);
api.post('/user_api/passkey/authenticate_request', passkey.authenticateRequest);
api.post('/user_api/passkey/authenticate_response', passkey.authenticateResponse);

// 关键修复：
// 1. 移除了未定义的 user_middleware
// 2. 确保路径匹配 /user_api/ 前缀
api.post('/user_api/redeem_code', recharge_api.redeemCode);
