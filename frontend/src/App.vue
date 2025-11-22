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

// [UI 美化] 深度定制主题变量
const themeOverrides = computed(() => {
  const alpha = 0.75; 
  
  const glassBg = isDark.value 
    ? `rgba(30, 30, 35, ${alpha})` 
    : `rgba(255, 255, 255, ${alpha})`;
  
  const glassBgHover = isDark.value 
    ? `rgba(40, 40, 45, ${alpha + 0.1})` 
    : `rgba(255, 255, 255, ${alpha + 0.1})`;

  const glassBorder = isDark.value
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.6)';

  const transparent = 'transparent';

  return {
    common: {
      primaryColor: '#2080f0',
      primaryColorHover: '#4098fc',
      primaryColorPressed: '#1060c9',
      borderRadius: '12px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      
      bodyColor: transparent,
      cardColor: glassBg,
      modalColor: glassBg,
      popoverColor: glassBg,
      tableHeaderColor: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', 
      inputColor: isDark.value ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
    },
    Card: {
      borderRadius: '16px',
      color: glassBg,
      borderColor: glassBorder,
      boxShadow: isDark.value 
        ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
        : '0 8px 32px rgba(31, 38, 135, 0.1)'
    },
    Modal: {
      color: glassBg,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      borderColor: glassBorder
    },
    Dialog: {
      color: glassBg,
      borderRadius: '16px',
      borderColor: glassBorder
    },
    DataTable: {
      color: transparent,
      tdColor: transparent,
      tdColorHover: isDark.value ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
      borderColor: glassBorder,
      borderRadius: '10px'
    },
    List: {
      color: transparent,
      colorHover: isDark.value ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
    },
    Input: {
      color: isDark.value ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
      colorFocus: isDark.value ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
      border: `1px solid ${glassBorder}`,
      borderRadius: '10px'
    },
    Select: {
      peers: {
        InternalSelection: {
          color: isDark.value ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
          border: `1px solid ${glassBorder}`,
          borderRadius: '10px'
        },
        InternalSelectMenu: {
          color: glassBg,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          optionColorHover: glassBgHover,
          padding: '8px',
          borderRadius: '12px'
        }
      }
    },
    Dropdown: {
      color: glassBg,
      optionColorHover: glassBgHover,
      borderRadius: '10px'
    },
    Popover: {
      color: glassBg,
      borderRadius: '10px',
      padding: '12px'
    },
    Layout: {
      color: transparent,
      headerColor: transparent,
      footerColor: transparent,
      siderColor: transparent
    },
    Tabs: {
      tabBorderRadius: '10px',
      panePadding: '16px',
      tabColor: transparent,
      tabBorderColor: transparent
    },
    Button: {
      fontWeight: '500',
      borderRadiusMedium: '10px',
      borderRadiusLarge: '12px'
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
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  margin: 0;
  background: url('https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN') no-repeat center center fixed;
  background-size: cover;
  background-attachment: fixed; 
}

.n-switch {
  margin-left: 10px;
  margin-right: 10px;
}

/* === 全局玻璃拟态样式 === */

.n-card, 
.n-modal, 
.n-drawer, 
.n-dialog,
.n-popover,
.n-dropdown-menu,
.n-select-menu {
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15) !important;
}

[data-theme='dark'] .n-card,
[data-theme='dark'] .n-modal,
[data-theme='dark'] .n-dialog {
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* [核心] 标签页 Tab 按钮毛玻璃效果 */
/* 针对用户中心的地址管理、收件箱等按钮，以及 Admin 功能栏 */
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  /* 默认未选中状态：半透明毛玻璃 */
  background-color: rgba(255, 255, 255, 0.45) !important;
  backdrop-filter: blur(12px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  margin-right: 6px !important;
  border-radius: 8px 8px 0 0 !important;
  transition: all 0.3s ease !important;
}

/* 激活状态的 Tab */
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: rgba(255, 255, 255, 0.85) !important; /* 激活时更不透明 */
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  border-bottom: none !important;
}

/* 深色模式下的 Tab */
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: rgba(30, 30, 35, 0.45) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: rgba(30, 30, 35, 0.85) !important;
}

/* Tab 内容区域 */
.n-tabs .n-tab-pane {
  background-color: rgba(255, 255, 255, 0.65) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-radius: 0 16px 16px 16px !important; /* 配合 Tab 按钮的圆角 */
  margin-top: -1px; /* 连接 Tab */
  padding: 20px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

[data-theme='dark'] .n-tabs .n-tab-pane {
  background-color: rgba(30, 30, 35, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.n-input .n-input-wrapper {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.n-data-table, 
.n-data-table .n-data-table-th, 
.n-data-table .n-data-table-td {
  background-color: transparent !important;
}

.n-layout, .n-layout-header, .n-layout-footer, .n-layout-sider {
  background-color: transparent !important;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  position: relative;
}

.bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  pointer-events: none;
  z-index: 0;
  transition: background 0.3s ease;
}

:deep(.n-config-provider--theme-dark) .bg-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.main-grid {
  position: relative;
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
  background: transparent;
}

.app-footer {
  margin-top: auto;
  padding-bottom: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
