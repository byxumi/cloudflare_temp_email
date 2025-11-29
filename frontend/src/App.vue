<script setup>
import { darkTheme, NGlobalStyle, zhCN } from 'naive-ui'
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
const localeConfig = computed(() => locale.value == 'zh' ? zhCN : null)
const isMobile = useIsMobile()
const showSideMargin = computed(() => !isMobile.value && useSideMargin.value);
const showAd = computed(() => !isMobile.value && adClient && adSlot);
const gridMaxCols = computed(() => showAd.value ? 8 : 12);

// 动态栅格间距
const xGap = computed(() => isMobile.value ? 0 : 24);

const showSplash = ref(true)

// [UI 美化] 终极版主题配置
const themeOverrides = computed(() => {
  // === 亮色模式配置 ===
  const lightAlpha = 0.72;
  const lightBg = `rgba(255, 255, 255, ${lightAlpha})`;
  const lightBorder = 'rgba(255, 255, 255, 0.6)';
  
  // === [美化] 暗色模式深度调优 ===
  // 使用略带冷色调的深灰，而不是纯黑，提升质感
  const darkBg = 'rgba(20, 21, 26, 0.65)'; 
  const darkBgHover = 'rgba(30, 32, 38, 0.75)';
  // 增强暗色模式下的边框亮度，形成“玻璃边缘”的光泽感
  const darkBorder = 'rgba(255, 255, 255, 0.12)';
  
  const glassBg = isDark.value ? darkBg : lightBg;
  const glassBgHover = isDark.value ? darkBgHover : `rgba(255, 255, 255, ${lightAlpha + 0.15})`;
  const glassBorder = isDark.value ? darkBorder : lightBorder;

  const primaryColor = '#2080f0';
  const transparent = 'transparent';

  return {
    common: {
      primaryColor: primaryColor,
      primaryColorHover: '#4098fc',
      primaryColorPressed: '#1060c9',
      borderRadius: '16px',
      borderRadiusSmall: '8px',
      fontFamily: '"Inter", "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif',
      
      bodyColor: transparent,
      cardColor: glassBg,
      modalColor: glassBg,
      popoverColor: glassBg,
      tableColor: transparent,
      // 表头颜色：暗色模式下稍微亮一点点，区分内容
      tableHeaderColor: isDark.value ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)', 
      // 文字颜色：暗色模式使用灰白色，不刺眼
      textColorBase: isDark.value ? '#E0E0E0' : '#333639',
      inputColor: isDark.value ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.5)',
    },
    LoadingBar: {
      colorLoading: primaryColor,
      colorError: '#d03050',
      height: '3px'
    },
    Card: {
      borderRadius: '20px',
      color: glassBg,
      borderColor: glassBorder,
      // 暗色模式阴影加深，亮色模式阴影柔和
      boxShadow: isDark.value 
        ? '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)' 
        : '0 8px 32px rgba(31, 38, 135, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.4)'
    },
    Modal: {
      color: glassBg,
      boxShadow: isDark.value 
        ? '0 20px 60px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
        : '0 20px 50px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.4)',
      borderColor: glassBorder,
      borderRadius: '24px'
    },
    Dialog: {
      color: glassBg,
      borderRadius: '20px',
      borderColor: glassBorder
    },
    DataTable: {
      color: transparent,
      thColor: isDark.value ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.02)',
      tdColor: transparent,
      tdColorHover: isDark.value ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.3)',
      borderColor: glassBorder,
      borderRadius: '12px'
    },
    Input: {
      // 输入框背景：暗色模式下深色半透明
      color: isDark.value ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.5)',
      colorFocus: isDark.value ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)',
      border: `1px solid ${glassBorder}`,
      borderRadius: '12px',
      // 聚焦时光晕
      boxShadowFocus: isDark.value ? `0 0 0 2px rgba(32, 128, 240, 0.3)` : `0 0 0 2px rgba(32, 128, 240, 0.2)`
    },
    Select: {
      peers: {
        InternalSelection: {
          color: isDark.value ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.5)',
          border: `1px solid ${glassBorder}`,
          borderRadius: '12px',
        },
        InternalSelectMenu: {
          color: isDark.value ? 'rgba(30, 32, 38, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          optionColorHover: glassBgHover,
          padding: '6px',
          borderRadius: '16px',
          backdropFilter: 'blur(16px)'
        }
      }
    },
    Dropdown: {
      color: isDark.value ? 'rgba(30, 32, 38, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      optionColorHover: glassBgHover,
      borderRadius: '12px'
    },
    Layout: {
      color: transparent,
      headerColor: transparent,
      footerColor: transparent,
      siderColor: transparent
    },
    Tabs: {
      tabBorderRadius: '12px',
      panePadding: '24px',
      tabColor: transparent,
      tabBorderColor: transparent
    },
    Button: {
      fontWeight: '600',
      borderRadiusMedium: '12px',
      borderRadiusLarge: '14px',
    },
    Pagination: {
      itemColor: transparent,
      itemColorHover: glassBgHover,
      itemColorActive: glassBgHover,
      itemBorder: `1px solid ${glassBorder}`,
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
  <n-config-provider :locale="localeConfig" :theme="theme" :theme-overrides="themeOverrides">
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

              <n-grid :x-gap="xGap" :cols="gridMaxCols" class="main-grid">
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
/* === 1. 全局基础设置 === */
body {
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  /* [修改] 您的新背景图链接 */
  background: url('https://t.alcy.cc/ycy') no-repeat center center fixed;
  background-size: cover;
  background-attachment: fixed;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
  width: 100%; 
  overflow-x: hidden;
}

/* ... (滚动条样式保持不变) ... */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(150, 150, 150, 0.2);
  border-radius: 3px;
  backdrop-filter: blur(4px);
  transition: background 0.3s;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(150, 150, 150, 0.5);
}

