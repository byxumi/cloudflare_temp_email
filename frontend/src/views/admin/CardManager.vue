<script setup>
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NButton, NDataTable, NPagination, NModal, NForm, NFormItem, NInputNumber, NDatePicker, NPopconfirm, NSpace, NTag, NDropdown } from 'naive-ui'
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
            validUntil: 'Valid Until',
            actions: 'Actions',
            delete: 'Delete',
            disable: 'Pause',
            enable: 'Resume',
            confirmDelete: 'Delete this card?',
            operateSuccess: 'Success',
            batchActions: 'Batch Actions',
            selected: 'Selected',
            confirmBatchDelete: 'Confirm delete selected cards?',
            statusActive: 'Active',
            statusDisabled: 'Paused',
            statusUsed: 'Used'
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
            validUntil: '失效时间',
            actions: '操作',
            delete: '删除',
            disable: '暂停',
            enable: '恢复',
            confirmDelete: '确认删除此卡密？',
            operateSuccess: '操作成功',
            batchActions: '批量操作',
            selected: '已选择',
            confirmBatchDelete: '确认删除选中的卡密？',
            statusActive: '正常',
            statusDisabled: '已暂停',
            statusUsed: '已用完'
        }
    }
})

const data = ref([])
const showModal = ref(false)
const genForm = ref({ amount: 1.00, count: 10, timeRange: null, max_uses: 1 })
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const checkedRowKeys = ref([]) // 选中的ID

const fetchData = async () => {
    loading.value = true
    checkedRowKeys.value = [] // 刷新时清空选择
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
        let starts_at = null
        let expires_at = null
        if (genForm.value.timeRange && genForm.value.timeRange.length === 2) {
            starts_at = new Date(genForm.value.timeRange[0]).toISOString()
            expires_at = new Date(genForm.value.timeRange[1]).toISOString()
        }
        const res = await api.adminGenerateCards(genForm.value.amount, genForm.value.count, starts_at, expires_at, genForm.value.max_uses)
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

// 批量操作处理
const handleBatchAction = async (action) => {
    if (checkedRowKeys.value.length === 0) return;
    
    loading.value = true;
    try {
        if (action === 'delete') {
            await api.adminBatchDeleteCards(checkedRowKeys.value);
        } else {
            // action is 'active' or 'disabled'
            await api.adminBatchUpdateCardStatus(checkedRowKeys.value, action);
        }
        message.success(t('operateSuccess'));
        fetchData(); // 刷新列表
    } catch (e) {
        message.error(e.message);
    } finally {
        loading.value = false;
    }
}

// 批量操作下拉菜单
const batchOptions = [
    { label: t('enable'), key: 'active' },
    { label: t('disable'), key: 'disabled' },
    { label: t('delete'), key: 'delete', props: { style: 'color: red' } }
]

const handleSelectBatch = (key) => {
    if (key === 'delete') {
        // 触发确认弹窗逻辑，这里通过外层按钮控制或简单直接调用
        // 由于 NDropdown 不好直接嵌 Popconfirm，这里简化处理，直接调用带确认的逻辑
        if(!confirm(t('confirmBatchDelete'))) return; 
        handleBatchAction('delete');
    } else {
        handleBatchAction(key);
    }
}

// 单个操作
const handleDelete = async (id) => {
    try {
        await api.adminDeleteCard(id)
        message.success(t('operateSuccess'))
        fetchData()
    } catch (e) {
        message.error(e.message)
    }
}

const handleToggleStatus = async (row) => {
    const newStatus = row.status === 'active' ? 'disabled' : 'active'
    try {
        await api.adminUpdateCardStatus(row.id, newStatus)
        row.status = newStatus
        message.success(t('operateSuccess'))
    } catch (e) {
        message.error(e.message)
    }
}

const columns = [
    { type: 'selection' }, // 多选列
    { title: 'ID', key: 'id', width: 60 },
    { title: t('code'), key: 'code', width: 200, ellipsis: { tooltip: true } },
    { 
        title: t('amount'), 
        key: 'amount',
        render(row) { return (row.amount / 100).toFixed(2) }
    },
    { 
        title: t('status'), 
        key: 'status',
        render(row) {
            let type = 'default'
            let label = row.status
            if (row.status === 'active') { type = 'success'; label = t('statusActive') }
            else if (row.status === 'disabled') { type = 'warning'; label = t('statusDisabled') }
            else if (row.status === 'used') { type = 'info'; label = t('statusUsed') }
            return h(NTag, { type, size: 'small' }, { default: () => label })
        }
    },
    { title: t('usedCount'), key: 'used_count' },
    { 
        title: t('validUntil'), 
        key: 'expires_at', 
        width: 160,
        render(row) { return row.expires_at ? new Date(row.expires_at).toLocaleDateString() : '-' } 
    },
    {
        title: t('actions'),
        key: 'actions',
        width: 150,
        fixed: 'right',
        render(row) {
            return h(NSpace, null, {
                default: () => [
                    (row.status === 'active' || row.status === 'disabled') ? h(NButton, {
                        size: 'small',
                        type: row.status === 'active' ? 'warning' : 'success',
                        secondary: true,
                        onClick: () => handleToggleStatus(row)
                    }, { default: () => row.status === 'active' ? t('disable') : t('enable') }) : null,
                    
                    h(NPopconfirm, {
                        onPositiveClick: () => handleDelete(row.id)
                    }, {
                        trigger: () => h(NButton, { size: 'small', type: 'error', secondary: true }, { default: () => t('delete') }),
                        default: () => t('confirmDelete')
                    })
                ]
            })
        }
    }
]

onMounted(fetchData)
</script>

<template>
    <div>
        <div style="margin-bottom: 10px; display: flex; gap: 10px; align-items: center;">
            <n-button type="primary" @click="showModal = true">{{ t('generate') }}</n-button>
            
            <n-dropdown :options="batchOptions" @select="handleSelectBatch" :disabled="checkedRowKeys.length === 0">
                <n-button :disabled="checkedRowKeys.length === 0">
                    {{ t('batchActions') }} 
                    <span v-if="checkedRowKeys.length > 0">({{ checkedRowKeys.length }})</span>
                </n-button>
            </n-dropdown>

            <n-button @click="fetchData">刷新</n-button>
        </div>
        
        <n-data-table 
            :columns="columns" 
            :data="data" 
            :loading="loading" 
            :bordered="false" 
            :scroll-x="1000" 
            :row-key="row => row.id"
            v-model:checked-row-keys="checkedRowKeys"
        />
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