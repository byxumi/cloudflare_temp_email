<script setup>
import { darkTheme, NGlobalStyle, zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'
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

// [UI 修复] 全局主题覆盖配置 - 纯净实色版
const themeOverrides = computed(() => {
  const isDarkTheme = isDark.value;
  
  // === 核心修复 ===
  // 暗色模式：使用纯实色背景 (#18181c)，防止背景透视造成视觉干扰
  // 浅色模式：纯白色 (#ffffff)
  const containerBg = isDarkTheme ? '#18181c' : '#ffffff';
  
  // 弹窗背景：暗色模式下稍微亮一点，区分层级
  const modalBg = isDarkTheme ? '#202024' : '#ffffff';
  
  // 边框颜色：暗色模式下稍微明显一点，勾勒轮廓
  const borderColor = isDarkTheme ? 'rgba(255, 255, 255, 0.12)' : '#eaocf0'; // 浅色可用淡紫/灰边框

  // 品牌色
  const primaryColor = '#3a86ff'; 
  const primaryColorHover = '#5c9aff';
  const primaryColorPressed = '#2a6fd9';
  const successColor = '#06d6a0'; 
  const warningColor = '#ffd166'; 
  const errorColor = '#ef476f';   

  const transparent = 'transparent';

  return {
    common: {
      primaryColor: primaryColor,
      primaryColorHover: primaryColorHover,
      primaryColorPressed: primaryColorPressed,
      successColor: successColor,
      warningColor: warningColor,
      errorColor: errorColor,
      
      borderRadius: '12px', 
      borderRadiusSmall: '8px',
      fontFamily: '"Inter", "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif',
      
      bodyColor: transparent,
      
      // [修复] 强制使用不透明背景
      cardColor: containerBg,
      modalColor: modalBg,
      popoverColor: modalBg,
      
      tableColor: transparent,
      tableHeaderColor: isDarkTheme ? '#1f1f23' : '#f8f9fa', 
      inputColor: isDarkTheme ? '#101014' : '#f2f3f5', // 输入框背景要比卡片深(暗色)或深灰(浅色)
      
      // [修复] 确保文字颜色对比度充足
      textColorBase: isDarkTheme ? '#e6e6e6' : '#333333',
      textColor1: isDarkTheme ? '#e6e6e6' : '#333333',
      textColor2: isDarkTheme ? '#c0c0c0' : '#666666',
    },
    LoadingBar: {
      colorLoading: primaryColor,
      colorError: errorColor,
      height: '3px'
    },
    Card: {
      borderRadius: '16px',
      color: containerBg,
      borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      // 移除复杂的内部阴影，使用干净的外部阴影
      boxShadow: isDarkTheme 
        ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
        : '0 4px 12px rgba(0, 0, 0, 0.05)'
    },
    Modal: {
      color: modalBg,
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
      borderColor: borderColor,
      borderRadius: '20px'
    },
    Dialog: {
      color: modalBg,
      borderRadius: '16px',
      borderColor: borderColor
    },
    DataTable: {
      thColor: isDarkTheme ? '#1f1f23' : '#fafafc',
      tdColor: containerBg,
      tdColorHover: isDarkTheme ? '#26262a' : '#f0f5ff',
      borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: '12px'
    },
    Input: {
      color: isDarkTheme ? '#101014' : '#ffffff', 
      colorFocus: isDarkTheme ? '#101014' : '#ffffff',
      // 输入框边框
      border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0'}`,
      borderRadius: '10px',
      textColor: isDarkTheme ? '#ffffff' : '#333',
    },
    Select: {
      peers: {
        InternalSelection: {
          color: isDarkTheme ? '#101014' : '#ffffff',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0'}`,
          borderRadius: '10px',
          textColor: isDarkTheme ? '#ffffff' : '#333',
        },
        InternalSelectMenu: {
          color: modalBg,
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
          optionColorHover: isDarkTheme ? '#2a2a2e' : '#f0f5ff',
          padding: '6px',
          borderRadius: '12px'
        }
      }
    },
    Dropdown: {
      color: modalBg,
      optionColorHover: isDarkTheme ? '#2a2a2e' : '#f0f5ff',
      borderRadius: '12px'
    },
    Layout: {
      color: transparent,
      headerColor: transparent,
      footerColor: transparent,
      siderColor: transparent
    },
    Tabs: {
      tabBorderRadius: '10px',
      panePadding: '20px 0 0 0',
      tabColor: transparent,
      tabBorderColor: transparent
    },
    Button: {
      fontWeight: '600',
      borderRadiusMedium: '10px',
      borderRadiusLarge: '12px',
      // 按钮保持微弱阴影
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
      boxShadowHover: '0 4px 10px rgba(0, 0, 0, 0.15)',
      boxShadowPressed: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    Statistic: {
      labelFontWeight: '500'
    },
    Pagination: {
      itemColor: transparent,
      itemColorHover: isDarkTheme ? '#2a2a2e' : '#f0f5ff',
      itemColorActive: isDarkTheme ? '#2a2a2e' : '#f0f5ff',
      itemBorder: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0'}`,
      itemBorderRadius: '8px'
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
      
      <n-spin description="loading..." :show="loading">
        <n-notification-provider container-style="margin-top: 60px;">
          <n-message-provider container-style="margin-top: 20px;">
            
            <div class="app-container">
              <div class="bg-overlay"></div>

              <n-grid :cols="gridMaxCols" class="main-grid" :x-gap="isMobile ? 0 : 24">
                <n-gi v-if="showSideMargin" span="1">
                  <div class="side-ad" v-if="showAd">
                    <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
                      data-ad-format="auto" data-full-width-responsive="true"></ins>
                  </div>
                </n-gi>
                
                <n-gi :span="!showSideMargin ? gridMaxCols : (gridMaxCols - 2)">
                  <div class="main-content">
                    <div class="sticky-header-wrapper">
                      <Header class="app-header" />
                    </div>
                    
                    <div class="router-container">
                      <router-view v-slot="{ Component }">
                        <transition name="fade" mode="out-in">
                          <component :is="Component" />
                        </transition>
                      </router-view>
                    </div>

                    <div class="floating-footer-wrapper">
                      <Footer class="app-footer" />
                    </div>
                  </div>
                </n-gi>
                
                <n-gi v-if="showSideMargin" span="1">
                  <div class="side-ad" v-if="showAd">
                    <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
                      data-ad-format="auto" data-full-width-responsive="true"></ins>
                  </div>
                </n-gi>
              </n-grid>
            </div>

            <n-back-top :bottom="50" :right="30" />
          </n-message-provider>
        </n-notification-provider>
      </n-spin>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<style>
/* === 1. 全局基础与背景设置 === */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  
  /* 浅色模式：清新的蓝粉渐变 */
  background: linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 50%, #FF9A9E 100%);
  background-attachment: fixed;
  background-size: cover;
  
  letter-spacing: 0.01em;
  color: #333;
  overflow-x: hidden;
  width: 100%;
  min-height: 100vh;
}

/* 深色模式：深邃的午夜紫/蓝背景，与前景卡片形成高对比 */
[data-theme='dark'] body {
  background: linear-gradient(135deg, #0b0c15 0%, #16122b 50%, #241038 100%);
  color: #e6e6e6;
}

/* === 开屏动画样式 === */
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  /* 纯色背景，防止开屏时显得杂乱 */
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
}
[data-theme='dark'] .splash-screen {
  background: #18181c;
}
.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}
.splash-logo {
  width: 100px;
  height: 100px;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
  animation: logo-pulse 2s ease-in-out infinite;
}
.splash-loader {
  width: 60px;
  height: 4px;
  background: rgba(58, 134, 255, 0.2);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}
.splash-loader::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: #3a86ff;
  transform: translateX(-100%);
  animation: loader-finish 1.5s ease-in-out infinite;
  border-radius: 2px;
}
@keyframes logo-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes loader-finish {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); }
  100% { transform: translateX(100%); }
}
.splash-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.splash-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

/* === 滚动条美化 === */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  transition: background 0.3s;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
[data-theme='dark'] ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}
[data-theme='dark'] ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.n-switch {
  margin-left: 10px;
  margin-right: 10px;
}

