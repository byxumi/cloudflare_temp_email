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

// [UI 美化] 终极版：玻璃拟态 + 细节打磨
const themeOverrides = computed(() => {
  const alpha = 0.75; // 保持内容清晰度
  
  const glassBg = isDark.value 
    ? `rgba(30, 30, 35, ${alpha})` 
    : `rgba(255, 255, 255, ${alpha})`;
  
  const glassBgHover = isDark.value 
    ? `rgba(45, 45, 50, ${alpha + 0.1})` 
    : `rgba(255, 255, 255, ${alpha + 0.15})`;

  const glassBorder = isDark.value
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.6)';

  const primaryShadow = '0 0 12px rgba(32, 128, 240, 0.3)'; // 主色调光晕
  const transparent = 'transparent';

  return {
    common: {
      primaryColor: '#2080f0',
      primaryColorHover: '#4098fc',
      primaryColorPressed: '#1060c9',
      borderRadius: '12px',
      borderRadiusSmall: '8px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      
      bodyColor: transparent,
      cardColor: glassBg,
      modalColor: glassBg,
      popoverColor: glassBg,
      tableColor: transparent,
      tableHeaderColor: isDark.value ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)', 
      inputColor: isDark.value ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
    },
    Card: {
      borderRadius: '16px',
      color: glassBg,
      borderColor: glassBorder,
      // 增加一点点默认阴影
      boxShadow: isDark.value 
        ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
        : '0 8px 32px rgba(31, 38, 135, 0.1)'
    },
    Modal: {
      color: glassBg,
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
      borderColor: glassBorder
    },
    Dialog: {
      color: glassBg,
      borderRadius: '16px',
      borderColor: glassBorder
    },
    DataTable: {
      color: transparent,
      thColor: isDark.value ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
      tdColor: transparent,
      tdColorHover: isDark.value ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
      borderColor: glassBorder,
      borderRadius: '10px'
    },
    Input: {
      color: isDark.value ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
      colorFocus: isDark.value ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
      border: `1px solid ${glassBorder}`,
      borderRadius: '10px',
      boxShadowFocus: primaryShadow // 聚焦时发光
    },
    Select: {
      peers: {
        InternalSelection: {
          color: isDark.value ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
          border: `1px solid ${glassBorder}`,
          borderRadius: '10px',
          boxShadowFocus: primaryShadow
        },
        InternalSelectMenu: {
          color: glassBg,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          optionColorHover: glassBgHover,
          padding: '6px',
          borderRadius: '12px'
        }
      }
    },
    Dropdown: {
      color: glassBg,
      optionColorHover: glassBgHover,
      borderRadius: '10px'
    },
    Layout: {
      color: transparent,
      headerColor: transparent,
      footerColor: transparent,
      siderColor: transparent
    },
    Tabs: {
      tabBorderRadius: '10px',
      panePadding: '20px',
      tabColor: transparent,
      tabBorderColor: transparent
    },
    Button: {
      fontWeight: '600',
      borderRadiusMedium: '10px',
      borderRadiusLarge: '12px',
      // 按钮阴影
      boxShadowFocus: primaryShadow
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
/* === 1. 全局基础设置 === */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  margin: 0;
  background: url('https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN') no-repeat center center fixed;
  background-size: cover;
  background-attachment: fixed; 
}

/* === 2. 自定义滚动条 (Webkit) === */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(150, 150, 150, 0.3);
  border-radius: 4px;
  backdrop-filter: blur(4px);
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(150, 150, 150, 0.5);
}

/* === 3. 玻璃拟态核心样式 === */
.n-card, 
.n-modal, 
.n-drawer, 
.n-dialog,
.n-popover,
.n-dropdown-menu,
.n-select-menu {
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  /* 悬浮过渡效果 */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 卡片悬浮微动效果 */
.n-card:hover {
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.2) !important;
}

/* 深色模式边框微调 */
[data-theme='dark'] .n-card,
[data-theme='dark'] .n-modal {
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Tab 内容区域 */
.n-tabs .n-tab-pane {
  background-color: rgba(255, 255, 255, 0.65) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-radius: 16px !important;
  margin-top: 10px;
  padding: 20px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}
[data-theme='dark'] .n-tabs .n-tab-pane {
  background-color: rgba(30, 30, 35, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* === 4. 标签页按钮 (Card Type) 样式优化 === */
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-bottom: none !important;
  margin-right: 6px !important;
  border-radius: 10px 10px 0 0 !important;
  transition: all 0.3s ease !important;
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover {
  background-color: rgba(255, 255, 255, 0.6) !important;
  transform: translateY(-2px);
}
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: rgba(255, 255, 255, 0.85) !important;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
  transform: translateY(0);
}
/* 深色模式 Tab */
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
  background-color: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}
[data-theme='dark'] .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active {
  background-color: rgba(40, 40, 45, 0.8) !important;
}

/* === 5. 按钮样式增强 === */
.n-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
/* 主要按钮光晕 */
.n-button--primary-type:not(.n-button--ghost) {
  box-shadow: 0 4px 14px 0 rgba(32, 128, 240, 0.3);
}
.n-button--primary-type:not(.n-button--ghost):hover {
  box-shadow: 0 6px 20px 0 rgba(32, 128, 240, 0.4);
  transform: translateY(-1px);
}

/* === 6. 杂项组件透明化 === */
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
  position: relative;
}

.bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15); /* 稍微提亮背景 */
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

/* 吸顶头部容器 */
.sticky-header-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  margin: 0 -16px 20px -16px; /* 抵消父级的 padding */
  padding: 10px 16px; /* 内部补回 padding */
  
  /* 独立的头部毛玻璃效果 */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;
}
/* 深色模式头部 */
:deep(.n-config-provider--theme-dark) .sticky-header-wrapper {
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.router-container {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding-bottom: 40px;
}

.side-ad {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-footer {
  margin-top: auto;
  padding-bottom: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(15px);
}
</style>
