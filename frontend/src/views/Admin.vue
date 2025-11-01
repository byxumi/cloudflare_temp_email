<script setup>
import { NTabs, NTabPane, NMessageProvider, NButton, useMessage, NTag, NIcon, NDivider, NLayout, NLayoutSider, NLayoutContent, NMenu } from 'naive-ui';
import { api } from '../api' //
import { userSettings, toggleTheme, theme } from '../store' //
import { useI18n } from 'vue-i18n' //
import { computed, ref, h } from 'vue';
import { useIsMobile } from '../utils/composables' //

// 修复 Bug 2 --> 导入更多图标，用于子菜单
import {
    AdminPanelSettingsFilled, ManageAccountsFilled, LockFilled, SettingsFilled, DataObjectFilled,
    MailFilled, SendFilled, AccountBalanceFilled, CleaningServicesFilled, InsightsFilled, Telegram,
    // --- 新增的子菜单图标 ---
    PeopleFilled, PersonAddFilled, KeyFilled, PriceChangeFilled, InboxFilled,
    MarkEmailUnreadFilled, ReceiptLongFilled, WebFilled, CodeFilled
} from '@vicons/material'; // 导入图标

// 导入所有 Admin 子组件
import DomainPricingConfig from './admin/DomainPricingConfig.vue'; //
import WorkerConfig from './admin/WorkerConfig.vue'; //
import Account from './admin/Account.vue'; //
import Maintenance from './admin/Maintenance.vue'; //
import WorkerMail from './admin/Mails.vue'; //
import MailsUnknow from './admin/MailsUnknow.vue'; //
import SenderAccess from './admin/SenderAccess.vue'; //
import SendBox from './admin/SendBox.vue'; //
import Statistics from './admin/Statistics.vue'; //
import UserManagement from './admin/UserManagement.vue'; //
import CreateAccount from './admin/CreateAccount.vue'; //
import UserSettingsComponent from './admin/UserSettings.vue'; //
import UserOauth2Settings from './admin/UserOauth2Settings.vue'; //
import Webhook from './admin/Webhook.vue'; //
import MailWebhook from './admin/MailWebhook.vue'; //
import SendMail from './admin/SendMail.vue'; //
import DatabaseManager from './admin/DatabaseManager.vue'; //
import TelegramManager from './admin/Telegram.vue'; //
import AccountSettings from './admin/AccountSettings.vue'; //
import RoleAddressConfig from './admin/RoleAddressConfig.vue'; //
import RechargeCodeManager from './admin/RechargeCodeManager.vue'; //

const message = useMessage(); //
const isMobile = useIsMobile(); //

// 修复 Bug 1 --> 添加一个 ref 来控制侧边栏的折叠状态
const isCollapsed = ref(true); // 默认折叠

// 关键修复：将默认 Tab 从 'address' 改为 'statistics'
const currentTab = ref('statistics'); //

const { t } = useI18n({ //
  messages: { //
  _ en: { //
      userManagement: 'User Management', //
      createAccount: 'Create Account', //
      mails: 'Inbox Mails', //
      mailsUnknow: 'Unknown Mails', //
      senderAccess: 'Sender Access', //
      sendBox: 'Send Box', //
      statistics: 'Statistics', //
      userSettings: 'User Settings', //
      webhook: 'Webhook Settings', //
      mailWebhook: 'Mail Webhook Settings', //
      sendMail: 'Send Mail', //
      workerconfig: 'Worker Config', //
      databaseManager: 'Database Manager', //
      maintenance: 'Maintenance', //
      qucickSetup: 'Quick Setup', //
      telegram: 'Telegram', //
      accountSettings: 'Account Settings', //
      domainPricingConfig: 'Domain Pricing Config', //
      userOauth2Settings: 'User Oauth2 Settings', //
      roleAddressConfig: 'Role Address Config', //
      rechargeCodeManager: 'Recharge Code Manager', //
      adminDashboard: 'Admin Dashboard', //
      userSystem: 'User System', //
      mailSystem: 'Mail System', //
      systemTools: 'System Tools', //
    },
    zh: { //
      userManagement: '用户管理', //
      createAccount: '创建账户', //
      mails: '收件箱', //
      mailsUnknow: '未知收件箱', //
      senderAccess: '发件权限', //
      sendBox: '发件箱', //
      statistics: '统计', //
      userSettings: '用户设置', //
      webhook: 'Webhook 配置', //
      mailWebhook: '邮件 Webhook 配置', //
      sendMail: '发送邮件', //
      workerconfig: 'Worker 配置', //
      databaseManager: '数据库管理', //
      maintenance: '维护', //
      qucickSetup: '快速设置', //
      telegram: 'Telegram', //
      accountSettings: '账户设置', //
      domainPricingConfig: '域名定价配置', //
      userOauth2Settings: '用户 Oauth2 配置', //
      roleAddressConfig: '角色地址配置', //
      rechargeCodeManager: '卡密管理', //
      adminDashboard: '管理概览', //
      userSystem: '用户系统', //
      mailSystem: '邮件系统', //
      systemTools: '系统工具', //
    }
  }
});

