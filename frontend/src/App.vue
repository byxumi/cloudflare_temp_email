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
                    <div class="header-wrapper">
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
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color 0.3s ease;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8);
}
[data-theme='dark'] ::-webkit-scrollbar-thumb {
  background: rgba(82, 82, 91, 0.6);
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
  background: #ffffff;
}
[data-theme='dark'] .splash-screen {
  background: #09090b;
}
.splash-logo {
  width: 80px;
  height: 80px;
  border-radius: 16px;
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

.header-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 16px 0;
  background: rgba(249, 250, 251, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  margin-bottom: 24px;
}

:deep(.n-config-provider--theme-dark) .header-wrapper {
  background: rgba(9, 9, 11, 0.85);
  border-bottom: 1px solid rgba(39, 39, 42, 0.5);
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
