<script setup>
import { ref, onMounted, defineAsyncComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NIcon, NModal, NInput, NButton, NSpace, NTabs, NTabPane, NStatistic, NSkeleton, NGrid, NGridItem } from 'naive-ui'
import { History, Sync, CreditCard, ShoppingCart, Gift } from '@vicons/fa'

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
            balance: 'Balance',
            redeem: 'Redeem',
            redeemPlaceholder: 'Card Code',
            redeemSuccess: 'Redeem Success',
            viewBills: 'Bills',
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
            balance: '账户余额',
            redeem: '卡密充值',
            redeemPlaceholder: '请输入充值卡密',
            redeemSuccess: '充值成功',
            viewBills: '查看账单',
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
    <div>
        <UserBar />
        
        <div v-if="userJwt">
            <div v-if="dataInitLoading" class="glass-panel wallet-container">
                <div class="balance-wrapper">
                    <n-skeleton text style="width: 60px; margin-bottom: 8px;" />
                    <n-skeleton text style="width: 120px; height: 32px;" />
                </div>
                <div class="action-wrapper">
                    <n-space>
                        <n-skeleton width="90px" height="34px" round />
                        <n-skeleton width="90px" height="34px" round />
                        <n-skeleton width="90px" height="34px" round />
                    </n-space>
                </div>
            </div>

            <div v-else class="glass-panel wallet-container animate-fade-in">
                <div class="balance-wrapper">
                    <div class="greeting-text">
                        {{ timeGreeting }}, {{ userSettings.user_email?.split('@')[0] || t('welcomeBack') }}
                    </div>
                    <n-statistic :label="t('balance')">
                        <template #prefix>
                            <span class="currency-symbol">¥</span>
                        </template>
                        <template #suffix>
                            <n-button text class="refresh-btn" @click="refreshBalance" :loading="balanceLoading">
                                <template #icon><n-icon><Sync /></n-icon></template>
                            </n-button>
                        </template>
                        <span class="balance-num">{{ (userBalance / 100).toFixed(2) }}</span>
                    </n-statistic>
                </div>
                <div class="action-wrapper">
                    <n-space>
                        <n-button type="primary" secondary strong @click="showRedeemModal = true">
                            <template #icon><n-icon><CreditCard /></n-icon></template>
                            {{ t('redeem') }}
                        </n-button>
                        
                        <n-button type="warning" secondary strong @click="handleBuyCard">
                            <template #icon><n-icon><ShoppingCart /></n-icon></template>
                            {{ t('buyCard') }}
                        </n-button>

                        <n-button secondary @click="showTransactions = true">
                            <template #icon><n-icon><History /></n-icon></template>
                            {{ t('viewBills') }}
                        </n-button>
                    </n-space>
                </div>
            </div>

            <div class="glass-panel animate-fade-in-up">
                <n-tabs type="line" animated :placement="globalTabplacement" v-model:value="userTab">
                    <n-tab-pane name="user_mail_box_tab" :tab="t('user_mail_box_tab')" display-directive="show:lazy">
                        <UserMailBox />
                    </n-tab-pane>
                    <n-tab-pane name="address_management" :tab="t('address_management')" display-directive="show:lazy">
                        <AddressMangement />
                    </n-tab-pane>
                    <n-tab-pane v-if="showLotteryTab" name="lottery" :tab="t('lottery')" display-directive="show:lazy">
                        <template #tab>
                            <n-space :size="4" align="center">
                                <n-icon color="#f0a020"><Gift /></n-icon>
                                {{ t('lottery') }}
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
            <n-space vertical size="large">
                <n-input 
                    v-model:value="redeemCode" 
                    :placeholder="t('redeemPlaceholder')" 
                    @keydown.enter="handleRedeem" 
                    size="large"
                >
                    <template #prefix>
                        <n-icon><CreditCard /></n-icon>
                    </template>
                </n-input>
                <n-button type="primary" block size="large" @click="handleRedeem" :loading="redeemLoading">
                    {{ t('redeem') }}
                </n-button>
            </n-space>
        </n-modal>

        <n-modal v-model:show="showTransactions" preset="card" :title="t('myBills')" class="custom-modal-lg">
            <UserTransactions />
        </n-modal>
    </div>
</template>

<style scoped>
/* [核心优化] 毛玻璃 + 描边效果 */
.glass-panel {
    /* 背景色由 App.vue 主题控制，这里专注于布局和描边 */
    padding: 24px;
    margin-bottom: 24px;
    border-radius: 20px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    /* 浅色模式下的描边 */
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

/* 深色模式下的描边适配 (如果 App.vue 的 themeOverrides 没完全覆盖) */
:deep([data-theme='dark']) .glass-panel {
    border: 1px solid rgba(255, 255, 255, 0.12); /* 亮白细线，增强轮廓 */
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* 悬停效果 */
.glass-panel:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
}

.wallet-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 20px;
}

.balance-wrapper {
    min-width: 200px;
}

.greeting-text {
    font-size: 14px;
    opacity: 0.8;
    margin-bottom: 4px;
    font-weight: 500;
}

.currency-symbol {
    font-size: 18px;
    margin-right: 4px;
    font-weight: 500;
    color: var(--n-primary-color);
}

.balance-num {
    font-weight: 700;
    font-size: 32px;
    letter-spacing: -0.5px;
    background: linear-gradient(120deg, var(--n-text-color), var(--n-primary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.refresh-btn {
    margin-left: 8px;
    vertical-align: sub;
    opacity: 0.7;
    transition: opacity 0.2s;
}
.refresh-btn:hover {
    opacity: 1;
}

.action-wrapper {
    display: flex;
    align-items: center;
}

.animate-fade-in {
    animation: fadeIn 0.4s ease-out;
}
.animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.custom-modal {
    width: 90%; 
    max-width: 400px;
}
.custom-modal-lg {
    width: 95%; 
    max-width: 800px;
}

@media (max-width: 600px) {
    .wallet-container {
        flex-direction: column;
        align-items: flex-start;
        padding: 20px;
    }
    .action-wrapper {
        width: 100%;
        margin-top: 10px;
    }
    .action-wrapper .n-space {
        width: 100%;
        justify-content: space-between;
    }
    .action-wrapper .n-button {
        flex: 1;
    }
    :deep(.n-tab-pane) {
        padding-top: 10px;
    }
}
</style>
