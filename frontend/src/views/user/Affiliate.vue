<script setup>
import { ref, onMounted } from 'vue'
import { useMessage, NCard, NStatistic, NButton, NSpace, NInput, NDataTable, NDivider, NInputGroup, NModal, NInputNumber } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { api } from '../../api'
import useClipboard from 'vue-clipboard3'

const message = useMessage()
const { toClipboard } = useClipboard()

const { t } = useI18n({
    messages: {
        en: {
            title: 'Affiliate Program',
            balance: 'Balance',
            invitedUsers: 'Invited Users',
            rebateRate: 'Rebate Rate',
            generateCode: 'Generate Invitation Code',
            copy: 'Copy',
            copied: 'Copied',
            shareTip: 'Share this code with new users.',
            transferToWallet: 'Transfer to Wallet',
            minWithdraw: 'Min withdraw',
            history: 'History',
            time: 'Time',
            type: 'Type',
            amount: 'Amount',
            rebate: 'Rebate',
            withdraw: 'Withdraw',
            confirm: 'Confirm',
            amountCents: 'Amount (cents)',
            amountTip: 'Amount in cents (e.g. 100 = 1 Yuan)',
            requestSubmitted: 'Request Submitted',
            codeGenerated: 'Code Generated',
            insufficient: 'Insufficient balance or below minimum',
        },
        zh: {
            title: '邀请返利',
            balance: '返利余额',
            invitedUsers: '已邀请人数',
            rebateRate: '返利比例',
            generateCode: '生成邀请码',
            copy: '复制',
            copied: '已复制',
            shareTip: '将此邀请码分享给新用户，注册时填写即可绑定。',
            transferToWallet: '转入余额',
            minWithdraw: '最低提现',
            history: '资金记录',
            time: '时间',
            type: '类型',
            amount: '金额',
            rebate: '返利',
            withdraw: '提现',
            confirm: '确认转入',
            amountCents: '金额 (分)',
            amountTip: '单位：分 (例如 100 代表 1 元)',
            requestSubmitted: '申请已提交，请等待管理员审核',
            codeGenerated: '邀请码已生成',
            insufficient: '余额不足或低于最低提现额',
        }
    }
})

const info = ref({ invitation_code: '', aff_balance: 0, invite_count: 0, settings: {} })
const history = ref([])
const showWithdrawModal = ref(false)
const withdrawAmount = ref(0)
const loading = ref(false)

const fetchData = async () => {
    try {
        const res = await api.getAffInfo()
        info.value = res
        const hist = await api.getAffHistory()
        history.value = hist
    } catch (e) {
        // quiet fail
    }
}

const generateCode = async () => {
    try {
        const res = await api.generateAffCode()
        info.value.invitation_code = res.invitation_code
        message.success(t('codeGenerated'))
    } catch(e) { message.error(e.message) }
}

const copyCode = async () => {
    try {
        await toClipboard(info.value.invitation_code)
        message.success(t('copied'))
    } catch (e) {
        message.error(e.message)
    }
}

const handleWithdraw = async () => {
    if(withdrawAmount.value < info.value.settings.minWithdraw) {
        return message.error(`${t('minWithdraw')}: ${(info.value.settings.minWithdraw/100).toFixed(2)}`)
    }
    loading.value = true
    try {
        await api.withdrawAff(withdrawAmount.value)
        message.success(t('requestSubmitted'))
        showWithdrawModal.value = false
        fetchData()
    } catch(e) { message.error(e.message) }
    finally { loading.value = false }
}

const columns = [
    { title: t('time'), key: 'created_at' },
    { title: t('type'), key: 'type', render(row){ return row.type === 'rebate' ? t('rebate') : t('withdraw') } },
    { title: t('amount'), key: 'amount', render(row){ return (row.amount/100).toFixed(2) } }
]

onMounted(fetchData)
</script>

<template>
    <div>
        <n-card :title="t('title')" class="glass-panel">
            <n-space justify="space-between" size="large">
                <n-statistic :label="t('balance')" :value="(info.aff_balance/100).toFixed(2)">
                    <template #prefix>¥</template>
                </n-statistic>
                <n-statistic :label="t('invitedUsers')" :value="info.invite_count" />
                <n-statistic :label="t('rebateRate')" :value="info.settings.rate">
                    <template #suffix>%</template>
                </n-statistic>
            </n-space>
            
            <n-divider />
            
            <div v-if="!info.invitation_code">
                <n-button type="primary" @click="generateCode">{{ t('generateCode') }}</n-button>
            </div>
            <div v-else>
                <n-input-group>
                    <n-input :value="info.invitation_code" readonly />
                    <n-button @click="copyCode">{{ t('copy') }}</n-button>
                </n-input-group>
                <p style="margin-top: 10px; color: gray; font-size: 12px;">{{ t('shareTip') }}</p>
            </div>

            <n-divider />

            <n-button type="warning" @click="showWithdrawModal = true" :disabled="info.aff_balance < info.settings.minWithdraw">
                {{ t('transferToWallet') }}
            </n-button>
            <p style="font-size: 12px; color: gray; margin-top: 5px;">{{ t('minWithdraw') }}: ¥{{ (info.settings.minWithdraw/100).toFixed(2) }}</p>
        </n-card>

        <n-card :title="t('history')" style="margin-top: 20px" class="glass-panel">
            <n-data-table :columns="columns" :data="history" />
        </n-card>

        <n-modal v-model:show="showWithdrawModal" preset="card" :title="t('transferToWallet')" style="width: 300px">
            <n-input-number v-model:value="withdrawAmount" :placeholder="t('amountCents')" :min="info.settings.minWithdraw" :max="info.aff_balance" />
            <p style="font-size: 12px; color: gray; margin-top: 5px;">{{ t('amountTip') }}</p>
            <template #action>
                <n-button type="primary" block :loading="loading" @click="handleWithdraw">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>
    </div>
</template>

<style scoped>
.glass-panel {
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
</style>
