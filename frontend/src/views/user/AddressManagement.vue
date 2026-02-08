<script setup>
import { ref, onMounted, computed, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NButton, NTag, NDropdown, NSpace, NModal, NForm, NFormItem, NInput, NSelect, NSpin, NDataTable, NIcon, NInputGroup, NInputGroupLabel, NCard, NStatistic, NNumberAnimation } from 'naive-ui'
import { 
    TrashAlt, ExchangeAlt, Copy, Edit, EllipsisH, Plus, List, Link, Sync, Random 
} from '@vicons/fa' // 引入图标
import useClipboard from 'vue-clipboard3'
import { useGlobalState } from '../../store'
import { api } from '../../api'

const router = useRouter()
const { openSettings, jwt, userBalance, userSettings, auth, userJwt } = useGlobalState()
const message = useMessage()
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
            selectDomain: 'Domain',
            prefix: 'Prefix',
            domain: 'Domain',
            price: 'Price',
            free: 'Free',
            currentPrice: 'Cost',
            balance: 'Wallet Balance',
            remaining: 'Remaining',
            insufficientBalance: 'Insufficient Balance',
            confirmPurchase: 'Pay & Create',
            createSuccess: 'Created Successfully',
            unbindSuccess: 'Unbind Successfully',
            switch: 'Switch',
            copyCredential: 'Copy JWT',
            copyEmail: 'Copy Email',
            transfer: 'Transfer',
            transferTitle: 'Transfer Address',
            targetEmail: 'Target User Email',
            transferSuccess: 'Transferred Successfully',
            bindTitle: 'Bind Address',
            jwtPlaceholder: 'Paste Address JWT Credential',
            bindSuccess: 'Bound Successfully',
            switched: 'Switched to ',
            copied: 'Copied',
            more: 'More',
            random: 'Random', 
            bindFailed: 'Bind failed',
            viewPrices: 'Prices',
            priceList: 'Price List',
            currency: 'CNY',
            remark: 'Remark',
            editRemark: 'Remark',
            remarkPlaceholder: 'Enter remark',
            dailyCheckin: 'Check-in',
            checkinSuccess: 'Check-in Success! Got ',
            checkinBalance: 'Bonus: ',
            mainBalance: 'Main: '
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
            prefix: '前缀名',
            domain: '选择域名',
            price: '价格',
            free: '免费',
            currentPrice: '本次扣费',
            balance: '当前余额',
            remaining: '预计剩余',
            insufficientBalance: '余额不足',
            confirmPurchase: '支付并创建',
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
            checkinBalance: '赠送: ',
            mainBalance: '充值: '
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

// 计算剩余余额
const totalBalance = computed(() => userBalance.value + checkinBalance.value);
const remainingBalance = computed(() => totalBalance.value - currentPriceCents.value);

