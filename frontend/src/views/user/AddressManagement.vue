<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NTag, NButton, NModal, NForm, NFormItem, NInput, NSelect, NAlert, NSpin } from 'naive-ui'
import { useGlobalState } from '../../store'
import { api } from '../../api'

const { openSettings } = useGlobalState()
const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            createAddress: 'Create New Address',
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
            purchaseTip: 'This operation will deduct ',
            createSuccess: 'Created Successfully',
            unbindSuccess: 'Unbind Successfully',
            loadingPrice: 'Loading price...'
        },
        zh: {
            createAddress: '新建邮箱地址',
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
            purchaseTip: '本次操作将扣除 ',
            createSuccess: '创建成功',
            unbindSuccess: '解绑成功',
            loadingPrice: '正在查询价格...'
        }
    }
})

const data = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const createLoading = ref(false)
const priceLoading = ref(false)

// 表单数据
const form = ref({
    name: '',
    domain: null
})

// 价格相关数据
const currentPriceCents = ref(0) // 单位：分
const userBalanceCents = ref(0)  // 单位：分

// 域名选项
const domainOptions = computed(() => {
    return (openSettings.value.domains || []).map(d => ({
        label: d.label || d.value,
        value: d.value
    }))
})

// 获取已绑定地址列表
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

// 获取余额
const fetchBalance = async () => {
    try {
        userBalanceCents.value = await api.getUserBalance()
    } catch (e) { console.error(e) }
}

// 监听域名变化，查询价格
watch(() => form.value.domain, async (newDomain) => {
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

// 打开创建弹窗
const openCreateModal = async () => {
    form.value.name = ''
    form.value.domain = domainOptions.value.length > 0 ? domainOptions.value[0].value : null
    showCreateModal.value = true
    await fetchBalance()
}

// 执行创建/购买
const handleCreate = async () => {
    if (!form.value.name || !form.value.domain) return
    
    // 前端简单校验余额
    if (currentPriceCents.value > userBalanceCents.value) {
        message.error(t('insufficientBalance'))
        return
    }

    createLoading.value = true
    try {
        // 调用后端的购买接口 (purchaseAddress)
        // 注意：即使是免费的，调用这个接口也没问题，后端会判断 price=0 不扣费
        const res = await api.buyAddress(form.value.name, form.value.domain)
        if (res.success) {
            message.success(t('createSuccess'))
            showCreateModal.value = false
            fetchData() // 刷新列表
            fetchBalance() // 刷新余额
        }
    } catch (e) {
        // 处理 402 余额不足等错误
        if (e.message && e.message.includes('402')) {
            message.error(t('insufficientBalance'))
        } else {
            message.error(e.message || 'Error')
        }
    } finally {
        createLoading.value = false
    }
}

// 解绑/删除地址
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

const columns = [
    { title: 'ID', key: 'id', width: 60 },
    { title: t('address'), key: 'name' },
    { 
        title: t('actions'), 
        key: 'actions',
        render(row) {
            return h(NButton, {
                size: 'small',
                type: 'error',
                tertiary: true,
                onClick: () => handleDelete(row.id)
            }, { default: () => t('delete') })
        }
    }
]

onMounted(() => {
    fetchData()
})
</script>

<template>
    <div>
        <div style="margin-bottom: 10px">
            <n-button type="primary" @click="openCreateModal">
                {{ t('createAddress') }}
            </n-button>
            <n-button style="margin-left: 10px" @click="fetchData">刷新</n-button>
        </div>

        <n-data-table :columns="columns" :data="data" :loading="loading" :bordered="false" />

        <n-modal v-model:show="showCreateModal" preset="card" :title="t('createAddress')" style="width: 500px">
            <n-form>
                <n-form-item :label="t('prefix')" required>
                    <n-input v-model:value="form.name" placeholder="例如: boss" />
                </n-form-item>
                <n-form-item :label="t('domain')" required>
                    <n-select v-model:value="form.domain" :options="domainOptions" :placeholder="t('selectDomain')" />
                </n-form-item>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <n-spin :show="priceLoading" size="small">
                        <div v-if="currentPriceCents > 0">
                            <p>
                                {{ t('currentPrice') }} 
                                <span style="color: #d03050; font-weight: bold; font-size: 1.1em;">
                                    {{ (currentPriceCents / 100).toFixed(2) }} 元
                                </span>
                            </p>
                            <p style="font-size: 0.9em; color: #666;">
                                {{ t('balance') }} {{ (userBalanceCents / 100).toFixed(2) }} 元
                            </p>
                            <n-alert v-if="currentPriceCents > userBalanceCents" type="error" :show-icon="true" style="margin-top: 10px">
                                {{ t('insufficientBalance') }}
                            </n-alert>
                        </div>
                        <div v-else>
                            <n-tag type="success">{{ t('free') }}</n-tag>
                        </div>
                    </n-spin>
                </div>

            </n-form>

            <template #action>
                <n-button @click="showCreateModal = false">{{ t('cancel') }}</n-button>
                <n-button 
                    type="primary" 
                    :loading="createLoading" 
                    :disabled="priceLoading || (currentPriceCents > userBalanceCents)"
                    @click="handleCreate"
                >
                    {{ currentPriceCents > 0 ? t('confirmPurchase') : t('confirm') }}
                </n-button>
            </template>
        </n-modal>
    </div>
</template>