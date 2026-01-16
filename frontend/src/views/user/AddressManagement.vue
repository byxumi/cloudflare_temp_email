<script setup>
import { ref, onMounted, computed, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, useDialog, NButton, NTag, NDropdown, NSpace, NModal, NForm, NFormItem, NInput, NSelect, NSpin, NDataTable, NIcon, NInputNumber } from 'naive-ui'
import useClipboard from 'vue-clipboard3'
import { CloudDownloadAlt, PlusSquare, CheckSquare } from '@vicons/fa'
import { useGlobalState } from '../../store'
import { api } from '../../api'

const router = useRouter()
const { openSettings, jwt, userBalance, userSettings, auth, userJwt } = useGlobalState()
const message = useMessage()
const dialog = useDialog()
const { toClipboard } = useClipboard()

const checkinBalance = ref(0)

const { t } = useI18n({
    messages: {
        en: {
            createAddress: 'New Address',
            bindExisting: 'Bind Existing',
            address: 'Address',
            actions: 'Actions',
            delete: 'Delete',
            cancel: 'Cancel',
            confirm: 'Confirm',
            selectDomain: 'Select Domain',
            prefix: 'Prefix',
            domain: 'Domain',
            price: 'Price',
            free: 'Free',
            currentPrice: 'Current Price: ',
            balance: 'Your Balance: ',
            insufficientBalance: 'Insufficient balance',
            confirmPurchase: 'Confirm Purchase',
            createSuccess: 'Created Successfully',
            unbindSuccess: 'Unbind Successfully',
            switch: 'Switch',
            copyCredential: 'Copy Credential',
            copyEmail: 'Copy Email',
            transfer: 'Transfer',
            transferTitle: 'Transfer Address',
            targetEmail: 'Target User Email',
            transferSuccess: 'Transferred Successfully',
            bindTitle: 'Bind Existing Address',
            jwtPlaceholder: 'Paste Address JWT Credential',
            bindSuccess: 'Bound Successfully',
            switched: 'Switched to ',
            copied: 'Copied',
            more: 'More',
            random: 'Random', 
            bindFailed: 'Bind failed',
            viewPrices: 'View Prices',
            priceList: 'Domain Price List',
            currency: 'CNY',
            remark: 'Remark',
            editRemark: 'Edit Remark',
            remarkPlaceholder: 'Enter remark',
            dailyCheckin: 'Daily Check-in',
            checkinSuccess: 'Check-in Success! Got ',
            checkinBalance: 'Check-in Bal: ',
            mainBalance: 'Main Bal: ',
            batchCreate: 'Batch New',
            batchExport: 'Export All',
            count: 'Count (1-20)',
            exportSuccess: 'Export successful, downloading...',
            batchExportSelected: 'Export Selected',
            selected: 'Selected',
            processing: 'Processing...'
        },
        zh: {
            createAddress: '新建地址',
            bindExisting: '绑定已有',
            address: '邮箱地址',
            actions: '操作',
            delete: '删除',
            cancel: '取消',
            confirm: '确定',
            selectDomain: '选择域名',
            prefix: '前缀',
            domain: '域名',
            price: '价格',
            free: '免费',
            currentPrice: '当前价格：',
            balance: '您的余额：',
            insufficientBalance: '余额不足',
            confirmPurchase: '确认购买',
            createSuccess: '创建成功',
            unbindSuccess: '解绑成功',
            switch: '切换',
            copyCredential: '复制凭证',
            copyEmail: '复制邮箱',
            transfer: '转移',
            transferTitle: '转移地址',
            targetEmail: '目标用户邮箱',
            transferSuccess: '转移成功',
            bindTitle: '绑定已有地址',
            jwtPlaceholder: '粘贴邮箱地址凭证 (JWT)',
            bindSuccess: '绑定成功',
            switched: '已切换到 ',
            copied: '已复制',
            more: '更多',
            random: '随机',
            bindFailed: '绑定失败',
            viewPrices: '查看价格',
            priceList: '域名价格表',
            currency: '元',
            remark: '备注',
            editRemark: '修改备注',
            remarkPlaceholder: '请输入备注',
            dailyCheckin: '每日签到',
            checkinSuccess: '签到成功！获得 ',
            checkinBalance: '签到余额: ',
            mainBalance: '充值余额: ',
            batchCreate: '批量注册',
            batchExport: '批量导出',
            count: '数量 (1-20)',
            exportSuccess: '导出成功，正在下载...',
            batchExportSelected: '导出选中',
            selected: '已选',
            processing: '处理中...'
        }
    }
})

