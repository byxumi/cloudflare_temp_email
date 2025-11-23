<script setup>
import { ref, onMounted, h, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NDataTable, NPagination, NTag } from 'naive-ui'
import { api } from '../../api'

const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            time: 'Time',
            type: 'Type',
            amount: 'Amount',
            desc: 'Description',
            typeRedeem: 'Redeem',
            typePurchase: 'Purchase',
            typeAdmin: 'Admin Topup'
        },
        zh: {
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
const pageSize = ref(10)
const total = ref(0)

const fetchData = async () => {
    loading.value = true
    try {
        const res = await api.getUserTransactions(pageSize.value, (page.value - 1) * pageSize.value)
        data.value = res.results
        // [修复] 防止翻页时 total 意外归零
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

// [修复] 使用 watch 监听分页，逻辑更稳健
watch([page, pageSize], () => {
    fetchData()
})

onMounted(fetchData)
</script>

<template>
    <div>
        <n-data-table :columns="columns" :data="data" :loading="loading" :bordered="false" />
        <n-pagination 
            v-model:page="page" 
            v-model:page-size="pageSize"
            :item-count="total" 
            :page-sizes="[10, 20, 50]"
            show-size-picker
            style="margin-top: 10px; justify-content: flex-end;"
        />
    </div>
</template>
