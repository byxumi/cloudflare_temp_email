// frontend/src/views/Admin.vue
<script setup>
import { NTabs, NTabPane, NMessageProvider, NButton, useMessage, NTag, NIcon, NDivider } from 'naive-ui';
import { api } from '../api';
import { userSettings, toggleTheme, theme } from '../store';
import { useI18n } from 'vue-i18n';

// 导入所有 Admin 子组件
import DomainPricingConfig from './admin/DomainPricingConfig.vue'; // <-- 关键新增导入
import WorkerConfig from './admin/WorkerConfig.vue';
import Account from './admin/Account.vue';
import Maintenance from './admin/Maintenance.vue';
import WorkerMail from './admin/Mails.vue';
import MailsUnknow from './admin/MailsUnknow.vue';
import SenderAccess from './admin/SenderAccess.vue';
import SendBox from './admin/SendBox.vue';
import Statistics from './admin/Statistics.vue';
import UserManagement from './admin/UserManagement.vue';
import CreateAccount from './admin/CreateAccount.vue';
import UserSettings from './admin/UserSettings.vue';
import UserOauth2Settings from './admin/UserOauth2Settings.vue';
import Webhook from './admin/Webhook.vue';
import MailWebhook from './admin/MailWebhook.vue';
import SendMail from './admin/SendMail.vue';
import DatabaseManager from './admin/DatabaseManager.vue';
import Telegram from './admin/Telegram.vue';
import AccountSettings from './admin/AccountSettings.vue';
import RoleAddressConfig from './admin/RoleAddressConfig.vue';
import RechargeCodeManager from './admin/RechargeCodeManager.vue'; // <-- 新增导入

const message = useMessage();

const { t } = useI18n({
  messages: {
    en: {
      userManagement: 'User Management',
      createAccount: 'Create Account',
      mails: 'Mails',
      mailsUnknow: 'Mails Unknow',
      senderAccess: 'Sender Access',
      sendBox: 'Send Box',
      statistics: 'Statistics',
      userSettings: 'User Settings',
      webhook: 'Webhook Settings',
      mailWebhook: 'Mail Webhook Settings',
      sendMail: 'Send Mail',
      workerconfig: 'Worker Config',
      databaseManager: 'Database Manager',
      maintenance: 'Maintenance',
      qucickSetup: 'Quick Setup',
      telegram: 'Telegram',
      accountSettings: 'Account Settings',
      domainPricingConfig: 'Domain Pricing Config', // <-- 关键新增消息
      userOauth2Settings: 'User Oauth2 Settings',
      roleAddressConfig: 'Role Address Config',
      rechargeCodeManager: 'Recharge Code Manager', // <-- 新增消息
    },
    zh: {
      userManagement: '用户管理',
      createAccount: '创建账户',
      mails: '收件箱',
      mailsUnknow: '未知收件箱',
      senderAccess: '发件权限',
      sendBox: '发件箱',
      statistics: '统计',
      userSettings: '用户设置',
      webhook: 'Webhook 配置',
      mailWebhook: '邮件 Webhook 配置',
      sendMail: '发送邮件',
      workerconfig: 'Worker 配置',
      databaseManager: '数据库管理',
      maintenance: '维护',
      qucickSetup: '快速设置',
      telegram: 'Telegram',
      accountSettings: '账户设置',
      domainPricingConfig: '域名定价配置', // <-- 关键新增消息
      userOauth2Settings: '用户 Oauth2 配置',
      roleAddressConfig: '角色地址配置',
      rechargeCodeManager: '卡密管理', // <-- 新增消息
    }
  }
});

</script>

<template>
  <div style="max-width: 1200px; margin: auto;">
    <n-message-provider>
      <n-tabs type="line" justify-content="center" animated>
        <n-tab-pane name="qucickSetup" :tab="t('qucickSetup')">
          <n-tabs type="bar" justify-content="center" animated>
            <n-tab-pane name="accountSettings" :tab="t('accountSettings')">
              <AccountSettings />
            </n-tab-pane>
            <n-tab-pane name="userSettings" :tab="t('userSettings')">
              <UserSettings />
            </n-tab-pane>
            <n-tab-pane name="userOauth2Settings" :tab="t('userOauth2Settings')">
              <UserOauth2Settings />
            </n-tab-pane>
            <n-tab-pane name="roleAddressConfig" :tab="t('roleAddressConfig')">
              <RoleAddressConfig />
            </n-tab-pane>
            <n-tab-pane name="domainPricingConfig" :tab="t('domainPricingConfig')">
              <DomainPricingConfig />
            </n-tab-pane>
            <n-tab-pane name="workerconfig" :tab="t('workerconfig')">
              <WorkerConfig />
            </n-tab-pane>
          </n-tabs>
        </n-tab-pane>
        <n-tab-pane name="userManagement" :tab="t('userManagement')">
          <UserManagement />
        </n-tab-pane>
        <n-tab-pane name="createAccount" :tab="t('createAccount')">
          <CreateAccount />
        </n-tab-pane>
        <n-tab-pane name="mails" :tab="t('mails')">
          <WorkerMail />
        </n-tab-pane>
        <n-tab-pane name="mailsUnknow" :tab="t('mailsUnknow')">
          <MailsUnknow />
        </n-tab-pane>
        <n-tab-pane name="sendBox" :tab="t('sendBox')">
          <SendBox />
        </n-tab-pane>
        <n-tab-pane name="senderAccess" :tab="t('senderAccess')">
          <SenderAccess />
        </n-tab-pane>
        <n-tab-pane name="statistics" :tab="t('statistics')">
          <Statistics />
        </n-tab-pane>
        <n-tab-pane name="webhook" :tab="t('webhook')">
          <Webhook />
        </n-tab-pane>
        <n-tab-pane name="mailWebhook" :tab="t('mailWebhook')">
          <MailWebhook />
        </n-tab-pane>
        <n-tab-pane name="sendMail" :tab="t('sendMail')">
          <SendMail />
        </n-tab-pane>
        <n-tab-pane name="maintenance" :tab="t('maintenance')">
          <Maintenance />
        </n-tab-pane>
        <n-tab-pane name="databaseManager" :tab="t('databaseManager')">
          <DatabaseManager />
        </n-tab-pane>
        <n-tab-pane name="telegram" :tab="t('telegram')">
          <Telegram />
        </n-tab-pane>
      </n-tabs>
    </n-message-provider>
  </div>
</template>