const data = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const showBatchCreateModal = ref(false)
const createLoading = ref(false)
const priceLoading = ref(false)
const createForm = ref({ name: '', domain: null })
const batchCreateForm = ref({ domain: null, count: 5 })
const currentPriceCents = ref(0)
const showTransferModal = ref(false)
const transferLoading = ref(false)
const transferForm = ref({ addressId: null, targetEmail: '' })
const showBindModal = ref(false)
const bindLoading = ref(false)
const bindForm = ref({ jwt: '' })
const showRemarkModal = ref(false)
const remarkForm = ref({ addressId: null, remark: '' })
const remarkLoading = ref(false)
const showPriceModal = ref(false)
const priceList = ref([])
const priceLoadingState = ref(false)
const checkinLoading = ref(false)
const exportLoading = ref(false)

// 多选状态
const checkedRowKeys = ref([])
const batchActionLoading = ref(false)

const domainOptions = computed(() => {
    return (openSettings.value.domains || []).map(d => ({
        label: d.label || d.value,
        value: d.value
    }))
})

const currentPrefix = computed(() => {
    if (userSettings.value.user_role && typeof userSettings.value.user_role.prefix === 'string') {
        return userSettings.value.user_role.prefix;
    }
    return openSettings.value.prefix || '';
})

const fetchData = async () => {
    loading.value = true
    try {
        const res = await api.fetch('/user_api/bind_address')
        if (Array.isArray(res)) {
            data.value = res;
        } else if (res && Array.isArray(res.results)) {
            data.value = res.results;
        } else {
            data.value = [];
        }
        checkedRowKeys.value = []
    } catch (e) {
        message.error(e.message || "Fetch failed")
    } finally {
        loading.value = false
    }
}

const refreshBalance = async () => {
    try {
        const res = await api.getUserBalance()
        if (res && typeof res === 'object') {
            checkinBalance.value = res.checkin_balance || 0
        }
    } catch (e) { console.error(e) }
}

const handleCheckin = async () => {
    checkinLoading.value = true
    try {
        const res = await api.userCheckin();
        if (res.success) {
            message.success(t('checkinSuccess') + (res.amount / 100).toFixed(2) + ' ' + t('currency'));
            refreshBalance();
        } else {
            message.warning(res.message || "Operation failed");
        }
    } catch (e) {
        message.error(e.message || 'Check-in failed');
    } finally {
        checkinLoading.value = false;
    }
}

const openPriceModal = async () => {
    showPriceModal.value = true;
    priceLoadingState.value = true;
    try {
        const res = await api.getUserDomainPrices();
        const pricesMap = new Map((res.results || []).map(p => [p.domain, p]));
        
        priceList.value = domainOptions.value.map(opt => {
            const domain = opt.value;
            const priceData = pricesMap.get(domain);
            return {
                domain: domain,
                price_yuan: priceData ? priceData.price_yuan : '0.00',
                price: priceData ? priceData.price : 0
            }
        })
    } catch (e) {
        message.error('Failed to load prices');
    } finally {
        priceLoadingState.value = false;
    }
}

watch(() => createForm.value.domain, async (newDomain) => {
    if (!newDomain) {
        currentPriceCents.value = 0
        return
    }
    priceLoading.value = true
    try {
        const res = await api.getDomainPrice(newDomain)
        currentPriceCents.value = res.price_cents || 0
    } catch (e) {
        console.error(e)
    } finally {
        priceLoading.value = false
    }
})

