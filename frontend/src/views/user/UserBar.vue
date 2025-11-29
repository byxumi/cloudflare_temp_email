<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useMessage, NCard, NAlert, NSkeleton } from 'naive-ui' // 补全引入

import { useGlobalState } from '../../store'
import { api } from '../../api'
import UserLogin from './UserLogin.vue'

const message = useMessage()
const router = useRouter()

const {
    userSettings, userJwt, userOpenSettings
} = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            currentUser: 'Current Login User',
            fetchUserSettingsError: 'Login password is invalid or account not exist, it may be network connection issue, please try again later.',
        },
        zh: {
            currentUser: '当前登录用户',
            fetchUserSettingsError: '登录信息已过期或账号不存在，也可能是网络连接异常，请稍后再尝试。',

        }
    }
});


onMounted(async () => {
    await api.getUserOpenSettings(message);
    // make sure user_id is fetched
    if (!userSettings.value.user_id) await api.getUserSettings(message);
});
</script>

<template>
    <div>
        <n-card :bordered="false" embedded v-if="!userSettings.fetched">
            <n-skeleton style="height: 50vh" />
        </n-card>
        <div v-else-if="userSettings.user_email">
            <n-alert type="success" :show-icon="false" :bordered="false">
                <span>
                    <b>{{ t('currentUser') }} <b>{{ userSettings.user_email }}</b></b>
                </span>
            </n-alert>
        </div>
        <div v-else class="center">
            <n-card :bordered="false" embedded class="login-card">
                <n-alert v-if="userJwt" type="warning" :show-icon="false" :bordered="false" closable style="margin-bottom: 15px;">
                    <span>{{ t('fetchUserSettingsError') }}</span>
                </n-alert>
                <UserLogin />
            </n-card>
        </div>
    </div>
</template>

<style scoped>
.n-alert {
    margin-top: 10px;
    margin-bottom: 10px;
    text-align: center;
}

.center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 10px; /* 减小左右内边距，适应小屏幕 */
    width: 100%;
    box-sizing: border-box;
}

.login-card {
    width: 100%;
    max-width: 500px; /* 限制最大宽度，大屏美观 */
    box-sizing: border-box;
}

/* 移动端适配 */
@media (max-width: 600px) {
    .center {
        padding: 10px; /* 移动端进一步减小边距 */
    }
    .login-card {
        /* 移动端卡片样式调整，防止内边距过大导致内容被挤压 */
        --n-padding-left: 12px !important;
        --n-padding-right: 12px !important;
    }
}
</style>
