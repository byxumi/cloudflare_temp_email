// frontend/src/views/admin/RechargeCodeManager.vue (新文件)

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n'
import { NButton, NInputNumber, NTable, NModal, NForm, NFormItem, NInput, NTabs, NTabPane, NAlert, NTag, NSpace, NDivider } from 'naive-ui';
import { api } from '../../api'

const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            // ... (英文消息)
            rechargeCodeManager: 'Recharge Code Manager',
            codeList: 'Code List',
            createCode: 'Create Code',
            codeValue: 'Code Value (Units)',
            codeCount: 'Number of Codes',
            validDays: 'Valid Days (0 for Permanent)',
            create: 'Create',
            successCodeCreate: 'Successfully created {count} codes. Please save them.',
            code: 'Code',
            value: 'Value',
            createdAt: 'Created At',
            expiresAt: 'Expires At',
            usedBy: 'Used By',
            usedAt: 'Used At',
            notUsed: 'Not Used',
            permanent: 'Permanent',
            used: 'Used',
            unused: 'Unused',
            showing: 'Showing {count} codes',
            loadMore: 'Load More',
            current: 'Current',
        },
        zh: {
            // ... (中文消息)
            rechargeCodeManager: '卡密管理',
            codeList: '卡密列表',
            createCode: '生成卡密',
            codeValue: '卡密价值 (余额单位)',
            codeCount: '生成数量',
            validDays: '有效期 (天, 0 为永久)',
            create: '生成',
            successCodeCreate: '成功生成 {count} 个卡密。请务必保存！',
            code: '卡密',
            value: '价值',
            createdAt: '创建时间',
            expiresAt: '过期时间',
            usedBy: '使用者',
            usedAt: '使用时间',
            notUsed: '未使用',
            permanent: '永久',
            used: '已使用',
            unused: '未使用',
            showing: '当前显示 {count} 条',
            loadMore: '加载更多',
            current: '当前',
        }
    }
});

const showCreateModal = ref(false);
const createForm = ref({
    value: 10,
    days: 0,
    count: 1
});

const codes = ref([]);
const codeCount = ref(0);
const loadingList = ref(false);
const showCopyCode = ref(false);
const currentCodes = ref('');
const listOffset = ref(0);
const pageSize = 20;

const activeTab = ref('unused');

const fetchList = async (reset = false) => {
    loadingList.value = true;
    if (reset) {
        codes.value = [];
        listOffset.value = 0;
    }

    const usedFilter = activeTab.value === 'used' ? 'true' : activeTab.value === 'unused' ? 'false' : '';

    try {
        const res = await api.fetch(`/admin/recharge_codes?limit=${pageSize}&offset=${listOffset.value}&used=${usedFilter}`);
        codeCount.value = res.count;
        codes.value.push(...res.results);
        listOffset.value += pageSize;
    } catch (error) {
        message.error(error.message || "获取卡密列表失败");
    } finally {
        loadingList.value = false;
    }
};

const handleCreate = async () => {
    try {
        const res = await api.fetch(`/admin/recharge_codes`, {
            method: 'POST',
            body: JSON.stringify(createForm.value)
        });
        showCreateModal.value = false;
        currentCodes.value = res.codes.join('\n');
        showCopyCode.value = true;
        message.success(t('successCodeCreate', { count: res.count }));
        await fetchList(true); // 刷新列表
    } catch (error) {
        message.error(error.message || "生成卡密失败");
    }
};

const formatDate = (dateString) => {
    if (!dateString) return t('permanent');
    return new Date(dateString).toLocaleString();
};

onMounted(() => fetchList(true));
</script>

<template>
    <div style="max-width: 1000px; margin: 20px auto;">
        <n-alert title="卡密管理说明" type="info" style="margin-bottom: 20px;">
            卡密用于给用户账户增加余额，可设置余额数值和有效期。
        </n-alert>

        <n-space justify="space-between" style="margin-bottom: 15px;">
            <n-button type="primary" @click="showCreateModal = true">{{ t('createCode') }}</n-button>
            <n-tag type="info">{{ t('current') }} {{ t('showing', { count: codes.length }) }} / {{ codeCount }}</n-tag>
        </n-space>

        <n-tabs v-model:value="activeTab" type="card" @update:value="fetchList(true)">
            <n-tab-pane name="unused" :tab="t('unused')">
            </n-tab-pane>
            <n-tab-pane name="used" :tab="t('used')">
            </n-tab-pane>
        </n-tabs>

        <n-table :bordered="false" :single-line="false" style="min-width: 800px;">
            <thead>
                <tr>
                    <th>{{ t('code') }}</th>
                    <th>{{ t('value') }}</th>
                    <th>{{ t('expiresAt') }}</th>
                    <th>{{ t('usedBy') }}</th>
                    <th>{{ t('usedAt') }}</th>
                    <th>{{ t('createdAt') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="code in codes" :key="code.id">
                    <td>{{ code.code }}</td>
                    <td><n-tag type="success">{{ code.value }}</n-tag></td>
                    <td>{{ formatDate(code.expires_at) }}</td>
                    <td>{{ code.used_by ? `User ID: ${code.used_by}` : t('notUsed') }}</td>
                    <td>{{ code.used_at ? formatDate(code.used_at) : t('notUsed') }}</td>
                    <td>{{ new Date(code.created_at).toLocaleString() }}</td>
                </tr>
            </tbody>
        </n-table>

        <n-space justify="center" style="margin-top: 20px;">
            <n-button v-if="codes.length < codeCount" :loading="loadingList" @click="fetchList()">
                {{ t('loadMore') }}
            </n-button>
        </n-space>

        <n-modal v-model:show="showCreateModal" preset="dialog" :title="t('createCode')">
            <n-form :model="createForm">
                <n-form-item :label="t('codeValue')" path="value">
                    <n-input-number v-model:value="createForm.value" :min="1" style="width: 100%;" />
                </n-form-item>
                <n-form-item :label="t('validDays')" path="days">
                    <n-input-number v-model:value="createForm.days" :min="0" style="width: 100%;" />
                </n-form-item>
                <n-form-item :label="t('codeCount')" path="count">
                    <n-input-number v-model:value="createForm.count" :min="1" :max="100" style="width: 100%;" />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button @click="showCreateModal = false">{{ t('cancel') }}</n-button>
                <n-button type="primary" :loading="loadingList" @click="handleCreate">{{ t('create') }}</n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showCopyCode" preset="dialog" title="请保存生成的卡密">
            <n-alert type="warning" style="margin-bottom: 10px;">
                请立即复制并保存以下卡密，关闭后将无法再次查看！
            </n-alert>
            <n-input type="textarea" :rows="10" :value="currentCodes" readonly />
            <template #action>
                <n-button @click="showCopyCode = false">关闭</n-button>
            </template>
        </n-modal>
    </div>
</template>

<style scoped>
/* 样式 */
</style>
