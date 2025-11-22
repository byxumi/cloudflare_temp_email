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

// [核心配置] 深度玻璃拟态主题变量
const themeOverrides = computed(() => {
  // 背景色：大幅降低不透明度
  const glassBg = isDark.value 
    ? 'rgba(30, 30, 35, 0.6)' 
    : 'rgba(255, 255, 255, 0.65)';
  
  const glassBgHover = isDark.value 
    ? 'rgba(40, 40, 45, 0.7)' 
    : 'rgba(255, 255, 255, 0.75)';

  const glassBorder = isDark.value
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.4)';

  const transparent = 'transparent';

  return {
    common: {
      primaryColor: '#2080f0',
      primaryColorHover: '#4098fc',
      primaryColorPressed: '#1060c9',
      borderRadius: '12px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      
      bodyColor: 'transparent', // 让 body 背景透出来
      cardColor: glassBg,
      modalColor: glassBg,
      popoverColor: glassBg,
      tableColor: transparent,
      tableHeaderColor: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      inputColor: isDark.value ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.4)',
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
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    Dialog: {
      color: glassBg,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    DataTable: {
      color: transparent,
      thColor: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      tdColor: transparent,
      tdColorHover: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderColor: glassBorder
    },
    List: {
      color: transparent,
      colorHover: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    },
    Input: {
      color: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
      colorFocus: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
      border: `1px solid ${glassBorder}`,
      borderRadius: '10px'
    },
    Select: {
      peers: {
        InternalSelection: {
          color: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
          border: `1px solid ${glassBorder}`,
          borderRadius: '10px'
        },
        InternalSelectMenu: {
          color: glassBg,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          optionColorHover: glassBgHover
        }
      }
    },
    Dropdown: {
      color: glassBg,
      optionColorHover: glassBgHover
    },
    Popover: {
      color: glassBg,
    },
    Layout: {
      color: transparent,
      headerColor: transparent,
      footerColor: transparent,
      siderColor: transparent
    },
    Tabs: {
      tabBorderRadius: '10px',
      panePadding: '16px 0',
      tabColor: transparent,
      tabBorderColor: transparent
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

/* === 全局玻璃拟态核心样式 === */

/* 1. 基础容器：卡片、弹窗、抽屉、对话框 */
.n-card, 
.n-modal, 
.n-drawer, 
.n-dialog {
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15) !important;
}

/* 2. 弹出层：下拉菜单、选择器菜单、气泡提示 */
.n-dropdown-menu,
.n-select-menu,
.n-popover {
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  background-color: rgba(255, 255, 255, 0.6) !important; /* 强制半透明背景 */
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* 3. 表格：强制透明背景，让 Card 的毛玻璃透出来 */
.n-data-table, 
.n-data-table .n-data-table-th, 
.n-data-table .n-data-table-td {
  background-color: transparent !important;
}

/* 4. 输入框：增加磨砂质感 */
.n-input .n-input-wrapper {
  backdrop-filter: blur(5px);
}

/* 5. 标签页：内容区透明 */
.n-tabs .n-tab-pane {
  background-color: transparent !important;
  padding: 20px 0;
}

/* 深色模式适配 (如果在 Dark Mode 下) */
[data-theme='dark'] .n-dropdown-menu,
[data-theme='dark'] .n-select-menu,
[data-theme='dark'] .n-popover {
  background-color: rgba(30, 30, 35, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* 布局组件透明化 */
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
  background: rgba(255, 255, 255, 0.1); /* 稍微提亮 */
  pointer-events: none;
  z-index: 0;
}

/* 深色模式下的遮罩 */
:deep(.n-config-provider--theme-dark) .bg-overlay {
  background: rgba(0, 0, 0, 0.4);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
