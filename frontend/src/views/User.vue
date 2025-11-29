<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NIcon, NModal, NInput, NButton, NSpace } from 'naive-ui'
import { History, Sync, CreditCard, ShoppingCart } from '@vicons/fa'

import { useGlobalState } from '../store'
import { api } from '../api'

import AddressMangement from './user/AddressManagement.vue';
import UserSettingsPage from './user/UserSettings.vue';
import UserBar from './user/UserBar.vue';
import UserMailBox from './user/UserMailBox.vue';
import UserTransactions from './user/UserTransactions.vue';

const { userTab, globalTabplacement, userSettings, userBalance, openSettings } = useGlobalState()

const message = useMessage()
const redeemCode = ref('')
const redeemLoading = ref(false)
const showTransactions = ref(false)
const showRedeemModal = ref(false)
const balanceLoading = ref(false)

const { t } = useI18n({
    messages: {
        en: {
            address_management: 'Address Management',
            user_mail_box_tab: 'Mail Box',
            user_settings: 'User Settings',
            wallet: 'Wallet',
            balance: 'Balance',
            redeem: 'Redeem',
            redeemPlaceholder: 'Enter card code',
            redeemSuccess: 'Redeem Success',
            viewBills: 'Bills',
            myBills: 'My Transactions',
            refreshBalance: 'Refresh',
            buyCard: 'Buy Card',
            inputCard: 'Input Code',
            recharge: 'Recharge'
        },
        zh: {
            address_management: '地址管理',
            user_mail_box_tab: '收件箱',
            user_settings: '用户设置',
            wallet: '钱包',
            balance: '当前余额',
            redeem: '立即充值',
            redeemPlaceholder: '请输入卡密',
            redeemSuccess: '充值成功',
            viewBills: '账单明细',
            myBills: '我的账单',
            refreshBalance: '刷新',
            buyCard: '购买卡密',
            inputCard: '输入卡密',
            recharge: '充值'
        }
    }
});

const fetchBalance = async () => {
    balanceLoading.value = true;
    try {
        await api.getUserBalance();
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
            showRedeemModal.value = false;
            await fetchBalance();
        }
    } catch (e) {
        message.error(e.message || "Redeem failed");
    } finally {
        redeemLoading.value = false;
    }
}

const handleBuyCard = () => {
    const myWebsiteUrl = "https://buy.xumicloud.top"; 
    
    if (openSettings.value.buyCardUrl) {
        window.open(openSettings.value.buyCardUrl, '_blank');
    } else {
        window.open(myWebsiteUrl, '_blank');
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
                <div class="wallet-container">
                    <div class="balance-wrapper">
                        <n-statistic :label="t('balance')">
                            <template #prefix>¥</template>
                            {{ (userBalance / 100).toFixed(2) }}
                            <template #suffix>
                                <n-button text class="refresh-btn" @click="fetchBalance" :loading="balanceLoading">
                                    <template #icon>
                                        <n-icon :component="Sync" />
                                    </template>
                                </n-button>
                            </template>
                        </n-statistic>
                    </div>

                    <div class="action-wrapper">
                        <n-space>
                            <n-button type="primary" @click="showRedeemModal = true">
                                <template #icon><n-icon :component="CreditCard" /></template>
                                {{ t('recharge') }}
                            </n-button>

                            <n-button @click="handleBuyCard">
                                <template #icon><n-icon :component="ShoppingCart" /></template>
                                {{ t('buyCard') }}
                            </n-button>

                            <n-button @click="showTransactions = true">
                                <template #icon><n-icon :component="History" /></template>
                                {{ t('viewBills') }}
                            </n-button>
                        </n-space>
                    </div>
                </div>
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

        <n-modal v-model:show="showRedeemModal" preset="card" :title="t('recharge')" style="width: 90%; max-width: 400px">
            <n-space vertical>
                <n-input v-model:value="redeemCode" :placeholder="t('redeemPlaceholder')" @keydown.enter="handleRedeem" />
                <n-button type="primary" block @click="handleRedeem" :loading="redeemLoading">
                    {{ t('redeem') }}
                </n-button>
            </n-space>
        </n-modal>

        <n-modal v-model:show="showTransactions" preset="card" :title="t('myBills')" style="width: 95%; max-width: 800px">
            <UserTransactions />
        </n-modal>
    </div>
</template>

<style scoped>
.wallet-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
}

.balance-wrapper {
    flex: 1;
    min-width: 120px;
}

.refresh-btn {
    margin-left: 8px; 
    vertical-align: middle;
}

@media (max-width: 600px) {
    .wallet-container {
        flex-direction: column;
        align-items: flex-start;
    }
    .action-wrapper {
        width: 100%;
    }
    .action-wrapper .n-space {
        width: 100%;
        justify-content: space-between;
        flex-wrap: wrap;
    }
    .action-wrapper .n-button {
        flex: 1;
        min-width: 30%;
    }
}
</style>
