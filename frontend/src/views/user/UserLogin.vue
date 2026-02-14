<script setup>
import { useMessage, NInput, NButton, NForm, NFormItem, NTabs, NTabPane, NAlert, NInputGroup } from 'naive-ui'
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
            forgotPassword: 'Forgot Password?',
            cannotForgotPassword: 'Reset password is disabled, please contact admin.',
            resetPassword: 'Reset Password',
            pleaseInput: 'Please input email and password',
            pleaseInputEmail: 'Please input email',
            pleaseInputCode: 'Please input code',
            pleaseCompleteTurnstile: 'Please complete turnstile',
            pleaseLogin: 'Please login',
            loginWithPasskey: 'Passkey',
            loginWith: '{provider}',
            invitationCode: 'Invitation Code',
            optional: '(Optional)',
            enterInvitationCode: 'Enter Invitation Code'
        },
        zh: {
            login: '登录',
            register: '注册',
            email: '邮箱',
            password: '密码',
            verifyCode: '验证码',
            verifyCodeSent: '验证码已发送',
            waitforVerifyCode: '{timeout}秒后重试',
            sendVerificationCode: '获取验证码',
            forgotPassword: '忘记密码?',
            cannotForgotPassword: '重置密码功能已禁用，请联系管理员。',
            resetPassword: '重置密码',
            pleaseInput: '请输入邮箱和密码',
            pleaseInputEmail: '请输入邮箱',
            pleaseInputCode: '请输入验证码',
            pleaseCompleteTurnstile: '请完成人机验证',
            pleaseLogin: '请登录',
            loginWithPasskey: '通行密钥登录',
            loginWith: '{provider} 登录',
            invitationCode: '邀请码',
            optional: '(可选)',
            enterInvitationCode: '请输入邀请码'
        }
    }
});

const isLogin = ref(true);
const authForm = ref({
    email: '',
    password: '',
    code: '',
    invitation_code: '' // [新增]
});
const cfToken = ref('');
const loading = ref(false);
const sendCodeLoading = ref(false);
const sendCodeTimeout = ref(0);
const showForgotPassword = ref(false);

const login = async () => {
    if (!authForm.value.email || !authForm.value.password) {
        message.error(t('pleaseInput'));
        return;
    }
    loading.value = true;
    try {
        const res = await api.fetch("/user_api/login", {
            method: 'POST',
            body: JSON.stringify(authForm.value),
        });
        userJwt.value = res.jwt;
        await api.getUserSettings(message);
    } catch (error) {
        message.error(error.message || "error");
    } finally {
        loading.value = false;
    }
};

const register = async () => {
    if (!authForm.value.email || !authForm.value.password) {
        message.error(t('pleaseInput'));
        return;
    }
    if (userOpenSettings.value.enableMailVerify && !authForm.value.code) {
        message.error(t('pleaseInputCode'));
        return;
    }
    if (openSettings.value.cfTurnstileSiteKey && !cfToken.value) {
        message.error(t('pleaseCompleteTurnstile'));
        return;
    }
    loading.value = true;
    try {
        await api.fetch("/user_api/register", {
            method: 'POST',
            body: JSON.stringify({
                email: authForm.value.email,
                password: authForm.value.password,
                code: authForm.value.code,
                invitation_code: authForm.value.invitation_code // [新增]
            }),
        });
        message.success(t('pleaseLogin'));
        isLogin.value = true;
    } catch (error) {
        message.error(error.message || "error");
    } finally {
        loading.value = false;
    }
};

const sendCode = async () => {
    if (!authForm.value.email) {
        message.error(t('pleaseInputEmail'));
        return;
    }
    if (openSettings.value.cfTurnstileSiteKey && !cfToken.value) {
        message.error(t('pleaseCompleteTurnstile'));
        return;
    }
    sendCodeLoading.value = true;
    try {
        const res = await api.fetch("/user_api/verify_code", {
            method: 'POST',
            body: JSON.stringify({
                email: authForm.value.email,
                cf_token: cfToken.value,
            }),
        });
        message.success(t('verifyCodeSent'));
        sendCodeTimeout.value = res.timeout || 60;
        const timer = setInterval(() => {
            sendCodeTimeout.value--;
            if (sendCodeTimeout.value <= 0) {
                clearInterval(timer);
            }
        }, 1000);
    } catch (error) {
        message.error(error.message || "error");
    } finally {
        sendCodeLoading.value = false;
    }
};