watch(() => batchCreateForm.value.domain, async (newDomain) => {
    if (!newDomain) {
        currentPriceCents.value = 0
        return
    }
    priceLoading.value = true
    try {
        const res = await api.getDomainPrice(newDomain)
        currentPriceCents.value = res.price_cents || 0
    } catch (e) {
        console.error(e)
    } finally {
        priceLoading.value = false
    }
})

const generateRandom = () => {
    createForm.value.name = Math.random().toString(36).substring(2, 10);
}

const openCreateModal = async () => {
    createForm.value.name = '' 
    createForm.value.domain = domainOptions.value.length > 0 ? domainOptions.value[0].value : null
    showCreateModal.value = true
    await refreshBalance()
}

const openBatchCreateModal = async () => {
    batchCreateForm.value.count = 5
    batchCreateForm.value.domain = domainOptions.value.length > 0 ? domainOptions.value[0].value : null
    showBatchCreateModal.value = true
    await refreshBalance()
}

const handleCreate = async () => {
    if (!createForm.value.name) generateRandom();
    if (!createForm.value.domain) return
    
    const totalBal = userBalance.value + checkinBalance.value
    if (currentPriceCents.value > totalBal) {
        message.error(t('insufficientBalance'))
        return
    }
    createLoading.value = true
    try {
        const res = await api.buyAddress(createForm.value.name, createForm.value.domain)
        if (res.success) {
            if (res.jwt) {
                jwt.value = res.jwt;
                await api.getSettings(); 
            }

            message.success(t('createSuccess'))
            showCreateModal.value = false
            fetchData()
            refreshBalance()
            router.push('/') 
        }
    } catch (e) {
        if (e.message && e.message.includes('402')) {
            message.error(t('insufficientBalance'))
        } else {
            message.error(e.message || 'Error')
        }
    } finally {
        createLoading.value = false
    }
}

const handleBatchCreate = async () => {
    if (!batchCreateForm.value.domain) return
    const count = batchCreateForm.value.count
    const totalBal = userBalance.value + checkinBalance.value
    if (currentPriceCents.value * count > totalBal) {
        message.error(t('insufficientBalance'))
        return
    }
    createLoading.value = true
    try {
        const res = await api.batchBuyAddress(batchCreateForm.value.domain, count)
        if (res.success) {
            message.success(`${t('createSuccess')} (${res.count})`)
            showBatchCreateModal.value = false
            fetchData()
            refreshBalance()
        }
    } catch (e) {
        message.error(e.message || 'Error')
    } finally {
        createLoading.value = false
    }
}

// 导出所有
const handleExportAll = async () => {
    exportLoading.value = true
    try {
        const res = await api.exportAddresses()
        if (res.data) {
            downloadFile(res.data, `emails_all_${Date.now()}.txt`)
            message.success(t('exportSuccess'))
        }
    } catch (e) {
        if (e.message.includes('403')) {
            message.error("Permission Denied: Contact admin to enable export")
        } else {
            message.error(e.message || "Export failed")
        }
    } finally {
        exportLoading.value = false
    }
}

// 导出选中
const handleBatchExport = async () => {
    if (checkedRowKeys.value.length === 0) return;
    batchActionLoading.value = true;
    try {
        const lines = [];
        for (const id of checkedRowKeys.value) {
            try {
                // 获取 JWT
                const res = await api.fetch(`/user_api/bind_address_jwt/${id}`);
                const row = data.value.find(item => item.id === id);
                if (res.jwt && row) {
                    lines.push(`${row.name}----${res.jwt}`);
                }
            } catch (e) {
                console.error(`Failed to get jwt for ${id}`, e);
            }
        }
        if (lines.length > 0) {
            downloadFile(lines.join('\n'), `emails_selected_${Date.now()}.txt`);
            message.success(t('exportSuccess'));
        } else {
            message.warning("No data exported");
        }
    } catch (e) {
        message.error(e.message || "Export failed");
    } finally {
        batchActionLoading.value = false;
    }
}

