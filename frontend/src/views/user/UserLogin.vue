<script setup>
import { useMessage, NTabs, NTabPane, NForm, NFormItemRow, NInput, NButton, NDivider, NIcon, NInputGroup, NAlert, NModal } from 'naive-ui'
import { onMounted, ref, computed } from "vue";
import { useI18n } from 'vue-i18n'
import { KeyFilled } from '@vicons/material'

import { api } from '../../api';
import { useGlobalState } from '../../store'
import { hashPassword } from '../../utils';
import { startAuthentication } from '@simplewebauthn/browser';
import { useIsMobile } from '../../utils/composables' // [新增]

import Turnstile from '../../components/Turnstile.vue';

const {
    userJwt, userOpenSettings, openSettings,
    userOauth2SessionState, userOauth2SessionClientID
} = useGlobalState()
const message = useMessage();
const isMobile = useIsMobile() // [新增]

const { t } = useI18n({
    messages: {
        en: {
            login: 'Login',
            register: 'Register',
            email: 'Email',
            password: 'Password',
            verifyCode: 'Verify Code',
            verifyCodeSent: 'Sent, expire in {timeout}s',
            waitforVerifyCode: 'Wait {timeout}s',
            sendVerificationCode: 'Send Code',
            forgotPassword: 'Forgot Pwd',
            cannotForgotPassword: 'Mail verification is disabled or register is disabled, cannot reset password, please contact administrator',
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
            sendVerificationCode: '发送验证码',
            verifyCodeSent: '验证码已发送, {timeout}秒失效',
            waitforVerifyCode: '等待{timeout}秒',
            forgotPassword: '忘记密码',
            cannotForgotPassword: '未开启邮箱验证或未开启注册功能，无法重置密码，请联系管理员',
            resetPassword: '重置密码',
            pleaseInput: '请输入邮箱和密码',
            pleaseInputEmail: '请输入邮箱',
            pleaseInputCode: '请输入验证码',
            pleaseCompleteTurnstile: '请完成人机验证',
            pleaseLogin: '请登录',
            loginWithPasskey: 'Passkey',
            loginWith: '{provider}',
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
                // hash password
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
                // hash password
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
    <div class="login-wrapper">
        <n-tabs v-model:value="tabValue" :size="isMobile ? 'small' : 'large'" v-if="userOpenSettings.fetched" justify-content="space-evenly" animated>
            <n-tab-pane name="signin" :tab="t('login')">
                <n-form class="login-form" label-placement="left" :label-width="60">
                    <n-form-item-row :label="t('email')" required>
                        <n-input v-model:value="user.email" placeholder="Email" />
                    </n-form-item-row>
                    <n-form-item-row :label="t('password')" required>
                        <n-input v-model:value="user.password" type="password" show-password-on="click" placeholder="Password" />
                    </n-form-item-row>
                    
                    <n-button @click="emailLogin" type="primary" block secondary strong class="action-btn">
                        {{ t('login') }}
                    </n-button>
                    
                    <div style="text-align: right; margin-top: 8px;">
                        <n-button @click="showModal = true" type="info" text size="small">
                            {{ t('forgotPassword') }}
                        </n-button>
                    </div>
                    
                    <div v-if="openSettings.enablePasskey || (userOpenSettings.oauth2ClientIDs && userOpenSettings.oauth2ClientIDs.length > 0)">
                        <n-divider />
                        <n-button v-if="openSettings.enablePasskey" @click="passkeyLogin" type="primary" block secondary strong class="action-btn">
                            <template #icon>
                                <n-icon :component="KeyFilled" />
                            </template>
                            {{ t('loginWithPasskey') }}
                        </n-button>
                        <n-button @click="oauth2Login(item.clientID)" v-for="item in userOpenSettings.oauth2ClientIDs"
                            :key="item.clientID" block secondary strong class="action-btn">
                            {{ t('loginWith', { provider: item.name }) }}
                        </n-button>
                    </div>
                </n-form>
            </n-tab-pane>
            
            <n-tab-pane v-if="userOpenSettings.enable" name="signup" :tab="t('register')">
                <n-form class="login-form" label-placement="left" :label-width="60">
                    <n-form-item-row :label="t('email')" required>
                        <n-input v-model:value="user.email" placeholder="Email" />
                    </n-form-item-row>
                    <n-form-item-row :label="t('password')" required>
                        <n-input v-model:value="user.password" type="password" show-password-on="click" placeholder="Password" />
                    </n-form-item-row>
                    <Turnstile v-if="userOpenSettings.enableMailVerify" v-model:value="cfToken" />
                    <n-form-item-row v-if="userOpenSettings.enableMailVerify" :label="t('verifyCode')" required>
                        <n-input-group>
                            <n-input v-model:value="user.code" placeholder="Code" />
                            <n-button @click="sendVerificationCode" type="primary" ghost
                                :disabled="verifyCodeTimeout > 0">
                                {{ verifyCodeTimeout > 0 ? verifyCodeTimeout + 's' : t('sendVerificationCode') }}
                            </n-button>
                        </n-input-group>
                    </n-form-item-row>
                    
                    <n-button @click="emailSignup" type="primary" block secondary strong class="action-btn">
                        {{ t('register') }}
                    </n-button>
                </n-form>
            </n-tab-pane>
        </n-tabs>

        <n-modal v-model:show="showModal" style="width: 90%; max-width: 450px;" preset="card" :title="t('forgotPassword')">
            <n-form v-if="userOpenSettings.enable && userOpenSettings.enableMailVerify" class="login-form" label-placement="left" :label-width="70">
                <n-form-item-row :label="t('email')" required>
                    <n-input v-model:value="user.email" />
                </n-form-item-row>
                <n-form-item-row :label="t('password')" required>
                    <n-input v-model:value="user.password" type="password" show-password-on="click" placeholder="New Pwd" />
                </n-form-item-row>
                <Turnstile v-model:value="cfToken" />
                <n-form-item-row :label="t('verifyCode')" required>
                    <n-input-group>
                        <n-input v-model:value="user.code" />
                        <n-button @click="sendVerificationCode" type="primary" ghost
                            :disabled="verifyCodeTimeout > 0">
                             {{ verifyCodeTimeout > 0 ? verifyCodeTimeout + 's' : t('sendVerificationCode') }}
                        </n-button>
                    </n-input-group>
                </n-form-item-row>
                <n-button @click="emailSignup" type="primary" block secondary strong class="action-btn">
                    {{ t('resetPassword') }}
                </n-button>
            </n-form>
            <n-alert v-else :show-icon="false" :bordered="false" type="warning">
                {{ t('cannotForgotPassword') }}
            </n-alert>
        </n-modal>
    </div>
</template>

<style scoped>
.login-wrapper {
    width: 100%;
    /* [修复] 确保内容撑满容器，不使用 flex center */
    display: block;
}

.login-form {
    margin-top: 10px;
    width: 100%;
}

.action-btn {
    margin-top: 15px;
    width: 100%;
}

/* 移动端特定优化 */
@media (max-width: 600px) {
    /* 强制标签靠左对齐，防止换行 */
    :deep(.n-form-item-label) {
        justify-content: flex-start;
        min-width: 60px; 
    }
}
</style>