// 修复 Bug 2 --> 为所有子菜单项 (children) 添加 icon 属性
const sideMenuOptions = computed(() => { //
    return [ //
        {
            label: t('adminDashboard'), //
            key: 'group-dashboard', //
            icon: () => h(NIcon, { component: InsightsFilled }), //
            children: [ //
                { 
                    label: t('statistics'), 
                    key: 'statistics',
                    icon: () => h(NIcon, { component: InsightsFilled })
                }, //
                { 
                    label: t('accountSettings'), 
                    key: 'accountSettings',
                    icon: () => h(NIcon, { component: AdminPanelSettingsFilled })
                }, //
            ]
        },
        {
            label: t('userSystem'), //
            key: 'group-user', //
            icon: () => h(NIcon, { component: ManageAccountsFilled }), //
            children: [ //
                { 
                    label: t('userManagement'), 
                    key: 'userManagement',
                    icon: () => h(NIcon, { component: PeopleFilled })
                }, //
                { 
                    label: t('createAccount'), 
                    key: 'createAccount',
                    icon: () => h(NIcon, { component: PersonAddFilled })
                }, //
                { 
                    label: t('rechargeCodeManager'), 
                    key: 'rechargeCodeManager',
                    icon: () => h(NIcon, { component: KeyFilled })
                }, //
                { 
                    label: t('userSettings'), 
                    key: 'userSettings',
                    icon: () => h(NIcon, { component: SettingsFilled })
                }, //
                { 
                    label: t('userOauth2Settings'), 
                    key: 'userOauth2Settings',
                    icon: () => h(NIcon, { component: LockFilled })
                }, //
                { 
                    label: t('roleAddressConfig'), 
                    key: 'roleAddressConfig',
                    icon: () => h(NIcon, { component: AdminPanelSettingsFilled })
                }, //
                { 
                    label: t('domainPricingConfig'), 
                    key: 'domainPricingConfig',
                    icon: () => h(NIcon, { component: PriceChangeFilled })
                }, //
s         ]
        },
        {
            label: t('mailSystem'), //
            key: 'group-mail', //
            icon: () => h(NIcon, { component: MailFilled }), //
            children: [ //
                { 
                    label: t('mails'), 
                    key: 'mails',
                    icon: () => h(NIcon, { component: InboxFilled })
                }, //
                { 
                    label: t('mailsUnknow'), 
                    key: 'mailsUnknow',
                    icon: () => h(NIcon, { component: MarkEmailUnreadFilled })
                }, //
                { 
                    label: t('sendMail'), 
                    key: 'sendMail',
                    icon: () => h(NIcon, { component: SendFilled })
                }, //
                { 
                    label: t('sendBox'), 
                    key: 'sendBox',
                    icon: () => h(NIcon, { component: ReceiptLongFilled })
                }, //
t             { 
                    label: t('senderAccess'), 
                    key: 'senderAccess',
                    icon: () => h(NIcon, { component: LockFilled })
                }, //
                { 
                    label: t('webhook'), 
                    key: 'webhook',
                    icon: () => h(NIcon, { component: WebFilled })
                }, //
                { 
                    label: t('mailWebhook'), 
                    key: 'mailWebhook',
                    icon: () => h(NIcon, { component: WebFilled })
                }, //
            ]
        },
        {
            label: t('systemTools'), //
            key: 'group-tools', //
            icon: () => h(NIcon, { component: SettingsFilled }), //
            children: [ //
                { 
                    label: t('databaseManager'), 
                    key: 'databaseManager',
                    icon: () => h(NIcon, { component: DataObjectFilled })
                }, //
                { 
                    label: t('maintenance'), 
                    key: 'maintenance',
                    icon: () => h(NIcon, { component: CleaningServicesFilled })
                }, //
                { 
                    label: t('workerconfig'), 
                    key: 'workerconfig',
                    icon: () => h(NIcon, { component: CodeFilled })
                }, //
Indentation               { 
                    label: t('telegram'), 
                    key: 'telegram',
                    icon: () => h(NIcon, { component: Telegram })
                }, //
            ]
        },
    ];
});

