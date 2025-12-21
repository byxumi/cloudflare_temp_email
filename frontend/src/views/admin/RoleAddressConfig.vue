<script setup>
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NSwitch, NInput, NButton, NDataTable, NModal, NForm, NFormItem, NInputNumber } from 'naive-ui'
import { api } from '../../api'

const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            title: 'Role Address Config',
            add: 'Add',
            role: 'Role/Address',
            maxAddressCount: 'Max Address Count',
            actions: 'Actions',
            edit: 'Edit',
            delete: 'Delete',
            save: 'Save',
            noAutoCleanup: 'No Auto Cleanup',
            allowSend: 'Allow Send',
            unlimitedSend: 'Unlimited Send',
            cleanInboxDays: 'Inbox Clean Days (Optional)',
            cleanSentDays: 'Sent Box Clean Days (Optional)',
            tips: 'You can configure by user role (e.g. "admin", "vip") or specific email address (e.g. "test@example.com"). Address config takes precedence.',
            deleteConfirm: 'Are you sure?'
        },
        zh: {
            title: '角色/地址配置',
            add: '添加',
            role: '角色/邮箱地址',
            maxAddressCount: '最大地址数量',
            actions: '操作',
            edit: '编辑',
            delete: '删除',
            save: '保存',
            noAutoCleanup: '不自动清理',
            allowSend: '允许发件',
            unlimitedSend: '无限制发件',
            cleanInboxDays: '收件箱清理天数 (选填)',
            cleanSentDays: '发件箱清理天数 (选填)',
            tips: '您可以配置用户角色 (如 "admin", "vip") 或具体邮箱地址。具体地址配置优先级更高。',
            deleteConfirm: '确定删除吗？'
        }
    }
})

const data = ref([])
const showModal = ref(false)
const form = ref({ key: '', maxAddressCount: 0, noAutoCleanup: false, allowSend: true, unlimitedSend: false, cleanInboxDays: null, cleanSentDays: null })
const configs = ref({})

const fetchData = async () => {
    try {
        const res = await api.fetch('/admin/role_address_config')
        configs.value = res.configs || {}
        const list = []
        // Process roles
        for (const [key, val] of Object.entries(configs.value)) {
            if (key === 'specificAddresses') continue;
            list.push({ key, ...val, type: 'Role' })
        }
        // Process specific addresses
        if (configs.value.specificAddresses) {
            for (const [key, val] of Object.entries(configs.value.specificAddresses)) {
                list.push({ key, ...val, type: 'Address' })
            }
        }
        data.value = list
    } catch (e) {
        message.error(e.message)
    }
}

const handleSave = async () => {
    if (!form.value.key) return
    const key = form.value.key
    const newConfig = {
        maxAddressCount: form.value.maxAddressCount,
        noAutoCleanup: form.value.noAutoCleanup,
        allowSend: form.value.allowSend,
        unlimitedSend: form.value.unlimitedSend,
        cleanInboxDays: form.value.cleanInboxDays,
        cleanSentDays: form.value.cleanSentDays
    }

    if (key.includes('@')) {
        if (!configs.value.specificAddresses) configs.value.specificAddresses = {}
        configs.value.specificAddresses[key] = newConfig
    } else {
        configs.value[key] = newConfig
    }

    try {
        await api.fetch('/admin/role_address_config', {
            method: 'POST',
            body: JSON.stringify({ configs: configs.value })
        })
        message.success(t('save') + ' Success')
        showModal.value = false
        fetchData()
    } catch (e) {
        message.error(e.message)
    }
}

const handleDelete = async (row) => {
    if (row.type === 'Address') {
        delete configs.value.specificAddresses[row.key]
    } else {
        delete configs.value[row.key]
    }
    try {
        await api.fetch('/admin/role_address_config', {
            method: 'POST',
            body: JSON.stringify({ configs: configs.value })
        })
        message.success(t('delete') + ' Success')
        fetchData()
    } catch (e) {
        message.error(e.message)
    }
}

const columns = [
    { title: t('role'), key: 'key' },
    { title: t('maxAddressCount'), key: 'maxAddressCount' },
    { 
        title: t('cleanInboxDays'), 
        key: 'cleanInboxDays',
        render(row) {
            return row.cleanInboxDays === undefined || row.cleanInboxDays === null ? 'Default' : row.cleanInboxDays
        }
    },
    { 
        title: t('cleanSentDays'), 
        key: 'cleanSentDays',
        render(row) {
            return row.cleanSentDays === undefined || row.cleanSentDays === null ? 'Default' : row.cleanSentDays
        }
    },
    {
        title: t('noAutoCleanup'),
        key: 'noAutoCleanup',
        render(row) { return row.noAutoCleanup ? 'Yes' : 'No' }
    },
    {
        title: t('allowSend'),
        key: 'allowSend',
        render(row) { return row.allowSend !== false ? 'Yes' : 'No' }
    },
    {
        title: t('actions'),
        key: 'actions',
        render(row) {
            return h(NButton, {
                size: 'small',
                type: 'error',
                onClick: () => { if(confirm(t('deleteConfirm'))) handleDelete(row) }
            }, { default: () => t('delete') })
        }
    }
]

const openAdd = () => {
    form.value = { key: '', maxAddressCount: 5, noAutoCleanup: false, allowSend: true, unlimitedSend: false, cleanInboxDays: null, cleanSentDays: null }
    showModal.value = true
}

onMounted(fetchData)
</script>

<template>
    <div>
        <div style="margin-bottom: 10px">
            <p>{{ t('tips') }}</p>
            <n-button type="primary" @click="openAdd">{{ t('add') }}</n-button>
        </div>
        <n-data-table :columns="columns" :data="data" :bordered="false" />
        <n-modal v-model:show="showModal" preset="card" :title="t('add')" style="width: 500px">
            <n-form>
                <n-form-item :label="t('role')">
                    <n-input v-model:value="form.key" placeholder="admin / user / test@example.com" />
                </n-form-item>
                <n-form-item :label="t('maxAddressCount')">
                    <n-input-number v-model:value="form.maxAddressCount" />
                </n-form-item>
                <n-form-item :label="t('cleanInboxDays')">
                    <n-input-number v-model:value="form.cleanInboxDays" placeholder="Leave empty for default" clearable />
                </n-form-item>
                <n-form-item :label="t('cleanSentDays')">
                    <n-input-number v-model:value="form.cleanSentDays" placeholder="Leave empty for default" clearable />
                </n-form-item>
                <n-form-item :label="t('noAutoCleanup')">
                    <n-switch v-model:value="form.noAutoCleanup" />
                </n-form-item>
                <n-form-item :label="t('allowSend')">
                    <n-switch v-model:value="form.allowSend" />
                </n-form-item>
                <n-form-item :label="t('unlimitedSend')">
                    <n-switch v-model:value="form.unlimitedSend" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" @click="handleSave">{{ t('save') }}</n-button>
            </template>
        </n-modal>
    </div>
</template>
