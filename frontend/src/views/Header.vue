<script setup>
import { h, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NButton, NMenu, NIcon, NDropdown, NAvatar, NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
import { 
  Home, 
  User, 
  SignOutAlt, 
  Language, 
  Github, 
  TelegramPlane,
  Bars // 移动端菜单图标
} from '@vicons/fa'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const { jwt, logout } = useGlobalState()

const activeKey = computed(() => route.path)

// 导航菜单选项
const menuOptions = computed(() => [
  {
    label: () => h('span', {}, t('home')),
    key: '/',
    icon: () => h(NIcon, null, { default: () => h(Home) })
  },
  {
    label: () => h('span', {}, jwt.value ? t('user') : t('login')),
    key: '/user',
    icon: () => h(NIcon, null, { default: () => h(User) })
  }
])

const handleUpdateValue = (key) => {
  router.push(key)
}

const changeLang = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}

const openGithub = () => {
  window.open('https://github.com/dreamhunter2333/cloudflare_temp_email', '_blank')
}
</script>

<template>
  <div class="header-glass">
    <div class="header-content">
      <div class="logo" @click="router.push('/')">
        <img src="/logo.png" alt="Logo" class="logo-img" />
        <span class="logo-text">Temp Email</span>
      </div>

      <div class="desktop-nav">
        <n-menu 
          mode="horizontal" 
          :value="activeKey" 
          :options="menuOptions" 
          @update:value="handleUpdateValue"
          class="nav-menu"
        />
        <n-space align="center" size="large">
          <n-button quaternary circle @click="changeLang">
            <template #icon><n-icon><Language /></n-icon></template>
          </n-button>
          <n-button quaternary circle @click="openGithub">
            <template #icon><n-icon><Github /></n-icon></template>
          </n-button>
          <n-button v-if="jwt" type="error" size="small" ghost round @click="logout">
            <template #icon><n-icon><SignOutAlt /></n-icon></template>
            {{ t('logout') }}
          </n-button>
        </n-space>
      </div>

      <div class="mobile-nav">
        <n-dropdown 
          trigger="click" 
          :options="[
            ...menuOptions, 
            { type: 'divider' },
            { label: locale === 'zh' ? 'English' : '中文', key: 'lang', icon: () => h(NIcon, null, { default: () => h(Language) }) },
            { label: 'GitHub', key: 'github', icon: () => h(NIcon, null, { default: () => h(Github) }) },
            ...(jwt ? [{ label: t('logout'), key: 'logout', icon: () => h(NIcon, null, { default: () => h(SignOutAlt) }) }] : [])
          ]"
          @select="(key) => {
            if(key === 'lang') changeLang();
            else if(key === 'github') openGithub();
            else if(key === 'logout') logout();
            else router.push(key);
          }"
        >
          <n-button text style="font-size: 24px;">
            <n-icon><Bars /></n-icon>
          </n-button>
        </n-dropdown>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-glass {
  /* 毛玻璃效果 */
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.3s;
}
.logo:hover {
  opacity: 0.8;
}

.logo-img {
  height: 32px;
  margin-right: 10px;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(to right, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

.mobile-nav {
  display: none;
}

/* 响应式 */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }
  .mobile-nav {
    display: block;
  }
}

:deep(.n-menu-item-content-header) {
  font-weight: 600;
}
</style>
