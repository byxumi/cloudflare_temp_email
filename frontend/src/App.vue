<script setup>
import { onMounted, ref } from 'vue'
import { NConfigProvider, NMessageProvider, NDialogProvider, NGlobalStyle, zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from './store'
import { api } from './api'
import Header from './views/Header.vue'
import Footer from './views/Footer.vue'
import RouterLoadingBar from './components/RouterLoadingBar.vue'

const { locale } = useI18n()
const { loading, openSettings } = useGlobalState()

const themeOverrides = {
  common: {
    primaryColor: '#60A5FA', // 蓝色主色调
    primaryColorHover: '#93C5FD',
    primaryColorPressed: '#3B82F6',
    borderRadius: '12px', // 更圆润的边角
  },
  Button: {
    textColor: '#60A5FA',
    border: '1px solid #60A5FA',
  },
  Card: {
    borderRadius: '16px',
    color: 'rgba(255, 255, 255, 0.85)', // 卡片半透明
  }
}

const fetchOpenSettings = async () => {
  try {
    const res = await api.fetch('/open_api/settings');
    openSettings.value = res;
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  fetchOpenSettings();
})
</script>

<template>
  <n-config-provider
    :locale="locale === 'zh' ? zhCN : enUS"
    :date-locale="locale === 'zh' ? dateZhCN : dateEnUS"
    :theme-overrides="themeOverrides"
  >
    <n-global-style />
    <n-message-provider>
      <n-dialog-provider>
        <RouterLoadingBar />
        <div class="app-layout">
          <div class="background-gradient"></div>
          
          <div class="main-container">
            <Header />
            <main class="content-wrapper">
              <router-view v-slot="{ Component }">
                <transition name="fade-slide" mode="out-in">
                  <component :is="Component" />
                </transition>
              </router-view>
            </main>
            <Footer />
          </div>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
/* 全局重置 */
body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #333;
}

/* 蓝粉色渐变背景 */
.background-gradient {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); /* 蓝粉色 */
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
}

@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-wrapper {
  flex: 1;
  padding: 20px 0;
  width: 100%;
}

/* 路由切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 移动端适配 */
@media (max-width: 600px) {
  .main-container {
    padding: 0 10px;
  }
}
</style>
