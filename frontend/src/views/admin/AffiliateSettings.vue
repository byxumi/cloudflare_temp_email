<script setup>
import { ref, onMounted } from 'vue'
import { useMessage, NCard, NForm, NFormItem, NInputNumber, NSwitch, NButton, NDataTable, NTag, NSpace, NTabs, NTabPane, NPopconfirm } from 'naive-ui'
import { api } from '../../api'

const message = useMessage()
const settings = ref({
    enabled: true,
    rate: 10,
    minWithdraw: 100
})
const loading = ref(false)
const withdrawals = ref([])
const withdrawalLoading = ref(false)

const fetchSettings = async () => {
    loading.value = true
    try {
        const res = await api.adminGetAffSettings()
        settings.value = res
    } catch(e) { message.error("Failed to load settings") }
    finally { loading.value = false }
}

const saveSettings = async () => {
    loading.value = true
    try {
        await api.adminSaveAffSettings(settings.value)
        message.success("Settings saved")
    } catch(e) { message.error("Failed to save") }
    finally { loading.value = false }
}

const fetchWithdrawals = async (status = '') => {
    withdrawalLoading.value = true
    try {
        const res = await api.adminGetAffWithdrawals(status)
        withdrawals.value = res
    } catch(e) { message.error("Failed to load withdrawals") }
    finally { withdrawalLoading.value = false }
}

const handleApprove = async (id) => {
    try {
        await api.adminApproveWithdraw(id)
        message.success("Approved")
        fetchWithdrawals()
    } catch(e) { message.error("Failed to approve") }
}

const handleReject = async (id) => {
    try {
        await api.adminRejectWithdraw(id)
        message.success("Rejected")
        fetchWithdrawals()
    } catch(e) { message.error("Failed to reject") }
}

const columns = [
    { title: 'ID', key: 'id', width: 60 },
    { title: 'User Email', key: 'user_email' },
    { title: 'Amount', key: 'amount', render(row) { return (row.amount/100).toFixed(2) } },
    { title: 'Status', key: 'status', render(row) {
        return h(NTag, { type: row.status === 'approved' ? 'success' : (row.status === 'pending' ? 'warning' : 'error') }, { default: () => row.status })
    }},
    { title: 'Time', key: 'created_at' },
    { title: 'Actions', key: 'actions', render(row) {
        if (row.status !== 'pending') return '-'
        return h(NSpace, {}, { default: () => [
            h(NPopconfirm, { onPositiveClick: () => handleApprove(row.id) }, { 
                trigger: () => h(NButton, { size: 'small', type: 'primary' }, { default: () => 'Approve' }),
                default: () => 'Confirm Approve?' 
            }),
            h(NPopconfirm, { onPositiveClick: () => handleReject(row.id) }, { 
                trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => 'Reject' }),
                default: () => 'Confirm Reject?' 
            })
        ]})
    }}
]

onMounted(() => {
    fetchSettings()
    fetchWithdrawals()
})
</script>

<template>
    <div>
        <n-card title="Affiliate Settings" style="margin-bottom: 20px">
            <n-form inline :model="settings" label-placement="left">
                <n-form-item label="Enable Affiliate">
                    <n-switch v-model:value="settings.enabled" />
                </n-form-item>
                <n-form-item label="Rebate Rate (%)">
                    <n-input-number v-model:value="settings.rate" :min="0" :max="100" />
                </n-form-item>
                <n-form-item label="Min Withdraw (Cents)">
                    <n-input-number v-model:value="settings.minWithdraw" :min="0" />
                </n-form-item>
                <n-form-item>
                    <n-button type="primary" @click="saveSettings" :loading="loading">Save</n-button>
                </n-form-item>
            </n-form>
        </n-card>

        <n-card title="Withdrawal Requests">
            <n-tabs type="line" @update:value="fetchWithdrawals">
                <n-tab-pane name="" tab="All" />
                <n-tab-pane name="pending" tab="Pending" />
                <n-tab-pane name="approved" tab="Approved" />
                <n-tab-pane name="rejected" tab="Rejected" />
            </n-tabs>
            <n-data-table :columns="columns" :data="withdrawals" :loading="withdrawalLoading" />
        </n-card>
    </div>
</template>
