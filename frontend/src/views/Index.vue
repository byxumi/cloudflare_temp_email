<script setup>
import { defineAsyncComponent, onMounted, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, NButton, NIcon, NCard, NSpace, NModal } from 'naive-ui'
import { User } from '@vicons/fa'

import { useGlobalState } from '../store'
import { api } from '../api'
import { useIsMobile } from '../utils/composables'
import { FullscreenExitOutlined } from '@vicons/material'

import AddressBar from './index/AddressBar.vue';
import MailBox from '../components/MailBox.vue';
import SendBox from '../components/SendBox.vue';
import AutoReply from './index/AutoReply.vue';
import AccountSettings from './index/AccountSettings.vue';
import Appearance from './common/Appearance.vue';
import Webhook from './index/Webhook.vue';
import Attachment from './index/Attachment.vue';
import About from './common/About.vue';
import SimpleIndex from './index/SimpleIndex.vue';
import UserLogin from './user/UserLogin.vue'
// [新增] 引入地址管理组件
import AddressManagement from './user/AddressManagement.vue'

const { loading, settings, openSettings, indexTab, globalTabplacement, useSimpleIndex, userJwt } = useGlobalState()
const message = useMessage()
const route = useRoute()
const router = useRouter()
const isMobile = useIsMobile()
const showLoginModal = ref(false)

const SendMail = defineAsyncComponent(() => {
  loading.value = true;
  return import('./index/SendMail.vue')
    .finally(() => loading.value = false);
});

const { t } = useI18n({
  messages: {
    en: {
      mailbox: 'Mail Box',
      sendbox: 'Send Box',
      sendmail: 'Send Mail',
      auto_reply: 'Auto Reply',
      accountSettings: 'Account Settings',
      appearance: 'Appearance',
      about: 'About',
      s3Attachment: 'S3 Attachment',
      saveToS3Success: 'save to s3 success',
      webhookSettings: 'Webhook Settings',
      query: 'Query',
      enterSimpleMode: 'Simple Mode',
      login: 'User Login',
      loginTip: 'Please login to access your mailbox',
      addressManagement: 'Address Management'
    },
    zh: {
      mailbox: '收件箱',
      sendbox: '发件箱',
      sendmail: '发送邮件',
      auto_reply: '自动回复',
      accountSettings: '账户',
      appearance: '外观',
      about: '关于',
      s3Attachment: 'S3附件',
      saveToS3Success: '保存到s3成功',
      webhookSettings: 'Webhook 设置',
      query: '查询',
      enterSimpleMode: '极简模式',
      login: '用户登录',
      loginTip: '请登录以使用邮箱服务',
      addressManagement: '地址管理'
    }
  }
});

const fetchMailData = async (limit, offset) => {
  if (mailIdQuery.value > 0) {
    const singleMail = await api.fetch(`/api/mail/${mailIdQuery.value}`);
    if (singleMail) return { results: [singleMail], count: 1 };
    return { results: [], count: 0 };
  }
  return await api.fetch(`/api/mails?limit=${limit}&offset=${offset}`);
};

const deleteMail = async (curMailId) => {
  await api.fetch(`/api/mails/${curMailId}`, { method: 'DELETE' });
};

const deleteSenboxMail = async (curMailId) => {
  await api.fetch(`/api/sendbox/${curMailId}`, { method: 'DELETE' });
};

const fetchSenboxData = async (limit, offset) => {
  return await api.fetch(`/api/sendbox?limit=${limit}&offset=${offset}`);
};

const saveToS3 = async (mail_id, filename, blob) => {
  try {
    const { url } = await api.fetch(`/api/attachment/put_url`, {
      method: 'POST',
      body: JSON.stringify({ key: `${mail_id}/${filename}` })
    });
    const formData = new FormData();
    formData.append(filename, blob);
    await fetch(url, {
      method: 'PUT',
      body: formData
    });
    message.success(t('saveToS3Success'));
  } catch (error) {
    console.error(error);
    message.error(error.message || "save to s3 error");
  }
}

const mailBoxKey = ref("")
const mailIdQuery = ref("")
const showMailIdQuery = ref(false)

