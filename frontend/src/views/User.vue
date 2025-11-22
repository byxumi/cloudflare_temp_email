<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NTabs, NTabPane } from 'naive-ui'
import { useGlobalState } from '../store'
import { api } from '../api'

import UserMailBox from './user/UserMailBox.vue'
import UserSettings from './user/UserSettings.vue'
import AddressManagement from './user/AddressManagement.vue'
import BindAddress from './user/BindAddress.vue'
import UserLogin from './user/UserLogin.vue'
// 1. 导入充值组件
import BuyAddress from './user/BuyAddress.vue'

const { t } = useI18n()
const { userJwt } = useGlobalState()
const activeTab = ref("mailbox")

onMounted(async () => {
    if (userJwt.value) {
        // check jwt
        try {
            await api.getUserSettings()
        } catch (e) {
            console.error(e)
            userJwt.value = ""
        }
    }
})
</script>

<template>
    <div>
        <UserLogin v-if="!userJwt" />
        <div v-else>
            <n-tabs v-model:value="activeTab" type="line" animated>
                <n-tab-pane name="mailbox" :tab="t('mailbox')">
                    <UserMailBox />
                </n-tab-pane>
                <n-tab-pane name="address" :tab="t('address_management')">
                    <AddressManagement />
                </n-tab-pane>
                <n-tab-pane name="bind" :tab="t('bind_address')">
                    <BindAddress />
                </n-tab-pane>
                <n-tab-pane name="recharge" :tab="t('recharge')">
                    <BuyAddress />
                </n-tab-pane>
                <n-tab-pane name="settings" :tab="t('settings')">
                    <UserSettings />
                </n-tab-pane>
            </n-tabs>
        </div>
    </div>
</template>

<style scoped>
</style>