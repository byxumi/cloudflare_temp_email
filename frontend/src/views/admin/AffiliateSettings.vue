<script setup>
import { ref, onMounted, h } from 'vue'
import { useMessage, NCard, NForm, NFormItem, NInputNumber, NSwitch, NButton, NDataTable, NTag, NSpace, NTabs, NTabPane, NPopconfirm } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { api } from '../../api'

const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            title: 'Affiliate Settings',
            withdrawRequests: 'Withdrawal Requests',
            enableAffiliate: 'Enable Affiliate',
            rebateRate: 'Rebate Rate (%)',
            minWithdraw: 'Min Withdraw (Cents)',
            save: 'Save',
            saved: 'Settings saved',
            all: 'All',
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
            id: 'ID',
            userEmail: 'User Email',
            amount: 'Amount',
            status: 'Status',
            time: 'Time',
            actions: 'Actions',
            approve: 'Approve',
            reject: 'Reject',
            confirmApprove: 'Confirm Approve?',
            confirmReject: 'Confirm Reject?',
            successApproved: 'Approved',
            successRejected: 'Rejected',
            failed: 'Operation Failed'
        },
        zh: {
            title: '邀请返利设置',
            withdrawRequests: '提现申请管理',
            enableAffiliate: '启用邀请返利',
            rebateRate: '返利比例 (%)',
            minWithdraw: '最低提现额 (分)',
            save: '保存',
            saved: '设置已保存',
            all: '全部',
            pending: '待审核',
            approved: '已通过',
            rejected: '已拒绝',
            id: 'ID',
            userEmail: '用户邮箱',
            amount: '金额 (元)',
            status: '状态',
            time: '时间',
            actions: '操作',
            approve: '批准',
            reject: '拒绝',
            confirmApprove: '确认批准该提现申请？',
            confirmReject: '确认拒绝该提现申请？',
            successApproved: '已批准',
            successRejected: '已拒绝',
            failed: '操作失败'
        }
    }
})

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
        message.success(t('saved'))
    } catch(e) { message.error(t('failed')) }
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
        message.success(t('successApproved'))
        fetchWithdrawals()
    } catch(e) { message.error(t('failed')) }
}

const handleReject = async (id) => {
    try {
        await api.adminRejectWithdraw(id)
        message.success(t('successRejected'))
        fetchWithdrawals()
    } catch(e) { message.error(t('failed')) }
}

const columns = [
    { title: t('id'), key: 'id', width: 60 },
    { title: t('userEmail'), key: 'user_email' },
    { title: t('amount'), key: 'amount', render(row) { return (row.amount/100).toFixed(2) } },
    { title: t('status'), key: 'status', render(row) {
        const typeMap = { 'approved': 'success', 'pending': 'warning', 'rejected': 'error' }
        const labelMap = { 'approved': t('approved'), 'pending': t('pending'), 'rejected': t('rejected') }
        return h(NTag, { type: typeMap[row.status] || 'default' }, { default: () => labelMap[row.status] || row.status })
    }},
    { title: t('time'), key: 'created_at' },
    { title: t('actions'), key: 'actions', render(row) {
        if (row.status !== 'pending') return '-'
        return h(NSpace, {}, { default: () => [
            h(NPopconfirm, { onPositiveClick: () => handleApprove(row.id) }, { 
                trigger: () => h(NButton, { size: 'small', type: 'primary' }, { default: () => t('approve') }),
                default: () => t('confirmApprove') 
            }),
            h(NPopconfirm, { onPositiveClick: () => handleReject(row.id) }, { 
                trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => t('reject') }),
                default: () => t('confirmReject') 
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
        <n-card :title="t('title')" style="margin-bottom: 20px">
            <n-form inline :model="settings" label-placement="left">
                <n-form-item :label="t('enableAffiliate')">
                    <n-switch v-model:value="settings.enabled" />
                </n-form-item>
                <n-form-item :label="t('rebateRate')">
                    <n-input-number v-model:value="settings.rate" :min="0" :max="100" />
                </n-form-item>
                <n-form-item :label="t('minWithdraw')">
                    <n-input-number v-model:value="settings.minWithdraw" :min="0" />
                </n-form-item>
                <n-form-item>
                    <n-button type="primary" @click="saveSettings" :loading="loading">{{ t('save') }}</n-button>
                </n-form-item>
            </n-form>
        </n-card>

        <n-card :title="t('withdrawRequests')">
            <n-tabs type="line" @update:value="fetchWithdrawals">
                <n-tab-pane name="" :tab="t('all')" />
                <n-tab-pane name="pending" :tab="t('pending')" />
                <n-tab-pane name="approved" :tab="t('approved')" />
                <n-tab-pane name="rejected" :tab="t('rejected')" />
            </n-tabs>
            <n-data-table :columns="columns" :data="withdrawals" :loading="withdrawalLoading" />
        </n-card>
    </div>
</template>