const fetchData = async () => {
    loading.value = true
    try {
        const res = await api.fetch('/user_api/bind_address')
        if (res && Array.isArray(res.results)) {
            data.value = res.results;
        } else if (Array.isArray(res)) {
            data.value = res;
        } else {
            data.value = [];
        }
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
    
    if (currentPriceCents.value > totalBalance.value) {
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
        message.error(e.message || 'Error')
    } finally {
        createLoading.value = false
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
        message.error(e.message);
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
        const headers = { 'Authorization': `Bearer ${cleanJwt}`, 'x-user-token': userJwt.value, 'Content-Type': 'application/json' };
        if (auth.value) headers['x-custom-auth'] = auth.value;
        const rawRes = await fetch(url, { method: 'POST', headers: headers });
        if (rawRes.ok) { message.success(t('bindSuccess')); showBindModal.value = false; bindForm.value.jwt = ''; fetchData(); } 
        else { throw new Error(t('bindFailed')); }
    } catch (e) { message.error(e.message || t('bindFailed')); } finally { bindLoading.value = false; }
}

const openRemarkModal = (row) => { remarkForm.value = { addressId: row.id, remark: row.remark || '' }; showRemarkModal.value = true }
const handleSaveRemark = async () => { remarkLoading.value = true; try { await api.updateAddressRemark(remarkForm.value.addressId, remarkForm.value.remark); message.success('Success'); showRemarkModal.value = false; fetchData() } catch (e) { message.error(e.message) } finally { remarkLoading.value = false } }

const columns = [
    { title: 'ID', key: 'id', width: 60, align: 'center' },
    { title: t('address'), key: 'name', minWidth: 150 },
    { title: t('remark'), key: 'remark', render(row) {
        return row.remark ? h(NTag, { type: 'info', size: 'small', bordered: false, round: true }, { default: () => row.remark }) : ''
    }},
    { 
        title: t('actions'), 
        key: 'actions',
        width: 150,
        align: 'right',
        render(row) {
            return h(NSpace, { justify: 'end' }, {
                default: () => [
                    h(NButton, { size: 'tiny', type: 'primary', secondary: true, round: true, onClick: () => handleSwitch(row) }, { 
                        icon: () => h(NIcon, null, { default: () => h(ExchangeAlt) }),
                        default: () => t('switch') 
                    }),
                    h(NDropdown, {
                        trigger: 'click',
                        options: [
                            { label: t('copyEmail'), key: 'copyEmail', icon: () => h(NIcon, null, { default: () => h(Copy) }) },
                            { label: t('copyCredential'), key: 'copyJwt', icon: () => h(NIcon, null, { default: () => h(Link) }) },
                            { label: t('editRemark'), key: 'remark', icon: () => h(NIcon, null, { default: () => h(Edit) }) },
                            { label: t('transfer'), key: 'transfer', icon: () => h(NIcon, null, { default: () => h(ExchangeAlt) }) },
                            { label: t('delete'), key: 'delete', props: { style: 'color: #d03050' }, icon: () => h(NIcon, null, { default: () => h(TrashAlt) }) }
                        ],
                        onSelect: (key) => {
                            if (key === 'copyEmail') handleCopyEmail(row)
                            if (key === 'copyJwt') handleCopyCredential(row)
                            if (key === 'remark') openRemarkModal(row)
                            if (key === 'transfer') openTransferModal(row)
                            if (key === 'delete') { if(confirm('Confirm Delete?')) handleDelete(row.id) }
                        }
                    }, { default: () => h(NButton, { size: 'tiny', circle: true, quaternary: true }, { icon: () => h(NIcon, null, { default: () => h(EllipsisH) }) }) })
                ]
            })
        }
    }
]

const priceColumns = [
    { title: t('domain'), key: 'domain' },
    { title: t('price'), key: 'price_yuan', render(row) { return row.price === 0 ? h(NTag, { type: 'success', size: 'small' }, { default: () => t('free') }) : `¥ ${row.price_yuan}` } }
]

onMounted(async () => {
    if (useGlobalState().userJwt.value) { await api.getUserSettings(message); }
    await Promise.all([fetchData(), refreshBalance()]);
})
</script>

<template>
    <div class="address-mgmt-container">
        <div class="toolbar glass-panel-sm">
            <div class="toolbar-left">
                <n-button type="primary" color="#3a86ff" @click="openCreateModal">
                    <template #icon><n-icon><Plus /></n-icon></template>
                    {{ t('createAddress') }}
                </n-button>
                <n-button secondary @click="openPriceModal">
                    <template #icon><n-icon><List /></n-icon></template>
                    {{ t('viewPrices') }}
                </n-button>
                <n-button secondary @click="showBindModal = true">
                    <template #icon><n-icon><Link /></n-icon></template>
                    {{ t('bindExisting') }}
                </n-button>
            </div>
            
            <div class="toolbar-right">
                <div class="balance-info">
                    <n-button text size="small" :loading="checkinLoading" @click="handleCheckin" class="checkin-btn">
                        <template #icon><n-icon color="#f0a020"><mr /></n-icon></template>
                        📅 {{ t('dailyCheckin') }}
                    </n-button>
                    <div class="balance-detail">
                        <span>{{ t('mainBalance') }} <span class="num">{{ (userBalance/100).toFixed(2) }}</span></span>
                        <span class="divider">|</span>
                        <span>{{ t('checkinBalance') }} <span class="num free">{{ (checkinBalance/100).toFixed(2) }}</span></span>
                    </div>
                </div>
                <n-button circle secondary size="small" @click="fetchData">
                    <template #icon><n-icon><Sync /></n-icon></template>
                </n-button>
            </div>
        </div>

        <div class="glass-container">
            <n-data-table 
                :row-key="row => row.id"
                :columns="columns" 
                :data="data" 
                :loading="loading" 
                :bordered="false"
                :single-line="false"
                class="address-table"
            />
        </div>

        <n-modal v-model:show="showCreateModal" preset="card" :title="t('createAddress')" class="custom-modal">
            <n-form size="large">
                <n-form-item :label="t('prefix')">
                    <n-input-group>
                        <n-input-group-label v-if="currentPrefix" class="prefix-label">{{ currentPrefix }}</n-input-group-label>
                        <n-input v-model:value="createForm.name" placeholder="boss" />
                        <n-button @click="generateRandom" secondary>
                            <template #icon><n-icon><Random /></n-icon></template>
                        </n-button>
                    </n-input-group>
                </n-form-item>
                <n-form-item :label="t('domain')">
                    <n-select v-model:value="createForm.domain" :options="domainOptions" />
                </n-form-item>

                <div class="price-receipt" v-if="createForm.domain">
                    <n-spin :show="priceLoading" size="small">
                        <div class="receipt-row">
                            <span class="label">{{ t('balance') }}</span>
                            <span class="value">¥ {{ (totalBalance / 100).toFixed(2) }}</span>
                        </div>
                        <div class="receipt-row highlight">
                            <span class="label">{{ t('currentPrice') }}</span>
                            <span class="value cost">- ¥ {{ (currentPriceCents / 100).toFixed(2) }}</span>
                        </div>
                        <div class="receipt-divider"></div>
                        <div class="receipt-row total">
                            <span class="label">{{ t('remaining') }}</span>
                            <span class="value" :class="{'insufficient': remainingBalance < 0}">
                                ¥ {{ (remainingBalance / 100).toFixed(2) }}
                            </span>
                        </div>
                        <div v-if="remainingBalance < 0" class="error-tip">
                            {{ t('insufficientBalance') }}
                        </div>
                    </n-spin>
                </div>
            </n-form>
            <template #action>
                <n-button type="primary" block size="large" :loading="createLoading" :disabled="priceLoading || remainingBalance < 0" @click="handleCreate">
                    {{ currentPriceCents > 0 ? t('confirmPurchase') : t('confirm') }}
                </n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showPriceModal" preset="card" :title="t('priceList')" class="custom-modal-lg">
            <n-data-table :columns="priceColumns" :data="priceList" :loading="priceLoadingState" :max-height="400" :bordered="false"/>
        </n-modal>

        <n-modal v-model:show="showTransferModal" preset="card" :title="t('transferTitle')" class="custom-modal">
            <n-form size="large">
                <n-form-item :label="t('targetEmail')">
                    <n-input v-model:value="transferForm.targetEmail" placeholder="user@example.com" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="warning" block size="large" :loading="transferLoading" @click="handleTransfer">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showBindModal" preset="card" :title="t('bindTitle')" class="custom-modal">
            <n-form size="large">
                <n-form-item label="JWT">
                    <n-input v-model:value="bindForm.jwt" type="textarea" :placeholder="t('jwtPlaceholder')" :autosize="{ minRows: 3 }"/>
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" block size="large" :loading="bindLoading" @click="handleBind">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showRemarkModal" preset="card" :title="t('editRemark')" class="custom-modal">
            <n-form size="large">
                <n-form-item :label="t('remark')">
                    <n-input v-model:value="remarkForm.remark" :placeholder="t('remarkPlaceholder')" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" block size="large" :loading="remarkLoading" @click="handleSaveRemark">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>
    </div>
</template>

<style scoped>
/* 顶部工具栏玻璃效果 */
.glass-panel-sm {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
}
:deep([data-theme='dark']) .glass-panel-sm {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-left, .toolbar-right {
    display: flex;
    gap: 10px;
    align-items: center;
}

/* 余额信息样式优化 */
.balance-info {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 0.9em;
    background: rgba(0,0,0,0.03);
    padding: 4px 12px;
    border-radius: 20px;
}
:deep([data-theme='dark']) .balance-info {
    background: rgba(255,255,255,0.08);
}
.balance-detail {
    display: flex;
    gap: 8px;
    align-items: center;
    color: var(--n-text-color-2);
}
.balance-detail .num {
    font-weight: 700;
    color: var(--n-text-color-1);
}
.balance-detail .num.free {
    color: #06d6a0; /* 赠送余额绿色显示 */
}
.divider {
    opacity: 0.3;
}

/* 表格容器描边玻璃 */
.glass-container {
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
}
:deep([data-theme='dark']) .glass-container {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
}

/* 弹窗收银台样式 */
.price-receipt {
    background: var(--n-card-color);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 12px;
    padding: 16px;
    margin-top: 10px;
    margin-bottom: 20px;
}
:deep([data-theme='dark']) .price-receipt {
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
}

.receipt-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
}
.receipt-row.highlight .value.cost {
    color: #ef476f;
    font-weight: bold;
}
.receipt-divider {
    height: 1px;
    background: rgba(0,0,0,0.1);
    margin: 8px 0;
    border-style: dashed;
}
:deep([data-theme='dark']) .receipt-divider {
    background: rgba(255,255,255,0.1);
}
.receipt-row.total {
    font-weight: bold;
    font-size: 16px;
    margin-top: 4px;
}
.receipt-row.total .value {
    color: #06d6a0;
}
.receipt-row.total .value.insufficient {
    color: #ef476f;
}
.error-tip {
    color: #ef476f;
    font-size: 12px;
    text-align: right;
    margin-top: 4px;
}

.custom-modal { width: 90%; max-width: 440px; }
.custom-modal-lg { width: 90%; max-width: 600px; }

@media (max-width: 600px) {
    .glass-panel-sm {
        flex-direction: column;
        align-items: stretch;
    }
    .toolbar-left, .toolbar-right {
        justify-content: space-between;
        width: 100%;
    }
    .balance-info {
        flex: 1;
        justify-content: space-between;
    }
}
</style>
