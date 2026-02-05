<script setup>
import { useGlobalState } from '../store'
import { onMounted, watch, ref } from 'vue'
import { useMessage, NGrid, NGi, NCard, NAlert, NSpin } from 'naive-ui'
import { useI18n } from 'vue-i18n'

import AddressBar from './index/AddressBar.vue'
import MailBox from '../components/MailBox.vue'
import SendBox from '../components/SendBox.vue'
import Turnstile from '../components/Turnstile.vue'
import { api } from '../api'

const { loading, settings, openSettings, showTurnstile, jwt } = useGlobalState()
const message = useMessage()
const { t } = useI18n({
  messages: {
    en: {
      notice: 'Notice',
      loadingSettings: 'Loading configuration...',
    },
    zh: {
      notice: '公告',
      loadingSettings: '正在加载配置...',
    }
  }
})

// 控制显示发送箱还是收件箱
const showSendBox = ref(false)

onMounted(async () => {
  await api.getSettings()
})
</script>

<template>
  <div class="index-container">
    <div v-if="openSettings.notice" class="mb-4">
      <n-alert type="info" show-icon :title="t('notice')">
        {{ openSettings.notice }}
      </n-alert>
    </div>

    <n-card :bordered="false" class="hero-card mb-4">
      <AddressBar />
    </n-card>

    <n-grid x-gap="16" y-gap="16" cols="1 m:24" responsive="screen">
      
      <n-gi span="24 m:9">
        <div class="left-panel">
          <n-card v-if="showTurnstile" class="mb-4 glass-card" :bordered="false">
            <Turnstile />
          </n-card>

          <n-card 
            :bordered="false" 
            content-style="padding: 0;" 
            class="mailbox-card glass-card"
            title="Inbox"
          >
            <template #header-extra>
               </template>
            <MailBox />
          </n-card>
        </div>
      </n-gi>

      <n-gi span="24 m:15">
        <div class="right-panel">
          <n-card v-if="false" title="Send Mail" :bordered="false" class="glass-card">
             <SendBox />
          </n-card>
          
          </div>
      </n-gi>
    </n-grid>

    <div class="main-workspace">
        <n-card :bordered="false" class="glass-card workspace-card">
            <MailBox />
        </n-card>
    </div>

    <div class="mt-4" v-if="!jwt">
       </div>
  </div>
</template>

<style scoped>
.index-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 英雄卡片 (地址栏) - 蓝粉渐变边框效果 */
.hero-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(108, 178, 235, 0.15);
  position: relative;
  overflow: hidden;
}

.hero-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; height: 4px;
  background: linear-gradient(90deg, #6CB2EB, #F699BE);
}

/* 通用毛玻璃卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

/* 适配 MailBox 内部样式覆盖 (如果不修改子组件，只能在这里穿透) */
:deep(.n-list-item) {
  border-radius: 8px;
  margin-bottom: 4px;
  transition: background 0.2s;
}
:deep(.n-list-item:hover) {
  background: rgba(108, 178, 235, 0.1);
}
</style>
