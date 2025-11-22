<script setup>
import { ref, onMounted, computed, watch, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NButton, NTag, NDropdown, NSpace, NModal, NForm, NFormItem, NInput, NSelect, NSpin } from 'naive-ui'
import useClipboard from 'vue-clipboard3'
import { useGlobalState } from '../../store'
import { api } from '../../api'

const { openSettings, jwt } = useGlobalState()
const message = useMessage()
const { toClipboard } = useClipboard()

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
            transfer: 'Transfer',
            transferTitle: 'Transfer Address',
            targetEmail: 'Target User Email',
            transferSuccess: 'Transferred Successfully',
            bindTitle: 'Bind Existing Address',
            jwtPlaceholder: 'Paste Address JWT Credential',
            bindSuccess: 'Bound Successfully',
            switched: 'Switched to ',
            copied: 'Copied',
            more: 'More'
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
            transfer: '转移',
            transferTitle: '转移地址',
            targetEmail: '目标用户邮箱',
            transferSuccess: '转移成功',
            bindTitle: '绑定已有地址',
            jwtPlaceholder: '粘贴邮箱地址凭证 (JWT)',
            bindSuccess: '绑定成功',
            switched: '已切换到 ',
            copied: '已复制凭证',
            more: '更多'
        }
    }
})

const data = ref([])
const loading = ref(false)

// Create Modal
const showCreateModal = ref(false)
const createLoading = ref(false)
const priceLoading = ref(false)
const createForm = ref({ name: '', domain: null })
const currentPriceCents = ref(0)
const userBalanceCents = ref(0)

// Transfer Modal
const showTransferModal = ref(false)
const transferLoading = ref(false)
const transferForm = ref({ addressId: null, targetEmail: '' })

// Bind Modal
const showBindModal = ref(false)
const bindLoading = ref(false)
const bindForm = ref({ jwt: '' })

const domainOptions = computed(() => {
    return (openSettings.value.domains || []).map(d => ({
        label: d.label || d.value,
        value: d.value
    }))
})

// Fetch List
const fetchData = async () => {
    loading.value = true
    try {
        const res = await api.fetch('/user_api/bind_address')
        data.value = res.results || []
    } catch (e) {
        message.error(e.message)
    } finally {
        loading.value = false
    }
}

const fetchBalance = async () => {
    try {
        userBalanceCents.value = await api.getUserBalance()
    } catch (e) { console.error(e) }
}

// Watch Domain for Price
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

// Handlers
const openCreateModal = async () => {
    createForm.value.name = ''
    createForm.value.domain = domainOptions.value.length > 0 ? domainOptions.value[0].value : null
    showCreateModal.value = true
    await fetchBalance()
}

