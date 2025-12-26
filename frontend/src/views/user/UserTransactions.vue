<script setup>
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NDataTable, NTag, NTime } from 'naive-ui'
import { api } from '../../api'

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
            let typeText = t(`types.${row.type}`) || row.type;
            let typeColor = 'default';

            switch (row.type) {
                case 'checkin':
                case 'lottery_win':
                case 'redeem':
                case 'admin_topup':
                    typeColor = 'success'; // 绿色（收入）
                    break;
                case 'purchase':
                case 'lottery_cost':
                    typeColor = 'warning'; // 橙色（支出）
                    break;
                case 'checkin_expire':
                    typeColor = 'error'; // 红色（过期）
                    break;
                default:
                    typeColor = 'default';
            }
            
            return h(NTag, { type: typeColor, bordered: false, size: 'small' }, { default: () => typeText })
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
    <n-data-table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        remote
        :bordered="false"
    />
</template>
