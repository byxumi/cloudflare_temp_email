<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NIcon, NModal, NInput, NButton, NSpace, NTabs, NTabPane, NCard, NStatistic } from 'naive-ui'
import { History, Sync, CreditCard, ShoppingCart } from '@vicons/fa'

import { useGlobalState } from '../store'
import { api } from '../api'

// 导入原有组件
import AddressMangement from './user/AddressManagement.vue';
import UserSettingsPage from './user/UserSettings.vue';
import UserBar from './user/UserBar.vue';
import UserMailBox from './user/UserMailBox.vue';
import UserTransactions from './user/UserTransactions.vue';

// 异步导入抽奖组件
const Lottery = defineAsyncComponent(() => import('./user/Lottery.vue'))

const { userTab, globalTabplacement, userSettings, userBalance, openSettings } = useGlobalState()

const message = useMessage()
const redeemCode = ref('')
const redeemLoading = ref(false)
const showTransactions = ref(false)
const showRedeemModal = ref(false)
const balanceLoading = ref(false)

// 抽奖 Tab 显示控制
const showLotteryTab = ref(false)

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
            lottery: 'Lottery'
        },
        zh: {
            address_management: '地址管理',
            user_mail_box_tab: '收件箱',
            user_settings: '用户设置',
            wallet: '钱包',
            balance: '余额',
            redeem: '充值',
            redeemPlaceholder: '输入卡密',
            redeemSuccess: '充值成功',
            viewBills: '账单',
            myBills: '我的账单',
            refreshBalance: '刷新',
            buyCard: '购买卡密',
            lottery: '幸运抽奖'
        }
    }
});

const refreshBalance = async () => {
    balanceLoading.value = true;
    try {
        await api.getUserBalance();
        message.success("Balance Updated");
    } catch (e) {
        message.error(e.message || "Failed");
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
            message.success(t('redeemSuccess') + (res.amount ? `: +${(res.amount/100).toFixed(2)}` : ''));
            redeemCode.value = '';
            showRedeemModal.value = false;
            await api.getUserBalance();
        } else {
            message.error(res.message || "Redeem failed");
        }
    } catch (e) {
        message.error(e.message || "Redeem failed");
    } finally {
        redeemLoading.value = false;
    }
}

onMounted(async () => {
    if (useGlobalState().userJwt.value) {
        // 并行加载，加快速度
        Promise.all([
            api.getUserSettings(message),
            api.getUserBalance()
        ]);
        
        // 检查抽奖功能是否开启
        try {
            const res = await api.getLotteryStatus()
            if (res && res.settings && res.settings.enabled) {
                showLotteryTab.value = true
            }
        } catch (e) {
            console.log("Failed to check lottery status")
        }
    }
})
</script>

<template>
    <div>
        <UserBar />
        
        <n-card :bordered="false" embedded style="margin-bottom: 15px;">
            <div class="wallet-container">
                <div class="balance-wrapper">
                    <n-statistic :label="t('balance')">
                        <template #prefix>
                            ￥
                        </template>
                        <template #suffix>
                            <n-button text class="refresh-btn" @click="refreshBalance" :loading="balanceLoading">
                                <template #icon><n-icon><Sync /></n-icon></template>
                            </n-button>
                        </template>
                        {{ (userBalance / 100).toFixed(2) }}
                    </n-statistic>
                </div>
                <n-space>
                    <n-button type="primary" @click="showRedeemModal = true">
                        <template #icon><n-icon><CreditCard /></n-icon></template>
                        {{ t('redeem') }}
                    </n-button>
                    <n-button @click="showTransactions = true">
                        <template #icon><n-icon><History /></n-icon></template>
                        {{ t('viewBills') }}
                    </n-button>
                    <n-button v-if="openSettings.buyCardUrl" tag="a" :href="openSettings.buyCardUrl" target="_blank" type="warning" secondary>
                        <template #icon><n-icon><ShoppingCart /></n-icon></template>
                        {{ t('buyCard') }}
                    </n-button>
                </n-space>
            </div>
        </n-card>

        <div>
            <n-tabs type="line" animated :placement="globalTabplacement" v-model:value="userTab">
                <n-tab-pane name="user_mail_box_tab" :tab="t('user_mail_box_tab')">
                    <UserMailBox />
                </n-tab-pane>
                <n-tab-pane name="address_management" :tab="t('address_management')">
                    <AddressMangement />
                </n-tab-pane>
                <n-tab-pane v-if="showLotteryTab" name="lottery" :tab="t('lottery')">
                    <Lottery />
                </n-tab-pane>
                <n-tab-pane name="user_settings" :tab="t('user_settings')">
                    <UserSettingsPage />
                </n-tab-pane>
            </n-tabs>
        </div>

        <n-modal v-model:show="showRedeemModal" preset="card" :title="t('redeem')" style="width: 90%; max-width: 400px">
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
    .balance-wrapper {
        width: 100%;
        margin-bottom: 10px;
    }
}
</style>
