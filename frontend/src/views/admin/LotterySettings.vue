<script setup>
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NForm, NFormItem, NSwitch, NInputNumber, NSelect, NButton, NDataTable, NInput } from 'naive-ui'
import { api } from '../../api'

const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            title: 'Lottery Settings',
            enabled: 'Enable Lottery',
            costType: 'Cost Type',
            costAmount: 'Cost Amount (Yuan/Count)',
            prizes: 'Prizes',
            addPrize: 'Add Prize',
            save: 'Save',
            name: 'Name',
            type: 'Type',
            value: 'Value (Yuan/Count)',
            weight: 'Weight',
            actions: 'Actions',
            delete: 'Delete',
            balance: 'Main Balance',
            checkin: 'Checkin Balance',
            ticket: 'Lottery Ticket',
            none: 'None',
            saveSuccess: 'Saved Successfully'
        },
        zh: {
            title: '抽奖设置',
            enabled: '启用抽奖',
            costType: '消耗类型',
            costAmount: '消耗数量 (元/张)',
            prizes: '奖品列表',
            addPrize: '添加奖品',
            save: '保存配置',
            name: '奖品名称',
            type: '类型',
            value: '数值 (元/张)',
            weight: '权重',
            actions: '操作',
            delete: '删除',
            balance: '主余额',
            checkin: '签到余额',
            ticket: '抽奖券',
            none: '谢谢惠顾',
            saveSuccess: '保存成功'
        }
    }
})

const settings = ref({
    enabled: false,
    costType: 'balance',
    costAmount: 1, // 默认为1
    prizes: []
})

const costOptions = [
    { label: t('balance'), value: 'balance' },
    { label: t('checkin'), value: 'checkin_balance' },
    { label: t('ticket'), value: 'ticket' }
]

const prizeTypeOptions = [
    { label: t('balance'), value: 'balance' },
    { label: t('checkin'), value: 'checkin_balance' },
    { label: t('ticket'), value: 'ticket' },
    { label: t('none'), value: 'none' }
]

// 辅助函数：判断类型是否是余额类（需要转换单位）
const isCurrency = (type) => type === 'balance' || type === 'checkin_balance';

const columns = [
    { title: t('name'), key: 'name', render(row, index) {
        return h(NInput, { value: row.name, onUpdateValue: v => settings.value.prizes[index].name = v })
    }},
    { title: t('type'), key: 'type', width: 150, render(row, index) {
        return h(NSelect, { value: row.type, options: prizeTypeOptions, onUpdateValue: v => settings.value.prizes[index].type = v })
    }},
    { title: t('value'), key: 'value', render(row, index) {
        // 如果是余额类型，显示小数（元）；如果是券，显示整数
        const precision = isCurrency(row.type) ? 2 : 0;
        return h(NInputNumber, { 
            value: row.value, 
            precision: precision,
            onUpdateValue: v => settings.value.prizes[index].value = v 
        })
    }},
    { title: t('weight'), key: 'weight', width: 100, render(row, index) {
        return h(NInputNumber, { value: row.weight, onUpdateValue: v => settings.value.prizes[index].weight = v })
    }},
    { title: t('actions'), key: 'actions', width: 80, render(row, index) {
        return h(NButton, { type: 'error', size: 'small', onClick: () => settings.value.prizes.splice(index, 1) }, { default: () => t('delete') })
    }}
]

const fetchData = async () => {
    try {
        const res = await api.adminGetLotterySettings()
        // 从后端读取（分） -> 转换为前端显示（元）
        if (isCurrency(res.costType)) {
            res.costAmount = res.costAmount / 100;
        }
        
        if (res.prizes) {
            res.prizes.forEach(p => {
                if (isCurrency(p.type)) {
                    p.value = p.value / 100;
                }
            });
        }
        
        settings.value = res
    } catch (e) {
        message.error(e.message)
    }
}

const handleSave = async () => {
    try {
        // 深拷贝一份，用于提交
        const payload = JSON.parse(JSON.stringify(settings.value));
        
        // 前端输入（元） -> 转换为后端存储（分）
        if (isCurrency(payload.costType)) {
            payload.costAmount = Math.round(payload.costAmount * 100);
        }
        
        if (payload.prizes) {
            payload.prizes.forEach(p => {
                if (isCurrency(p.type)) {
                    p.value = Math.round(p.value * 100);
                }
            });
        }

        await api.adminSaveLotterySettings(payload)
        message.success(t('saveSuccess'))
        // 重新拉取以确保同步
        fetchData();
    } catch (e) {
        message.error(e.message)
    }
}

const addPrize = () => {
    settings.value.prizes.push({
        id: Date.now().toString(),
        name: 'New Prize',
        type: 'none',
        value: 0,
        weight: 10
    })
}

onMounted(fetchData)
</script>

<template>
    <n-card :title="t('title')">
        <n-form>
            <n-form-item :label="t('enabled')">
                <n-switch v-model:value="settings.enabled" />
            </n-form-item>
            <n-form-item :label="t('costType')">
                <n-select v-model:value="settings.costType" :options="costOptions" />
            </n-form-item>
            <n-form-item :label="t('costAmount')">
                <n-input-number 
                    v-model:value="settings.costAmount" 
                    :precision="isCurrency(settings.costType) ? 2 : 0"
                />
            </n-form-item>
            
            <n-form-item :label="t('prizes')">
                <div style="width: 100%">
                    <n-data-table :columns="columns" :data="settings.prizes" />
                    <n-button style="margin-top: 10px" @click="addPrize">{{ t('addPrize') }}</n-button>
                </div>
            </n-form-item>

            <n-button type="primary" @click="handleSave">{{ t('save') }}</n-button>
        </n-form>
    </n-card>
</template>