const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
}

const handleSwitch = async (row) => {
    try {
        const res = await api.fetch(`/user_api/bind_address_jwt/${row.id}`);
        if (res.jwt) {
            jwt.value = res.jwt;
            message.success(t('switched') + row.name);
            await api.getSettings();
            router.push('/');
        }
    } catch (e) {
        message.error(e.message)
    }
}

const handleCopyCredential = async (row) => { 
    try { 
        const res = await api.fetch(`/user_api/bind_address_jwt/${row.id}`); 
        if (res.jwt) { 
            await toClipboard(res.jwt); 
            message.success(t('copied')) 
        } 
    } catch (e) { 
        message.error(e.message) 
    } 
}

const openTransferModal = (row) => { transferForm.value = { addressId: row.id, targetEmail: '' }; showTransferModal.value = true }
const handleTransfer = async () => { if (!transferForm.value.targetEmail) return; transferLoading.value = true; try { await api.fetch('/user_api/transfer_address', { method: 'POST', body: JSON.stringify({ address_id: transferForm.value.addressId, target_user_email: transferForm.value.targetEmail }) }); message.success(t('transferSuccess')); showTransferModal.value = false; fetchData() } catch (e) { message.error(e.message) } finally { transferLoading.value = false } }
const handleDelete = async (addressId) => { try { await api.fetch('/user_api/unbind_address', { method: 'POST', body: JSON.stringify({ address_id: addressId }) }); message.success(t('unbindSuccess')); fetchData() } catch (e) { message.error(e.message) } }

const handleBind = async () => {
    if (!bindForm.value.jwt) return;
    bindLoading.value = true;
    try {
        const cleanJwt = bindForm.value.jwt.trim();
        const apiBase = import.meta.env.VITE_API_BASE || "";
        const url = `${apiBase}/user_api/bind_address`;
        const headers = {
            'Authorization': `Bearer ${cleanJwt}`,
            'x-user-token': userJwt.value,
            'Content-Type': 'application/json'
        };
        if (auth.value) {
            headers['x-custom-auth'] = auth.value;
        }

        const rawRes = await fetch(url, {
            method: 'POST',
            headers: headers
        });
        
        if (rawRes.ok) {
            message.success(t('bindSuccess'));
            showBindModal.value = false;
            bindForm.value.jwt = '';
            fetchData();
        } else {
            const txt = await rawRes.text();
            try {
                const json = JSON.parse(txt);
                throw new Error(json.error || json.message || txt);
            } catch (e) {
                throw new Error(txt || t('bindFailed'));
            }
        }
    } catch (e) {
        console.error(e);
        message.error(e.message || t('bindFailed'));
    } finally {
        bindLoading.value = false;
    }
}

const openRemarkModal = (row) => {
    remarkForm.value = { addressId: row.id, remark: row.remark || '' }
    showRemarkModal.value = true
}

const handleSaveRemark = async () => {
    remarkLoading.value = true
    try {
        await api.updateAddressRemark(remarkForm.value.addressId, remarkForm.value.remark)
        message.success('Success')
        showRemarkModal.value = false
        fetchData()
    } catch (e) {
        message.error(e.message)
    } finally {
        remarkLoading.value = false
    }
}