const queryMail = () => {
  mailBoxKey.value = Date.now();
}

const checkLogin = () => {
  if (userJwt.value) {
    router.push('/user')
  }
}

watch(route, () => {
  if (!route.query.mail_id) {
    showMailIdQuery.value = false;
    mailIdQuery.value = "";
    queryMail();
  }
})

onMounted(async () => {
  if (route.query.mail_id) {
    showMailIdQuery.value = true;
    mailIdQuery.value = route.query.mail_id;
    queryMail();
  }
})
</script>

<template>
  <div>
    <div v-if="useSimpleIndex">
      <SimpleIndex />
    </div>
    <div v-else>
      <div v-if="userJwt" style="padding: 20px;">
        <n-card :title="t('addressManagement')">
          <AddressManagement />
        </n-card>
      </div>

      <div v-else-if="settings.address">
        <AddressBar />
        <n-tabs type="card" v-model:value="indexTab" :placement="globalTabplacement">
          <template #prefix v-if="!isMobile">
            <n-button @click="useSimpleIndex = true" tertiary size="small">
              <template #icon>
                <n-icon>
                  <FullscreenExitOutlined />
                </n-icon>
              </template>
              {{ t('enterSimpleMode') }}
            </n-button>
          </template>
          <n-tab-pane name="mailbox" :tab="t('mailbox')">
            <div v-if="showMailIdQuery" style="margin-bottom: 10px;">
              <n-input-group>
                <n-input v-model:value="mailIdQuery" />
                <n-button @click="queryMail" type="primary" tertiary>
                  {{ t('query') }}
                </n-button>
              </n-input-group>
            </div>
            <MailBox :key="mailBoxKey" :showEMailTo="false" :showReply="true" :showSaveS3="openSettings.isS3Enabled"
              :saveToS3="saveToS3" :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
              :fetchMailData="fetchMailData" :deleteMail="deleteMail" />
          </n-tab-pane>
          <n-tab-pane name="sendbox" :tab="t('sendbox')">
            <SendBox :fetchMailData="fetchSenboxData" :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
              :deleteMail="deleteSenboxMail" />
          </n-tab-pane>
          <n-tab-pane name="sendmail" :tab="t('sendmail')">
            <SendMail />
          </n-tab-pane>
          <n-tab-pane name="accountSettings" :tab="t('accountSettings')">
            <AccountSettings />
          </n-tab-pane>
          <n-tab-pane name="appearance" :tab="t('appearance')">
            <Appearance :showUseSimpleIndex="true" />
          </n-tab-pane>
          <n-tab-pane v-if="openSettings.enableAutoReply" name="auto_reply" :tab="t('auto_reply')">
            <AutoReply />
          </n-tab-pane>
          <n-tab-pane v-if="openSettings.enableWebhook" name="webhook" :tab="t('webhookSettings')">
            <Webhook />
          </n-tab-pane>
          <n-tab-pane v-if="openSettings.isS3Enabled" name="s3_attachment" :tab="t('s3Attachment')">
            <Attachment />
          </n-tab-pane>
          <n-tab-pane v-if="openSettings.enableIndexAbout" name="about" :tab="t('about')">
            <About />
          </n-tab-pane>
        </n-tabs>
      </div>

      <div v-else class="landing-container">
        <n-card class="login-card" :bordered="false">
          <n-space vertical align="center" size="large">
            <h2 style="margin-bottom: 0; color: #666;">{{ t('loginTip') }}</h2>
            <n-button type="primary" size="large" round style="width: 200px; height: 50px; font-size: 18px;"
              @click="showLoginModal = true">
              <template #icon>
                <n-icon size="24">
                  <User />
                </n-icon>
              </template>
              {{ t('login') }}
            </n-button>
          </n-space>
        </n-card>
      </div>
    </div>

    <n-modal v-model:show="showLoginModal" preset="card" style="width: 400px;" :title="t('login')">
      <UserLogin @login-success="checkLogin" />
    </n-modal>
  </div>
</template>

<style scoped>
.landing-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.login-card {
  max-width: 500px;
  width: 90%;
  text-align: center;
  background-color: transparent;
}
</style>