/* === 全局组件样式优化 (无毛玻璃版) === */

/* 卡片样式 */
.n-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.n-card:hover {
  transform: translateY(-2px);
  /* 悬停加深阴影 */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
}
[data-theme='dark'] .n-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
}

/* Tab 按钮样式 - 扁平化处理 */
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: #f5f5f7 !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  border-bottom: none !important;
  margin-right: 6px !important;
  border-radius: 10px 10px 0 0 !important;
  transition: all 0.3s ease !important;
  font-weight: 500;
  opacity: 1;
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover {
  background-color: #e8e8ed !important;
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: #ffffff !important;
  box-shadow: 0 -2px 6px rgba(0,0,0,0.03);
  font-weight: 600;
  color: #3a86ff !important;
  border-top: 2px solid #3a86ff !important; /* 顶部高亮条 */
}

/* 深色模式下的 Tab */
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: #25252a !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #aaa;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover {
  background-color: #2e2e33 !important;
  color: #ddd;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: #18181c !important; /* 与卡片背景一致 */
  color: #fff !important;
  border-bottom: none !important;
  border-top: 2px solid #3a86ff !important;
}

/* 按钮微动效 */
.n-button {
  transition: all 0.2s !important;
}
.n-button:hover {
  transform: translateY(-1px);
}
.n-button:active {
  transform: translateY(0) scale(0.98);
}

