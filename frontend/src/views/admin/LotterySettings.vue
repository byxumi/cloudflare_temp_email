<script setup>
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NForm, NFormItem, NSwitch, NInputNumber, NSelect, NButton, NInput, NGrid, NGi, NIcon, NTag } from 'naive-ui'
import { GripVertical } from '@vicons/fa' // 需要安装或使用现有图标
import { api } from '../../api'

const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            title: 'Lottery Settings',
            enabled: 'Enable Lottery',
            costType: 'Cost Type',
            costAmount: 'Cost Amount (Yuan/Count)',
            prizes: 'Prize List (Drag to reorder)',
            addPrize: 'Add Prize',
            save: 'Save Config',
            name: 'Name',
            emoji: 'Emoji',
            type: 'Type',
            value: 'Value',
            probability: 'Probability',
            actions: 'Actions',
            delete: 'Delete',
            balance: 'Main Balance',
            checkin: 'Checkin Balance',
            ticket: 'Lottery Ticket',
            none: 'None',
            saveSuccess: 'Saved Successfully',
            unitYuan: 'Yuan',
            unitCount: 'Count'
        },
        zh: {
            title: '抽奖设置',
            enabled: '启用抽奖',
            costType: '消耗类型',
            costAmount: '消耗数量 (元/张)',
            prizes: '奖品列表 (按住图标拖拽排序)',
            addPrize: '添加奖品',
            save: '保存配置',
            name: '奖品名称',
            emoji: '图标(Emoji)',
            type: '类型',
            value: '数值',
            probability: '概率',
            actions: '操作',
            delete: '删除',
            balance: '主余额',
            checkin: '签到余额',
            ticket: '抽奖券',
            none: '谢谢惠顾',
            saveSuccess: '保存成功',
            unitYuan: '元',
            unitCount: '个'
        }
    }
})

const settings = ref({
    enabled: false,
    costType: 'balance',
    costAmount: 1,
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

const isCurrency = (type) => type === 'balance' || type === 'checkin_balance';

const fetchData = async () => {
    try {
        const res = await api.adminGetLotterySettings()
        if (isCurrency(res.costType)) {
            res.costAmount = res.costAmount / 100;
        }
        
        if (res.prizes) {
            res.prizes.forEach(p => {
                // 确保有 emoji 字段
                if (!p.emoji) p.emoji = '🎁';
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
        const payload = JSON.parse(JSON.stringify(settings.value));
        
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
        fetchData();
    } catch (e) {
        message.error(e.message)
    }
}

const addPrize = () => {
    settings.value.prizes.push({
        id: Date.now().toString(),
        name: 'New Prize',
        emoji: '🎁',
        type: 'none',
        value: 0,
        weight: 10
    })
}

const removePrize = (index) => {
    settings.value.prizes.splice(index, 1);
}

// --- Drag and Drop Logic ---
const dragIndex = ref(-1);

const onDragStart = (index) => {
    dragIndex.value = index;
}

const onDragEnter = (index) => {
    if (dragIndex.value === index) return;
    // 移动数组元素
    const item = settings.value.prizes.splice(dragIndex.value, 1)[0];
    settings.value.prizes.splice(index, 0, item);
    dragIndex.value = index;
}

const onDragEnd = () => {
    dragIndex.value = -1;
}

onMounted(fetchData)
</script>

<template>
    <n-card :title="t('title')">
        <n-form>
            <div style="background: rgba(0,0,0,0.02); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <n-grid :cols="3" :x-gap="12">
                    <n-gi>
                        <n-form-item :label="t('enabled')">
                            <n-switch v-model:value="settings.enabled" />
                        </n-form-item>
                    </n-gi>
                    <n-gi>
                        <n-form-item :label="t('costType')">
                            <n-select v-model:value="settings.costType" :options="costOptions" />
                        </n-form-item>
                    </n-gi>
                    <n-gi>
                        <n-form-item :label="t('costAmount')">
                            <n-input-number 
                                v-model:value="settings.costAmount" 
                                :precision="isCurrency(settings.costType) ? 2 : 0"
                                style="width: 100%"
                            />
                        </n-form-item>
                    </n-gi>
                </n-grid>
            </div>
            
            <n-form-item :label="t('prizes')" label-style="font-weight: bold; font-size: 1.1em;">
                <div class="prize-list">
                    <transition-group name="list">
                        <div 
                            v-for="(prize, index) in settings.prizes" 
                            :key="prize.id" 
                            class="prize-item"
                            :class="{ 'dragging': dragIndex === index }"
                            draggable="true"
                            @dragstart="onDragStart(index)"
                            @dragenter.prevent="onDragEnter(index)"
                            @dragover.prevent
                            @dragend="onDragEnd"
                        >
                            <div class="drag-handle">
                                <n-icon size="20" color="#999"><GripVertical /></n-icon>
                            </div>
                            
                            <div class="prize-content">
                                <n-grid :cols="24" :x-gap="10" align-items="center">
                                    <n-gi :span="2">
                                        <n-input v-model:value="prize.emoji" placeholder="🎁" style="text-align: center;" />
                                    </n-gi>
                                    
                                    <n-gi :span="6">
                                        <n-input v-model:value="prize.name" :placeholder="t('name')" />
                                    </n-gi>

                                    <n-gi :span="5">
                                        <n-select v-model:value="prize.type" :options="prizeTypeOptions" size="small" />
                                    </n-gi>

                                    <n-gi :span="5">
                                        <n-input-number 
                                            v-model:value="prize.value" 
                                            :precision="isCurrency(prize.type) ? 2 : 0"
                                            size="small"
                                            :disabled="prize.type === 'none'"
                                            :placeholder="t('value')"
                                        >
                                            <template #suffix>{{ isCurrency(prize.type) ? t('unitYuan') : t('unitCount') }}</template>
                                        </n-input-number>
                                    </n-gi>

                                    <n-gi :span="4">
                                        <n-input-number v-model:value="prize.weight" :min="0" size="small" :placeholder="t('probability')" />
                                    </n-gi>

                                    <n-gi :span="2" style="text-align: right;">
                                        <n-button type="error" circle size="small" @click="removePrize(index)" secondary>
                                            -
                                        </n-button>
                                    </n-gi>
                                </n-grid>
                            </div>
                        </div>
                    </transition-group>
                    
                    <div style="text-align: center; padding: 10px; border: 2px dashed #eee; border-radius: 8px; margin-top: 10px; cursor: pointer; color: #666;" @click="addPrize">
                        + {{ t('addPrize') }}
                    </div>
                </div>
            </n-form-item>

            <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                <n-button type="primary" size="large" @click="handleSave" style="width: 150px;">{{ t('save') }}</n-button>
            </div>
        </n-form>
    </n-card>
</template>

<style scoped>
.prize-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.prize-item {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 10px;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.prize-item:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.08);
    border-color: #ddd;
}

.prize-item.dragging {
    opacity: 0.5;
    background: #f0f0f0;
    border: 2px dashed #ccc;
}

.drag-handle {
    cursor: move;
    padding: 0 10px;
    display: flex;
    align-items: center;
}

.prize-content {
    flex: 1;
}

/* List transition animations */
.list-move {
    transition: transform 0.3s ease;
}
</style>
