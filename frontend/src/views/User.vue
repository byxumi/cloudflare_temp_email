<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NIcon, NModal, NInput, NButton, NSpace, NTabs, NTabPane, NStatistic } from 'naive-ui'
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

// [修改] 引入 userJwt 以判断登录状态
const { userTab, globalTabplacement, userSettings, userBalance, openSettings, userJwt } = useGlobalState()

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
            redeemPlaceholder: '请输入卡密',
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

const handleBuyCard = () => {
    const myWebsiteUrl = "https://buy.xumicloud.top"; 
    if (openSettings.value.buyCardUrl) {
        window.open(openSettings.value.buyCardUrl, '_blank');
    } else {
        window.open(myWebsiteUrl, '_blank');
    }
}

onMounted(async () => {
    if (useGlobalState().userJwt.value) {
        // 并行加载
        Promise.all([
            api.getUserSettings(message),
            api.getUserBalance()
        ]);
        
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
        
        <div v-if="userJwt">
            <div class="glass-panel wallet-container">
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
                        <span style="font-weight: 600;">{{ (userBalance / 100).toFixed(2) }}</span>
                    </n-statistic>
                </div>
                <div class="action-wrapper">
                    <n-space>
                        <n-button type="primary" @click="showRedeemModal = true">
                            <template #icon><n-icon><CreditCard /></n-icon></template>
                            {{ t('redeem') }}
                        </n-button>
                        
                        <n-button type="warning" secondary @click="handleBuyCard">
                            <template #icon><n-icon><ShoppingCart /></n-icon></template>
                            {{ t('buyCard') }}
                        </n-button>

                        <n-button @click="showTransactions = true">
                            <template #icon><n-icon><History /></n-icon></template>
                            {{ t('viewBills') }}
                        </n-button>
                    </n-space>
                </div>
            </div>

            <div class="glass-panel">
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
/* 通用毛玻璃卡片样式 */
.glass-panel {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
}

.wallet-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
}

.balance-wrapper {
    min-width: 150px;
}

.refresh-btn {
    margin-left: 8px;
    vertical-align: sub;
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
    }
    .action-wrapper .n-button {
        flex: 1;
    }
}
</style>
