<script setup>
import { darkTheme, NGlobalStyle, zhCN } from 'naive-ui'
import { computed, onMounted } from 'vue'
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
const localeConfig = computed(() => locale.value == 'zh' ? zhCN : null)
const isMobile = useIsMobile()
const showSideMargin = computed(() => !isMobile.value && useSideMargin.value);
const showAd = computed(() => !isMobile.value && adClient && adSlot);
const gridMaxCols = computed(() => showAd.value ? 8 : 12);

// [核心配置] 玻璃拟态主题变量
const themeOverrides = computed(() => {
  // 定义半透明背景色
  const glassBg = isDark.value 
    ? 'rgba(30, 30, 35, 0.65)' 
    : 'rgba(255, 255, 255, 0.70)';
  
  const glassBorder = isDark.value
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.4)';

  return {
    common: {
      primaryColor: '#2080f0',
      primaryColorHover: '#4098fc',
      primaryColorPressed: '#1060c9',
      borderRadius: '12px',
      borderRadiusSmall: '8px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      
      // 基础背景透明，让 body 的壁纸透出来
      bodyColor: 'transparent',
      // 各类浮层组件的背景色设为半透明
      cardColor: glassBg,
      modalColor: glassBg,
      popoverColor: glassBg,
      tableColor: 'transparent',
    },
    Card: {
      borderRadius: '16px',
      color: glassBg,
      borderColor: glassBorder,
      // 更柔和的阴影
      boxShadow: isDark.value 
        ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
        : '0 8px 32px rgba(31, 38, 135, 0.1)'
    },
    Modal: {
      color: glassBg,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    Layout: {
      color: 'transparent',
      headerColor: 'transparent',
      footerColor: 'transparent',
      siderColor: 'transparent'
    },
    Button: {
      fontWeight: '500',
      borderRadiusMedium: '10px',
      borderRadiusLarge: '12px'
    },
    Tabs: {
      tabBorderRadius: '10px',
      panePadding: '16px 0'
    },
    Input: {
      // 输入框也做轻微透明处理
      color: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
      colorFocus: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
      border: `1px solid ${glassBorder}`
    },
    Dropdown: {
      color: glassBg
    }
  }
})

onMounted(async () => {
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
    <n-spin description="loading..." :show="loading">
      <n-notification-provider container-style="margin-top: 60px;">
        <n-message-provider container-style="margin-top: 20px;">
          
          <div class="app-container">
            <div class="bg-overlay"></div>

            <n-grid x-gap="24" :cols="gridMaxCols" class="main-grid">
              <n-gi v-if="showSideMargin" span="1">
                <div class="side-ad" v-if="showAd">
                  <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
                    data-ad-format="auto" data-full-width-responsive="true"></ins>
                </div>
              </n-gi>
              
              <n-gi :span="!showSideMargin ? gridMaxCols : (gridMaxCols - 2)">
                <div class="main-content">
                  <Header class="app-header" />
                  
                  <div class="router-container">
                    <router-view v-slot="{ Component }">
                      <transition name="fade" mode="out-in">
                        <component :is="Component" />
                      </transition>
                    </router-view>
                  </div>

                  <Footer class="app-footer" />
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
  </n-config-provider>
</template>

<style>
/* === 全局样式重置与优化 === */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  margin: 0;
  /* 必应每日壁纸 */
  background: url('https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN') no-repeat center center fixed;
  background-size: cover;
  /* 确保背景固定，内容滚动 */
  background-attachment: fixed; 
}

.n-switch {
  margin-left: 10px;
  margin-right: 10px;
}

/* === 核心：全局毛玻璃效果 === */
/* 覆盖所有常见的容器组件 */
.n-card, 
.n-modal, 
.n-drawer, 
.n-dropdown-menu, 
.n-popover,
.n-dialog {
  /* 模糊 + 饱和度提升(让色彩更鲜艳) */
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  
  /* 细微的白色半透明边框，增强玻璃质感 */
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* 输入框特殊处理 */
.n-input .n-input-wrapper {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 标签页内容背景透明 */
.n-tabs .n-tab-pane {
  background-color: transparent !important;
}

/* 列表项悬浮效果增强 */
.n-list-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* 确保 Layout 组件完全透明 */
.n-layout, .n-layout-header, .n-layout-footer, .n-layout-sider {
  background-color: transparent !important;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  position: relative;
}

/* 背景遮罩：让背景暗一点，突出前景文字 */
.bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1); /* 浅色遮罩，深色模式可调整为 0.4 */
  pointer-events: none;
  z-index: 0;
}

.main-grid {
  position: relative; /* 确保在遮罩之上 */
  z-index: 1;
  min-height: 100vh;
  max-width: 1440px; 
  margin: 0 auto;
}

.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 16px; 
}

.router-container {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding-top: 20px;
  padding-bottom: 40px;
}

.side-ad {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-header {
  margin-bottom: 20px;
  /* 头部也可以加一点点背景 */
  background: transparent;
}

.app-footer {
  margin-top: auto;
  padding-bottom: 20px;
}

/* 页面切换动画：缩放淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