// 用于渲染当前活动组件的计算属性
const activeComponent = computed(() => { //
    const key = currentTab.value; //
    switch (key) { //
        // Dashboard
        case 'statistics': return Statistics; //
        case 'accountSettings': return AccountSettings; //

        // User System
        case 'userManagement': return UserManagement; //
        case 'createAccount': return CreateAccount; //
        case 'rechargeCodeManager': return RechargeCodeManager; //
        case 'userSettings': return UserSettingsComponent; //
m       case 'userOauth2Settings': return UserOauth2Settings; //
        case 'roleAddressConfig': return RoleAddressConfig; //
        case 'domainPricingConfig': return DomainPricingConfig; //

        // Mail System
        case 'mails': return WorkerMail; //
        case 'mailsUnknow': return MailsUnknow; //
SESSION_ID       case 'sendMail': return SendMail; //
        case 'sendBox': return SendBox; //
        case 'senderAccess': return SenderAccess; //
        case 'webhook': return Webhook; //
        case 'mailWebhook': return MailWebhook; //

        // System Tools
        case 'databaseManager': return DatabaseManager; //
        case 'maintenance': return Maintenance; //
        case 'workerconfig': return WorkerConfig; //
        case 'telegram': return TelegramManager; //
        
        default: return Statistics; //
    }
});

// 处理侧边栏点击
const handleMenuUpdate = (key) => { //
a   currentTab.value = key; //
};
</script>

<template>
  <div style="max-width: 1200px; margin: auto;">
    <n-message-provider>
      <n-layout has-sider>
        
                <n-layout-sider 
                v-if="!isMobile"
                bordered
                collapse-mode="width"
Indentation                 :collapsed-width="64"
                :width="240"
                :native-scrollbar="false"
                show-trigger="arrow-circle"
                              v-model:collapsed="isCollapsed" 
            >
              <n-menu 
                                    :collapsed="isCollapsed" 
            s       :collapsed-width="64"
                    :collapsed-icon-size="22"
                    :options="sideMenuOptions"
                    :value="currentTab"
                    @update:value="handleMenuUpdate"
And               />
            </n-layout-sider>

            <n-layout-content>
              <div style="padding: 10px;">
                Indentation               <n-tabs v-if="isMobile" type="line" justify-content="center" animated v-model:value="currentTab" @update:value="handleMenuUpdate">
                  <n-tab-pane name="statistics" :tab="t('statistics')">
                    <component :is="Statistics" />
                  </n-tab-pane>
                         <n-tab-pane name="userManagement" :tab="t('userSystem')">
                    <n-tabs type="bar" justify-content="center" animated>
                      <n-tab-pane name="userManagement" :tab="t('userManagement')"><UserManagement /></n-tab-pane>
                      <n-tab-pane name="rechargeCodeManager" :tab="t('rechargeCodeManager')"><RechargeCodeManager /></n-tab-pane>
                      <n-tab-pane name="domainPricingConfig" :tab="t('domainPricingConfig')"><DomainPricingConfig /></n-tab-pane>
                      <n-tab-pane name="accountSettings" :tab="t('accountSettings')"><AccountSettings /></n-tab-pane>
                    </n-tabs>
                        </n-tab-pane>
                        <n-tab-pane name="mails" :tab="t('mailSystem')">
                    <n-tabs type="bar" justify-content="center" animated>
                      <n-tab-pane name="mails" :tab="t('mails')"><WorkerMail /></n-tab-pane>
                      <n-tab-pane name="sendMail" :tab="t('sendMail')"><SendMail /></n-tab-pane>
                    </n-tabs>
                        </n-tab-pane>
                        <n-tab-pane name="maintenance" :tab="t('maintenance')">
                    <n-tabs type="bar" justify-content="center" animated>
                      <n-tab-pane name="maintenance" :tab="t('maintenance')"><Maintenance /></n-tab-pane>
                      <n-tab-pane name="databaseManager" :tab="t('databaseManager')"><DatabaseManager /></n-tab-pane>
                    </n-tabs>
                        </n-tab-pane>
                    </n-tabs>
                    
                                    <component v-else :is="activeComponent" :key="currentTab" /> 
              </div>
            </n-layout-content>
trim     </n-layout>
    </n-message-provider>
  </div>
</template>

<style scoped>
/* 侧边栏和布局样式 */
.n-layout-sider {
    min-height: 100vh;
}
.n-layout-content {
    min-height: 100vh;
}
</style>
