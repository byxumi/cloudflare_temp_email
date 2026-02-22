<script setup>
import { ref, onMounted, defineAsyncComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NIcon, NModal, NInput, NButton, NSpace, NTabs, NTabPane, NStatistic, NSkeleton, NGrid, NGridItem, NNumberAnimation } from 'naive-ui'
import { History, Sync, CreditCard, ShoppingCart, Gift, User, Wallet, ShareAlt } from '@vicons/fa'

import { useGlobalState } from '../store'
import { api } from '../api'

import UserBar from './user/UserBar.vue';

const AddressMangement = defineAsyncComponent(() => import('./user/AddressManagement.vue'));
const UserSettingsPage = defineAsyncComponent(() => import('./user/UserSettings.vue'));
const UserMailBox = defineAsyncComponent(() => import('./user/UserMailBox.vue'));
const UserTransactions = defineAsyncComponent(() => import('./user/UserTransactions.vue'));
const Lottery = defineAsyncComponent(() => import('./user/Lottery.vue'))
const Affiliate = defineAsyncComponent(() => import('./user/Affiliate.vue'))

const { userTab, globalTabplacement, userSettings, userBalance, openSettings, userJwt } = useGlobalState()

const message = useMessage()
const redeemCode = ref('')
const redeemLoading = ref(false)
const showTransactions = ref(false)
const showRedeemModal = ref(false)
const balanceLoading = ref(false)
const dataInitLoading = ref(true)

const showLotteryTab = ref(false)

const { t } = useI18n({
    messages: {
        en: {
            address_management: 'Address',
            user_mail_box_tab: 'Inbox',
            user_settings: 'Settings',
            wallet: 'Wallet',
            balance: 'Total Balance',
            redeem: 'Deposit',
            redeemPlaceholder: 'Enter Card Code',
            redeemSuccess: 'Redeem Success',
            viewBills: 'History',
            myBills: 'Transactions',
            refreshBalance: 'Refresh',
            buyCard: 'Buy Card',
            lottery: 'Lottery',
            affiliate: 'Affiliate',
            goodMorning: 'Good Morning',
            goodAfternoon: 'Good Afternoon',
            goodEvening: 'Good Evening',
            welcomeBack: 'Welcome Back',
        },
        zh: {
            address_management: '地址管理',
            user_mail_box_tab: '收件箱',
            user_settings: '用户设置',
            wallet: '钱包',
            balance: '账户总余额',
            redeem: '充值',
            redeemPlaceholder: '请输入充值卡密',
            redeemSuccess: '充值成功',
            viewBills: '账单记录',
            myBills: '我的账单',
            refreshBalance: '刷新',
            buyCard: '购买卡密',
            lottery: '幸运抽奖',
            affiliate: '邀请返利', // [新增翻译]
            goodMorning: '早上好',
            goodAfternoon: '下午好',
            goodEvening: '晚上好',
            welcomeBack: '欢迎回来',
        }
    }
});

const timeGreeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('goodMorning')
    if (hour < 18) return t('goodAfternoon')
    return t('goodEvening')
})

