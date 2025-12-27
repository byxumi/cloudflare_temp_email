<script setup>
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NDataTable, NTag, NTime, NIcon, NPagination, NEmpty, NSpin } from 'naive-ui'
import { 
    CalendarCheck, // 签到
    Gift,          // 抽奖
    ShoppingCart,  // 购买
    CreditCard,    // 充值
    Clock,         // 过期
    UserEdit,      // 管理员
    MoneyBillAlt   // 默认
} from '@vicons/fa'
import { api } from '../../api'
import { useGlobalState } from '../../store'

const { isMobile } = useGlobalState()
const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            amount: 'Amount',
            type: 'Type',
            desc: 'Description',
            time: 'Time',
            types: {
                checkin: 'Check-in',
                checkin_expire: 'Expired',
                lottery_cost: 'Lottery Cost',
                lottery_win: 'Lottery Win',
                purchase: 'Purchase',
                redeem: 'Redeem',
                admin_topup: 'Admin Topup',
                admin_reset: 'Admin Reset'
            }
        },
        zh: {
            amount: '金额',
            type: '类型',
            desc: '描述',
            time: '时间',
            types: {
                checkin: '每日签到',
                checkin_expire: '签到过期',
                lottery_cost: '抽奖消耗',
                lottery_win: '抽奖中奖',
                purchase: '购买邮箱',
                redeem: '卡密充值',
                admin_topup: '管理员充值',
                admin_reset: '管理员重置'
            }
        }
    }
})

const loading = ref(false)
const data = ref([])
const pagination = ref({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    onChange: (page) => {
        pagination.value.page = page
        fetchData()
    }
})

// 获取图标配置
const getIconConfig = (type) => {
    switch (type) {
        case 'checkin': return { icon: CalendarCheck, color: '#18a058', bg: 'rgba(24, 160, 88, 0.1)' };
        case 'lottery_win': return { icon: Gift, color: '#f0a020', bg: 'rgba(240, 160, 32, 0.1)' };
        case 'lottery_cost': return { icon: Gift, color: '#666', bg: '#f5f5f5' };
        case 'purchase': return { icon: ShoppingCart, color: '#2080f0', bg: 'rgba(32, 128, 240, 0.1)' };
        case 'redeem': return { icon: CreditCard, color: '#18a058', bg: 'rgba(24, 160, 88, 0.1)' };
        case 'checkin_expire': return { icon: Clock, color: '#d03050', bg: 'rgba(208, 48, 80, 0.1)' };
        case 'admin_topup': return { icon: UserEdit, color: '#18a058', bg: 'rgba(24, 160, 88, 0.1)' };
        default: return { icon: MoneyBillAlt, color: '#666', bg: '#eee' };
    }
}

// 获取文本和颜色配置
const getTypeConfig = (type) => {
    const text = t(`types.${type}`) || type;
    let color = 'default';
    switch (type) {
        case 'checkin':
        case 'lottery_win':
        case 'redeem':
        case 'admin_topup':
            color = 'success'; 
            break;
        case 'purchase':
        case 'lottery_cost':
            color = 'warning'; 
            break;
        case 'checkin_expire':
            color = 'error'; 
            break;
        default:
            color = 'default';
    }
    return { text, color };
}

// 表格列定义 (Desktop)
const columns = [
    { 
        title: t('time'), 
        key: 'created_at',
        width: 160,
        render(row) {
            return h(NTime, { time: new Date(row.created_at), type: 'datetime' })
        }
    },
    { 
        title: t('type'), 
        key: 'type',
        width: 120,
        render(row) {
            const config = getTypeConfig(row.type);
            return h(NTag, { type: config.color, bordered: false, size: 'small' }, { default: () => config.text })
        }
    },
    { 
        title: t('amount'), 
        key: 'amount',
        width: 120,
        render(row) {
            const amt = (row.amount / 100).toFixed(2);
            const style = {
                color: row.amount > 0 ? '#18a058' : (row.amount < 0 ? '#d03050' : '#333'),
                fontWeight: 'bold'
            };
            return h('span', { style }, (row.amount > 0 ? '+' : '') + amt + ' 元');
        }
    },
    { title: t('desc'), key: 'description' }
]

const fetchData = async () => {
    loading.value = true
    try {
        const limit = pagination.value.pageSize
        const offset = (pagination.value.page - 1) * limit
        const res = await api.getUserTransactions(limit, offset)
        data.value = res.results || []
        pagination.value.itemCount = res.count || 0
    } catch (e) {
        message.error(e.message || "Failed to load transactions")
    } finally {
        loading.value = false
    }
}

onMounted(fetchData)
</script>

<template>
    <div class="transactions-page">
        <div v-if="isMobile">
            <n-spin :show="loading">
                <div v-if="data.length > 0" class="mobile-list">
                    <div v-for="item in data" :key="item.id" class="mobile-card">
                        <div class="card-main">
                            <div class="card-icon" :style="{ background: getIconConfig(item.type).bg }">
                                <n-icon :size="20" :color:="getIconConfig(item.type).color">
                                    <component :is="getIconConfig(item.type).icon" />
                                </n-icon>
                            </div>

                            <div class="card-info">
                                <div class="card-title">{{ getTypeConfig(item.type).text }}</div>
                                <div class="card-time">
                                    <n-time :time="new Date(item.created_at)" format="yyyy-MM-dd HH:mm" />
                                </div>
                            </div>

                            <div class="card-amount" :class="{
                                'income': item.amount > 0,
                                'expense': item.amount < 0
                            }">
                                {{ item.amount > 0 ? '+' : '' }}{{ (item.amount / 100).toFixed(2) }}
                            </div>
                        </div>
                        
                        <div class="card-footer" v-if="item.description">
                            <div class="desc-text">{{ item.description }}</div>
                        </div>
                    </div>
                </div>
                
                <n-empty v-else :description="t('none')" style="margin-top: 50px;" />

                <div class="mobile-pagination" v-if="data.length > 0">
                    <n-pagination
                        v-model:page="pagination.page"
                        :item-count="pagination.itemCount"
                        :page-size="pagination.pageSize"
                        simple
                        @update:page="pagination.onChange"
                    />
                </div>
            </n-spin>
        </div>

        <n-data-table
            v-else
            :columns="columns"
            :data="data"
            :loading="loading"
            :pagination="pagination"
            remote
            :bordered="false"
            single-column
        />
    </div>
</template>

<style scoped>
/* 移动端列表样式优化 */
.mobile-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.mobile-card {
    /* 移除背景色和阴影，使其更像账单列表，或者保留卡片样式 */
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #f0f0f0;
    /* 禁止水平滚动 */
    width: 100%; 
    box-sizing: border-box;
}

.card-main {
    display: flex;
    align-items: center;
    gap: 12px;
}

.card-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.card-info {
    flex: 1;
    min-width: 0; /* 允许文本截断 */
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.card-title {
    font-weight: 500;
    font-size: 15px;
    color: #333;
    margin-bottom: 2px;
}

.card-time {
    font-size: 12px;
    color: #999;
}

.card-amount {
    font-size: 16px;
    font-weight: 600;
    flex-shrink: 0;
    margin-left: 10px;
    color: #333;
}

.card-amount.income {
    color: #18a058;
}

.card-amount.expense {
    color: #333; /* 支出通常用黑色或深色 */
}

.card-footer {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed #eee;
}

.desc-text {
    font-size: 12px;
    color: #888;
    line-height: 1.4;
    word-break: break-all; /* 关键：强制换行，防止撑开宽度 */
    white-space: normal;
}

.mobile-pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    margin-bottom: 20px;
}
</style>
