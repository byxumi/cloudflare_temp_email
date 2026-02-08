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

// [UI 深度美化] 全局主题覆盖配置
const themeOverrides = computed(() => {
  const isDarkTheme = isDark.value;
  
  // === 核心配色逻辑 ===
  // 浅色模式：高透白玻璃 (0.65)
  // 深色模式：深邃黑透玻璃 (0.6) - 关键点：不能太黑，要透出背景的紫色
  const glassAlpha = isDarkTheme ? 0.6 : 0.65;
  
  // 卡片背景色
  const cardBg = isDarkTheme 
    ? `rgba(20, 20, 25, ${glassAlpha})` 
    : `rgba(255, 255, 255, ${glassAlpha})`;
    
  // 悬停加深
  const cardBgHover = isDarkTheme 
    ? `rgba(30, 30, 35, ${glassAlpha + 0.1})` 
    : `rgba(255, 255, 255, ${glassAlpha + 0.15})`;

  // 边框高光：暗色模式下需要明显的白色微光边框来勾勒轮廓
  const borderColor = isDarkTheme
    ? 'rgba(255, 255, 255, 0.12)' 
    : 'rgba(255, 255, 255, 0.5)';

  // 品牌色 - 保持鲜亮
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
      
      borderRadius: '16px', 
      borderRadiusSmall: '10px',
      fontFamily: '"Inter", "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif',
      
      // 让基础组件背景透明，依赖 CSS 的 backdrop-filter 产生模糊
      bodyColor: transparent,
      cardColor: cardBg,
      // 弹窗稍微实一点，防止层级混乱
      modalColor: isDarkTheme ? 'rgba(25, 25, 30, 0.8)' : 'rgba(255, 255, 255, 0.85)',
      popoverColor: cardBg,
      
      tableColor: transparent,
      tableHeaderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.4)', 
      inputColor: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)',
      
      textColorBase: isDarkTheme ? '#f2f2f2' : '#333',
    },
    LoadingBar: {
      colorLoading: primaryColor,
      colorError: errorColor,
      height: '3px'
    },
    Card: {
      borderRadius: '20px',
      color: cardBg,
      borderColor: borderColor,
      // 玻璃质感阴影：暗色模式下增加一点辉光
      boxShadow: isDarkTheme 
        ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)' 
        : '0 8px 32px rgba(31, 38, 135, 0.07), inset 0 0 0 1px rgba(255, 255, 255, 0.4)'
    },
    Modal: {
      color: isDarkTheme ? 'rgba(30, 30, 35, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      borderColor: borderColor,
      borderRadius: '24px'
    },
    Dialog: {
      color: cardBg,
      borderRadius: '20px',
      borderColor: borderColor
    },
    DataTable: {
      thColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.4)',
      tdColor: transparent,
      tdColorHover: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)',
      borderColor: borderColor,
      borderRadius: '12px'
    },
    Input: {
      color: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)',
      colorFocus: isDarkTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)',
      border: `1px solid ${borderColor}`,
      borderRadius: '12px',
      textColor: isDarkTheme ? '#fff' : '#333',
    },
    Select: {
      peers: {
        InternalSelection: {
          color: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)',
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          textColor: isDarkTheme ? '#fff' : '#333',
        },
        InternalSelectMenu: {
          color: isDarkTheme ? 'rgba(30, 30, 35, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          optionColorHover: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          padding: '6px',
          borderRadius: '16px'
        }
      }
    },
    Dropdown: {
      color: isDarkTheme ? 'rgba(30, 30, 35, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      optionColorHover: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: '16px'
    },
    Layout: {
      color: transparent,
      headerColor: transparent,
      footerColor: transparent,
      siderColor: transparent
    },
    Tabs: {
      tabBorderRadius: '12px',
      panePadding: '20px 0 0 0',
      tabColor: transparent,
      tabBorderColor: transparent
    },
    Button: {
      fontWeight: '600',
      borderRadiusMedium: '12px',
      borderRadiusLarge: '14px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
      boxShadowHover: '0 6px 16px rgba(0, 0, 0, 0.12)',
      boxShadowPressed: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    Statistic: {
      labelFontWeight: '500'
    },
    Pagination: {
      itemColor: transparent,
      itemColorHover: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
      itemColorActive: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
      itemBorder: `1px solid ${borderColor}`,
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
  
  /* 浅色模式：保留您喜欢的清新蓝粉渐变 */
  /* Blue -> Purple -> Pink */
  background: linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 50%, #FF9A9E 100%);
  background-attachment: fixed;
  background-size: cover;
  
  letter-spacing: 0.01em;
  color: #333;
  overflow-x: hidden;
  width: 100%;
  min-height: 100vh;
}

/* [核心修改] 深色模式背景 - 还原经典毛玻璃深色背景 */
/* 使用深紫蓝渐变，类似 mailjwt.xumicloud.top 的质感 */
/* 这种颜色在毛玻璃下效果最佳 */
[data-theme='dark'] body {
  /* Midnight Blue -> Deep Purple -> Dark Indigo */
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  color: #f2f2f2;
}

/* === 开屏动画样式 === */
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  /* 恢复毛玻璃开屏 */
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(40px) saturate(160%);
  -webkit-backdrop-filter: blur(40px) saturate(160%);
  display: flex;
  justify-content: center;
  align-items: center;
}
[data-theme='dark'] .splash-screen {
  background: rgba(15, 12, 41, 0.6); /* 匹配深色背景色调 */
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
  backdrop-filter: blur(0px);
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

/* === 全局组件深度样式优化 - Glassmorphism 回归 === */

/* 强制开启毛玻璃特效 - 核心 */
.n-card, 
.n-modal, 
.n-drawer, 
.n-dialog,
.n-popover,
.n-dropdown-menu,
.n-select-menu,
.glass-panel {
  /* 增加 saturate 提升背景透视的鲜艳度，这才是“好看”的关键 */
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* 卡片悬停微动效 */
.n-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px -12px rgba(31, 38, 135, 0.15) !important;
}
[data-theme='dark'] .n-card:hover {
  /* 暗色模式下，悬停阴影更深 */
  box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.5) !important;
}