const columns = [
    { type: 'selection' },
    { title: 'ID', key: 'id', width: 50 },
    { title: t('address'), key: 'name' },
    { title: t('remark'), key: 'remark', render(row) {
        return row.remark ? h(NTag, { type: 'info', size: 'small', bordered: false }, { default: () => row.remark }) : '-'
    }},
    { 
        title: t('actions'), 
        key: 'actions',
        render(row) {
            return h(NSpace, { size: 'small' }, {
                default: () => [
                    h(NButton, { size: 'tiny', type: 'primary', secondary: true, onClick: () => handleSwitch(row) }, { default: () => t('switch') }),
                    h(NDropdown, {
                        trigger: 'click',
                        options: [
                            { label: t('editRemark'), key: 'remark' },
                            { label: t('copyCredential'), key: 'copy' },
                            { label: t('transfer'), key: 'transfer' },
                            { label: t('delete'), key: 'delete', props: { style: 'color: red' } }
                        ],
                        onSelect: (key) => {
                            if (key === 'remark') openRemarkModal(row)
                            if (key === 'copy') handleCopyCredential(row)
                            if (key === 'transfer') openTransferModal(row)
                            if (key === 'delete') { if(confirm('Confirm Delete?')) handleDelete(row.id) }
                        }
                    }, { default: () => h(NButton, { size: 'tiny' }, { default: () => t('more') }) })
                ]
            })
        }
    }
]

const priceColumns = [
    { title: t('domain'), key: 'domain' },
    { 
        title: t('price'), 
        key: 'price_yuan',
        render(row) {
            if (row.price === 0) {
                return h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => t('free') })
            }
            return `${row.price_yuan} ${t('currency')}`
        }
    }
]

onMounted(async () => {
    if (useGlobalState().userJwt.value) {
        await api.getUserSettings(message);
    }
    await Promise.all([fetchData(), refreshBalance()]);
})
</script>

