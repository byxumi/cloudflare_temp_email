<script setup>
import { darkTheme, zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useScript } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from './store'
import { useIsMobile } from './utils/composables'
import Header from './views/Header.vue';
import Footer from './views/Footer.vue';
import RouterLoadingBar from './components/RouterLoadingBar.vue'
import { api } from './api'

const {
  isDark, loading, useSideMargin, telegramApp, isTelegram
} = useGlobalState()
const adClient = import.meta.env.VITE_GOOGLE_AD_CLIENT;
const adSlot = import.meta.env.VITE_GOOGLE_AD_SLOT;
const { locale } = useI18n({});

const theme = computed(() => isDark.value ? darkTheme : null)

// 自动根据 i18n 切换 Naive UI 语言包
const localeConfig = computed(() => locale.value === 'zh' ? zhCN : enUS)
const dateLocaleConfig = computed(() => locale.value === 'zh' ? dateZhCN : dateEnUS)

const isMobile = useIsMobile()
const showSideMargin = computed(() => !isMobile.value && useSideMargin.value);
const showAd = computed(() => !isMobile.value && adClient && adSlot);
const gridMaxCols = computed(() => showAd.value ? 8 : 12);

const showSplash = ref(true)

// [深度美化] 全局主题覆盖配置
const themeOverrides = computed(() => {
  const isDarkTheme = isDark.value;
  
  // 核心色板
  const primary = '#4361ee'; // 更加稳重的蓝紫色
  const primaryHover = '#4895ef';
  const success = '#06d6a0';
  const warning = '#ffd166';
  const error = '#ef476f';

  // 玻璃参数
  const glassAlpha = isDarkTheme ? 0.6 : 0.75;
  const glassBg = isDarkTheme 
    ? `rgba(20, 20, 23, ${glassAlpha})` 
    : `rgba(255, 255, 255, ${glassAlpha})`;
  
  const borderColor = isDarkTheme 
    ? 'rgba(255, 255, 255, 0.08)' 
    : 'rgba(255, 255, 255, 0.6)';

  return {
    common: {
      primaryColor: primary,
      primaryColorHover: primaryHover,
      primaryColorPressed: '#3f37c9',
      successColor: success,
      warningColor: warning,
      errorColor: error,
      
      borderRadius: '16px',
      borderRadiusSmall: '8px',
      fontFamily: '"Inter", "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif',
      
      // 基础背景透明，交由 CSS 处理
      bodyColor: 'transparent',
      cardColor: glassBg,
      modalColor: glassBg,
      popoverColor: glassBg,
      tableColor: 'transparent',
      
      // 文字颜色微调
      textColorBase: isDarkTheme ? '#f0f0f0' : '#2d3436',
      textColor1: isDarkTheme ? '#e0e0e0' : '#2d3436',
      textColor2: isDarkTheme ? '#a0a0a0' : '#636e72',
    },
    Card: {
      borderRadius: '20px',
      borderColor: borderColor,
      // 移除默认阴影，使用 CSS 类增强
      boxShadow: 'none' 
    },
    Modal: {
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
      borderColor: borderColor
    },
    Button: {
      fontWeight: '600',
      borderRadiusMedium: '12px',
      borderRadiusLarge: '14px',
      // 按钮自带微光泽
      colorOpacitySecondary: 0.15,
      colorSecondaryHover: 0.25,
    },
    Input: {
      borderRadius: '12px',
      border: `1px solid ${borderColor}`,
      color: isDarkTheme ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
      colorFocus: isDarkTheme ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)',
    },
    Tabs: {
      tabBorderRadius: '10px',
      tabGapSmallCard: '4px',
      panePadding: '20px 0 0 0'
    },
    Statistic: {
      labelFontWeight: '500',
      valueFontWeight: '700'
    }
  }
})

