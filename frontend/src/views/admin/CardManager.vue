<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NButton, NDataTable, NPagination, NModal, NForm, NFormItem, NInputNumber, NDatePicker } from 'naive-ui'
import { api } from '../../api'

const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            generate: 'Generate Cards',
            amount: 'Amount (CNY)',
            count: 'Count',
            validityPeriod: 'Validity Period',
            maxUses: 'Max Uses',
            code: 'Code',
            status: 'Status',
            usedCount: 'Used',
            timeRange: 'Valid Time Range',
            generateSuccess: 'Generated Successfully',
            downloadTip: 'Cards have been downloaded automatically.',
            validFrom: 'Valid From',
            validUntil: 'Valid Until'
        },
        zh: {
            generate: '生成卡密',
            amount: '面额 (元)',
            count: '数量 (张)',
            validityPeriod: '有效期限 (留空则永久有效)',
            maxUses: '最大使用次数',
            code: '卡密',
            status: '状态',
            usedCount: '使用次数',
            timeRange: '生效时间段',
            generateSuccess: '生成成功',
            downloadTip: '卡密文件已自动下载',
            validFrom: '生效时间',
            validUntil: '失效时间'
        }
    }
})

const data = ref([])
const showModal = ref(false)
// 表单数据
const genForm = ref({ 
    amount: 1.00, 
    count: 10,
    timeRange: null, // [start, end]
    max_uses: 1
})
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetchData = async () => {
    loading.value = true
    try {
        const res = await api.adminGetCards(pageSize.value, (page.value - 1) * pageSize.value)
        data.value = res.results
        total.value = res.count
    } catch (e) {
        message.error(e.message)
    } finally {
        loading.value = false
    }
}

const handleGenerate = async () => {
    loading.value = true
    try {
        // 处理时间
        let starts_at = null
        let expires_at = null
        if (genForm.value.timeRange && genForm.value.timeRange.length === 2) {
            starts_at = new Date(genForm.value.timeRange[0]).toISOString()
            expires_at = new Date(genForm.value.timeRange[1]).toISOString()
        }

        const res = await api.adminGenerateCards(
            genForm.value.amount, 
            genForm.value.count, 
            starts_at, 
            expires_at,
            genForm.value.max_uses
        )
        
        if (res.success) {
            message.success(t('generateSuccess'))
            if (res.codes && res.codes.length > 0) {
                const blob = new Blob([res.codes.join('\n')], { type: 'text/plain' })
                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = `cards_${genForm.value.amount}yuan_${Date.now()}.txt`
                link.click()
                message.info(t('downloadTip'))
            }
            showModal.value = false
            fetchData()
        }
    } catch (e) {
        message.error(e.message)
    } finally {
        loading.value = false
    }
}

const columns = [
    { title: 'ID', key: 'id', width: 60 },
    { title: t('code'), key: 'code', width: 200, ellipsis: { tooltip: true } },
    { 
        title: t('amount'), 
        key: 'amount',
        render(row) { return (row.amount / 100).toFixed(2) }
    },
    { title: t('status'), key: 'status' },
    { title: t('usedCount'), key: 'used_count' },
    { 
        title: t('validFrom'), 
        key: 'starts_at', 
        width: 160,
        render(row) { return row.starts_at ? new Date(row.starts_at).toLocaleString() : '-' } 
    },
    { 
        title: t('validUntil'), 
        key: 'expires_at', 
        width: 160,
        render(row) { return row.expires_at ? new Date(row.expires_at).toLocaleString() : '-' } 
    }
]

onMounted(fetchData)
</script>

<template>
    <div>
        <div style="margin-bottom: 10px">
            <n-button type="primary" @click="showModal = true">{{ t('generate') }}</n-button>
            <n-button style="margin-left: 10px" @click="fetchData">刷新</n-button>
        </div>
        
        <n-data-table :columns="columns" :data="data" :loading="loading" :bordered="false" :scroll-x="1000" />
        <n-pagination 
            v-model:page="page" 
            :item-count="total" 
            :page-size="pageSize" 
            @update:page="fetchData" 
            style="margin-top: 10px"
        />

        <n-modal v-model:show="showModal" preset="dialog" :title="t('generate')" style="width: 600px">
            <n-form label-placement="left" label-width="auto">
                <n-form-item :label="t('amount')">
                    <n-input-number v-model:value="genForm.amount" :precision="2" :step="1.00" placeholder="1.00" style="width: 100%"/>
                </n-form-item>
                <n-form-item :label="t('count')">
                    <n-input-number v-model:value="genForm.count" :precision="0" style="width: 100%"/>
                </n-form-item>
                <n-form-item :label="t('validityPeriod')">
                    <n-date-picker 
                        v-model:value="genForm.timeRange" 
                        type="datetimerange" 
                        clearable 
                        style="width: 100%"
                    />
                </n-form-item>
                <n-form-item :label="t('maxUses')">
                    <n-input-number v-model:value="genForm.max_uses" :precision="0" min="1" style="width: 100%"/>
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" :loading="loading" @click="handleGenerate">{{ t('generate') }}</n-button>
            </template>
        </n-modal>
    </div>
</template>