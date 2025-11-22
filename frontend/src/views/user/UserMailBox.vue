<script setup>
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '../../api'
import { useGlobalState } from '../../store'
import MailBox from '../../components/MailBox.vue'

const { userSettings, openSettings } = useGlobalState()
const message = useMessage()

// 这是一个 key，用于强制刷新 MailBox 组件
const mailBoxKey = ref(Date.now())

// [关键修复] 修改 fetchMailData 逻辑，不传 address 参数以获取所有邮件
const fetchMailData = async (limit, offset) => {
    // 调用 user_api/mails
    // 后端逻辑：如果不传 address 参数，则返回所有绑定地址的邮件
    return await api.fetch(`/user_api/mails?limit=${limit}&offset=${offset}`);
};

const deleteMail = async (mailId) => {
    await api.fetch(`/user_api/mails/${mailId}`, { method: 'DELETE' });
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
        message.success("Saved to S3");
    } catch (error) {
        console.error(error);
        message.error(error.message || "Save to S3 error");
    }
}
</script>

<template>
    <div v-if="userSettings.user_email">
        <MailBox 
            :key="mailBoxKey"
            :showEMailTo="true" 
            :showReply="false"
            :showSaveS3="openSettings.isS3Enabled"
            :saveToS3="saveToS3"
            :enableUserDeleteEmail="true"
            :fetchMailData="fetchMailData"
            :deleteMail="deleteMail"
        />
    </div>
</template>