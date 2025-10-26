// frontend/src/views/user/UserBar.vue
<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NAlert, NButton, NTag, useMessage, NCard, NSkeleton } from 'naive-ui'; 

import { useGlobalState } from '../../store' 
import { api } from '../../api'
import UserLogin from './UserLogin.vue'

const message = useMessage()
const router = useRouter()

const {
    userSettings, userJwt, userOpenSettings, removeJwt 
} = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            currentUser: 'Current Login User',
            fetchUserSettingsError: 'Login password is invalid or account not exist, it may be network connection issue, please try again later.',
            logout: 'Logout' 
        },
        zh: {
            currentUser: '当前登录用户',
            fetchUserSettingsError: '登录信息已过期或账号不存在，也可能是网络连接异常，请稍后再尝试。',
            logout: '登出' 
        }
    }
});

const logout = () => {
    removeJwt() 
    router.push('/')
}

onMounted(async () => {
    await api.getUserOpenSettings(message);
    // make sure user_id is fetched
    if (!userSettings.user_id) await api.getUserSettings(message);
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
                    <span style="margin-left: 20px;">
                        <n-tag type="info">余额: {{ userSettings.balance }}</n-tag>
                    </span>
                    <n-button 
                        size="small" 
                        style="margin-left: 20px;" 
                        @click="logout"
                        type="error"
                        tertiary
                    >
                        {{ t('logout') }}
                    </n-button>
                </span>
            </n-alert>
        </div>
        <div v-else class="center">
            <n-card :bordered="false" embedded style="max-width: 600px;">
                <n-alert v-if="userJwt" type="warning" :show-icon="false" :bordered="false" closable>
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
    text-align: center;
    place-items: center;
    justify-content: center;
    margin: 20px;
}
</style>
