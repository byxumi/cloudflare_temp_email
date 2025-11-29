<script setup>
import { ref, onMounted, computed, h, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NButton, NDataTable, NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NPopconfirm, NPagination, NInputGroup } from 'naive-ui'
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
            deleteSuccess: 'Deleted successfully',
            search: 'Search Domain',
            edit: 'Edit'
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
            deleteSuccess: '删除成功',
            search: '搜索域名',
            edit: '编辑'
        }
    }
})

const data = ref([])
const showModal = ref(false)
const form = ref({ domain: null, role_text: 'default', price: 0.00 })
const loading = ref(false)
const roleOptions = ref([{ label: t('default'), value: 'default' }])
const checkedRowKeys = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchQuery = ref('') // [新增] 搜索词

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
        
        // [修改] 传递 searchQuery
        const res = await api.adminGetPrices(searchQuery.value)
        data.value = res.results || []
        
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

// [新增] 编辑功能
const handleEdit = (row) => {
    form.value = {
        domain: row.domain,
        role_text: row.role_text,
        price: row.price / 100 // 转回元
    }
    showModal.value = true
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
            return h(NSpace, null, {
                default: () => [
                    // [新增] 编辑按钮
                    h(NButton, { 
                        size: 'tiny', 
                        type: 'primary', 
                        secondary: true,
                        onClick: () => handleEdit(row)
                    }, { default: () => t('edit') }),
                    
                    h(NPopconfirm, {
                        onPositiveClick: () => handleDelete(row.id)
                    }, {
                        trigger: () => h(NButton, { size: 'tiny', type: 'error', secondary: true }, { default: () => t('delete') }),
                        default: () => t('confirmDelete')
                    })
                ]
            })
        }
    }
]

watch([page, pageSize], () => {
    fetchData() 
})

onMounted(fetchData)
</script>

<template>
    <div>
        <div style="margin-bottom: 10px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <n-button type="primary" @click="showModal = true">{{ t('setPrice') }}</n-button>
            <n-popconfirm v-if="checkedRowKeys.length > 0" @positive-click="handleBatchDelete">
                <template #trigger>
                    <n-button type="error" secondary>
                        {{ t('batchDelete') }} ({{ checkedRowKeys.length }})
                    </n-button>
                </template>
                {{ t('confirmBatchDelete') }}
            </n-popconfirm>
            
            <n-input-group style="width: 300px;">
                <n-input v-model:value="searchQuery" :placeholder="t('search')" @keydown.enter="fetchData" />
                <n-button type="primary" ghost @click="fetchData">{{ t('search') }}</n-button>
            </n-input-group>
            
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
                        tag // 允许输入不存在于选项中的域名
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
