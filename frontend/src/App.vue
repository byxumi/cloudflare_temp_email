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

  // check if google ad is enabled
  if (showAd.value) {
    useScript({
      src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`,
      async: true,
      crossorigin: "anonymous",
    });
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }


  // check if telegram is enabled
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
  <n-config-provider :locale="localeConfig" :theme="theme">
    <n-global-style />
    <n-spin description="loading..." :show="loading">
      <n-notification-provider container-style="margin-top: 60px;">
        <n-message-provider container-style="margin-top: 20px;">
          <n-grid x-gap="12" :cols="gridMaxCols">
            <n-gi v-if="showSideMargin" span="1">
              <div class="side" v-if="showAd">
                <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
                  data-ad-format="auto" data-full-width-responsive="true"></ins>
              </div>
            </n-gi>
            <n-gi :span="!showSideMargin ? gridMaxCols : (gridMaxCols - 2)">
              <div class="main">
                <n-space vertical>
                  <n-layout style="min-height: 80vh;opacity:0.7;">
                    <Header />
                    <router-view></router-view>
                  </n-layout>
                  <Footer />
                </n-space>
              </div>
            </n-gi>
            <n-gi v-if="showSideMargin" span="1">
              <div class="side" v-if="showAd">
                <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
                  data-ad-format="auto" data-full-width-responsive="true"></ins>
              </div>
            </n-gi>
          </n-grid>
          <n-back-top />
        </n-message-provider>
      </n-notification-provider>
    </n-spin>
  </n-config-provider>
</template>

<template>
  <div>
    <!-- 你原本的内容 -->
    <h1>欢迎使用临时邮箱</h1>

    <!-- 吉祥物图片 -->
    <img
      v-if="showMascot"
      src="/assets/mascot.png"
      @click="toggleChat"
      alt="吉祥物"
      class="fixed bottom-4 right-4 w-24 h-24 z-50 drop-shadow-lg cursor-pointer animate-float"
    />

    <!-- 对话框 -->
    <div
      v-if="showChat"
      class="fixed bottom-28 right-4 w-72 bg-white border border-pink-200 rounded-xl p-4 shadow-lg z-50"
    >
      <h3 class="text-pink-500 font-bold mb-2">有什么问题想问我？</h3>

      <!-- 问题列表 -->
      <ul v-if="!selectedQuestion" class="text-sm text-gray-700 space-y-2">
        <li
          v-for="(item, index) in faqList"
          :key="index"
          class="hover:text-pink-500 cursor-pointer"
          @click="selectedQuestion = item"
        >
          👉 {{ item.q }}
        </li>
      </ul>

      <!-- 回答内容 -->
      <div v-else>
        <p class="text-gray-700 text-sm mb-2">❓ <strong>{{ selectedQuestion.q }}</strong></p>
        <p class="text-gray-600 text-sm">💬 {{ selectedQuestion.a }}</p>
        <button class="mt-3 text-xs text-blue-500 hover:underline" @click="selectedQuestion = null">返回问题列表</button>
      </div>

      <!-- 关闭按钮 -->
      <button class="mt-4 text-xs text-red-500 hover:underline block" @click="hideMascot">关闭吉祥物</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showMascot = ref(true)
const showChat = ref(false)
const selectedQuestion = ref(null)

const faqList = [
  {
    q: "什么是临时邮箱？",
    a: "临时邮箱是一种无需注册即可使用的邮箱，用于接收短期邮件。"
  },
  {
    q: "邮箱多久会失效？",
    a: "一般会保存几小时到一天，取决于平台配置。"
  },
  {
    q: "可以用来注册网站吗？",
    a: "当然可以，但请注意部分服务可能禁止临时邮箱。"
  }
]

function toggleChat() {
  showChat.value = !showChat.value
  selectedQuestion.value = null
}

function hideMascot() {
  showChat.value = false
  showMascot.value = false
}
</script>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>

<style>
.n-switch {
  margin-left: 10px;
  margin-right: 10px;
}
</style>

<style scoped>
.side {
  height: 100vh;
}

.main {
  height: 100vh;
  text-align: center;
}

.n-grid {
  height: 100%;
}

.n-gi {
  height: 100%;
}

.n-space {
  height: 100%;
}
</style>
