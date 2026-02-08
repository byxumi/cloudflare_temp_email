<script setup>
import { ref, onMounted, defineAsyncComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NIcon, NModal, NInput, NButton, NSpace, NTabs, NTabPane, NStatistic, NSkeleton, NGrid, NGridItem } from 'naive-ui'
import { History, Sync, CreditCard, ShoppingCart, Gift } from '@vicons/fa'

import { useGlobalState } from '../store'
import { api } from '../api'

// 导入 UserBar (保持同步导入以确保顶部栏优先显示)
import UserBar from './user/UserBar.vue';

// [优化1] 全组件异步加载，大幅降低首屏体积
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
const dataInitLoading = ref(true) // [优化] 数据初始化加载状态

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

// [优化2] 人性化时间问候
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

// 检查抽奖状态
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
        // [优化3] 并行请求所有关键数据，显著减少等待时间
        try {
            await Promise.allSettled([
                api.getUserSettings(message),
                api.getUserBalance(),
                checkLottery()
            ]);
        } finally {
            // 设置一个极短的延时防止闪烁
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
/* 通用毛玻璃卡片样式 - 配合 App.vue 的暗色主题修复 */
.glass-panel {
    /* 这里使用 var(--n-card-color) 或者继承 App.vue 定义的背景策略 */
    /* 这里的样式通常由 Naive UI 的 n-card 或 App.vue 的 themeOverrides 覆盖，
       但保留一些 padding 和 border 是好的 */
    padding: 24px;
    margin-bottom: 20px;
    border-radius: 16px;
    transition: all 0.3s ease;
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
    color: var(--n-text-color-3); /* 使用 Naive UI 变量 */
    opacity: 0.8;
    margin-bottom: 4px;
}

.currency-symbol {
    font-size: 18px;
    margin-right: 4px;
    font-weight: 500;
}

.balance-num {
    font-weight: 700;
    font-size: 28px;
    letter-spacing: 0.5px;
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

/* 简单的淡入动画 */
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
    /* 移动端 Tab 内容区域增加 padding 以防贴边 */
    :deep(.n-tab-pane) {
        padding-top: 10px;
    }
}
</style>
