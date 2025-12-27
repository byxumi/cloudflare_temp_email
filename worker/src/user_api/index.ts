import { Hono } from 'hono';

import settings from './settings';
import user from './user';
import bind_address from './bind_address';
import passkey from './passkey';
import oauth2 from './oauth2';
import user_mail_api from './user_mail_api';
import { userUseRechargeCode } from './recharge_code_api';
import { checkin } from './checkin';
import * as lottery from './lottery'; // [新增]

export const api = new Hono<HonoCustomType>();

// settings api
api.get('/user_api/open_settings', settings.openSettings);
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
api.post('/user_api/update_remark', async (c) => {
    const { user_id } = c.get("userPayload");
    const { address_id, remark } = await c.req.json();
    return await bind_address.updateAddressRemark(c, user_id, address_id, remark || "");
});

// passkey api
api.get('/user_api/passkey', passkey.getPassKeys);
api.post('/user_api/passkey/rename', passkey.renamePassKey);
api.delete('/user_api/passkey/:passkey_id', passkey.deletePassKey);
api.post('/user_api/passkey/register_request', passkey.registerRequest);
api.post('/user_api/passkey/register_response', passkey.registerResponse);
api.post('/user_api/passkey/authenticate_request', passkey.authenticateRequest);
api.post('/user_api/passkey/authenticate_response', passkey.authenticateResponse);

// recharge
api.post('/user_api/recharge_code', userUseRechargeCode);

// checkin
api.post('/user_api/checkin', checkin);

// [新增] lottery
api.get('/user_api/lottery/status', lottery.getStatus);
api.post('/user_api/lottery/draw', lottery.draw);