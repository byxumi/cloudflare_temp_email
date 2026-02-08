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

// [UI 美化] 全局主题覆盖配置
const themeOverrides = computed(() => {
  const isDarkTheme = isDark.value;
  
  // === 关键修改：去除毛玻璃后，背景需要更“实” ===
  // 浅色模式：纯白或极高不透明度白色，保证清新整洁
  // 深色模式：深灰黑色，保证与多彩背景的隔离感
  
  const baseBgColor = isDarkTheme ? '#1e1e24' : '#ffffff';
  
  // 容器背景色 (Card, Modal 等)
  // 如果想要一点点透出的感觉，可以给极高的 alpha (如 0.95)，否则建议 1.0
  const containerBg = isDarkTheme 
    ? 'rgba(30, 30, 36, 0.96)'  // 深色模式卡片背景
    : 'rgba(255, 255, 255, 0.95)'; // 浅色模式卡片背景
    
  // 悬停态背景
  const containerBgHover = isDarkTheme 
    ? '#25252b' 
    : '#f9f9f9';

  // 边框颜色
  const borderColor = isDarkTheme
    ? 'rgba(255, 255, 255, 0.08)' // 深色模式微弱边框
    : 'rgba(0, 0, 0, 0.06)';      // 浅色模式微弱边框

  // 现代配色方案
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
      
      borderRadius: '12px', // 稍微减小一点圆角，显得更干练（可选）
      borderRadiusSmall: '8px',
      fontFamily: '"Inter", "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif',
      
      bodyColor: transparent,
      cardColor: containerBg,
      modalColor: isDarkTheme ? '#2a2a30' : '#ffffff', // 弹窗建议纯色，防止叠加太乱
      popoverColor: isDarkTheme ? '#2a2a30' : '#ffffff',
      tableColor: transparent,
      // 表头颜色
      tableHeaderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : '#f7f9fc', 
      inputColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
    },
    LoadingBar: {
      colorLoading: primaryColor,
      colorError: errorColor,
      height: '3px'
    },
    Card: {
      borderRadius: '16px',
      color: containerBg,
      borderColor: borderColor,
      // 实体卡片阴影
      boxShadow: isDarkTheme 
        ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
        : '0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)'
    },
    Modal: {
      color: isDarkTheme ? '#2a2a30' : '#ffffff',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
      borderColor: borderColor,
      borderRadius: '20px'
    },
    Dialog: {
      color: isDarkTheme ? '#2a2a30' : '#ffffff',
      borderRadius: '16px',
      borderColor: borderColor
    },
    DataTable: {
      thColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : '#f7f9fc',
      tdColor: transparent,
      tdColorHover: isDarkTheme ? 'rgba(255, 255, 255, 0.04)' : '#f0f5ff',
      borderColor: borderColor,
      borderRadius: '12px'
    },
    Input: {
      color: isDarkTheme ? '#151518' : '#ffffff', // 输入框背景更深/更亮
      colorFocus: isDarkTheme ? '#151518' : '#ffffff',
      border: `1px solid ${borderColor}`,
      borderRadius: '10px',
      textColor: isDarkTheme ? '#e0e0e0' : '#333',
    },
    Select: {
      peers: {
        InternalSelection: {
          color: isDarkTheme ? '#151518' : '#ffffff',
          border: `1px solid ${borderColor}`,
          borderRadius: '10px',
          textColor: isDarkTheme ? '#e0e0e0' : '#333',
        },
        InternalSelectMenu: {
          color: isDarkTheme ? '#2a2a30' : '#ffffff',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
          optionColorHover: isDarkTheme ? '#3e3e45' : '#f0f5ff',
          padding: '6px',
          borderRadius: '12px'
        }
      }
    },
    Dropdown: {
      color: isDarkTheme ? '#2a2a30' : '#ffffff',
      optionColorHover: isDarkTheme ? '#3e3e45' : '#f0f5ff',
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
      // 按钮阴影
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      boxShadowHover: '0 4px 10px rgba(0, 0, 0, 0.1)',
      boxShadowPressed: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    Statistic: {
      labelFontWeight: '500'
    },
    Pagination: {
      itemColor: transparent,
      itemColorHover: isDarkTheme ? '#3e3e45' : '#f0f5ff',
      itemColorActive: isDarkTheme ? '#3e3e45' : '#f0f5ff',
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
  
  /* 蓝粉渐变背景 - 浅色模式 */
  background: linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 50%, #FF9A9E 100%);
  background-attachment: fixed;
  background-size: cover;
  
  letter-spacing: 0.01em;
  color: #333;
  overflow-x: hidden;
  width: 100%;
  min-height: 100vh;
}

/* 深色模式背景 - 优化后的午夜渐变 */
[data-theme='dark'] body {
  background: linear-gradient(135deg, #121216 0%, #1a1a24 50%, #251e36 100%);
  color: #e0e0e0;
}

/* === 开屏动画样式 === */
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  /* 去除毛玻璃，改为高不透明度背景 */
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
}
[data-theme='dark'] .splash-screen {
  background: rgba(20, 20, 25, 0.95);
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

/* === 全局组件样式优化 (已移除 backdrop-filter) === */

/* 卡片悬停微动效 */
.n-card:hover {
  transform: translateY(-2px);
  /* 悬停时加深阴影 */
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08) !important;
}
[data-theme='dark'] .n-card:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5) !important;
}

/* Tab 按钮样式 - 无毛玻璃版 */
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  border-bottom: none !important;
  margin-right: 6px !important;
  border-radius: 10px 10px 0 0 !important;
  transition: all 0.3s ease !important;
  font-weight: 500;
  opacity: 0.9;
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover {
  background-color: #ffffff !important;
  opacity: 1;
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: #ffffff !important;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.02);
  font-weight: 600;
  opacity: 1;
  color: #3a86ff !important;
}

/* 深色模式下的 Tab */
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: #202025 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #aaa;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover {
  background-color: #2a2a30 !important;
  color: #ddd;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: #303036 !important;
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

/* 背景覆盖层 (可保留用于微调全局色调，也可移除) */
.bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 深色模式下，如果不想要太花的背景，可以用这个层压暗 */
:deep(.n-config-provider--theme-dark) .bg-overlay {
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
  /* 头部背景：高不透明度 */
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  max-width: 100%;
  box-sizing: border-box;
}

:deep(.n-config-provider--theme-dark) .sticky-header-wrapper {
  background: rgba(30, 30, 36, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
  /* 底部背景：高不透明度 */
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  text-align: center;
  align-self: center;
  width: fit-content;
  min-width: auto;
  max-width: 100%;
  box-sizing: border-box;
  transition: transform 0.2s;
}

.floating-footer-wrapper:hover {
  background: #ffffff;
  transform: translateY(-2px);
}

:deep(.n-config-provider--theme-dark) .floating-footer-wrapper {
  background: rgba(30, 30, 36, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:deep(.n-config-provider--theme-dark) .floating-footer-wrapper:hover {
  background: #25252b;
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