/* Tab 按钮样式 - 半透明玻璃风格 */
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: rgba(255, 255, 255, 0.25) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-bottom: none !important;
  margin-right: 6px !important;
  border-radius: 12px 12px 0 0 !important;
  transition: all 0.3s ease !important;
  font-weight: 500;
  opacity: 0.85;
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover {
  background-color: rgba(255, 255, 255, 0.45) !important;
  opacity: 1;
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: rgba(255, 255, 255, 0.75) !important;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
  font-weight: 600;
  opacity: 1;
  color: #3a86ff !important;
}

/* 深色模式下的 Tab */
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #ccc;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover {
  background-color: rgba(0, 0, 0, 0.4) !important;
  color: #fff;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: rgba(50, 50, 60, 0.6) !important;
  color: #fff !important;
  border-bottom: none !important;
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
  box-shadow: 0 0 0 3px rgba(58, 134, 255, 0.2);
}

/* 去除部分组件的默认背景，防止遮挡毛玻璃 */
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

/* 背景覆盖层 - 增加纹理或微调 */
.bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(at 0% 0%, rgba(255, 255, 255, 0.5) 0px, transparent 50%),
    radial-gradient(at 90% 100%, rgba(255, 255, 255, 0.5) 0px, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

:deep(.n-config-provider--theme-dark) .bg-overlay {
  /* 深色模式下，去除白光，改为微弱的紫光增强氛围 */
  background-image: radial-gradient(at 80% 0%, rgba(120, 119, 198, 0.15) 0px, transparent 50%);
  background-color: rgba(0, 0, 0, 0.2); 
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
  /* 头部毛玻璃 */
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  max-width: 100%;
  box-sizing: border-box;
}

:deep(.n-config-provider--theme-dark) .sticky-header-wrapper {
  background: rgba(30, 30, 35, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
  /* 底部悬浮毛玻璃 */
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  text-align: center;
  align-self: center;
  width: fit-content;
  min-width: auto;
  max-width: 100%;
  box-sizing: border-box;
  transition: transform 0.2s;
}

.floating-footer-wrapper:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

:deep(.n-config-provider--theme-dark) .floating-footer-wrapper {
  background: rgba(30, 30, 35, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
