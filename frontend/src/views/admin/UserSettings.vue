<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NInput, NButton, NCard, NSwitch, NForm, NFormItem, NSelect, NInputNumber } from 'naive-ui'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const message = useMessage()
const { openSettings } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            title: 'User Settings',
            enable: 'Enable User Registration',
            enableMailVerify: 'Enable Email Verification',
            verifyMailSender: 'Verification Email Sender',
            enableMailAllowList: 'Enable Email Allowlist',
            mailAllowList: 'Email Allowlist (One per line)',
            save: 'Save',
            saveSuccess: 'Saved successfully',
            maxAddressCount: 'Max Address Count'
        },
        zh: {
            title: '用户设置',
            enable: '启用用户注册',
            enableMailVerify: '启用邮箱验证',
            verifyMailSender: '验证邮件发送者',
            enableMailAllowList: '启用邮箱白名单',
            mailAllowList: '邮箱白名单 (每行一个)',
            save: '保存',
            saveSuccess: '保存成功',
            maxAddressCount: '最大地址数量'
        }
    }
});

const settings = ref({
    enable: false,
    enableMailVerify: false,
    verifyMailSender: "",
    enableMailAllowList: false,
    mailAllowList: [],
    maxAddressCount: 5
})

const mailAllowListStr = computed({
    get: () => (settings.value.mailAllowList || []).join('\n'),
    set: (val) => {
        settings.value.mailAllowList = val.split('\n').map(v => v.trim()).filter(v => v)
    }
})

const fetchData = async () => {
    try {
        const res = await api.fetch("/admin/user_settings");
        Object.assign(settings.value, res);
    } catch (error) {
        message.error(error.message || "error");
    }
}

const save = async () => {
    try {
        await api.fetch("/admin/user_settings", {
            method: 'POST',
            body: JSON.stringify(settings.value)
        });
        message.success(t('saveSuccess'));
    } catch (error) {
        message.error(error.message || "error");
    }
}

onMounted(() => {
    fetchData();
})
</script>

<template>
    <div class="center">
        <n-card style="max-width: 800px;" :title="t('title')">
            <n-form>
                <n-form-item :label="t('enable')">
                    <n-switch v-model:value="settings.enable" />
                </n-form-item>
                <n-form-item :label="t('maxAddressCount')">
                    <n-input-number v-model:value="settings.maxAddressCount" />
                </n-form-item>
                <n-form-item :label="t('enableMailVerify')">
                    <n-switch v-model:value="settings.enableMailVerify" />
                </n-form-item>
                <n-form-item :label="t('verifyMailSender')" v-if="settings.enableMailVerify">
                    <n-input v-model:value="settings.verifyMailSender" placeholder="verify@example.com" />
                </n-form-item>
                
                <n-form-item :label="t('enableMailAllowList')">
                    <n-switch v-model:value="settings.enableMailAllowList" />
                </n-form-item>
                <n-form-item :label="t('mailAllowList')" v-if="settings.enableMailAllowList">
                    <n-input v-model:value="mailAllowListStr" type="textarea" :rows="5" />
                </n-form-item>
                <n-button type="primary" @click="save" block>
                    {{ t('save') }}
                </n-button>
            </n-form>
        </n-card>
    </div>
</template>

<style scoped>
.center {
    display: flex;
    justify-content: center;
}
</style>
