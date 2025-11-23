<script setup>
import { ref, onMounted, h, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NDataTable, NPagination, NTag, NButton } from 'naive-ui'
import { api } from '../../api'

const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            user: 'User',
            time: 'Time',
            type: 'Type',
            amount: 'Amount',
            desc: 'Description',
            typeRedeem: 'Redeem',
            typePurchase: 'Purchase',
            typeAdmin: 'Admin Topup'
        },
        zh: {
            user: '用户',
            time: '时间',
            type: '类型',
            amount: '金额',
            desc: '描述',
            typeRedeem: '卡密充值',
            typePurchase: '购买消费',
            typeAdmin: '管理员充值'
        }
    }
})

const data = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetchData = async () => {
    loading.value = true
    try {
        const res = await api.adminGetTransactions(pageSize.value, (page.value - 1) * pageSize.value)
        data.value = res.results
        // [修复] 防止 total 归零
        if (res.count > 0) {
            total.value = res.count
        }
    } catch (e) {
        message.error(e.message)
    } finally {
        loading.value = false
    }
}

const columns = [
    { title: t('user'), key: 'user_email' },
    { 
        title: t('time'), 
        key: 'created_at',
        render(row) { return new Date(row.created_at).toLocaleString() }
    },
    { 
        title: t('type'), 
        key: 'type',
        render(row) {
            let type = 'default'
            let text = row.type
            if (row.type === 'redeem') { type = 'success'; text = t('typeRedeem') }
            if (row.type === 'purchase') { type = 'warning'; text = t('typePurchase') }
            if (row.type === 'admin_topup') { type = 'info'; text = t('typeAdmin') }
            return h(NTag, { type, size: 'small' }, { default: () => text })
        }
    },
    { 
        title: t('amount'), 
        key: 'amount',
        render(row) {
            const amt = (row.amount / 100).toFixed(2)
            return h('span', { style: { color: row.amount > 0 ? 'green' : 'red', fontWeight: 'bold' } }, 
                row.amount > 0 ? `+${amt}` : amt
            )
        }
    },
    { title: t('desc'), key: 'description' }
]

// [修复] 使用 watch
watch([page, pageSize], () => {
    fetchData()
})

onMounted(fetchData)
</script>

<template>
    <div>
        <div style="margin-bottom: 10px;">
            <n-button @click="fetchData">刷新</n-button>
        </div>
        <n-data-table :columns="columns" :data="data" :loading="loading" :bordered="false" />
        <n-pagination 
            v-model:page="page" 
            v-model:page-size="pageSize"
            :item-count="total" 
            :page-sizes="[20, 50, 100]"
            show-size-picker
            style="margin-top: 10px;"
        />
    </div>
</template>
