<script setup>
import { useMessage } from 'naive-ui'
import { onMounted, ref } from "vue";
import { useI18n } from 'vue-i18n'
import { KeyFilled } from '@vicons/material'

import { api } from '../../api';
import { useGlobalState } from '../../store'
import { hashPassword } from '../../utils';
import { startAuthentication } from '@simplewebauthn/browser';

import Turnstile from '../../components/Turnstile.vue';

const {
    userJwt, userOpenSettings, openSettings,
    userOauth2SessionState, userOauth2SessionClientID
} = useGlobalState()
const message = useMessage();

const { t } = useI18n({
    messages: {
        en: {
            login: 'Login',
            register: 'Register',
            email: 'Email',
            password: 'Password',
            verifyCode: 'Verify Code',
            verifyCodeSent: 'Sent',
            waitforVerifyCode: '{timeout}s',
            sendVerificationCode: 'Get Code',
            forgotPassword: 'Forgot Password',
            cannotForgotPassword: 'Reset password is disabled, please contact admin.',
            resetPassword: 'Reset Password',
            pleaseInput: 'Please input email and password',
            pleaseInputEmail: 'Please input email',
            pleaseInputCode: 'Please input code',
            pleaseCompleteTurnstile: 'Please complete turnstile',
            pleaseLogin: 'Please login',
            loginWithPasskey: 'Passkey',
            loginWith: '{provider}',
        },
        zh: {
            login: '登录',
            register: '注册',
            email: '邮箱',
            password: '密码',
            verifyCode: '验证码',
            sendVerificationCode: '获取验证码',
            verifyCodeSent: '已发送',
            waitforVerifyCode: '{timeout}秒后重试',
            forgotPassword: '忘记密码',
            cannotForgotPassword: '未开启邮箱验证或注册功能，无法重置密码。',
            resetPassword: '重置密码',
            pleaseInput: '请输入邮箱和密码',
            pleaseInputEmail: '请输入邮箱',
            pleaseInputCode: '请输入验证码',
            pleaseCompleteTurnstile: '请完成人机验证',
            pleaseLogin: '请登录',
            loginWithPasskey: 'Passkey 登录',
            loginWith: '{provider} 登录',
        }
    }
});

const tabValue = ref("signin");
const showModal = ref(false);
const user = ref({
    email: "",
    password: "",
    code: ""
});
const cfToken = ref("")

const emailLogin = async () => {
    if (!user.value.email || !user.value.password) {
        message.error(t('pleaseInput'));
        return;
    }
    try {
        const res = await api.fetch(`/user_api/login`, {
            method: "POST",
            body: JSON.stringify({
                email: user.value.email,
                password: await hashPassword(user.value.password)
            })
        });
        userJwt.value = res.jwt;
        location.reload();
    } catch (error) {
        message.error(error.message || "login failed");
    }
};

const verifyCodeExpire = ref(0);
const verifyCodeTimeout = ref(0);

const getVerifyCodeTimeout = () => {
    if (!verifyCodeExpire.value || verifyCodeExpire.value < new Date().getTime()) return 0;
    return Math.round((verifyCodeExpire.value - new Date().getTime()) / 1000);
};

const sendVerificationCode = async () => {
    if (!user.value.email) {
        message.error(t('pleaseInputEmail'));
        return;
    }
    if (openSettings.value.cfTurnstileSiteKey && !cfToken.value && userOpenSettings.value.enableMailVerify) {
        message.error(t('pleaseCompleteTurnstile'));
        return;
    }
    try {
        const res = await api.fetch(`/user_api/verify_code`, {
            method: "POST",
            body: JSON.stringify({
                email: user.value.email,
                cf_token: cfToken.value
            })
        });
        if (res && res.expirationTtl) {
            message.success(t('verifyCodeSent', { timeout: res.expirationTtl }));
            verifyCodeExpire.value = new Date().getTime() + res.expirationTtl * 1000;
            const intervalId = setInterval(() => {
                verifyCodeTimeout.value = getVerifyCodeTimeout();
                if (verifyCodeTimeout.value <= 0) {
                    clearInterval(intervalId);
                    verifyCodeTimeout.value = 0;
                }
            }, 1000);
        }
    } catch (error) {
        message.error(error.message || "send verification code failed");
    }
};

