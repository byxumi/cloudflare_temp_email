<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NIcon } from 'naive-ui'
import { History, Sync } from '@vicons/fa' // [新增] 引入 Sync 图标

import { useGlobalState } from '../store'
import { api } from '../api'

import AddressMangement from './user/AddressManagement.vue';
import UserSettingsPage from './user/UserSettings.vue';
import UserBar from './user/UserBar.vue';
import UserMailBox from './user/UserMailBox.vue';
import UserTransactions from './user/UserTransactions.vue';

const { userTab, globalTabplacement, userSettings, userBalance } = useGlobalState()

const message = useMessage()
const redeemCode = ref('')
const redeemLoading = ref(false)
const showTransactions = ref(false)
const balanceLoading = ref(false) // [新增] 余额刷新loading状态

const { t } = useI18n({
    messages: {
        en: {
            address_management: 'Address Management',
            user_mail_box_tab: 'Mail Box',
            user_settings: 'User Settings',
            wallet: 'Wallet',
            balance: 'Balance',
            redeem: 'Redeem',
            redeemPlaceholder: 'Enter redemption code',
            redeemSuccess: 'Redeem Success',
            viewBills: 'View Bills',
            myBills: 'My Transactions',
            refreshBalance: 'Refresh Balance'
        },
        zh: {
            address_management: '地址管理',
            user_mail_box_tab: '收件箱',
            user_settings: '用户设置',
            wallet: '钱包',
            balance: '当前余额',
            redeem: '充值',
            redeemPlaceholder: '输入卡密',
            redeemSuccess: '充值成功',
            viewBills: '查看账单',
            myBills: '我的账单',
            refreshBalance: '刷新余额'
        }
    }
});

const fetchBalance = async () => {
    balanceLoading.value = true;
    try {
        await api.getUserBalance(); // 更新全局 store
    } catch (e) {
        console.error(e);
    } finally {
        balanceLoading.value = false;
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
                <template #header-extra>
                    <n-button size="small" @click="showTransactions = true">
                        <template #icon><n-icon :component="History" /></template>
                        {{ t('viewBills') }}
                    </n-button>
                </template>
                <n-grid x-gap="12" :cols="2">
                    <n-gi>
                        <n-statistic :label="t('balance')">
                            <template #prefix>¥</template>
                            {{ (userBalance / 100).toFixed(2) }}
                            <template #suffix>
                                <n-button text style="margin-left: 8px; vertical-align: middle;" @click="fetchBalance" :loading="balanceLoading">
                                    <template #icon>
                                        <n-icon :component="Sync" />
                                    </template>
                                </n-button>
                            </template>
                        </n-statistic>
                    </n-gi>
                    <n-gi>
                        <n-input-group>
                            <n-input v-model:value="redeemCode" :placeholder="t('redeemPlaceholder')" @keydown.enter="handleRedeem" />
                            <n-button type="primary" @click="handleRedeem" :loading="redeemLoading">{{ t('redeem') }}</n-button>
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
            </n-tabs>
        </div>

        <n-modal v-model:show="showTransactions" preset="card" :title="t('myBills')" style="max-width: 800px">
            <UserTransactions />
        </n-modal>
    </div>
</template>