<script setup>
import { computed, ref, h } from 'vue';
import { useI18n } from 'vue-i18n';
import { startRegistration } from '@simplewebauthn/browser';
import { NButton, NPopconfirm, NCard, NDivider, NForm, NFormItem, NInput, NTabs, NTabPane, NSpace, NTag, NAlert, NDataTable, NModal, useMessage } from 'naive-ui'; // 确保导入所有组件

import { useGlobalState } from '../../store';
import { api } from '../../api';

const message = useMessage();
const { userJwt, userSettings, loading } = useGlobalState();

const showLogout = ref(false)
const showCreatePasskey = ref(false)
const passkeyName = ref('')
const showPasskeyList = ref(false)
const showRenamePasskey = ref(false)
const currentPasskeyId = ref(null)
const currentPasskeyName = ref('')
const codeToRedeem = ref(''); // 卡密输入状态

const passkeyData = ref([])

const { t } = useI18n({
    messages: {
        en: {
            logout: 'Logout',
            logoutConfirm: 'Are you sure you want to logout?',
            passordTip: 'The server will only receive the hash value of the password, and will not receive the plaintext password, so it cannot view or retrieve your password. If the administrator enables email verification, you can reset the password in incognito mode',
            createPasskey: 'Create Passkey',
            showPasskeyList: 'Show Passkey List',
            passkeyCreated: 'Passkey created successfully',
            passkeyNamePlaceholder: 'Please enter the passkey name or leave it empty to generate a random one',
            renamePasskey: 'Rename Passkey',
            deletePasskey: 'Delete Passkey',
            passkey_name: 'Passkey Name',
            created_at: 'Created At',
            updated_at: 'Updated At',
            actions: 'Actions',
            renamePasskeyNamePlaceholder: 'Please enter the new passkey name',

            // New Recharge Messages
            userSettings: 'User Settings',
            baseInfo: 'Basic Info',
            userEmail: 'Email',
            userRole: 'Role',
            currentBalance: 'Current Balance',
            redeemCode: 'Recharge Code',
            enterCode: 'Enter Recharge Code',
            redeem: 'Redeem',
            successRedeem: 'Redeem successful!',
            // End New Messages
        },
        zh: {
            logout: '退出登录',
            logoutConfirm: '确定要退出登录吗？',
            passordTip: '服务器只会接收到密码的哈希值，不会接收到明文密码，因此无法查看或者找回您的密码, 如果管理员启用了邮件验证您可以在无痕模式重置密码',
            createPasskey: '创建 Passkey',
            showPasskeyList: '查看 Passkey 列表',
            passkeyCreated: 'Passkey 创建成功',
            passkeyNamePlaceholder: '请输入 Passkey 名称或者留空自动生成',
            renamePasskey: '重命名 Passkey',
            deletePasskey: '删除 Passkey',
            passkey_name: 'Passkey 名称',
            created_at: '创建时间',
            updated_at: '更新时间',
            actions: '操作',
            renamePasskeyNamePlaceholder: '请输入新的 Passkey 名称',

            // New Recharge Messages
            userSettings: '个人中心',
            baseInfo: '基本信息',
            userEmail: '用户邮箱',
            userRole: '用户角色',
            currentBalance: '当前余额',
            redeemCode: '卡密兑换',
            enterCode: '输入卡密',
            redeem: '兑换',
            successRedeem: '兑换成功！',
            // End New Messages
        }
    }
});


const logout = async () => {
    userJwt.value = '';
    location.reload()
}

// === Recharge Code Logic ===
const handleRedeem = async () => {
    if (!codeToRedeem.value) {
        message.warning("卡密不能为空");
        return;
    }
    
    // 假设 api.redeemCode 已在 api/index.js 中定义
    try {
        const res = await api.redeemCode(codeToRedeem.value);
        if (res.success) {
            // 刷新用户余额
            await api.getUserSettings(message); 
            message.success(t('successRedeem') + ` ${res.new_balance} (新余额)`);
            codeToRedeem.value = '';
        } else {
            message.error(res.message || "兑换失败");
        }
    } catch (error) {
        message.error(error.message || "兑换失败");
    }
};

// === Passkey Logic ===
const fetchPasskeyList = async () => {
    try {
        const data = await api.fetch(`/user_api/passkey`)
        passkeyData.value = data
    } catch (e) {
        console.error(e)
        message.error(e.message)
    }
}

const createPasskey = async () => {
    try {
        const options = await api.fetch(`/user_api/passkey/register_request`, {
            method: 'POST',
            body: JSON.stringify({
                domain: location.hostname,
            })
        })
        const credential = await startRegistration(options)

        // Send the result to the server and return the promise.
        await api.fetch(`/user_api/passkey/register_response`, {
            method: 'POST',
            body: JSON.stringify({
                origin: location.origin,
                passkey_name: passkeyName.value || (
                    (window.navigator.userAgentData?.platform || "Unknown")
                    + ": " + Math.random().toString(36).substring(7)
                ),
                credential
            })
        })
        message.success(t('passkeyCreated'));
    } catch (e) {
        console.error(e)
        message.error(e.message)
    } finally {
        passkeyName.value = ''
        showCreatePasskey.value = false
    }
}

