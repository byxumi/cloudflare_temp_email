<script setup>
import { ref, onMounted } from 'vue'
import { useMessage, NCard, NStatistic, NButton, NSpace, NInput, NDataTable, NTag, NTabs, NTabPane, NModal, NInputNumber } from 'naive-ui'
import { api } from '../../api'
import useClipboard from 'vue-clipboard3'

const message = useMessage()
const { toClipboard } = useClipboard()

const info = ref({ invitation_code: '', aff_balance: 0, invite_count: 0, settings: {} })
const history = ref([])
const showWithdrawModal = ref(false)
const withdrawAmount = ref(0)
const loading = ref(false)

const fetchData = async () => {
    const res = await api.getAffInfo()
    info.value = res
    const hist = await api.getAffHistory()
    history.value = hist
}

const generateCode = async () => {
    try {
        const res = await api.generateAffCode()
        info.value.invitation_code = res.invitation_code
        message.success("Code Generated")
    } catch(e) { message.error(e.message) }
}

const copyCode = async () => {
    await toClipboard(info.value.invitation_code)
    message.success("Copied")
}

const handleWithdraw = async () => {
    if(withdrawAmount.value < info.value.settings.minWithdraw) {
        return message.error(`Min withdraw is ${(info.value.settings.minWithdraw/100).toFixed(2)}`)
    }
    loading.value = true
    try {
        await api.withdrawAff(withdrawAmount.value)
        message.success("Request Submitted")
        showWithdrawModal.value = false
        fetchData()
    } catch(e) { message.error(e.message) }
    finally { loading.value = false }
}

const columns = [
    { title: 'Time', key: 'created_at' },
    { title: 'Type', key: 'type', render(row){ return row.type === 'rebate' ? 'Rebate' : 'Withdraw' } },
    { title: 'Amount', key: 'amount', render(row){ return (row.amount/100).toFixed(2) } }
]

onMounted(fetchData)
</script>

<template>
    <div>
        <n-card title="Affiliate Program" class="glass-panel">
            <n-space justify="space-between">
                <n-statistic label="Balance" :value="(info.aff_balance/100).toFixed(2)">
                    <template #prefix>¥</template>
                </n-statistic>
                <n-statistic label="Invited Users" :value="info.invite_count" />
                <n-statistic label="Rebate Rate" :value="info.settings.rate">
                    <template #suffix>%</template>
                </n-statistic>
            </n-space>
            
            <n-divider />
            
            <div v-if="!info.invitation_code">
                <n-button type="primary" @click="generateCode">Generate Invitation Code</n-button>
            </div>
            <div v-else>
                <n-input-group>
                    <n-input :value="info.invitation_code" readonly />
                    <n-button @click="copyCode">Copy</n-button>
                </n-input-group>
                <p style="margin-top: 10px; color: gray; font-size: 12px;">Share this code with new users.</p>
            </div>

            <n-divider />

            <n-button type="warning" @click="showWithdrawModal = true" :disabled="info.aff_balance < info.settings.minWithdraw">
                Transfer to Wallet
            </n-button>
            <p style="font-size: 12px; color: gray">Min withdraw: ¥{{ (info.settings.minWithdraw/100).toFixed(2) }}</p>
        </n-card>

        <n-card title="History" style="margin-top: 20px" class="glass-panel">
            <n-data-table :columns="columns" :data="history" />
        </n-card>

        <n-modal v-model:show="showWithdrawModal" preset="card" title="Transfer to Wallet" style="width: 300px">
            <n-input-number v-model:value="withdrawAmount" placeholder="Amount (cents)" :min="info.settings.minWithdraw" :max="info.aff_balance" />
            <p>Amount in cents (e.g. 100 = 1 Yuan)</p>
            <template #action>
                <n-button type="primary" block :loading="loading" @click="handleWithdraw">Confirm</n-button>
            </template>
        </n-modal>
    </div>
</template>