onMounted(async () => {
  setTimeout(() => {
    showSplash.value = false
  }, 2000)

  try {
    await api.getUserSettings();
  } catch (error) {
    console.error(error);
  }

  const token = import.meta.env.VITE_CF_WEB_ANALY_TOKEN;
  const exist = document.querySelector('script[src="https://static.cloudflareinsights.com/beacon.min.js"]') !== null
  if (token && !exist) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.dataset.cfBeacon = `{ token: ${token} }`;
    document.body.appendChild(script);
  }

  if (showAd.value) {
    useScript({
      src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`,
      async: true,
      crossorigin: "anonymous",
    });
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  const enableTelegram = import.meta.env.VITE_IS_TELEGRAM;
  if (
    (typeof enableTelegram === 'boolean' && enableTelegram === true)
    ||
    (typeof enableTelegram === 'string' && enableTelegram === 'true')
  ) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
    telegramApp.value = window.Telegram?.WebApp || {};
    isTelegram.value = !!window.Telegram?.WebApp?.initData;
  }
});
</script>

<template>
  <n-config-provider 
    :locale="localeConfig" 
    :date-locale="dateLocaleConfig" 
    :theme="theme" 
    :theme-overrides="themeOverrides"
  >
    <n-global-style />
    
    <div class="noise-overlay"></div>

    <Transition name="splash">
      <div v-if="showSplash" class="splash-screen">
        <div class="splash-content">
          <img src="/logo.png" alt="Logo" class="splash-logo" />
          <div class="splash-loader"></div>
        </div>
      </div>
    </Transition>

    <n-loading-bar-provider>
      <RouterLoadingBar />
      
      <n-spin description="Loading..." :show="loading">
        <n-notification-provider container-style="margin-top: 60px;">
          <n-message-provider container-style="margin-top: 20px;">
            
            <div class="app-container">
              <n-grid :cols="gridMaxCols" class="main-grid" :x-gap="isMobile ? 0 : 28">
                <n-gi v-if="showSideMargin" span="1">
                  <div class="side-ad glass-module" v-if="showAd">
                    <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
                      data-ad-format="auto" data-full-width-responsive="true"></ins>
                  </div>
                </n-gi>
                
                <n-gi :span="!showSideMargin ? gridMaxCols : (gridMaxCols - 2)">
                  <div class="main-content">
                    <div class="sticky-header-wrapper glass-module-header">
                      <Header class="app-header" />
                    </div>
                    
                    <div class="router-container">
                      <router-view v-slot="{ Component }">
                        <transition name="page-fade" mode="out-in">
                          <component :is="Component" />
                        </transition>
                      </router-view>
                    </div>

                    <div class="footer-wrapper glass-module-footer">
                      <Footer class="app-footer" />
                    </div>
                  </div>
                </n-gi>
                
                <n-gi v-if="showSideMargin" span="1">
                  <div class="side-ad glass-module" v-if="showAd">
                    <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
                      data-ad-format="auto" data-full-width-responsive="true"></ins>
                  </div>
                </n-gi>
              </n-grid>
            </div>

            <n-back-top :bottom="50" :right="30" class="glass-module-icon" />
          </n-message-provider>
        </n-notification-provider>
      </n-spin>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<style>
/* === 1. 全局环境与背景 === */
:root {
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  --glass-shadow-hover: 0 16px 48px 0 rgba(31, 38, 135, 0.15);
  --glass-border-light: rgba(255, 255, 255, 0.5);
  --glass-border-dark: rgba(255, 255, 255, 0.1);
  --primary-gradient: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  /* 极光渐变背景 */
  background: 
    radial-gradient(at 0% 0%, rgba(67, 97, 238, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(76, 201, 240, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(247, 37, 133, 0.08) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(114, 9, 183, 0.08) 0px, transparent 50%),
    linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  background-attachment: fixed;
  background-size: cover;
  min-height: 100vh;
  color: #2d3436;
  overflow-x: hidden;
}

[data-theme='dark'] body {
  background: 
    radial-gradient(at 0% 0%, rgba(67, 97, 238, 0.1) 0px, transparent 50%),
    linear-gradient(135deg, #0f0f13 0%, #1a1a20 100%);
  color: #f0f0f0;
}

/* 噪点纹理 - 增加高级感 */
.noise-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* === 2. 深度模块化美化 (Modular Beautification) === */

/* 通用玻璃模块基础类 */
.glass-module, 
.n-card, 
.n-modal, 
.n-drawer,
.glass-panel {
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  background-clip: padding-box !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: var(--glass-shadow) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

/* 悬停浮动效果 - 增加交互感 */
.n-card:not(.n-card--bordered):hover,
.glass-module:hover,
.glass-panel:hover {
  transform: translateY(-4px);
  box-shadow: var(--glass-shadow-hover) !important;
  border-color: rgba(255, 255, 255, 0.8) !important;
}

/* 深色模式适配 */
[data-theme='dark'] .glass-module, 
[data-theme='dark'] .n-card {
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
}

/* 顶部导航 - 独立胶囊模块 */
.glass-module-header {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border-radius: 20px;
  margin-bottom: 24px;
}
[data-theme='dark'] .glass-module-header {
  background: rgba(30, 30, 35, 0.7);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 底部页脚 - 悬浮胶囊 */
.glass-module-footer {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  border-radius: 16px;
  transition: transform 0.3s ease;
}
.glass-module-footer:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.6);
}
[data-theme='dark'] .glass-module-footer {
  background: rgba(30, 30, 35, 0.4);
  border-color: rgba(255, 255, 255, 0.05);
}

/* 按钮 - 现代渐变与阴影 */
.n-button--primary-type {
  background: var(--primary-gradient) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
}
.n-button:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}
.n-button:active {
  transform: translateY(0);
}

/* 标签页 (Tabs) - 胶囊式切换 */
.n-tabs .n-tabs-nav--card-type .n-tabs-tab {
  border: none !important;
  background: transparent !important;
  position: relative;
  transition: all 0.3s ease !important;
  color: #666;
}
.n-tabs .n-tabs-nav--card-type .n-tabs-tab--active {
  background: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
  color: #4361ee !important;
  font-weight: bold;
  border-radius: 10px !important;
}
[data-theme='dark'] .n-tabs .n-tabs-nav--card-type .n-tabs-tab--active {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}

/* 输入框 - 融入背景 */
.n-input .n-input-wrapper {
  background: rgba(255, 255, 255, 0.4);
}
[data-theme='dark'] .n-input .n-input-wrapper {
  background: rgba(0, 0, 0, 0.2);
}

/* 表格 - 去除杂乱背景，强调内容 */
.n-data-table {
  background: transparent !important;
}
.n-data-table th {
  background: rgba(255, 255, 255, 0.3) !important;
  font-weight: 600;
}
[data-theme='dark'] .n-data-table th {
  background: rgba(255, 255, 255, 0.05) !important;
}
.n-data-table td {
  background: transparent !important;
}

/* 滚动条微调 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
::-webkit-scrollbar-track {
  background: transparent;
}

/* === 开屏动画 === */
.splash-screen {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(50px);
  display: flex;
  justify-content: center;
  align-items: center;
}
[data-theme='dark'] .splash-screen {
  background: rgba(0, 0, 0, 0.5);
}
.splash-content {
  display: flex; flex-direction: column; align-items: center; gap: 32px;
}
.splash-logo {
  width: 90px; height: 90px;
  border-radius: 22px;
  box-shadow: 0 15px 35px rgba(67, 97, 238, 0.25);
  animation: float 3s ease-in-out infinite;
}
.splash-loader {
  width: 50px; height: 3px;
  background: rgba(67, 97, 238, 0.1);
  border-radius: 2px;
  position: relative; overflow: hidden;
}
.splash-loader::after {
  content: ''; position: absolute; top: 0; left: 0; height: 100%; width: 100%;
  background: #4361ee;
  transform: translateX(-100%);
  animation: loading 1.5s infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes loading {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); }
  100% { transform: translateX(100%); }
}
.splash-leave-active {
  transition: opacity 0.6s ease, filter 0.6s ease;
}
.splash-leave-to {
  opacity: 0;
  filter: blur(10px);
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  width: 100%;
  position: relative;
  z-index: 1;
}

.main-grid {
  max-width: 1300px;
  margin: 0 auto;
  min-height: 100vh;
}

.main-content {
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  min-height: 100vh;
}

.sticky-header-wrapper {
  position: sticky;
  top: 16px;
  z-index: 100;
  padding: 12px 24px;
  margin-top: 16px;
}

.router-container {
  flex: 1;
  width: 100%;
  margin-top: 20px;
  padding-bottom: 40px;
}

.footer-wrapper {
  margin-top: auto;
  margin-bottom: 24px;
  padding: 12px 24px;
  width: fit-content;
  align-self: center;
}

.side-ad {
  height: calc(100vh - 40px);
  margin-top: 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 600px) {
  .main-content {
    padding: 0 12px;
  }
  .sticky-header-wrapper {
    top: 8px;
    margin-top: 8px;
    padding: 10px 16px;
    border-radius: 16px;
  }
}
</style>
