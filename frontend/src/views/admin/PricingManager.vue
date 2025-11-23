<script setup>
import { ref, onMounted, computed, h, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NButton, NDataTable, NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NPopconfirm, NPagination } from 'naive-ui'
import { api } from '../../api'
import { useGlobalState } from '../../store'

const message = useMessage()
const { openSettings } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            domain: 'Domain',
            role: 'Role',
            price: 'Price (CNY)',
            save: 'Save',
            setPrice: 'Set Price',
            updatedAt: 'Updated At',
            selectDomain: 'Select Domain',
            selectRole: 'Select Role (Default is "default")',
            default: 'Default User',
            actions: 'Actions',
            delete: 'Delete',
            batchDelete: 'Batch Delete',
            confirmDelete: 'Confirm delete?',
            confirmBatchDelete: 'Confirm delete selected items?',
            deleteSuccess: 'Deleted successfully'
        },
        zh: {
            domain: '域名',
            role: '角色',
            price: '价格 (元)',
            save: '保存',
            setPrice: '设置价格',
            updatedAt: '更新时间',
            selectDomain: '选择域名',
            selectRole: '选择角色 (默认为 default)',
            default: '默认用户',
            actions: '操作',
            delete: '删除',
            batchDelete: '批量删除',
            confirmDelete: '确认删除？',
            confirmBatchDelete: '确认删除选中项？',
            deleteSuccess: '删除成功'
        }
    }
})

const data = ref([])
const showModal = ref(false)
const form = ref({ domain: null, role_text: 'default', price: 0.00 })
const loading = ref(false)
const roleOptions = ref([{ label: t('default'), value: 'default' }])
const checkedRowKeys = ref([])
// [修复] 增加分页状态
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const domainOptions = computed(() => {
    if (openSettings.value && openSettings.value.domains) {
        return openSettings.value.domains.map(d => ({
            label: d.label || d.value,
            value: d.value
        }))
    }
    return []
})

const fetchData = async () => {
    loading.value = true
    checkedRowKeys.value = []
    try {
        if (!openSettings.value.fetched) {
            await api.getOpenSettings(message)
        }
        
        // 获取定价列表 (这里虽然 api 可能没传 limit/offset，但后端支持的话最好加上)
        // 如果 adminGetPrices 不支持分页，这里就只展示数据
        const res = await api.adminGetPrices()
        data.value = res.results || []
        
        // [修复] 分页逻辑兼容
        if (res.count > 0) {
            total.value = res.count
        }

        const roles = await api.adminGetUserRoles()
        if (roles && Array.isArray(roles)) {
            const apiRoles = roles.map(r => ({ label: r.role, value: r.role }))
            roleOptions.value = [{ label: t('default'), value: 'default' }, ...apiRoles]
        }
    } catch (e) {
        message.error(e.message)
    } finally {
        loading.value = false
    }
}

const handleSave = async () => {
    if (!form.value.domain) return message.error("Please select a domain")
    if (!form.value.role_text) form.value.role_text = 'default'
    
    loading.value = true
    try {
        const res = await api.adminSetPrice(form.value.domain, form.value.role_text, form.value.price)
        if (res.success) {
            message.success('Saved')
            showModal.value = false
            fetchData()
        }
    } catch (e) {
        message.error(e.message)
    } finally {
        loading.value = false
    }
}

const handleDelete = async (id) => {
    try {
        await api.adminDeletePrice(id)
        message.success(t('deleteSuccess'))
        fetchData()
    } catch (e) {
        message.error(e.message)
    }
}

const handleBatchDelete = async () => {
    if (checkedRowKeys.value.length === 0) return
    try {
        await api.adminBatchDeletePrices(checkedRowKeys.value)
        message.success(t('deleteSuccess'))
        fetchData()
    } catch (e) {
        message.error(e.message)
    }
}

const columns = [
    { type: 'selection' },
    { title: t('domain'), key: 'domain' },
    { title: t('role'), key: 'role_text' },
    { 
        title: t('price'), 
        key: 'price',
        render(row) {
            return (row.price / 100).toFixed(2)
        }
    },
    { title: t('updatedAt'), key: 'updated_at' },
    {
        title: t('actions'),
        key: 'actions',
        render(row) {
            return h(NPopconfirm, {
                onPositiveClick: () => handleDelete(row.id)
            }, {
                trigger: () => h(NButton, { size: 'tiny', type: 'error', secondary: true }, { default: () => t('delete') }),
                default: () => t('confirmDelete')
            })
        }
    }
]

// [修复] 监听分页
watch([page, pageSize], () => {
    // 如果后端 adminGetPrices 支持分页，这里可以传参
    // 目前代码里 adminGetPrices 是直接返回所有，所以这个 watch 主要为了未来扩展
    fetchData() 
})

onMounted(fetchData)
</script>

<template>
    <div>
        <div style="margin-bottom: 10px; display: flex; gap: 10px;">
            <n-button type="primary" @click="showModal = true">{{ t('setPrice') }}</n-button>
            <n-popconfirm v-if="checkedRowKeys.length > 0" @positive-click="handleBatchDelete">
                <template #trigger>
                    <n-button type="error" secondary>
                        {{ t('batchDelete') }} ({{ checkedRowKeys.length }})
                    </n-button>
                </template>
                {{ t('confirmBatchDelete') }}
            </n-popconfirm>
            <n-button style="margin-left: auto;" @click="fetchData">刷新</n-button>
        </div>
        
        <n-data-table 
            :columns="columns" 
            :data="data" 
            :loading="loading" 
            :bordered="false" 
            :row-key="row => row.id"
            v-model:checked-row-keys="checkedRowKeys"
        />
        
        <n-pagination 
            v-if="total > 0"
            v-model:page="page" 
            v-model:page-size="pageSize"
            :item-count="total"
            style="margin-top: 10px"
        />

        <n-modal v-model:show="showModal" preset="dialog" :title="t('setPrice')">
            <n-form>
                <n-form-item :label="t('domain')" required>
                    <n-select 
                        v-model:value="form.domain" 
                        :options="domainOptions" 
                        :placeholder="t('selectDomain')" 
                        filterable
                    />
                </n-form-item>
                <n-form-item :label="t('role')">
                    <n-select 
                        v-model:value="form.role_text" 
                        :options="roleOptions" 
                        :placeholder="t('selectRole')" 
                    />
                </n-form-item>
                 <n-form-item :label="t('price')">
                    <n-input-number v-model:value="form.price" :precision="2" :step="0.1" placeholder="0.00" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" :loading="loading" @click="handleSave">{{ t('save') }}</n-button>
            </template>
        </n-modal>
    </div>
</template>
