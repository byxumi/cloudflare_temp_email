<script setup>
import { ref, onMounted, defineAsyncComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NIcon, NModal, NInput, NButton, NSpace, NTabs, NTabPane, NStatistic, NSkeleton, NGrid, NGridItem, NNumberAnimation } from 'naive-ui'
import { History, Sync, CreditCard, ShoppingCart, Gift, User, Wallet } from '@vicons/fa' // 增加图标

import { useGlobalState } from '../store'
import { api } from '../api'

// 导入 UserBar
import UserBar from './user/UserBar.vue';

// 全组件异步加载
const AddressMangement = defineAsyncComponent(() => import('./user/AddressManagement.vue'));
const UserSettingsPage = defineAsyncComponent(() => import('./user/UserSettings.vue'));
const UserMailBox = defineAsyncComponent(() => import('./user/UserMailBox.vue'));
const UserTransactions = defineAsyncComponent(() => import('./user/UserTransactions.vue'));
const Lottery = defineAsyncComponent(() => import('./user/Lottery.vue'))

const { userTab, globalTabplacement, userSettings, userBalance, openSettings, userJwt } = useGlobalState()

const message = useMessage()
const redeemCode = ref('')
const redeemLoading = ref(false)
const showTransactions = ref(false)
const showRedeemModal = ref(false)
const balanceLoading = ref(false)
const dataInitLoading = ref(true)

// 抽奖 Tab 显示控制
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
    const myWebsiteUrl = "https://buy.xumicloud.top"; 
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
                <n-tabs type="line" animated :placement="globalTabplacement" v-model:value="userTab" size="large">
                    <n-tab-pane name="user_mail_box_tab" :tab="t('user_mail_box_tab')" display-directive="show:lazy">
                        <UserMailBox />
                    </n-tab-pane>
                    <n-tab-pane name="address_management" :tab="t('address_management')" display-directive="show:lazy">
                        <AddressMangement />
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
                        class="fancy-input"
                    />
                    <n-button type="primary" block size="large" @click="handleRedeem" :loading="redeemLoading" class="fancy-btn">
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
/* 全局容器微调 */
.user-center-wrapper {
    max-width: 1200px;
    margin: 0 auto;
}

/* === 毛玻璃面板通用样式 === */
.glass-panel {
    background: var(--n-card-color); /* 依赖 App.vue 的主题色 */
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 深色模式下的面板边框调整 */
:deep([data-theme='dark']) .glass-panel {
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* === 钱包卡片专属样式 === */
.wallet-card {
    padding: 0; /* 内部布局自己控制 padding */
    margin-bottom: 24px;
    /* 给予一个微弱的渐变底色，突出钱包区域 */
    background: linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%);
}
:deep([data-theme='dark']) .wallet-card {
    background: linear-gradient(145deg, rgba(30,30,35,0.7) 0%, rgba(20,20,25,0.4) 100%);
}

.wallet-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

/* 背景光晕装饰 */
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

/* [修复] 余额字体：使用等宽数字，清晰实色，移除渐变 */
.balance-num {
    font-family: 'Inter', 'Roboto Mono', monospace; /* 优先使用无衬线或等宽 */
    font-weight: 700;
    font-size: 42px;
    line-height: 1;
    letter-spacing: -1px;
    color: var(--n-text-color-1); /* 实色，保证清晰度 */
    font-variant-numeric: tabular-nums; /* 数字等宽，防止跳动 */
}

/* 刷新按钮 */
.refresh-btn {
    opacity: 0.5;
    transition: all 0.3s;
    margin-left: 8px;
}
.refresh-btn:hover {
    opacity: 1;
    transform: rotate(180deg);
}

/* 操作区域 */
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

/* Tab 区域 */
.content-panel {
    padding: 24px;
    min-height: 500px;
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

/* 弹窗美化 */
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

/* 移动端适配 */
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
    /* 移动端 Tab 内容边距调整 */
    :deep(.n-tabs .n-tab-pane) {
        padding-top: 16px;
    }
}
</style>