const handleCreate = async () => {
    if (!createForm.value.name || !createForm.value.domain) return
    if (currentPriceCents.value > userBalanceCents.value) {
        message.error(t('insufficientBalance'))
        return
    }
    createLoading.value = true
    try {
        const res = await api.buyAddress(createForm.value.name, createForm.value.domain)
        if (res.success) {
            message.success(t('createSuccess'))
            showCreateModal.value = false
            fetchData()
            fetchBalance()
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

const handleSwitch = async (row) => {
    try {
        const res = await api.fetch(`/user_api/bind_address_jwt/${row.id}`)
        if (res.jwt) {
            jwt.value = res.jwt
            message.success(t('switched') + row.name)
            // 可选：跳转首页或刷新设置
            await api.getSettings()
        }
    } catch (e) {
        message.error(e.message)
    }
}

const handleCopyCredential = async (row) => {
    try {
        const res = await api.fetch(`/user_api/bind_address_jwt/${row.id}`)
        if (res.jwt) {
            await toClipboard(res.jwt)
            message.success(t('copied'))
        }
    } catch (e) {
        message.error(e.message)
    }
}

const openTransferModal = (row) => {
    transferForm.value = { addressId: row.id, targetEmail: '' }
    showTransferModal.value = true
}

const handleTransfer = async () => {
    if (!transferForm.value.targetEmail) return
    transferLoading.value = true
    try {
        await api.fetch('/user_api/transfer_address', {
            method: 'POST',
            body: JSON.stringify({
                address_id: transferForm.value.addressId,
                target_user_email: transferForm.value.targetEmail
            })
        })
        message.success(t('transferSuccess'))
        showTransferModal.value = false
        fetchData()
    } catch (e) {
        message.error(e.message)
    } finally {
        transferLoading.value = false
    }
}

const handleDelete = async (addressId) => {
    try {
        await api.fetch('/user_api/unbind_address', {
            method: 'POST',
            body: JSON.stringify({ address_id: addressId })
        })
        message.success(t('unbindSuccess'))
        fetchData()
    } catch (e) {
        message.error(e.message)
    }
}

const handleBind = async () => {
    if (!bindForm.value.jwt) return
    bindLoading.value = true
    try {
        // 调用后端 bind 接口，需要把 jwt 放在 header 里
        // 这里我们临时用 apiFetch 的 userJwt 参数覆盖 trick，或者直接修改 apiFetch 支持
        // 由于 /user_api/bind_address 后端逻辑是取 header x-user-token (用户) 和 Authorization (地址)
        // 但这里我们是在已登录用户状态下，绑定另一个地址。
        // 后端 user_api/bind_address.ts: bind() -> bindByID(c, user_id, address_id)
        // 但前端怎么传 address_id? 通常地址凭证就是 JWT。
        
        // [修正]：我们直接使用 fetch 构造请求，因为标准 apiFetch 会带上当前的 address jwt
        // 目标是将 bindForm.value.jwt 作为 Authorization 头，去请求 /user_api/bind_address
        // 同时保持用户的 x-user-token
        
        // 这里有个简便方法：后端 bind 接口其实也支持 bindByID，但那是内部调用。
        // 我们直接用 api.fetch，但在 options.headers 里覆盖 Authorization
        
        // 注意：这个操作比较特殊，因为我们想“把这个 JWT 代表的地址绑定给当前用户”
        // 后端 bind_address.ts 的 bind 方法逻辑是：const { address_id } = c.get("jwtPayload");
        // 所以我们需要伪造一个请求，用待绑定的 JWT 做 Auth。
        
        const rawRes = await fetch(api.fetch.defaults?.baseURL ? api.fetch.defaults.baseURL + '/user_api/bind_address' : '/user_api/bind_address', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${bindForm.value.jwt}`,
                'x-user-token': useGlobalState().userJwt.value, // 保持用户登录态
                'Content-Type': 'application/json'
            }
        })
        
        if (rawRes.ok) {
            message.success(t('bindSuccess'))
            showBindModal.value = false
            bindForm.value.jwt = ''
            fetchData()
        } else {
            const txt = await rawRes.text()
            throw new Error(txt)
        }
    } catch (e) {
        message.error(e.message || 'Bind failed')
    } finally {
        bindLoading.value = false
    }
}

const columns = [
    { title: 'ID', key: 'id', width: 50 },
    { title: t('address'), key: 'name' },
    { 
        title: t('actions'), 
        key: 'actions',
        render(row) {
            return h(NSpace, null, {
                default: () => [
                    h(NButton, { size: 'tiny', type: 'primary', secondary: true, onClick: () => handleSwitch(row) }, { default: () => t('switch') }),
                    
                    // Dropdown for More Actions
                    h(NDropdown, {
                        trigger: 'click',
                        options: [
                            { label: t('copyCredential'), key: 'copy' },
                            { label: t('transfer'), key: 'transfer' },
                            { label: t('delete'), key: 'delete', props: { style: 'color: red' } }
                        ],
                        onSelect: (key) => {
                            if (key === 'copy') handleCopyCredential(row)
                            if (key === 'transfer') openTransferModal(row)
                            if (key === 'delete') {
                                if(confirm('Confirm Delete?')) handleDelete(row.id)
                            }
                        }
                    }, {
                        default: () => h(NButton, { size: 'tiny' }, { default: () => t('more') })
                    })
                ]
            })
        }
    }
]

onMounted(() => {
    fetchData()
})
</script>

<template>
    <div>
        <div style="margin-bottom: 10px; display: flex; gap: 10px;">
            <n-button type="primary" @click="openCreateModal">{{ t('createAddress') }}</n-button>
            <n-button @click="showBindModal = true">{{ t('bindExisting') }}</n-button>
            <n-button @click="fetchData">刷新</n-button>
        </div>

        <n-data-table :columns="columns" :data="data" :loading="loading" :bordered="false" />

        <n-modal v-model:show="showCreateModal" preset="card" :title="t('createAddress')" style="width: 500px">
            <n-form>
                <n-form-item :label="t('prefix')" required>
                    <n-input v-model:value="createForm.name" placeholder="e.g. boss" />
                </n-form-item>
                <n-form-item :label="t('domain')" required>
                    <n-select v-model:value="createForm.domain" :options="domainOptions" />
                </n-form-item>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <n-spin :show="priceLoading" size="small">
                        <div v-if="currentPriceCents > 0">
                            <p>{{ t('currentPrice') }} <span style="color: #d03050; font-weight: bold;">{{ (currentPriceCents / 100).toFixed(2) }} 元</span></p>
                            <p style="font-size: 0.9em; color: #666;">{{ t('balance') }} {{ (userBalanceCents / 100).toFixed(2) }} 元</p>
                        </div>
                        <div v-else><n-tag type="success">{{ t('free') }}</n-tag></div>
                    </n-spin>
                </div>
            </n-form>
            <template #action>
                <n-button type="primary" :loading="createLoading" :disabled="priceLoading || (currentPriceCents > userBalanceCents)" @click="handleCreate">
                    {{ currentPriceCents > 0 ? t('confirmPurchase') : t('confirm') }}
                </n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showTransferModal" preset="card" :title="t('transferTitle')" style="width: 400px">
            <n-form>
                <n-form-item :label="t('targetEmail')" required>
                    <n-input v-model:value="transferForm.targetEmail" placeholder="user@example.com" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="warning" :loading="transferLoading" @click="handleTransfer">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showBindModal" preset="card" :title="t('bindTitle')" style="width: 400px">
            <n-form>
                <n-form-item label="JWT" required>
                    <n-input v-model:value="bindForm.jwt" type="textarea" :placeholder="t('jwtPlaceholder')" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" :loading="bindLoading" @click="handleBind">{{ t('confirm') }}</n-button>
            </template>
        </n-modal>
    </div>
</template>