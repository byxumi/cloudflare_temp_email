<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NButton, NStatistic, NGrid, NGi, NResult, NModal, NTag } from 'naive-ui'
import { api } from '../../api'

const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            title: 'Lucky Draw',
            tickets: 'My Tickets',
            draw: 'Draw',
            cost: 'Cost per draw',
            balance: 'Balance',
            checkin: 'Checkin Balance',
            ticket: 'Ticket',
            win: 'You Won!',
            none: 'No luck this time',
            prize: 'Prize: ',
            disabled: 'Lottery is currently disabled',
            prizeList: 'Prize List',
            val: 'Value'
        },
        zh: {
            title: '幸运抽奖',
            tickets: '我的抽奖券',
            draw: '立即抽奖',
            cost: '每次消耗',
            balance: '余额',
            checkin: '签到余额',
            ticket: '抽奖券',
            win: '恭喜中奖！',
            none: '很遗憾，未中奖',
            prize: '奖品: ',
            disabled: '抽奖活动暂未开启',
            prizeList: '奖品列表',
            val: '价值'
        }
    }
})

const loading = ref(false)
const userStatus = ref({ lottery_tickets: 0 })
const settings = ref({ enabled: false, costType: 'balance', costAmount: 0, prizes: [] })
const showResult = ref(false)
const result = ref({ success: false, prize: null })

const fetchData = async () => {
    try {
        const res = await api.getLotteryStatus()
        userStatus.value.lottery_tickets = res.lottery_tickets
        settings.value = res.settings || { enabled: false, prizes: [] }
    } catch (e) {
        console.error(e)
    }
}

const handleDraw = async () => {
    loading.value = true
    try {
        const res = await api.drawLottery()
        result.value = res
        showResult.value = true
        fetchData()
    } catch (e) {
        message.error(e.message)
    } finally {
        loading.value = false
    }
}

const getCostText = () => {
    if (settings.value.costType === 'ticket') {
        return `${settings.value.costAmount} 张`;
    } else {
        return `${(settings.value.costAmount / 100).toFixed(2)} 元`;
    }
}

const getPrizeText = (prize) => {
    if (!prize) return ''
    if (prize.type === 'none') return t('none')
    
    let valText = '';
    if (prize.type === 'ticket') {
        valText = `${prize.value} 张`;
    } else {
        valText = `${(prize.value / 100).toFixed(2)} 元`;
    }

    const typeMap = {
        'balance': t('balance'),
        'checkin_balance': t('checkin'),
        'ticket': t('ticket')
    }
    // 显示 Emoji
    const emoji = prize.emoji || '🎁';
    return `${emoji} ${prize.name} (${valText} ${typeMap[prize.type]})`
}

const getPrizeValueDisplay = (prize) => {
    if (prize.type === 'none') return '';
    if (prize.type === 'ticket') return `${prize.value} 张`;
    return `${(prize.value / 100).toFixed(2)} 元`;
}

const getPrizeTypeTag = (type) => {
    switch (type) {
        case 'balance': return 'success';
        case 'checkin_balance': return 'warning';
        case 'ticket': return 'info';
        case 'none': return 'default';
        default: return 'default';
    }
}

const getPrizeTypeLabel = (type) => {
    const map = {
        'balance': t('balance'),
        'checkin_balance': t('checkin'),
        'ticket': t('ticket'),
        'none': t('none')
    }
    return map[type] || type
}

onMounted(fetchData)
</script>

<template>
    <div>
        <n-card :bordered="false" class="lottery-card">
            <template #header>
                <div style="text-align: center; font-size: 1.2rem; font-weight: bold;">{{ t('title') }} 🎰</div>
            </template>
            
            <div v-if="!settings.enabled" style="text-align: center; padding: 20px;">
                <h3>{{ t('disabled') }}</h3>
            </div>
            <div v-else>
                <div class="status-bar">
                    <n-statistic :label="t('tickets')" :value="userStatus.lottery_tickets" />
                    <n-statistic :label="t('cost')" :value="getCostText()" />
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <div class="draw-btn-wrapper">
                        <n-button 
                            type="primary" 
                            circle
                            style="width: 120px; height: 120px; font-size: 24px; font-weight: bold; box-shadow: 0 0 20px rgba(24, 160, 88, 0.4);"
                            :loading="loading" 
                            @click="handleDraw"
                        >
                            {{ t('draw') }}
                        </n-button>
                    </div>
                </div>

                <div class="prize-list-container">
                    <div style="margin-bottom: 10px; font-weight: bold; color: #666;">{{ t('prizeList') }}</div>
                    <n-grid x-gap="12" y-gap="12" cols="2 s:3 m:4 l:5" responsive="screen">
                        <n-gi v-for="prize in settings.prizes" :key="prize.id">
                            <n-card size="small" embedded class="prize-item" :bordered="false">
                                <div style="text-align: center;">
                                    <div style="font-size: 2rem; margin-bottom: 5px;">{{ prize.emoji || '🎁' }}</div>
                                    <div style="font-weight: bold; margin-bottom: 5px; font-size: 0.95rem;">{{ prize.name }}</div>
                                    
                                    <n-tag :type="getPrizeTypeTag(prize.type)" size="tiny" :bordered="false" round style="margin-bottom: 4px;">
                                        {{ getPrizeTypeLabel(prize.type) }}
                                    </n-tag>
                                    <div v-if="prize.type !== 'none'" style="font-size: 0.85em; color: #666;">
                                        {{ getPrizeValueDisplay(prize) }}
                                    </div>
                                </div>
                            </n-card>
                        </n-gi>
                    </n-grid>
                </div>
            </div>
        </n-card>

        <n-modal v-model:show="showResult">
            <n-card style="width: 320px; text-align: center; border-radius: 16px;" :bordered="false" size="huge" role="dialog" aria-modal="true">
                <div style="font-size: 4rem; margin-bottom: 10px;">
                    {{ (result.prize && result.prize.emoji) || '🎉' }}
                </div>
                <n-result
                    :status="result.prize && result.prize.type !== 'none' ? 'success' : 'info'"
                    :title="result.prize && result.prize.type !== 'none' ? t('win') : t('none')"
                    :description="getPrizeText(result.prize)"
                >
                </n-result>
                <n-button @click="showResult = false" style="margin-top: 20px; width: 100%;" type="primary" size="large" round>
                    开心收下
                </n-button>
            </n-card>
        </n-modal>
    </div>
</template>

<style scoped>
.lottery-card {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    border-radius: 12px;
}

.status-bar {
    display: flex;
    justify-content: space-around;
    background: rgba(0,0,0,0.03);
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.prize-item {
    transition: transform 0.2s;
    cursor: default;
    background: rgba(255,255,255,0.7);
}

.prize-item:hover {
    transform: translateY(-3px);
    background: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.draw-btn-wrapper {
    display: inline-block;
    padding: 10px;
    border-radius: 50%;
    background: rgba(24, 160, 88, 0.1);
}
</style>