const emailSignup = async () => {
    if (!user.value.email || !user.value.password) {
        message.error(t('pleaseInput'));
        return;
    }
    if (!user.value.code && userOpenSettings.value.enableMailVerify) {
        message.error(t('pleaseInputCode'));
        return;
    }
    try {
        const res = await api.fetch(`/user_api/register`, {
            method: "POST",
            body: JSON.stringify({
                email: user.value.email,
                password: await hashPassword(user.value.password),
                code: user.value.code
            }),
            message: message
        });
        if (res) {
            tabValue.value = "signin";
            message.success(t('pleaseLogin'));
        }
        showModal.value = false;
    } catch (error) {
        message.error(error.message || "register failed");
    }
};

const passkeyLogin = async () => {
    try {
        const options = await api.fetch(`/user_api/passkey/authenticate_request`, {
            method: 'POST',
            body: JSON.stringify({
                domain: location.hostname,
            })
        })
        const credential = await startAuthentication(options)

        const res = await api.fetch(`/user_api/passkey/authenticate_response`, {
            method: 'POST',
            body: JSON.stringify({
                origin: location.origin,
                domain: location.hostname,
                credential
            })
        })
        userJwt.value = res.jwt;
        location.reload();
    } catch (e) {
        console.error(e)
        message.error(e.message)
    }
};

const oauth2Login = async (clientID) => {
    try {
        userOauth2SessionClientID.value = clientID;
        userOauth2SessionState.value = Math.random().toString(36).substring(2);
        const res = await api.fetch(`/user_api/oauth2/login_url?clientID=${clientID}&state=${userOauth2SessionState.value}`);
        location.href = res.url;
    } catch (error) {
        message.error(error.message || "login failed");
    }
};

onMounted(async () => {
});
</script>

