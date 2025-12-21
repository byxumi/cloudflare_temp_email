<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n'
import { NButton, NForm, NFormItemRow, NInput, NCard, NFlex, useMessage } from 'naive-ui'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading } = useGlobalState()
const message = useMessage()

const { t } = useI18n({
    messages: {
        en: {
            save: 'Save',
            successTip: 'Save Success',
            frontendVersion: 'Frontend Version',
            frontendVersionTip: 'Enter the version number to display in the header (e.g. v1.0.0)'
        },
        zh: {
            save: '保存',
            successTip: '保存成功',
            frontendVersion: '前端版本号',
            frontendVersionTip: '输入要在顶部栏显示的版本号 (例如 v1.0.0)'
        }
    }
});

const formModel = ref({
    frontendVersion: ""
});

// 我们需要读取完整的 user_settings，修改其中的 version，然后再保存回去
const fullUserSettings = ref({});

const fetchData = async () => {
    try {
        const res = await api.fetch(`/admin/user_settings`)
        fullUserSettings.value = res;
        formModel.value.frontendVersion = res.frontendVersion || "";
    } catch (error) {
        message.error(error.message || "error");
    }
}

const save = async () => {
    try {
        // 合并旧设置和新版本号
        const payload = {
            ...fullUserSettings.value,
            frontendVersion: formModel.value.frontendVersion
        };
        
        await api.fetch(`/admin/user_settings`, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
        message.success(t('successTip'))
        // 刷新本地数据
        await fetchData();
    } catch (error) {
        message.error(error.message || "error");
    }
}

onMounted(async () => {
    await fetchData();
})
</script>

<template>
    <div class="version-settings">
        <n-card :bordered="false" embedded style="max-width: 600px; margin: 0 auto;">
            <n-form>
                <n-form-item-row :label="t('frontendVersion')">
                    <n-input 
                        v-model:value="formModel.frontendVersion" 
                        :placeholder="t('frontendVersionTip')" 
                    />
                </n-form-item-row>
                <n-flex justify="end">
                    <n-button @click="save" type="primary" :loading="loading">
                        {{ t('save') }}
                    </n-button>
                </n-flex>
            </n-form>
        </n-card>
    </div>
</template>

<style scoped>
.version-settings {
    margin-top: 20px;
}
</style>
