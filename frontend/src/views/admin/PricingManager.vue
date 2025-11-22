<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NButton, NDataTable, NModal, NForm, NFormItem, NInput, NInputNumber, NSelect } from 'naive-ui'
import { api } from '../../api'
import { useGlobalState } from '../../store'

const message = useMessage()
const { openSettings } = useGlobalState() // 获取全局设置中的域名列表

const { t } = useI18n({
    messages: {
        en: {
            domain: 'Domain',
            role: 'Role (default/vip)',
            price: 'Price (CNY)',
            save: 'Save',
            setPrice: 'Set Price',
            updatedAt: 'Updated At',
            selectDomain: 'Select Domain'
        },
        zh: {
            domain: '域名',
            role: '角色 (default/vip)',
            price: '价格 (元)',
            save: '保存',
            setPrice: '设置价格',
            updatedAt: '更新时间',
            selectDomain: '选择域名'
        }
    }
})

const data = ref([])
const showModal = ref(false)
const form = ref({ domain: null, role_text: 'default', price: 0.00 })
const loading = ref(false)

// 计算属性：生成域名下拉选项
const domainOptions = computed(() => {
    if (openSettings.value && openSettings.value.domains) {
        return openSettings.value.domains.map(d => ({
            label: d.label || d.value,
            value: d.value
        }))
    }
    return []
})

const fetchData = async () => {
    loading.value = true
    try {
        // 确保获取到最新的域名列表
        if (!openSettings.value.fetched) {
            await api.getOpenSettings(message)
        }
        const res = await api.adminGetPrices()
        data.value = res.results || []
    } catch (e) {
        message.error(e.message)
    } finally {
        loading.value = false
    }
}

const handleSave = async () => {
    if (!form.value.domain) return message.error("Please select a domain")
    loading.value = true
    try {
        const res = await api.adminSetPrice(form.value.domain, form.value.role_text, form.value.price)
        if (res.success) {
            message.success('Saved')
            showModal.value = false
            fetchData()
        }
    } catch (e) {
        message.error(e.message)
    } finally {
        loading.value = false
    }
}

const columns = [
    { title: t('domain'), key: 'domain' },
    { title: t('role'), key: 'role_text' },
    { 
        title: t('price'), 
        key: 'price',
        render(row) {
            return (row.price / 100).toFixed(2)
        }
    },
    { title: t('updatedAt'), key: 'updated_at' }
]

onMounted(fetchData)
</script>

<template>
    <div>
        <div style="margin-bottom: 10px">
            <n-button type="primary" @click="showModal = true">{{ t('setPrice') }}</n-button>
            <n-button style="margin-left: 10px" @click="fetchData">刷新</n-button>
        </div>
        
        <n-data-table :columns="columns" :data="data" :loading="loading" :bordered="false" />

        <n-modal v-model:show="showModal" preset="dialog" :title="t('setPrice')">
            <n-form>
                <n-form-item :label="t('domain')" required>
                    <n-select 
                        v-model:value="form.domain" 
                        :options="domainOptions" 
                        :placeholder="t('selectDomain')" 
                        filterable
                    />
                </n-form-item>
                <n-form-item :label="t('role')">
                    <n-input v-model:value="form.role_text" placeholder="default" />
                </n-form-item>
                 <n-form-item :label="t('price')">
                    <n-input-number v-model:value="form.price" :precision="2" :step="0.1" placeholder="0.00" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button type="primary" :loading="loading" @click="handleSave">{{ t('save') }}</n-button>
            </template>
        </n-modal>
    </div>
</template>