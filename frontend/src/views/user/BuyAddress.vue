<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NInput, NButton, NSpace, NAlert } from 'naive-ui'
import { api } from '../../api'

const { t } = useI18n()
const message = useMessage()

const code = ref('')
const loading = ref(false)

const submit = async () => {
    if (!code.value) return
    loading.value = true
    try {
        const res = await api.userUseRechargeCode(code.value)
        message.success(res.message || 'Success')
        code.value = ''
        // 充值成功后刷新页面以更新状态
        setTimeout(() => {
            location.reload()
        }, 1500)
    } catch (e) {
        message.error(e.message || 'Error')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="recharge-container">
        <n-card :title="t('recharge')">
            <n-space vertical size="large">
                <n-alert type="info" :show-icon="false">
                    {{ t('recharge_tip') }}
                </n-alert>
                <n-space vertical>
                    <n-input 
                        v-model:value="code" 
                        :placeholder="t('recharge_code_placeholder')" 
                        size="large"
                        @keydown.enter="submit"
                    />
                    <n-button type="primary" block size="large" :loading="loading" @click="submit" :disabled="!code">
                        {{ t('redeem') }}
                    </n-button>
                </n-space>
            </n-space>
        </n-card>
    </div>
</template>

<style scoped>
.recharge-container {
    max-width: 600px;
    margin: 0 auto;
}
</style>