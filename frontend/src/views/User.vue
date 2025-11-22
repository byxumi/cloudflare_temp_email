<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { Plus } from '@vicons/fa'

import { useGlobalState } from '../store'
import { api } from '../api'

import AddressMangement from './user/AddressManagement.vue';
import UserSettingsPage from './user/UserSettings.vue';
import UserBar from './user/UserBar.vue';
import BindAddress from './user/BindAddress.vue';
import UserMailBox from './user/UserMailBox.vue';

const {
    userTab, globalTabplacement, userSettings
} = useGlobalState()

const message = useMessage()
const userBalance = ref(0)
const redeemCode = ref('')
const redeemLoading = ref(false)

const { t } = useI18n({
    messages: {
        en: {
            address_management: 'Address Management',
            user_mail_box_tab: 'Mail Box',
            user_settings: 'User Settings',
            bind_address: 'Bind Mail Address',
            wallet: 'Wallet',
            balance: 'Balance',
            redeem: 'Redeem',
            redeemPlaceholder: 'Enter redemption code',
            redeemSuccess: 'Redeem Success',
        },
        zh: {
            address_management: '地址管理',
            user_mail_box_tab: '收件箱',
            user_settings: '用户设置',
            bind_address: '绑定邮箱地址',
            wallet: '钱包',
            balance: '当前余额',
            redeem: '充值',
            redeemPlaceholder: '输入卡密',
            redeemSuccess: '充值成功',
        }
    }
});

const fetchBalance = async () => {
    try {
        userBalance.value = await api.getUserBalance();
    } catch (e) {
        console.error(e)
    }
}

const handleRedeem = async () => {
    if (!redeemCode.value) return;
    redeemLoading.value = true;
    try {
        const res = await api.redeemCard(redeemCode.value);
        if (res.success) {
            message.success(t('redeemSuccess'));
            redeemCode.value = '';
            await fetchBalance();
        }
    } catch (e) {
        message.error(e.message || "Redeem failed");
    } finally {
        redeemLoading.value = false;
    }
}

onMounted(async () => {
    if (userSettings.value.user_email) {
        await fetchBalance();
    }
})
</script>

<template>
    <div>
        <UserBar />
        <div v-if="userSettings.user_email">
            <n-card :title="t('wallet')" style="margin-bottom: 10px;" size="small">
                <n-grid x-gap="12" :cols="2">
                    <n-gi>
                        <n-statistic :label="t('balance')" :value="userBalance / 100" :precision="2">
                            <template #prefix>¥</template>
                        </n-statistic>
                    </n-gi>
                    <n-gi>
                        <n-input-group>
                            <n-input v-model:value="redeemCode" :placeholder="t('redeemPlaceholder')"
                                @keydown.enter="handleRedeem" />
                            <n-button type="primary" @click="handleRedeem" :loading="redeemLoading">
                                {{ t('redeem') }}
                            </n-button>
                        </n-input-group>
                    </n-gi>
                </n-grid>
            </n-card>

            <n-tabs type="card" v-model:value="userTab" :placement="globalTabplacement">
                <n-tab-pane name="address_management" :tab="t('address_management')">
                    <AddressMangement />
                </n-tab-pane>
                <n-tab-pane name="user_mail_box_tab" :tab="t('user_mail_box_tab')">
                    <UserMailBox />
                </n-tab-pane>
                <n-tab-pane name="user_settings" :tab="t('user_settings')">
                    <UserSettingsPage />
                </n-tab-pane>
                <n-tab-pane name="bind_address" :tab="t('bind_address')">
                    <BindAddress />
                </n-tab-pane>
            </n-tabs>
        </div>
    </div>
</template>