<script setup>
import { ref, computed, h, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NLayout, NLayoutSider, NLayoutContent, NMenu, NCard, NIcon, NResult, NButton } from 'naive-ui'
import { useGlobalState } from '../store'
import { 
  User, 
  EnvelopeOpenText, 
  AddressBook, 
  MoneyBillWave, 
  Cog, 
  SignOutAlt, 
  TicketAlt 
} from '@vicons/fa'

const router = useRouter()
const route = useRoute()
const { t } = useI18n({
  messages: {
    en: {
      dashboard: 'Dashboard',
      myEmails: 'My Emails',
      addressMgmt: 'Addresses',
      transactions: 'Transactions',
      settings: 'Settings',
      lottery: 'Lottery',
      logout: 'Logout',
      welcome: 'User Center'
    },
    zh: {
      dashboard: '仪表盘',
      myEmails: '我的邮件',
      addressMgmt: '地址管理',
      transactions: '交易记录',
      settings: '账户设置',
      lottery: '幸运抽奖',
      logout: '退出登录',
      welcome: '用户中心'
    }
  }
})

const { jwt, logout } = useGlobalState()
const collapsed = ref(false)

// 菜单配置
const menuOptions = computed(() => [
  {
    label: t('myEmails'),
    key: '/user', // 对应 UserMailBox
    icon: () => h(NIcon, null, { default: () => h(EnvelopeOpenText) })
  },
  {
    label: t('addressMgmt'),
    key: '/user/address',
    icon: () => h(NIcon, null, { default: () => h(AddressBook) })
  },
  {
    label: t('transactions'),
    key: '/user/transactions',
    icon: () => h(NIcon, null, { default: () => h(MoneyBillWave) })
  },
  {
    label: t('lottery'),
    key: '/user/lottery',
    icon: () => h(NIcon, null, { default: () => h(TicketAlt) })
  },
  {
    label: t('settings'),
    key: '/user/settings',
    icon: () => h(NIcon, null, { default: () => h(Cog) })
  },
  {
    type: 'divider'
  },
  {
    label: t('logout'),
    key: 'logout',
    icon: () => h(NIcon, { color: '#d03050' }, { default: () => h(SignOutAlt) }),
    props: { style: 'color: #d03050' }
  }
])

const activeKey = computed(() => {
  // 简单的路由匹配逻辑
  return route.path
})

const handleMenuUpdate = (key) => {
  if (key === 'logout') {
    logout()
  } else {
    router.push(key)
  }
}

onMounted(() => {
  if (!jwt.value) {
    router.push('/')
  }
})
</script>

<template>
  <div class="user-layout-container">
    <div v-if="!jwt" class="center-login">
        <n-result status="403" title="Access Denied" description="Please login first.">
            <template #footer>
            <n-button @click="router.push('/')">Go Home</n-button>
            </template>
        </n-result>
    </div>

    <n-layout has-sider v-else class="glass-layout">
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
        class="user-sider"
      >
        <div class="sider-header" v-if="!collapsed">
            <span>{{ t('welcome') }}</span>
        </div>
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="activeKey"
          @update:value="handleMenuUpdate"
        />
      </n-layout-sider>

      <n-layout-content content-style="padding: 24px;" class="user-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-scale" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>
    </n-layout>
  </div>
</template>

<style scoped>
.user-layout-container {
  /* 容器高度适配 */
  min-height: calc(100vh - 120px); /* 减去 Header/Footer 高度 */
  margin-top: 20px;
}

.glass-layout {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  min-height: 600px;
}

.user-sider {
  background: rgba(255, 255, 255, 0.5);
}

.sider-header {
  padding: 20px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #6CB2EB; /* Blue */
  text-align: center;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.user-content {
  background: transparent;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .user-layout-container {
    margin-top: 10px;
  }
  
  .glass-layout {
    display: flex;
    flex-direction: column;
  }

  /* 移动端隐藏侧边栏，改为简单的顶部导航或假定用户使用 Header 导航 */
  /* 这里我们做一个简单的处理：在移动端让 Sider 变成全宽或者隐藏，
     实际上 Naive UI 的 Layout Sider 在移动端体验一般。
     建议：移动端可以隐藏 Sider，使用顶部的 Dropdown 菜单导航（Header.vue 已实现）。
     或者在这里强制 Sider 为 100% 宽度的菜单条。
  */
  :deep(.n-layout-sider) {
    display: none; /* 移动端使用 Header 的导航 */
  }
  
  .user-content {
    padding: 10px !important;
  }
}

/* 路由过渡动画 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.02);
}
</style>
