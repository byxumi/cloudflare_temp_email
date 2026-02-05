<script setup>
import { NConfigProvider, NMessageProvider, NDialogProvider, NGlobalStyle, zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useGlobalState } from './store'
import Header from './views/Header.vue'
import Footer from './views/Footer.vue'
import RouterLoadingBar from './components/RouterLoadingBar.vue'

const { locale } = useI18n()
const { isDark } = useGlobalState()

const nLocale = computed(() => (locale.value === 'zh' ? zhCN : enUS))
const nDateLocale = computed(() => (locale.value === 'zh' ? dateZhCN : dateEnUS))

// --- 蓝粉色主题配置 ---
const themeOverrides = {
  common: {
    // 主色调：清新的蓝色
    primaryColor: '#6CB2EB', 
    primaryColorHover: '#4FA3E8',
    primaryColorPressed: '#3490DC',
    primaryColorSuppl: '#6CB2EB',
    
    // 辅助色/强调色：柔和的粉色 (用于 Info/Warning 等)
    infoColor: '#F699BE',
    infoColorHover: '#F48fb1',
    infoColorPressed: '#F06292',
    
    borderRadius: '12px', // 更圆润的边角
    fontFamily: '"Nunito", "PingFang SC", "Microsoft YaHei", sans-serif'
  },
  Button: {
    // 按钮渐变需要在组件层面做，这里定义基础色
    borderRadiusMedium: '10px',
    fontWeight: '600'
  },
  Card: {
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(149, 157, 165, 0.1)' // 柔和阴影
  }
}
</script>

<template>
  <n-config-provider 
    :locale="nLocale" 
    :date-locale="nDateLocale" 
    :theme-overrides="themeOverrides"
    :theme="isDark ? null : null" 
  >
    <n-global-style />
    <n-dialog-provider>
      <n-message-provider>
        <RouterLoadingBar />
        <div class="app-layout">
          <Header />
          <div class="main-content">
            <router-view v-slot="{ Component }">
              <keep-alive>
                <component :is="Component" />
              </keep-alive>
            </router-view>
          </div>
          <Footer />
        </div>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<style>
/* 全局样式重置与背景 */
body {
  margin: 0;
  font-family: 'Nunito', sans-serif;
  /* 蓝粉色渐变背景 */
  background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
  background-attachment: fixed;
  color: #2c3e50;
  min-height: 100vh;
}

.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* 针对移动端的优化 */
@media (max-width: 600px) {
  .main-content {
    padding: 10px;
  }
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.3);
}
::-webkit-scrollbar-thumb {
  background: rgba(108, 178, 235, 0.5);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(108, 178, 235, 0.8);
}
</style>