const refreshBalance = async () => {
    balanceLoading.value = true;
    try {
        await api.getUserBalance();
        message.success(t('balance') + " Updated");
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
    const myWebsiteUrl = "https://buy.xumitech.top"; 
    if (openSettings.value.buyCardUrl) {
        window.open(openSettings.value.buyCardUrl, '_blank');
    } else {
        window.open(myWebsiteUrl, '_blank');
    }
}

const checkLottery = async () => {
    try {
        const res = await api.getLotteryStatus()
        if (res && res.settings && res.settings.enabled) {
            showLotteryTab.value = true
        }
    } catch (e) {
        console.log("Failed to check lottery status")
    }
}

onMounted(async () => {
    if (userJwt.value) {
        dataInitLoading.value = true;
        try {
            await Promise.allSettled([
                api.getUserSettings(message),
                api.getUserBalance(),
                checkLottery()
            ]);
        } finally {
            setTimeout(() => {
                dataInitLoading.value = false;
            }, 300)
        }
    } else {
        dataInitLoading.value = false;
    }
})
</script>

<template>
    <div class="user-center-wrapper">
        <UserBar />
        
        <div v-if="userJwt">
            <div v-if="dataInitLoading" class="glass-panel wallet-card">
                <n-space justify="space-between" align="center" style="width: 100%">
                    <div class="balance-skeleton">
                        <n-skeleton text style="width: 100px; margin-bottom: 10px;" />
                        <n-skeleton text style="width: 180px; height: 40px;" />
                    </div>
                    <n-space>
                        <n-skeleton height="40px" width="100px" style="border-radius: 8px" />
                        <n-skeleton height="40px" width="100px" style="border-radius: 8px" />
                    </n-space>
                </n-space>
            </div>

            <div v-else class="glass-panel wallet-card animate-fade-in">
                <div class="card-bg-glow"></div>
                <div class="wallet-content">
                    <div class="balance-section">
                        <div class="greeting-row">
                            <n-icon class="greeting-icon"><User /></n-icon>
                            <span class="greeting-text">
                                {{ timeGreeting }}, 
                                <span class="username">{{ userSettings.user_email?.split('@')[0] || t('welcomeBack') }}</span>
                            </span>
                        </div>
                        
                        <div class="balance-display">
                            <div class="label">
                                <n-icon><Wallet /></n-icon> {{ t('balance') }}
                            </div>
                            <div class="number-row">
                                <span class="currency">¥</span>
                                <n-number-animation 
                                    ref="numberAnimation"
                                    :from="0" 
                                    :to="userBalance / 100" 
                                    :precision="2" 
                                    show-separator
                                    class="balance-num"
                                />
                                <n-button text class="refresh-btn" @click="refreshBalance" :loading="balanceLoading">
                                    <template #icon><n-icon><Sync /></n-icon></template>
                                </n-button>
                            </div>
                        </div>
                    </div>

                    <div class="action-section">
                        <n-grid :x-gap="12" :y-gap="12" :cols="3" responsive="screen" item-responsive>
                            <n-grid-item span="3 400:1">
                                <n-button type="primary" block strong class="action-btn" @click="showRedeemModal = true">
                                    <template #icon><n-icon><CreditCard /></n-icon></template>
                                    {{ t('redeem') }}
                                </n-button>
                            </n-grid-item>
                            <n-grid-item span="3 400:1">
                                <n-button type="warning" secondary block strong class="action-btn" @click="handleBuyCard">
                                    <template #icon><n-icon><ShoppingCart /></n-icon></template>
                                    {{ t('buyCard') }}
                                </n-button>
                            </n-grid-item>
                            <n-grid-item span="3 400:1">
                                <n-button secondary block strong class="action-btn" @click="showTransactions = true">
                                    <template #icon><n-icon><History /></n-icon></template>
                                    {{ t('viewBills') }}
                                </n-button>
                            </n-grid-item>
                        </n-grid>
                    </div>
                </div>
            </div>

            <div class="glass-panel animate-fade-in-up content-panel">
                <n-tabs type="line" animated :placement="globalTabplacement" class="compact-tabs">
                    <n-tab-pane name="address_management" :tab="t('address_management')" display-directive="show:lazy">
                        <AddressMangement />
                    </n-tab-pane>
                    <n-tab-pane name="user_mail_box_tab" :tab="t('user_mail_box_tab')" display-directive="show:lazy">
                        <UserMailBox />
                    </n-tab-pane>
                    <n-tab-pane name="affiliate" :tab="t('affiliate')" display-directive="show:lazy">
                        <template #tab>
                            <n-space :size="6" align="center">
                                <n-icon><ShareAlt /></n-icon>
                                <span>{{ t('affiliate') }}</span>
                            </n-space>
                        </template>
                        <Affiliate />
                    </n-tab-pane>
                    <n-tab-pane v-if="showLotteryTab" name="lottery" :tab="t('lottery')" display-directive="show:lazy">
                        <template #tab>
                            <n-space :size="6" align="center" style="color: #f0a020;">
                                <n-icon><Gift /></n-icon>
                                <span>{{ t('lottery') }}</span>
                            </n-space>
                        </template>
                        <Lottery />
                    </n-tab-pane>
                    <n-tab-pane name="user_settings" :tab="t('user_settings')" display-directive="show:lazy">
                        <UserSettingsPage />
                    </n-tab-pane>
                </n-tabs>
            </div>
        </div>

        <n-modal v-model:show="showRedeemModal" preset="card" :title="t('redeem')" class="custom-modal">
            <div class="modal-content">
                <div class="modal-icon-header">
                    <n-icon size="40" color="#3a86ff"><CreditCard /></n-icon>
                </div>
                <n-space vertical size="large">
                    <n-input 
                        v-model:value="redeemCode" 
                        :placeholder="t('redeemPlaceholder')" 
                        @keydown.enter="handleRedeem" 
                        size="large"
                    />
                    <n-button type="primary" block size="large" @click="handleRedeem" :loading="redeemLoading">
                        {{ t('redeem') }}
                    </n-button>
                </n-space>
            </div>
        </n-modal>

        <n-modal v-model:show="showTransactions" preset="card" :title="t('myBills')" class="custom-modal-lg">
            <UserTransactions />
        </n-modal>
    </div>
</template>

<style scoped>
.user-center-wrapper {
    max-width: 1200px;
    margin: 0 auto;
}

.glass-panel {
    background: var(--n-card-color);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

:deep([data-theme='dark']) .glass-panel {
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.wallet-card {
    padding: 0;
    margin-bottom: 24px;
    background: linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%);
}
:deep([data-theme='dark']) .wallet-card {
    background: linear-gradient(145deg, rgba(30,30,35,0.7) 0%, rgba(20,20,25,0.4) 100%);
}

.wallet-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

.card-bg-glow {
    position: absolute;
    top: -50%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(58, 134, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
}
:deep([data-theme='dark']) .card-bg-glow {
    background: radial-gradient(circle, rgba(58, 134, 255, 0.15) 0%, transparent 70%);
}

.wallet-content {
    position: relative;
    z-index: 1;
    padding: 32px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
    flex-wrap: wrap;
}

.balance-section {
    flex: 1;
    min-width: 280px;
}

.greeting-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: var(--n-text-color-3);
    margin-bottom: 16px;
}
.username {
    font-weight: 600;
    color: var(--n-text-color-1);
}

.balance-display .label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--n-text-color-2);
    margin-bottom: 4px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.number-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.currency {
    font-size: 24px;
    font-weight: 400;
    color: var(--n-text-color-2);
    margin-right: 4px;
}

.balance-num {
    font-family: 'Inter', 'Roboto Mono', monospace;
    font-weight: 700;
    font-size: 42px;
    line-height: 1;
    letter-spacing: -1px;
    color: var(--n-text-color-1);
    font-variant-numeric: tabular-nums;
}

.refresh-btn {
    opacity: 0.5;
    transition: all 0.3s;
    margin-left: 8px;
}
.refresh-btn:hover {
    opacity: 1;
    transform: rotate(180deg);
}

.action-section {
    width: 400px;
    max-width: 100%;
}

.action-btn {
    height: 44px;
    font-size: 15px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.content-panel {
    padding: 24px;
    min-height: 500px;
}

/* Tab 字体优化 */
.compact-tabs :deep(.n-tabs-tab) {
    font-size: 15px !important;
    padding: 12px 16px !important;
}
.compact-tabs :deep(.n-tabs-tab--active) {
    font-weight: 700 !important;
    font-size: 15px !important;
}

/* 动画 */
.animate-fade-in {
    animation: fadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.animate-fade-in-up {
    animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.custom-modal {
    width: 90%; 
    max-width: 400px;
    border-radius: 20px;
    overflow: hidden;
}
.custom-modal-lg {
    width: 95%; 
    max-width: 900px;
    border-radius: 20px;
}
.modal-content {
    padding: 10px 0;
}
.modal-icon-header {
    text-align: center;
    margin-bottom: 20px;
    opacity: 0.9;
}

@media (max-width: 768px) {
    .wallet-content {
        flex-direction: column;
        align-items: flex-start;
        padding: 24px;
    }
    .action-section {
        width: 100%;
        margin-top: 10px;
    }
    .balance-num {
        font-size: 36px;
    }
    :deep(.n-tabs .n-tab-pane) {
        padding-top: 16px;
    }
}
</style>
