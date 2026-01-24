<script setup>
import { ref, onMounted, computed, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, useDialog, NButton, NTag, NDropdown, NSpace, NModal, NForm, NFormItem, NInput, NSelect, NSpin, NDataTable, NIcon, NTooltip, NCard, NGrid, NGi, NStatistic, NNumberAnimation } from 'naive-ui'
import useClipboard from 'vue-clipboard3'
import { Copy, Key, CheckSquare, Trash, SyncAlt, Wallet, CalendarCheck, Plus, Link, Tags, ExchangeAlt } from '@vicons/fa'
import { useGlobalState } from '../../store'
import { api } from '../../api'

const router = useRouter()
const { openSettings, jwt, userBalance, userSettings, auth, userJwt } = useGlobalState()
const message = useMessage()
const dialog = useDialog()
const { toClipboard } = useClipboard()

const checkinBalance = ref(0)

// --- JS 定义的渐变色主题 (满足 JS 渐变色要求) ---
const theme = {
    cardPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardSecondary: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    btnCreate: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
    btnBind: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
    btnRefresh: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)',
    tableHeader: 'rgba(249, 250, 251, 0.5)'
}

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
            balance: 'Main Balance',
            checkin_bal: 'Check-in Balance',
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
            more: 'Options',
            random: 'Random', 
            bindFailed: 'Bind failed',
            viewPrices: 'Price List',
            priceList: 'Domain Price List',
            currency: 'CNY',
            remark: 'Remark',
            editRemark: 'Edit Remark',
            remarkPlaceholder: 'Enter remark',
            dailyCheckin: 'Daily Check-in',
            checkinSuccess: 'Check-in Success! Got ',
            checkinBalance: 'Check-in Bal: ',
            mainBalance: 'Main Bal: ',
            batchExportSelected: 'Export Selected',
            selected: 'Selected',
            processing: 'Processing...',
            dashboard: 'Dashboard',
            refresh: 'Refresh'
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
            balance: '账户余额',
            checkin_bal: '签到余额',
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
            viewPrices: '价格表',
            priceList: '域名价格表',
            currency: '元',
            remark: '备注',
            editRemark: '修改备注',
            remarkPlaceholder: '请输入备注',
            dailyCheckin: '每日签到',
            checkinSuccess: '签到成功！获得 ',
            checkinBalance: '签到余额: ',
            mainBalance: '充值余额: ',
            batchExportSelected: '导出选中',
            selected: '已选',
            processing: '处理中...',
            dashboard: '概览',
            refresh: '刷新列表'
        }
    }
})