.n-switch {
  margin-left: 10px;
  margin-right: 10px;
}

/* === 2. 玻璃拟态核心样式 === */
.n-card, 
.n-modal, 
.n-drawer, 
.n-dialog,
.n-popover,
.n-dropdown-menu,
.n-select-menu {
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  max-width: 100% !important;
  box-sizing: border-box;
}

.n-card:hover {
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.2) !important;
}

/* [美化] 暗色模式组件样式 */
[data-theme='dark'] .n-card,
[data-theme='dark'] .n-modal,
[data-theme='dark'] .n-dialog,
[data-theme='dark'] .n-popover {
  /* 边框更亮一点，模拟玻璃反光 */
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  /* 阴影更重，增加立体感 */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6) !important;
}

/* Tab Pane */
.n-tabs .n-tab-pane {
  background-color: rgba(255, 255, 255, 0.65) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-radius: 16px !important;
  margin-top: 12px;
  padding: 24px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  max-width: 100%;
  overflow-x: hidden; 
}
/* [美化] 暗色模式 Tab Pane */
[data-theme='dark'] .n-tabs .n-tab-pane {
  background-color: rgba(20, 21, 26, 0.65) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

/* Tab Buttons */
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: rgba(255, 255, 255, 0.35) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-bottom: none !important;
  margin-right: 8px !important;
  border-radius: 12px 12px 0 0 !important;
  transition: all 0.2s ease !important;
  font-weight: 500;
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover {
  background-color: rgba(255, 255, 255, 0.55) !important;
  transform: translateY(-2px);
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: rgba(255, 255, 255, 0.85) !important;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
  transform: translateY(0);
  font-weight: 600;
}

/* [美化] 暗色模式 Tab 按钮 */
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: rgba(30, 32, 38, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover {
  background-color: rgba(45, 48, 55, 0.7) !important;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: rgba(40, 42, 48, 0.9) !important;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
}

.n-button:active {
  transform: scale(0.96);
}
.n-button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.n-data-table, .n-data-table .n-data-table-th, .n-data-table .n-data-table-td,
.n-list, .n-list .n-list-item,
.n-layout, .n-layout-header, .n-layout-footer, .n-layout-sider {
  background-color: transparent !important;
}
.n-input .n-input-wrapper {
  backdrop-filter: blur(8px);
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow-x: hidden;
}

.bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  pointer-events: none;
  z-index: 0;
  transition: background 0.3s ease;
}

/* [美化] 暗色模式下的背景遮罩 */
:deep(.n-config-provider--theme-dark) .bg-overlay {
  background: rgba(0, 0, 0, 0.65); /* 稍微加深遮罩，保证内容清晰 */
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
  padding: 0 16px;
  width: 100%;
  box-sizing: border-box; 
}

.sticky-header-wrapper {
  position: sticky;
  top: 20px;
  z-index: 100;
  margin: 0 0 24px 0;
  padding: 12px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  max-width: 100%;
  box-sizing: border-box;
}

/* [美化] 暗色模式 Header */
:deep(.n-config-provider--theme-dark) .sticky-header-wrapper {
  background: rgba(30, 32, 38, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
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
  overflow-x: hidden;
}

.floating-footer-wrapper {
  margin-top: auto;
  margin-bottom: 20px;
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  align-self: center;
  width: fit-content;
  min-width: auto;
  max-width: 100%;
  box-sizing: border-box;
}

/* [美化] 暗色模式 Footer */
:deep(.n-config-provider--theme-dark) .floating-footer-wrapper {
  background: rgba(30, 32, 38, 0.5);
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

/* ... (保留动画部分) ... */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

/* 开屏动画部分保持不变 */
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(60px) saturate(160%);
  -webkit-backdrop-filter: blur(60px) saturate(160%);
  display: flex;
  justify-content: center;
  align-items: center;
}
[data-theme='dark'] .splash-screen {
  background: rgba(0, 0, 0, 0.6);
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
  background: rgba(32, 128, 240, 0.2);
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
  background: #2080f0;
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
</style>
