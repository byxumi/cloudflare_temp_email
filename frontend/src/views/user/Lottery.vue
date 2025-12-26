<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NButton, NStatistic, NGrid, NGi, NResult, NModal } from 'naive-ui'
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
            disabled: 'Lottery is currently disabled'
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
            disabled: '抽奖活动暂未开启'
        }
    }
})

const loading = ref(false)
const userStatus = ref({ lottery_tickets: 0 })
const settings = ref({ enabled: false, costType: 'balance', costAmount: 0 })
const showResult = ref(false)
const result = ref({ success: false, prize: null })

const fetchData = async () => {
    try {
        const res = await api.getLotteryStatus()
        userStatus.value.lottery_tickets = res.lottery_tickets
        settings.value = res.settings
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
        fetchData() // Refresh status
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
        // 如果是余额，除以100显示为元
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
        // 余额类型除以100
        valText = `${(prize.value / 100).toFixed(2)} 元`;
    }

    const typeMap = {
        'balance': t('balance'),
        'checkin_balance': t('checkin'),
        'ticket': t('ticket')
    }
    return `${prize.name} (${valText} ${typeMap[prize.type]})`
}

onMounted(fetchData)
</script>

<template>
    <div>
        <n-card :title="t('title')" :bordered="false" embedded>
            <div v-if="!settings.enabled" style="text-align: center; padding: 20px;">
                <h3>{{ t('disabled') }}</h3>
            </div>
            <div v-else>
                <n-grid :cols="2" style="margin-bottom: 20px;">
                    <n-gi>
                        <n-statistic :label="t('tickets')" :value="userStatus.lottery_tickets" />
                    </n-gi>
                    <n-gi>
                        <n-statistic :label="t('cost')" :value="getCostText()" />
                    </n-gi>
                </n-grid>

                <div style="text-align: center; margin-top: 30px;">
                    <n-button type="primary" size="large" :loading="loading" @click="handleDraw" style="width: 200px; height: 60px; font-size: 20px; box-shadow: 0 4px 12px rgba(24, 160, 88, 0.4);">
                        {{ t('draw') }} 🎁
                    </n-button>
                </div>
            </div>
        </n-card>

        <n-modal v-model:show="showResult">
            <n-card style="width: 400px; text-align: center;" :bordered="false" size="huge">
                <n-result
                    :status="result.prize && result.prize.type !== 'none' ? 'success' : 'info'"
                    :title="result.prize && result.prize.type !== 'none' ? t('win') : t('none')"
                    :description="getPrizeText(result.prize)"
                >
                </n-result>
                <n-button @click="showResult = false" style="margin-top: 20px;" type="primary">开心收下</n-button>
            </n-card>
        </n-modal>
    </div>
</template>
