<script setup>
import { computed, onMounted, ref, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'

import { useGlobalState } from '../store'
import { api } from '../api'

// [核心安全修复] 引入 Turnstile
import Turnstile from '../components/Turnstile.vue'

import SenderAccess from './admin/SenderAccess.vue'
import Statistics from "./admin/Statistics.vue"
import SendBox from './admin/SendBox.vue';
import Account from './admin/Account.vue';
import CreateAccount from './admin/CreateAccount.vue';
import AccountSettings from './admin/AccountSettings.vue';
import UserManagement from './admin/UserManagement.vue';
import UserSettings from './admin/UserSettings.vue';
import UserOauth2Settings from './admin/UserOauth2Settings.vue';
import RoleAddressConfig from './admin/RoleAddressConfig.vue';
import Mails from './admin/Mails.vue';
import MailsUnknow from './admin/MailsUnknow.vue';
import About from './common/About.vue';
import Maintenance from './admin/Maintenance.vue';
import DatabaseManager from './admin/DatabaseManager.vue';
import Appearance from './common/Appearance.vue';
import Telegram from './admin/Telegram.vue';
import Webhook from './admin/Webhook.vue';
import MailWebhook from './admin/MailWebhook.vue';
import WorkerConfig from './admin/WorkerConfig.vue';
import IpBlacklistSettings from './admin/IpBlacklistSettings.vue';
import CardManager from './admin/CardManager.vue';
import PricingManager from './admin/PricingManager.vue';
import TransactionManager from './admin/TransactionManager.vue';
import VersionSettings from './admin/VersionSettings.vue';
import LotterySettings from './admin/LotterySettings.vue';

const {
  adminAuth, showAdminAuth, adminTab, loading,
  globalTabplacement, showAdminPage, userSettings, openSettings
} = useGlobalState()
const message = useMessage()

const SendMail = defineAsyncComponent(() => {
  loading.value = true;
  return import('./admin/SendMail.vue')
    .finally(() => loading.value = false);
});

const cfToken = ref('')

const authFunc = async () => {
  // [安全] 前端检查：若配置了 CF，必须先完成验证
  if (openSettings.value.cfTurnstileSiteKey && !cfToken.value) {
      message.error("Please complete the captcha verification");
      return;
  }
  
  loading.value = true;
  try {
    // [安全] 必须通过后端验证接口
    // 即使未配置 Turnstile，也建议走后端验证密码，比纯前端存储更安全（防止仅前端泄露）
    // 后端会验证 password 和 cf_token (若需)
    await api.adminLogin(tmpAdminAuth.value, cfToken.value || "");

    // 验证通过，保存凭证
    adminAuth.value = tmpAdminAuth.value;
    location.reload();
  } catch (error) {
    message.error(error.message || "Authentication failed");
  } finally {
    loading.value = false;
  }
}

const { t } = useI18n({
  messages: {
    en: {
      accessHeader: 'Admin Password',
      accessTip: 'Please enter the admin password',
      mails: 'Emails',
      sendMail: 'Send Mail',
      qucickSetup: 'Quick Setup',
      account: 'Account',
      account_create: 'Create Account',
      account_settings: 'Account Settings',
      user: 'User',
      user_management: 'User Management',
      user_settings: 'User Settings',
      userOauth2Settings: 'Oauth2 Settings',
      roleAddressConfig: 'Role Address Config',
      unknow: 'Mails with unknow receiver',
      senderAccess: 'Sender Access Control',
      sendBox: 'Send Box',
      telegram: 'Telegram Bot',
      webhookSettings: 'Webhook Settings',
      statistics: 'Statistics',
      maintenance: 'Maintenance',
      database: 'Database',
      workerconfig: 'Worker Config',
      ipBlacklistSettings: 'IP Blacklist',
      appearance: 'Appearance',
      about: 'About',
      ok: 'Login',
      mailWebhook: 'Mail Webhook',
      billing: 'Billing',
      cardManager: 'Card Management',
      pricingManager: 'Pricing Management',
      transactionManager: 'Transactions',
      versionSettings: 'Version',
      lotterySettings: 'Lottery Settings',
    },
    zh: {
      accessHeader: '管理员登录',
      accessTip: '请输入 Admin 密码以继续',
      mails: '邮件',
      sendMail: '发送邮件',
      qucickSetup: '快速设置',
      account: '账号',
      account_create: '创建账号',
      account_settings: '账号设置',
      user: '用户',
      user_management: '用户管理',
      user_settings: '用户设置',
      userOauth2Settings: 'Oauth2 设置',
      roleAddressConfig: '角色地址配置',
      unknow: '无收件人邮件',
      senderAccess: '发件权限控制',
      sendBox: '发件箱',
      telegram: '电报机器人',
      webhookSettings: 'Webhook 设置',
      statistics: '统计',
      maintenance: '维护',
      database: '数据库',
      workerconfig: 'Worker 配置',
      ipBlacklistSettings: 'IP 黑名单',
      appearance: '外观',
      about: '关于',
      ok: '登录',
      mailWebhook: '邮件 Webhook',
      billing: '计费管理',
      cardManager: '卡密管理',
      pricingManager: '定价管理',
      transactionManager: '交易流水',
      versionSettings: '版本号',
      lotterySettings: '抽奖设置',
    }
  }
});

const showAdminPasswordModal = computed(() => !showAdminPage.value || showAdminAuth.value)
const tmpAdminAuth = ref('')

onMounted(async () => {
  if (!userSettings.value.user_id) await api.getUserSettings(message);
})
</script>

<template>
  <div v-if="userSettings.fetched">
    <n-modal v-model:show="showAdminPasswordModal" :closable="false" :closeOnEsc="false" :maskClosable="false"
      preset="card" :title="t('accessHeader')" class="login-modal">
      <div style="text-align: center; margin-bottom: 20px;">
          <p style="color: #666;">{{ t('accessTip') }}</p>
      </div>
      <n-space vertical size="large">
          <n-input v-model:value="tmpAdminAuth" type="password" show-password-on="click" placeholder="Password" size="large" @keydown.enter="authFunc"/>
          
          <div v-if="openSettings.cfTurnstileSiteKey" style="display: flex; justify-content: center;">
              <Turnstile v-model:value="cfToken" />
          </div>

          <n-button 
            @click="authFunc" 
            type="primary" 
            :loading="loading" 
            block 
            size="large"
            :disabled="openSettings.cfTurnstileSiteKey && !cfToken"
          >
            {{ t('ok') }}
          </n-button>
      </n-space>
    </n-modal>

    <n-tabs v-if="showAdminPage" type="card" v-model:value="adminTab" :placement="globalTabplacement">
      <n-tab-pane name="qucickSetup" :tab="t('qucickSetup')">
        <n-tabs type="bar" justify-content="center" animated>
          <n-tab-pane name="version_settings" :tab="t('versionSettings')">
            <VersionSettings />
          </n-tab-pane>
          <n-tab-pane name="database" :tab="t('database')">
            <DatabaseManager />
          </n-tab-pane>
          <n-tab-pane name="account_settings" :tab="t('account_settings')">
            <AccountSettings />
          </n-tab-pane>
          <n-tab-pane name="user_settings" :tab="t('user_settings')">
            <UserSettings />
          </n-tab-pane>
          <n-tab-pane name="workerconfig" :tab="t('workerconfig')">
            <WorkerConfig />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>
      
      <n-tab-pane name="account" :tab="t('account')">
        <n-tabs type="bar" justify-content="center" animated>
          <n-tab-pane name="account" :tab="t('account')">
            <Account />
          </n-tab-pane>
          <n-tab-pane name="account_create" :tab="t('account_create')">
            <CreateAccount />
          </n-tab-pane>
          <n-tab-pane name="account_settings" :tab="t('account_settings')">
            <AccountSettings />
          </n-tab-pane>
          <n-tab-pane name="senderAccess" :tab="t('senderAccess')">
            <SenderAccess />
          </n-tab-pane>
          <n-tab-pane name="ipBlacklistSettings" :tab="t('ipBlacklistSettings')">
            <IpBlacklistSettings />
          </n-tab-pane>
          <n-tab-pane name="webhook" :tab="t('webhookSettings')">
            <Webhook />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>
      <n-tab-pane name="user" :tab="t('user')">
        <n-tabs type="bar" justify-content="center" animated>
          <n-tab-pane name="user_management" :tab="t('user_management')">
            <UserManagement />
          </n-tab-pane>
          <n-tab-pane name="user_settings" :tab="t('user_settings')">
            <UserSettings />
          </n-tab-pane>
          <n-tab-pane name="userOauth2Settings" :tab="t('userOauth2Settings')">
            <UserOauth2Settings />
          </n-tab-pane>
          <n-tab-pane name="roleAddressConfig" :tab="t('roleAddressConfig')">
            <RoleAddressConfig />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>
      
      <n-tab-pane name="billing" :tab="t('billing')">
        <n-tabs type="bar" justify-content="center" animated>
          <n-tab-pane name="cardManager" :tab="t('cardManager')">
            <CardManager />
          </n-tab-pane>
          <n-tab-pane name="pricingManager" :tab="t('pricingManager')">
            <PricingManager />
          </n-tab-pane>
          <n-tab-pane name="transactionManager" :tab="t('transactionManager')">
            <TransactionManager />
          </n-tab-pane>
          <n-tab-pane name="lotterySettings" :tab="t('lotterySettings')">
            <LotterySettings />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>

      <n-tab-pane name="mails" :tab="t('mails')">
        <n-tabs type="bar" justify-content="center" animated>
          <n-tab-pane name="mails" :tab="t('mails')">
            <Mails />
          </n-tab-pane>
          <n-tab-pane name="unknow" :tab="t('unknow')">
            <MailsUnknow />
          </n-tab-pane>
          <n-tab-pane name="sendBox" :tab="t('sendBox')">
            <SendBox />
          </n-tab-pane>
          <n-tab-pane name="sendMail" :tab="t('sendMail')">
            <SendMail />
          </n-tab-pane>
          <n-tab-pane name="mailWebhook" :tab="t('mailWebhook')">
            <MailWebhook />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>
      <n-tab-pane name="telegram" :tab="t('telegram')">
        <Telegram />
      </n-tab-pane>
      <n-tab-pane name="statistics" :tab="t('statistics')">
        <Statistics />
      </n-tab-pane>
      <n-tab-pane name="maintenance" :tab="t('maintenance')">
        <n-tabs type="bar" justify-content="center" animated>
          <n-tab-pane name="database" :tab="t('database')">
            <DatabaseManager />
          </n-tab-pane>
          <n-tab-pane name="workerconfig" :tab="t('workerconfig')">
            <WorkerConfig />
          </n-tab-pane>
          <n-tab-pane name="maintenance" :tab="t('maintenance')">
            <Maintenance />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>
      <n-tab-pane name="appearance" :tab="t('appearance')">
        <Appearance />
      </n-tab-pane>
      <n-tab-pane name="about" :tab="t('about')">
        <About />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.n-pagination {
  margin-top: 10px;
  margin-bottom: 10px;
}

.login-modal {
    width: 90%; 
    max-width: 400px;
    border-radius: 16px;
}
</style>
