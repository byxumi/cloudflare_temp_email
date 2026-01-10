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
  
  // 基础透明度配置
  const alpha = isDarkTheme ? 0.6 : 0.65;
  const hoverAlpha = isDarkTheme ? 0.7 : 0.75;

  // 玻璃背景颜色
  const glassBg = isDarkTheme 
    ? `rgba(20, 20, 25, ${alpha})` 
    : `rgba(255, 255, 255, ${alpha})`;
  
  // 悬停/激活态玻璃背景
  const glassBgHover = isDarkTheme 
    ? `rgba(40, 40, 45, ${hoverAlpha})` 
    : `rgba(255, 255, 255, ${hoverAlpha})`;

  // 玻璃边框：使用混合模式模拟光照边缘
  const glassBorder = isDarkTheme
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.45)';

  // 品牌色调 - 更加鲜亮现代
  const primaryColor = '#3a86ff'; // 鲜亮蓝
  const primaryColorHover = '#5c9aff';
  const primaryColorPressed = '#2a6fd9';
  const successColor = '#00b894'; // 薄荷绿
  const warningColor = '#fdcb6e'; // 暖阳黄
  const errorColor = '#ff7675';   // 柔和红

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
      fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
      
      bodyColor: transparent,
      cardColor: glassBg,
      modalColor: isDarkTheme ? 'rgba(30, 30, 35, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      popoverColor: glassBgHover,
      tableColor: transparent,
      tableHeaderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
      inputColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.4)',
    },
    LoadingBar: {
      colorLoading: primaryColor,
      colorError: errorColor,
      height: '3px'
    },
    Card: {
      borderRadius: '20px',
      color: glassBg,
      borderColor: glassBorder,
      // 增加内发光(inset)增加厚度感
      boxShadow: isDarkTheme 
        ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)' 
        : '0 8px 32px rgba(31, 38, 135, 0.07), inset 0 0 0 1px rgba(255, 255, 255, 0.4)'
    },
    Modal: {
      color: isDarkTheme ? 'rgba(30, 30, 35, 0.8)' : 'rgba(255, 255, 255, 0.85)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
      borderColor: glassBorder,
      borderRadius: '24px'
    },
    Dialog: {
      color: glassBg,
      borderRadius: '20px',
      borderColor: glassBorder
    },
    DataTable: {
      thColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
      tdColor: transparent,
      tdColorHover: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)',
      borderColor: glassBorder,
      borderRadius: '16px'
    },
    Input: {
      color: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.4)',
      colorFocus: isDarkTheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.75)',
      border: `1px solid ${glassBorder}`,
      borderRadius: '12px',
      textColor: isDarkTheme ? '#eee' : '#333',
      boxShadowFocus: `0 0 0 2px ${primaryColor}33`, // 柔和的聚焦光晕
    },
    Select: {
      peers: {
        InternalSelection: {
          color: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.4)',
          border: `1px solid ${glassBorder}`,
          borderRadius: '12px',
        },
        InternalSelectMenu: {
          color: isDarkTheme ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
          optionColorHover: glassBgHover,
          padding: '6px',
          borderRadius: '16px'
        }
      }
    },
    Dropdown: {
      color: isDarkTheme ? 'rgba(30, 30, 35, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      optionColorHover: glassBgHover,
      borderRadius: '16px',
      padding: '6px',
    },
    Layout: {
      color: transparent,
      headerColor: transparent,
      footerColor: transparent,
      siderColor: transparent
    },
    Tabs: {
      tabBorderRadius: '12px',
      panePadding: '24px 0 0 0',
      tabColor: transparent,
      tabBorderColor: transparent
    },
    Button: {
      fontWeight: '600',
      borderRadiusMedium: '12px',
      borderRadiusLarge: '14px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)', // 按钮微阴影
      boxShadowHover: '0 6px 16px rgba(58, 134, 255, 0.25)', // 悬停时的彩色光晕
      boxShadowPressed: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    Statistic: {
      labelFontWeight: '500'
    },
    Pagination: {
      itemColor: transparent,
      itemColorHover: glassBgHover,
      itemColorActive: primaryColor,
      itemColorActiveHover: primaryColorHover,
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
              <div class="bg-gradient-1"></div>
              <div class="bg-gradient-2"></div>
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
  color: #333;
  overflow-x: hidden;
  width: 100%;
  min-height: 100vh;
  /* 基础背景色，防止图片加载前的白屏 */
  background-color: #f0f2f5; 
}

/* 深色模式文字适配 */
[data-theme='dark'] body {
  color: #f0f0f0;
  background-color: #121212;
}

/* === 背景渐变动画效果 === */
.bg-gradient-1, .bg-gradient-2 {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: -2;
  transition: opacity 0.5s ease;
}

/* 浅色模式：梦幻极光渐变 */
.bg-gradient-1 {
  background: 
    radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
    radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
    radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%);
  background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
  opacity: 1;
}