const data = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const createLoading = ref(false)
const priceLoading = ref(false)
const createForm = ref({ name: '', domain: null })
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
        console.log("Fetch Address Result:", res);
        
        if (Array.isArray(res)) {
            data.value = res;
        } else if (res && Array.isArray(res.results)) {
            data.value = res.results;
        } else {
            data.value = [];
        }
        checkedRowKeys.value = []
    } catch (e) {
        console.error("Fetch Address Error:", e);
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

const generateRandom = () => {
    createForm.value.name = Math.random().toString(36).substring(2, 10);
}

const openCreateModal = async () => {
    createForm.value.name = '' 
    createForm.value.domain = domainOptions.value.length > 0 ? domainOptions.value[0].value : null
    showCreateModal.value = true
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

// 导出选中
const handleBatchExport = async () => {
    if (checkedRowKeys.value.length === 0) return;
    batchActionLoading.value = true;
    try {
        const lines = [];
        for (const id of checkedRowKeys.value) {
            try {
                // 复用单条获取 JWT 的接口
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
            const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `emails_selected_${Date.now()}.txt`
            a.click()
            window.URL.revokeObjectURL(url)
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

const handleCopyEmail = async (row) => {
    try {
        await toClipboard(row.name);
        message.success(t('copied'));
    } catch (e) {
        message.error(e.message || "Copy failed");
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
    { 
        title: 'ID', 
        key: 'id', 
        width: 60,
        render: (row) => h('span', { style: 'color: #999; font-size: 12px' }, `#${row.id}`)
    },
    { 
        title: t('address'), 
        key: 'name',
        render: (row) => h('span', { style: 'font-weight: 500; color: #333' }, row.name)
    },
    { 
        title: t('remark'), 
        key: 'remark', 
        render(row) {
            return row.remark 
                ? h(NTag, { type: 'primary', size: 'small', bordered: false, style: 'border-radius: 4px;' }, { default: () => row.remark }) 
                : h('span', { style: 'color: #ccc' }, '-')
        }
    },
    { 
        title: t('actions'), 
        key: 'actions',
        align: 'right',
        render(row) {
            return h(NSpace, { justify: 'end' }, {
                default: () => [
                    h(NButton, { 
                        size: 'small', 
                        type: 'primary', 
                        secondary: true, 
                        round: true,
                        onClick: () => handleSwitch(row) 
                    }, { default: () => t('switch') }),
                    h(NDropdown, {
                        trigger: 'click',
                        options: [
                            { label: t('copyEmail'), key: 'copyEmail', icon: () => h(NIcon, null, { default: () => h(Copy) }) },
                            { label: t('copyCredential'), key: 'copyJwt', icon: () => h(NIcon, null, { default: () => h(Key) }) },
                            { label: t('editRemark'), key: 'remark', icon: () => h(NIcon, null, { default: () => h(Tags) }) },
                            { label: t('transfer'), key: 'transfer', icon: () => h(NIcon, null, { default: () => h(ExchangeAlt) }) },
                            { type: 'divider' },
                            { label: t('delete'), key: 'delete', props: { style: 'color: #d03050' }, icon: () => h(NIcon, { color: '#d03050' }, { default: () => h(Trash) }) }
                        ],
                        onSelect: (key) => {
                            if (key === 'copyEmail') handleCopyEmail(row)
                            if (key === 'copyJwt') handleCopyCredential(row)
                            if (key === 'remark') openRemarkModal(row)
                            if (key === 'transfer') openTransferModal(row)
                            if (key === 'delete') { if(confirm('Confirm Delete?')) handleDelete(row.id) }
                        }
                    }, { default: () => h(NButton, { size: 'small', quaternary: true, circle: true }, { icon: () => h(NIcon, null, { default: () => h(CheckSquare) }) }) })
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
    <div class="page-container">
        <n-grid x-gap="12" y-gap="12" cols="1 s:2" responsive="screen">
            <n-gi>
                <n-card :bordered="false" class="dashboard-card" :style="{ background: theme.cardPrimary }">
                    <n-statistic label-style="color: rgba(255,255,255,0.8)" value-style="color: #fff; font-weight: bold;">
                        <template #label>{{ t('balance') }}</template>
                        <n-number-animation :from="0" :to="userBalance / 100" :precision="2" /> 
                        <template #suffix><span style="font-size: 0.6em; margin-left: 4px;">{{ t('currency') }}</span></template>
                    </n-statistic>
                    <div class="card-icon"><n-icon><Wallet /></n-icon></div>
                </n-card>
            </n-gi>
            <n-gi>
                <n-card :bordered="false" class="dashboard-card" :style="{ background: theme.cardSecondary }">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <n-statistic label-style="color: #555" value-style="color: #333; font-weight: bold;">
                            <template #label>{{ t('checkin_bal') }}</template>
                            <n-number-animation :from="0" :to="checkinBalance / 100" :precision="2" />
                            <template #suffix><span style="font-size: 0.6em; margin-left: 4px;">{{ t('currency') }}</span></template>
                        </n-statistic>
                        <n-button class="checkin-btn" :loading="checkinLoading" @click="handleCheckin" round size="small">
                            {{ t('dailyCheckin') }}
                        </n-button>
                    </div>
                    <div class="card-icon" style="color: rgba(0,0,0,0.05)"><n-icon><CalendarCheck /></n-icon></div>
                </n-card>
            </n-gi>
        </n-grid>

        <div class="toolbar">
            <div class="left-actions">
                <n-button type="primary" class="gradient-btn" :style="{ background: theme.btnCreate }" @click="openCreateModal">
                    <template #icon><n-icon><Plus /></n-icon></template>
                    {{ t('createAddress') }}
                </n-button>
                <n-button strong secondary type="info" @click="openPriceModal">
                    {{ t('viewPrices') }}
                </n-button>
                <n-button strong secondary type="warning" @click="showBindModal = true">
                    <template #icon><n-icon><Link /></n-icon></template>
                    {{ t('bindExisting') }}
                </n-button>
            </div>
            <div class="right-actions">
                <n-button quaternary circle @click="fetchData">
                    <template #icon><n-icon><SyncAlt /></n-icon></template>
                </n-button>
            </div>
        </div>

        <transition name="fade">
            <div v-if="checkedRowKeys.length > 0" class="batch-bar">
                <div class="batch-info">
                    <n-icon><CheckSquare /></n-icon>
                    <span>{{ t('selected') }}: <b>{{ checkedRowKeys.length }}</b></span>
                </div>
                <div class="batch-actions">
                    <n-button size="small" type="primary" ghost :loading="batchActionLoading" @click="handleBatchExport">
                        {{ t('batchExportSelected') }}
                    </n-button>
                </div>
            </div>
        </transition>

        <n-card :bordered="false" class="table-card">
            <n-data-table
                :columns="columns"
                :data="data"
                :loading="loading"
                :row-key="row => row.id"
                v-model:checked-row-keys="checkedRowKeys"
                :bordered="false"
                :single-line="false"
                size="large"
            />
        </n-card>

        <n-modal v-model:show="showCreateModal" preset="card" :title="t('createAddress')" class="custom-modal">
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
                <div class="price-info">
                    <n-spin :show="priceLoading" size="small">
                        <div v-if="currentPriceCents > 0">
                            <p>{{ t('currentPrice') }} <span class="price-highlight">{{ (currentPriceCents / 100).toFixed(2) }} {{ t('currency') }}</span></p>
                            <p class="balance-sub">{{ t('balance') }}: {{ ((userBalance + checkinBalance) / 100).toFixed(2) }}</p>
                        </div>
                        <div v-else><n-tag type="success" round>{{ t('free') }}</n-tag></div>
                    </n-spin>
                </div>
            </n-form>
            <template #action>
                <n-button type="primary" block :loading="createLoading" :disabled="priceLoading || (currentPriceCents > userBalance + checkinBalance)" @click="handleCreate">
                    {{ currentPriceCents > 0 ? t('confirmPurchase') : t('confirm') }}
                </n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showPriceModal" preset="card" :title="t('priceList')" class="custom-modal">
            <n-data-table :columns="priceColumns" :data="priceList" :loading="priceLoadingState" :max-height="400" />
        </n-modal>

        <n-modal v-model:show="showTransferModal" preset="card" :title="t('transferTitle')" class="custom-modal">
            <n-form>
                <n-form-item :label="t('targetEmail')" required>
                    <n-input v-model:value="transferForm.targetEmail" placeholder="user@example.com" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="warning" block :loading="transferLoading" @click="handleTransfer">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showBindModal" preset="card" :title="t('bindTitle')" class="custom-modal">
            <n-form>
                <n-form-item label="JWT" required>
                    <n-input v-model:value="bindForm.jwt" type="textarea" :placeholder="t('jwtPlaceholder')" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" block :loading="bindLoading" @click="handleBind">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showRemarkModal" preset="card" :title="t('editRemark')" class="custom-modal">
            <n-form>
                <n-form-item :label="t('remark')">
                    <n-input v-model:value="remarkForm.remark" :placeholder="t('remarkPlaceholder')" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" block :loading="remarkLoading" @click="handleSaveRemark">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>
    </div>
</template>

<style scoped>
.page-container {
    padding: 0;
}

/* 仪表盘卡片 */
.dashboard-card {
    border-radius: 16px;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: default;
    height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.dashboard-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.card-icon {
    position: absolute;
    right: -10px;
    bottom: -20px;
    font-size: 100px;
    color: rgba(255,255,255,0.15);
    pointer-events: none;
    transform: rotate(-15deg);
}

.checkin-btn {
    background: rgba(255, 255, 255, 0.9);
    color: #ff6b6b;
    font-weight: bold;
    border: none;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

/* 工具栏 */
.toolbar {
    margin: 20px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}

.left-actions {
    display: flex;
    gap: 12px;
}

.gradient-btn {
    border: none;
    transition: opacity 0.3s;
}
.gradient-btn:hover {
    opacity: 0.9;
}

/* 批量操作条 */
.batch-bar {
    background: rgba(235, 247, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(144, 202, 249, 0.5);
    padding: 8px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: slideDown 0.3s ease;
}

.batch-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1890ff;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* 表格卡片 */
.table-card {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    overflow: hidden;
}

/* Modal 内部样式 */
.custom-modal {
    width: 90%;
    max-width: 450px;
    border-radius: 12px;
}

.price-info {
    background: #f7f9fc;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    text-align: center;
}

.price-highlight {
    color: #d03050;
    font-weight: bold;
    font-size: 1.2em;
}

.balance-sub {
    font-size: 0.9em;
    color: #888;
    margin-top: 4px;
}

/* 响应式调整 */
@media (max-width: 600px) {
    .toolbar {
        flex-direction: column;
        align-items: stretch;
    }
    .left-actions {
        flex-direction: column;
    }
    .left-actions button {
        width: 100%;
    }
    .right-actions {
        display: none; /* 移动端隐藏刷新按钮节省空间 */
    }
}
</style>