/* 输入框聚焦时的光晕效果 */
.n-input--focus {
  box-shadow: 0 0 0 3px rgba(58, 134, 255, 0.25);
  border-color: #3a86ff !important;
}

/* 去除部分组件的默认背景 */
.n-data-table, .n-data-table .n-data-table-th, .n-data-table .n-data-table-td,
.n-list, .n-list .n-list-item,
.n-layout, .n-layout-header, .n-layout-footer, .n-layout-sider {
  background-color: transparent !important;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  width: 100%;
  position: relative;
}

/* 背景覆盖层 - 仅用于在深色模式下压暗一点点全局，防止背景过曝 */
.bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

:deep(.n-config-provider--theme-dark) .bg-overlay {
  background-color: rgba(0, 0, 0, 0.3);
}

.main-grid {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  max-width: 1440px; 
  width: 100%;
  margin: 0 auto;
}

.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 24px; 
  width: 100%;
  box-sizing: border-box;
}

/* 移动端适配 */
@media (max-width: 600px) {
  .main-content {
    padding: 0 12px;
  }
}

.sticky-header-wrapper {
  position: sticky;
  top: 20px;
  z-index: 100;
  margin: 0 0 24px 0;
  padding: 12px 24px;
  border-radius: 20px;
  /* 头部背景：纯色，带轻微阴影 */
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  max-width: 100%;
  box-sizing: border-box;
}

:deep(.n-config-provider--theme-dark) .sticky-header-wrapper {
  background: #18181c;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.app-header {
  margin-bottom: 0; 
}

.router-container {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding-top: 10px;
  padding-bottom: 40px;
  overflow-x: visible; 
}

.floating-footer-wrapper {
  margin-top: auto;
  margin-bottom: 20px;
  padding: 10px 24px;
  /* 底部背景 */
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
  align-self: center;
  width: fit-content;
  min-width: auto;
  max-width: 100%;
  box-sizing: border-box;
  transition: transform 0.2s;
}

.floating-footer-wrapper:hover {
  transform: translateY(-2px);
}

:deep(.n-config-provider--theme-dark) .floating-footer-wrapper {
  background: #18181c;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.app-footer {
  padding-bottom: 0;
}

.side-ad {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 路由切换淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