/* 深色模式：深邃星空渐变 */
[data-theme='dark'] .bg-gradient-1 {
  background-image: linear-gradient(to top, #30cfd0 0%, #330867 100%); 
  /* 或者使用更高级的 mesh gradient */
  background: 
    radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.4), transparent 25%), 
    radial-gradient(circle at 85% 30%, rgba(13, 148, 136, 0.4), transparent 25%);
  background-color: #0f172a;
  opacity: 1;
}

/* 纹理叠加层，增加质感 */
.bg-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: -1;
  /* 点状纹理 */
  background-image: radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}
[data-theme='dark'] .bg-overlay {
  background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
}

/* === 开屏动画样式 === */
.splash-screen {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(50px) saturate(180%);
  display: flex;
  justify-content: center;
  align-items: center;
}
[data-theme='dark'] .splash-screen {
  background: rgba(0, 0, 0, 0.3);
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
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  animation: logo-float 3s ease-in-out infinite;
}
.splash-loader {
  width: 50px;
  height: 4px;
  background: rgba(58, 134, 255, 0.2);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}
.splash-loader::after {
  content: '';
  position: absolute;
  top: 0; left: 0; height: 100%; width: 100%;
  background: #3a86ff;
  transform: translateX(-100%);
  animation: loader-slide 1.5s ease-in-out infinite;
  border-radius: 2px;
}
@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes loader-slide {
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
  background: rgba(255, 255, 255, 0.15);
}
[data-theme='dark'] ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* === 核心组件毛玻璃化 === */
.n-card, 
.n-modal, 
.n-drawer, 
.n-dialog,
.n-popover,
.n-dropdown-menu,
.n-select-menu,
.glass-panel {
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

/* 卡片悬停效果：轻微上浮 + 阴影加深 */
.n-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.12) !important;
}
[data-theme='dark'] .n-card:hover {
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.5) !important;
}

/* Tab 按钮现代化重构 */
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: rgba(255, 255, 255, 0.25) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-bottom: none !important;
  margin-right: 6px !important;
  border-radius: 12px 12px 0 0 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  font-weight: 500;
  color: #555;
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover {
  background-color: rgba(255, 255, 255, 0.5) !important;
  color: #333;
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: rgba(255, 255, 255, 0.9) !important;
  box-shadow: 0 -4px 16px rgba(0,0,0,0.04);
  font-weight: 600;
  color: #3a86ff !important;
  transform: translateY(1px); /* 细微下沉，连接内容区 */
}

/* 深色模式 Tab */
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: #aaa;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: rgba(45, 45, 50, 0.9) !important;
  color: #fff !important;
}

/* 按钮微动效 */
.n-button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.n-button:hover {
  transform: translateY(-1px);
}
.n-button:active {
  transform: translateY(0) scale(0.98);
}

/* 输入框优化 */
.n-input .n-input-wrapper {
  transition: box-shadow 0.3s ease;
}

/* 去除可能干扰透明度的背景 */
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

@media (max-width: 600px) {
  .main-content {
    padding: 0 12px;
  }
}

.sticky-header-wrapper {
  position: sticky;
  top: 16px;
  z-index: 100;
  margin: 0 0 24px 0;
  padding: 12px 24px;
  border-radius: 20px;
  /* 头部极度通透 */
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  max-width: 100%;
  box-sizing: border-box;
}

:deep(.n-config-provider--theme-dark) .sticky-header-wrapper {
  background: rgba(30, 30, 35, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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
  margin-bottom: 24px;
  padding: 10px 24px;
  /* 底部悬浮岛 */
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(16px) saturate(120%);
  -webkit-backdrop-filter: blur(16px) saturate(120%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
  text-align: center;
  align-self: center;
  width: fit-content;
  min-width: auto;
  max-width: 100%;
  box-sizing: border-box;
  transition: transform 0.2s, background 0.2s;
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

/* 路由切换：更平滑的淡入上浮 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