<template>
    <div class="login-container">
        <n-tabs v-model:value="tabValue" size="large" v-if="userOpenSettings.fetched" justify-content="space-evenly" animated>
            <n-tab-pane name="signin" :tab="t('login')">
                <div class="form-wrapper">
                    <n-form size="large" label-placement="top" :show-feedback="false">
                        <n-form-item-row :label="t('email')" path="email">
                            <n-input v-model:value="user.email" placeholder="name@example.com" />
                        </n-form-item-row>
                        
                        <div class="spacer"></div>
                        
                        <n-form-item-row :label="t('password')" path="password">
                            <n-input v-model:value="user.password" type="password" show-password-on="click" placeholder="" @keydown.enter="emailLogin" />
                        </n-form-item-row>
                    </n-form>

                    <div class="spacer-large"></div>

                    <n-button @click="emailLogin" type="primary" block size="large" class="submit-btn">
                        {{ t('login') }}
                    </n-button>

                    <n-button @click="showModal = true" secondary type="warning" block size="large" class="action-btn">
                        {{ t('forgotPassword') }}
                    </n-button>

                    <div v-if="userOpenSettings.oauth2ClientIDs && userOpenSettings.oauth2ClientIDs.length > 0 || true" class="divider">
                        <span>OR</span>
                    </div>

                    <n-space vertical :size="12" style="width: 100%">
                        <n-button @click="passkeyLogin" block secondary>
                            <template #icon><n-icon :component="KeyFilled" /></template>
                            {{ t('loginWithPasskey') }}
                        </n-button>
                        <n-button v-for="item in userOpenSettings.oauth2ClientIDs" :key="item.clientID" 
                            @click="oauth2Login(item.clientID)" block secondary>
                            {{ t('loginWith', { provider: item.name }) }}
                        </n-button>
                    </n-space>
                </div>
            </n-tab-pane>
            
            <n-tab-pane v-if="userOpenSettings.enable" name="signup" :tab="t('register')">
                <div class="form-wrapper">
                    <n-form size="large" label-placement="top" :show-feedback="false">
                        <n-form-item-row :label="t('email')">
                            <n-input v-model:value="user.email" placeholder="name@example.com" />
                        </n-form-item-row>
                        
                        <div class="spacer"></div>
                        
                        <n-form-item-row :label="t('password')">
                            <n-input v-model:value="user.password" type="password" show-password-on="click" />
                        </n-form-item-row>
                        
                        <div class="spacer"></div>
                        
                        <Turnstile v-if="userOpenSettings.enableMailVerify" v-model:value="cfToken" />
                        
                        <n-form-item-row v-if="userOpenSettings.enableMailVerify" :label="t('verifyCode')">
                            <n-input-group class="verify-group">
                                <n-input v-model:value="user.code" placeholder="123456" class="verify-input" />
                                <n-button @click="sendVerificationCode" :disabled="verifyCodeTimeout > 0" ghost class="verify-btn">
                                    {{ verifyCodeTimeout > 0 ? t('waitforVerifyCode', { timeout: verifyCodeTimeout }) : t('sendVerificationCode') }}
                                </n-button>
                            </n-input-group>
                        </n-form-item-row>
                    </n-form>
                    
                    <div class="spacer-large"></div>
                    
                    <n-button @click="emailSignup" type="primary" block size="large" class="submit-btn">
                        {{ t('register') }}
                    </n-button>
                </div>
            </n-tab-pane>
        </n-tabs>

        <n-modal v-model:show="showModal" preset="card" :title="t('forgotPassword')" style="width: 90%; max-width: 450px;">
            <div class="form-wrapper">
                <div v-if="userOpenSettings.enable && userOpenSettings.enableMailVerify">
                    <n-form size="large" label-placement="top">
                        <n-form-item-row :label="t('email')">
                            <n-input v-model:value="user.email" />
                        </n-form-item-row>
                        <n-form-item-row :label="t('password')">
                            <n-input v-model:value="user.password" type="password" show-password-on="click" placeholder="New Password" />
                        </n-form-item-row>
                        <Turnstile v-model:value="cfToken" />
                        
                        <n-form-item-row :label="t('verifyCode')">
                            <n-input-group class="verify-group">
                                <n-input v-model:value="user.code" class="verify-input" />
                                <n-button @click="sendVerificationCode" :disabled="verifyCodeTimeout > 0" ghost class="verify-btn">
                                    {{ verifyCodeTimeout > 0 ? t('waitforVerifyCode', { timeout: verifyCodeTimeout }) : t('sendVerificationCode') }}
                                </n-button>
                            </n-input-group>
                        </n-form-item-row>
                    </n-form>
                    <div class="spacer-large"></div>
                    <n-button @click="emailSignup" type="primary" block size="large" class="submit-btn">
                        {{ t('resetPassword') }}
                    </n-button>
                </div>
                <n-alert v-else type="warning" :show-icon="false">
                    {{ t('cannotForgotPassword') }}
                </n-alert>
            </div>
        </n-modal>
    </div>
</template>

<style scoped>
.login-container {
    width: 100%;
    box-sizing: border-box;
    text-align: left; 
}

/* [修改] 增加左右内边距，缩短输入框 */
.form-wrapper {
    padding: 0 24px; 
    width: 100%;
    /* 允许小屏幕滚动 */
    max-height: 75vh;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
}

.spacer {
    height: 16px;
}

.spacer-large {
    height: 24px;
}

.forgot-password-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
    margin-top: 4px;
}

.submit-btn {
    margin-bottom: 0;
}

.action-btn {
    margin-top: 12px;
}

.divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: #999;
    font-size: 12px;
    margin: 20px 0;
}

.divider::before,
.divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #eee;
}

.divider::before {
    margin-right: 10px;
}

.divider::after {
    margin-left: 10px;
}

:deep(.n-input) {
    width: 100%;
}

.verify-group {
    display: flex;
    width: 100%;
}

.verify-input {
    flex: 1;        
    min-width: 0;  
}

.verify-btn {
    flex-shrink: 0; 
}
</style>
