<script setup>
import { darkTheme, NGlobalStyle, zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useScript } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from './store'
import { useIsMobile } from './utils/composables'
import Header from './views/Header.vue';
import Footer from './views/Footer.vue';
import { api } from './api'

const {
  isDark, loading, useSideMargin, telegramApp, isTelegram
} = useGlobalState()
const adClient = import.meta.env.VITE_GOOGLE_AD_CLIENT;
const adSlot = import.meta.env.VITE_GOOGLE_AD_SLOT;
const { locale } = useI18n({});

const theme = computed(() => isDark.value ? darkTheme : null)
const localeConfig = computed(() => locale.value === 'zh' ? zhCN : enUS)
const dateLocaleConfig = computed(() => locale.value === 'zh' ? dateZhCN : dateEnUS)

const isMobile = useIsMobile()
const showSideMargin = computed(() => !isMobile.value && useSideMargin.value);
const showAd = computed(() => !isMobile.value && adClient && adSlot);
const gridMaxCols = computed(() => showAd.value ? 8 : 12);

const showSplash = ref(true)

const themeOverrides = computed(() => {
  const isDarkTheme = isDark.value;
  
  const primaryColor = '#2563eb'; 
  const primaryColorHover = '#3b82f6';
  const primaryColorPressed = '#1d4ed8';
  
  const bgLight = '#f9fafb';
  const bgDark = '#09090b';
  const cardLight = '#ffffff';
  const cardDark = '#18181b';
  const borderLight = '#e5e7eb';
  const borderDark = '#27272a';

  return {
    common: {
      primaryColor,
      primaryColorHover,
      primaryColorPressed,
      borderRadius: '12px', 
      borderRadiusSmall: '8px',
      fontFamily: '"Inter", "-apple-system", "BlinkMacSystemFont", "PingFang SC", "Helvetica Neue", sans-serif',
      
      bodyColor: isDarkTheme ? bgDark : bgLight,
      cardColor: isDarkTheme ? cardDark : cardLight,
      popoverColor: isDarkTheme ? cardDark : cardLight,
      modalColor: isDarkTheme ? cardDark : cardLight,
      
      borderColor: isDarkTheme ? borderDark : borderLight,
      textColorBase: isDarkTheme ? '#f8fafc' : '#0f172a',
      textColor1: isDarkTheme ? '#f8fafc' : '#0f172a',
      textColor2: isDarkTheme ? '#94a3b8' : '#64748b',
    },
    Card: {
      borderRadius: '16px',
      borderColor: isDarkTheme ? borderDark : borderLight,
      boxShadow: isDarkTheme 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)' 
        : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
    },
    Button: {
      fontWeight: '500',
      borderRadiusMedium: '8px',
    },
    Input: {
      borderRadius: '8px',
    }
  }
})

onMounted(async () => {
  setTimeout(() => {
    showSplash.value = false
  }, 1200)

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
    
    <Transition name="fade">
      <div v-if="showSplash" class="splash-screen">
        <img src="/logo.png" alt="Logo" class="splash-logo" />
      </div>
    </Transition>

    <n-loading-bar-provider>
      <n-spin :show="loading">
        <n-notification-provider container-style="margin-top: 60px;">
          <n-message-provider container-style="margin-top: 20px;">
            
            <div class="app-container">
              <n-grid :cols="gridMaxCols" class="main-grid" :x-gap="isMobile ? 0 : 24">
                <n-gi v-if="showSideMargin" span="1">
                  <div class="side-ad" v-if="showAd">
                    <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
                      data-ad-format="auto" data-full-width-responsive="true"></ins>
                  </div>
                </n-gi>
                
                <n-gi :span="!showSideMargin ? gridMaxCols : (gridMaxCols - 2)">
                  <div class="main-content">
                    
                    <div class="header-wrapper" :class="{ 'is-dark': isDark }">
                      <Header />
                    </div>
                    
                    <div class="router-container">
                      <router-view v-slot="{ Component }">
                        <transition name="fade-slide" mode="out-in">
                          <component :is="Component" />
                        </transition>
                      </router-view>
                    </div>

                    <div class="footer-wrapper">
                      <Footer />
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
/* === CSS 变量，用于处理渐变背景和暗色模式 === */
:root {
  /* 柔和的蓝粉组合 */
  --bg-gradient-light: linear-gradient(135deg, #f0f7ff 0%, #fff0f7 100%);
  /* 深沉的暗色组合 */
  --bg-gradient-dark: linear-gradient(135deg, #0f172a 0%, #171717 100%);
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* 全局渐变背景 */
  background: var(--bg-gradient-light);
  /* 移除 Transitional */
}

[data-theme='dark'] body {
  /* 暗色模式下的全局渐变背景 */
  background: var(--bg-gradient-dark);
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  /* 修改滚动条滑块颜色，使其更生动 */
  background: linear-gradient(180deg, rgba(147, 165, 207, 0.5) 0%, rgba(228, 187, 178, 0.5) 100%);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8);
}
[data-theme='dark'] ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(82, 82, 91, 0.5) 0%, rgba(113, 113, 122, 0.5) 100%);
}
[data-theme='dark'] ::-webkit-scrollbar-thumb:hover {
  background: rgba(113, 113, 122, 0.8);
}

.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 加载动画背景也应用渐变，使其更生动 */
  background: var(--bg-gradient-light);
}
[data-theme='dark'] .splash-screen {
  background: var(--bg-gradient-dark);
}
.splash-logo {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  /* 保留 pulse 动画 */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .7; transform: scale(0.95); }
}

.n-button {
  transition: all 0.2s ease !important;
}
.n-button:active {
  transform: scale(0.96);
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  width: 100%;
}

.main-grid {
  max-width: 1440px; 
  margin: 0 auto;
}

.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 24px; 
}

@media (max-width: 600px) {
  .main-content {
    padding: 0 16px;
  }
}

/* === 顶部 Header 悬浮圆角设计 === */
.header-wrapper {
  position: sticky;
  top: 16px; /* 距离顶部留出间隙形成悬浮感 */
  z-index: 100;
  padding: 12px 24px;
  border-radius: 16px; /* 圆角设计 */
  margin-bottom: 24px;
  
  /* 浅色模式样式 */
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(229, 231, 235, 0.6);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* === 暗色模式样式（精准覆盖，去除白蒙层，使其更生动） === */
.header-wrapper.is-dark {
  /* 添加一个微妙的渐变，使其暗色背景更生动 */
  background: linear-gradient(135deg, rgba(24, 24, 27, 0.65) 0%, rgba(39, 39, 42, 0.65) 100%);
  border: 1px solid rgba(63, 63, 70, 0.4);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.router-container {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 48px;
}

.footer-wrapper {
  padding: 24px 0;
  text-align: center;
  margin-top: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
