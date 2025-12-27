<script setup>
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NDataTable, NTag, NTime, NList, NListItem, NThing, NSpace, NPagination, NEmpty } from 'naive-ui'
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

// 辅助函数：获取类型对应的颜色和文本
const getTypeConfig = (type) => {
    const text = t(`types.${type}`) || type;
    let color = 'default';
    let sign = ''; // 金额符号前缀

    switch (type) {
        case 'checkin':
        case 'lottery_win':
        case 'redeem':
        case 'admin_topup':
            color = 'success'; // 绿色（收入）
            sign = '+';
            break;
        case 'purchase':
        case 'lottery_cost':
            color = 'warning'; // 橙色（支出）
            sign = '';
            break;
        case 'checkin_expire':
            color = 'error'; // 红色（过期）
            sign = '';
            break;
        default:
            color = 'default';
    }
    return { text, color, sign };
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
                color: row.amount > 0 ? '#18a058' : (row.amount < 0 ? '#d03050' : ''),
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
    <div class="transactions-container">
        <div v-if="isMobile">
            <n-list v-if="data.length > 0">
                <n-list-item v-for="item in data" :key="item.id">
                    <div class="mobile-item">
                        <div class="mobile-item-header">
                            <div class="mobile-item-type">
                                <n-tag :type="getTypeConfig(item.type).color" size="small" :bordered="false" round>
                                    {{ getTypeConfig(item.type).text }}
                                </n-tag>
                                <span class="mobile-item-time">
                                    <n-time :time="new Date(item.created_at)" format="MM-dd HH:mm" />
                                </span>
                            </div>
                            <div class="mobile-item-amount" :class="{
                                'income': item.amount > 0,
                                'expense': item.amount < 0
                            }">
                                {{ item.amount > 0 ? '+' : '' }}{{ (item.amount / 100).toFixed(2) }}
                            </div>
                        </div>
                        <div class="mobile-item-desc" v-if="item.description">
                            {{ item.description }}
                        </div>
                    </div>
                </n-list-item>
            </n-list>
            
            <n-empty v-else :description="t('none')" style="margin: 40px 0" />

            <div class="mobile-pagination" v-if="data.length > 0">
                <n-pagination
                    v-model:page="pagination.page"
                    :item-count="pagination.itemCount"
                    :page-size="pagination.pageSize"
                    simple
                    @update:page="pagination.onChange"
                />
            </div>
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
/* 移动端列表样式 */
.mobile-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.mobile-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mobile-item-type {
    display: flex;
    align-items: center;
    gap: 8px;
}

.mobile-item-time {
    font-size: 0.85em;
    color: #999;
}

.mobile-item-amount {
    font-weight: 600;
    font-size: 1.1em;
}

.mobile-item-amount.income {
    color: #18a058;
}

.mobile-item-amount.expense {
    color: #f0a020; /* 或者 #d03050 */
}

.mobile-item-desc {
    font-size: 0.9em;
    color: #666;
    background: #f9f9f9;
    padding: 4px 8px;
    border-radius: 4px;
}

.mobile-pagination {
    display: flex;
    justify-content: center;
    padding: 15px 0;
}
</style>