<template>
    <div>
        <div style="margin-bottom: 15px; display: flex; gap: 15px; align-items: center; background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;">
            <n-button type="warning" size="small" :loading="checkinLoading" @click="handleCheckin">
                📅 {{ t('dailyCheckin') }}
            </n-button>
            <div style="font-size: 0.9em;">
                <span style="margin-right: 15px;">{{ t('mainBalance') }} <b>{{ (userBalance/100).toFixed(2) }}</b></span>
                <span style="color: #d03050;">{{ t('checkinBalance') }} <b>{{ (checkinBalance/100).toFixed(2) }}</b></span>
            </div>
        </div>

        <div style="margin-bottom: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
            <n-button type="primary" @click="openCreateModal">{{ t('createAddress') }}</n-button>
            
            <n-button type="success" secondary @click="openBatchCreateModal">
                <template #icon><n-icon><PlusSquare /></n-icon></template>
                {{ t('batchCreate') }}
            </n-button>
            
            <n-button type="warning" secondary @click="handleExportAll" :loading="exportLoading">
                <template #icon><n-icon><CloudDownloadAlt /></n-icon></template>
                {{ t('batchExport') }}
            </n-button>

            <n-button type="info" secondary @click="openPriceModal">{{ t('viewPrices') }}</n-button>
            <n-button @click="showBindModal = true">{{ t('bindExisting') }}</n-button>
            <n-button @click="fetchData">刷新</n-button>
        </div>

        <div v-if="checkedRowKeys.length > 0" class="batch-action-bar">
            <span style="margin-right: 10px; font-weight: bold;">{{ t('selected') }}: {{ checkedRowKeys.length }}</span>
            <n-space>
                <n-button type="info" size="small" :loading="batchActionLoading" @click="handleBatchExport">
                    <template #icon><n-icon><CheckSquare /></n-icon></template>
                    {{ t('batchExportSelected') }}
                </n-button>
            </n-space>
        </div>

        <n-data-table 
            v-model:checked-row-keys="checkedRowKeys"
            :row-key="row => row.id"
            :columns="columns" 
            :data="data" 
            :loading="loading" 
            :bordered="false" 
        />

        <n-modal v-model:show="showCreateModal" preset="card" :title="t('createAddress')" style="width: 90%; max-width: 500px">
            <n-form>
                <n-form-item :label="t('prefix')">
                    <n-input-group>
                        <n-input-group-label v-if="currentPrefix">{{ currentPrefix }}</n-input-group-label>
                        <n-input v-model:value="createForm.name" placeholder="e.g. boss" />
                        <n-button @click="generateRandom">{{ t('random') }}</n-button>
                    </n-input-group>
                </n-form-item>
                <n-form-item :label="t('domain')" required>
                    <n-select v-model:value="createForm.domain" :options="domainOptions" />
                </n-form-item>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <n-spin :show="priceLoading" size="small">
                        <div v-if="currentPriceCents > 0">
                            <p>{{ t('currentPrice') }} <span style="color: #d03050; font-weight: bold;">{{ (currentPriceCents / 100).toFixed(2) }} 元</span></p>
                            <p style="font-size: 0.9em; color: #666;">
                                {{ t('balance') }} {{ ((userBalance + checkinBalance) / 100).toFixed(2) }} 元
                            </p>
                        </div>
                        <div v-else><n-tag type="success">{{ t('free') }}</n-tag></div>
                    </n-spin>
                </div>
            </n-form>
            <template #action>
                <n-button type="primary" :loading="createLoading" :disabled="priceLoading || (currentPriceCents > userBalance + checkinBalance)" @click="handleCreate">
                    {{ currentPriceCents > 0 ? t('confirmPurchase') : t('confirm') }}
                </n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showBatchCreateModal" preset="card" :title="t('batchCreate')" style="width: 90%; max-width: 500px">
            <n-form>
                <n-form-item :label="t('domain')" required>
                    <n-select v-model:value="batchCreateForm.domain" :options="domainOptions" />
                </n-form-item>
                <n-form-item :label="t('count')" required>
                    <n-input-number v-model:value="batchCreateForm.count" :min="1" :max="20" />
                </n-form-item>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <n-spin :show="priceLoading" size="small">
                        <div v-if="currentPriceCents > 0">
                            <p>单价: {{ (currentPriceCents / 100).toFixed(2) }} 元</p>
                            <p style="font-weight: bold; color: #d03050;">总价: {{ (currentPriceCents * batchCreateForm.count / 100).toFixed(2) }} 元</p>
                        </div>
                        <div v-else><n-tag type="success">{{ t('free') }}</n-tag></div>
                    </n-spin>
                </div>
            </n-form>
            <template #action>
                <n-button type="success" :loading="createLoading" :disabled="priceLoading || (currentPriceCents * batchCreateForm.count > userBalance + checkinBalance)" @click="handleBatchCreate">
                    {{ t('confirm') }}
                </n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showPriceModal" preset="card" :title="t('priceList')" style="width: 90%; max-width: 600px">
            <n-data-table :columns="priceColumns" :data="priceList" :loading="priceLoadingState" :max-height="400" />
        </n-modal>

        <n-modal v-model:show="showTransferModal" preset="card" :title="t('transferTitle')" style="width: 90%; max-width: 400px">
            <n-form>
                <n-form-item :label="t('targetEmail')" required>
                    <n-input v-model:value="transferForm.targetEmail" placeholder="user@example.com" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="warning" :loading="transferLoading" @click="handleTransfer">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showBindModal" preset="card" :title="t('bindTitle')" style="width: 90%; max-width: 400px">
            <n-form>
                <n-form-item label="JWT" required>
                    <n-input v-model:value="bindForm.jwt" type="textarea" :placeholder="t('jwtPlaceholder')" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" :loading="bindLoading" @click="handleBind">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showRemarkModal" preset="card" :title="t('editRemark')" style="width: 90%; max-width: 400px">
            <n-form>
                <n-form-item :label="t('remark')">
                    <n-input v-model:value="remarkForm.remark" :placeholder="t('remarkPlaceholder')" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" :loading="remarkLoading" @click="handleSaveRemark">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>
    </div>
</template>

<style scoped>
.batch-action-bar {
    background-color: rgba(230, 247, 255, 0.6);
    border: 1px solid rgba(145, 213, 255, 0.6);
    padding: 8px 16px;
    border-radius: 4px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>