const passkeyLogin = async () => {
    loading.value = true;
    try {
        const res = await api.fetch('/user_api/passkey/authenticate_options', {
            method: 'POST',
            body: JSON.stringify({
                domain: window.location.hostname
            })
        });
        const credential = await startAuthentication(res);
        const verifyRes = await api.fetch('/user_api/passkey/authenticate_verification', {
            method: 'POST',
            body: JSON.stringify({
                domain: window.location.hostname,
                credential
            })
        });
        userJwt.value = verifyRes.jwt;
        await api.getUserSettings(message);
    } catch (error) {
        message.error(error.message || "error");
    } finally {
        loading.value = false;
    }
}

const oauth2Login = async (clientID) => {
    try {
        const state = Math.random().toString(36).substring(7);
        const res = await api.fetch(`/user_api/oauth2/login_url?clientID=${clientID}&state=${state}`);
        userOauth2SessionClientID.value = clientID;
        userOauth2SessionState.value = state;
        window.location.href = res.url;
    } catch (error) {
        message.error(error.message || "error");
    }
}

</script>

<template>
    <div class="login-container">
        <n-tabs v-model:value="isLogin" justify-content="space-evenly" animated>
            <n-tab-pane :name="true" :tab="t('login')">
                <div class="form-wrapper">
                    <n-form>
                        <n-form-item :label="t('email')">
                            <n-input v-model:value="authForm.email" placeholder="email@example.com" />
                        </n-form-item>
                        <n-form-item :label="t('password')">
                            <n-input type="password" show-password-on="click" v-model:value="authForm.password" @keyup.enter="login" />
                        </n-form-item>
                        <n-button type="primary" block @click="login" :loading="loading" class="submit-btn">
                            {{ t('login') }}
                        </n-button>
                        <div class="spacer"></div>
                        <n-button text class="action-btn" @click="showForgotPassword = true">
                            {{ t('forgotPassword') }}
                        </n-button>
                    </n-form>
                </div>
            </n-tab-pane>
            <n-tab-pane :name="false" :tab="t('register')">
                <div class="form-wrapper">
                    <n-form>
                        <n-form-item :label="t('email')">
                            <n-input v-model:value="authForm.email" placeholder="email@example.com" />
                        </n-form-item>
                        <n-form-item :label="t('password')">
                            <n-input type="password" show-password-on="click" v-model:value="authForm.password" />
                        </n-form-item>
                        <n-form-item v-if="userOpenSettings.enableMailVerify" :label="t('verifyCode')">
                            <n-input-group>
                                <n-input v-model:value="authForm.code" placeholder="123456" />
                                <n-button :disabled="!authForm.email || sendCodeTimeout > 0" :loading="sendCodeLoading" @click="sendCode">
                                    {{ sendCodeTimeout > 0 ? t('waitforVerifyCode', { timeout: sendCodeTimeout }) : t('sendVerificationCode') }}
                                </n-button>
                            </n-input-group>
                        </n-form-item>
                        
                        <n-form-item :label="`${t('invitationCode')} ${t('optional')}`">
                            <n-input v-model:value="authForm.invitation_code" :placeholder="t('enterInvitationCode')" />
                        </n-form-item>

                        <div class="spacer"></div>
                        <Turnstile v-model:value="cfToken" />
                        <div class="spacer"></div>
                        <n-button type="primary" block @click="register" :loading="loading" class="submit-btn">
                            {{ t('register') }}
                        </n-button>
                    </n-form>
                </div>
            </n-tab-pane>
        </n-tabs>

        <div class="form-wrapper" v-if="userOpenSettings.enable">
            <div class="spacer-large"></div>
            <n-button block secondary @click="passkeyLogin" :loading="loading">
                <template #icon><n-icon><KeyFilled /></n-icon></template>
                {{ t('loginWithPasskey') }}
            </n-button>
            <div class="spacer"></div>
            <div v-for="client in userOpenSettings.oauth2ClientIDs" :key="client.clientID">
                <n-button block secondary @click="oauth2Login(client.clientID)" style="margin-bottom: 12px;">
                    {{ t('loginWith', { provider: client.name }) }}
                </n-button>
            </div>
        </div>

        <n-modal v-model:show="showForgotPassword" preset="dialog" :title="t('resetPassword')">
            <div>
                <n-alert type="warning" :show-icon="false" :bordered="false">
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

:deep(.n-tab-pane) {
    padding: 0 !important;
    margin-top: 0 !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
}

.form-wrapper {
    padding: 10px 30px; 
    width: 100%;
    box-sizing: border-box;
    max-height: 70vh;
    overflow-y: auto;
    overflow-x: hidden;
}

@media (max-width: 600px) {
    .form-wrapper {
        padding: 10px 5px;
    }
}

.spacer {
    height: 12px;
}

.spacer-large {
    height: 20px;
}

.submit-btn {
    margin-bottom: 0;
}

.action-btn {
    margin-top: 12px;
}
</style>