const renamePasskey = async () => {
    try {
        await api.fetch(`/user_api/passkey/rename`, {
            method: 'POST',
            body: JSON.stringify({
                passkey_name: currentPasskeyName.value,
                passkey_id: currentPasskeyId.value
            })
        })
        await fetchPasskeyList()
    } catch (e) {
        console.error(e)
        message.error(e.message)
    } finally {
        currentPasskeyName.value = ''
        showRenamePasskey.value = false
    }
}

const passkeyColumns = [
    {
        title: "Passkey ID",
        key: "passkey_id"
    },
    {
        title: t('passkey_name'),
        key: "passkey_name"
    },
    {
        title: t('created_at'),
        key: "created_at"
    },
    {
        title: t('updated_at'),
        key: "updated_at"
    },
    {
        title: t('actions'),
        key: 'actions',
        render(row) {
            return h('div', [
                [
                    h(NButton,
                        {
                            secondary: true,
                            type: "primary",
                            onClick: () => {
                                showRenamePasskey.value = true;
                                currentPasskeyId.value = row.passkey_id;
                                currentPasskeyName.value = row.passkey_name;
                            }
                        },
                        { default: () => t('renamePasskey') }
                    ),
                    h(NPopconfirm,
                        {
                            onPositiveClick: async () => {
                                try {
                                    await api.fetch(`/user_api/passkey/${row.passkey_id}`, {
                                        method: 'DELETE'
                                    })
                                    await fetchPasskeyList()
                                } catch (e) {
                                    console.error(e)
                                    message.error(e.message)
                                }
                            }
                        },
                        {
                            trigger: () => h(NButton,
                                {
                                    secondary: true,
                                    type: "error",
                                    style: "margin-left: 8px;"
                                },
                                { default: () => t('deletePasskey') }
                            ),
                            default: () => `${t('deletePasskey')}?`
                        }
                    ),
                ]
            ])
        }
    }
]

</script>

<template>
    <div class="center" v-if="userSettings.user_email">
        <n-card :bordered="false" embedded style="max-width: 800px;">
            <n-tabs type="line" :value="'info'" animated>
                <n-tab-pane name="info" :tab="t('baseInfo')">
                    <n-form :label-width="120" label-placement="left">
                        <n-form-item :label="t('userEmail')">
                            <n-input :value="userSettings.user_email" disabled />
                        </n-form-item>
                        <n-form-item :label="t('userRole')">
                            <n-tag type="info">{{ userSettings.user_role?.role || 'Normal' }}</n-tag>
                        </n-form-item>
                        <n-form-item :label="t('currentBalance')">
                            <n-tag type="success" size="large">{{ userSettings.balance }}</n-tag>
                        </n-form-item>

                        <n-divider>{{ t('redeemCode') }}</n-divider>

                        <n-form-item :label="t('enterCode')">
                            <n-space style="width: 100%;">
                                <n-input v-model:value="codeToRedeem" :placeholder="t('enterCode')" style="flex-grow: 1;" @keyup.enter="handleRedeem" />
                                <n-button type="success" :loading="loading" @click="handleRedeem">
                                    {{ t('redeem') }}
                                </n-button>
                            </n-space>
                        </n-form-item>
                    </n-form>
                </n-tab-pane>

                <n-tab-pane name="security" :tab="t('security')">
                    <n-alert :show-icon="false" :bordered="false" type="info" style="margin-bottom: 15px;">
                        <span>
                            {{ t('passordTip') }}
                        </span>
                    </n-alert>

                    <n-space vertical>
                        <n-button @click="showPasskeyList = true; fetchPasskeyList();" secondary block strong>
                            {{ t('showPasskeyList') }}
                        </n-button>
                        <n-button @click="showCreatePasskey = true" type="primary" secondary block strong>
                            {{ t('createPasskey') }}
                        </n-button>
                        <n-button @click="showLogout = true" secondary block strong>
                            {{ t('logout') }}
                        </n-button>
                    </n-space>
                </n-tab-pane>
            </n-tabs>
        </n-card>

        <n-modal v-model:show="showCreatePasskey" preset="dialog" :title="t('createPasskey')">
            <n-input v-model:value="passkeyName" :placeholder="t('passkeyNamePlaceholder')" />
            <template #action>
                <n-button :loading="loading" @click="createPasskey" size="small" tertiary type="primary">
                    {{ t('createPasskey') }}
                </n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showRenamePasskey" preset="dialog" :title="t('renamePasskey')">
            <n-input v-model:value="currentPasskeyName" :placeholder="t('renamePasskeyNamePlaceholder')" />
            <template #action>
                <n-button :loading="loading" @click="renamePasskey" size="small" tertiary type="primary">
                    {{ t('renamePasskey') }}
                </n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showPasskeyList" preset="card" :title="t('showPasskeyList')" style="width: 80%;">
            <n-data-table :columns="passkeyColumns" :data="passkeyData" :bordered="false" embedded />
        </n-modal>

        <n-modal v-model:show="showLogout" preset="dialog" :title="t('logout')">
            <p>{{ t('logoutConfirm') }}</p>
            <template #action>
                <n-button :loading="loading" @click="logout" size="small" tertiary type="warning">
                    {{ t('logout') }}
                </n-button>
            </template>
        </n-modal>
    </div>
</template>

<style scoped>
.center {
    display: flex;
    justify-content: center;
}

.n-card {
    max-width: 800px;
    text-align: left;
    margin-top: 20px;
}

.n-form-item {
    margin-bottom: 12px;
}
</style>
