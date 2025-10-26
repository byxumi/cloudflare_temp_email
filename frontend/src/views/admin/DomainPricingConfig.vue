<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n'
import { NButton, NInputNumber, NTag, NDivider, NCollapse, NCollapseItem, NFormItemRow, NAlert, NSelect, useMessage, NFlex } from 'naive-ui';
import { api } from '../../api'

const message = useMessage()
const { t } = useI18n({
    messages: {
        en: {
            save: 'Save',
            successTip: 'Save Success',
            defaultCost: 'Default Cost (Units)',
            domainPrices: 'Domain Prices',
            roleOverrides: 'Role Overrides',
            role: 'Role',
            defaultCostOverride: 'Default Cost Override',
            domainPricesOverride: 'Domain Prices Override',
            addRoleOverride: 'Add Role Override',
            delete: 'Delete',
            price: 'Price (0 or "free")',
            domain: 'Domain',
            costUnit: 'Units',
            selectRole: 'Select Role',
            domainPricingDesc: 'Configure costs for creating a new address. The creation cost will be deducted from the user\'s balance. The priority is: Role Domain Override > Domain Price > Role Default Override > Global Default Cost.',
            setToFree: 'Set Free',
            setToDefault: 'Set to Default',
            newRolePlaceholder: 'Unselected Role'
        },
        zh: {
            save: '保存',
            successTip: '保存成功',
            defaultCost: '全局默认成本 (单位)',
            domainPrices: '域名价格',
            roleOverrides: '角色重写规则',
            role: '角色',
            defaultCostOverride: '默认成本重写',
            domainPricesOverride: '域名价格重写',
            addRoleOverride: '添加角色重写',
            delete: '删除',
            price: '价格 (0 或 "free")',
            domain: '域名',
            costUnit: '单位',
            selectRole: '选择角色',
            domainPricingDesc: '配置创建新地址的成本。该成本将从用户的余额中扣除。优先级为: 角色域名重写 > 域名价格 > 角色默认重写 > 全局默认成本。',
            setToFree: '设为免费',
            setToDefault: '设为默认',
            newRolePlaceholder: '未选定角色'
        }
    }
});

const config = ref({
    defaultCost: 0,
    domainPrices: {},
    roleOverrides: {}
});

const systemRoles = ref([]);
const domainsOptions = ref([]);

/**
 * 从 Worker 加载定价配置和域名列表
 */
const fetchData = async () => {
    try {
        // 1. 获取定价配置
        const pricingRes = await api.fetch(`/admin/domain_pricing_config`);
        Object.assign(config.value, pricingRes);
        
        // 2. 获取系统角色列表
        // 假设 Admin API 有一个 /admin/user_roles 端点
        const rolesRes = await api.fetch(`/admin/user_roles`); 
        systemRoles.value = rolesRes.map(r => r.role);

        // 3. 获取域名列表
        const openSettings = await api.getOpenSettings(message); 
        domainsOptions.value = openSettings.domains.map(d => ({ label: d, value: d }));

    } catch (error) {
        message.error(error.message || "获取配置失败");
    }
}

/**
 * 保存配置到 Worker
 */
const save = async () => {
    try {
        const configToSave = JSON.parse(JSON.stringify(config.value));

        // 清理 domainPrices，确保没有空值
        for (const domain in configToSave.domainPrices) {
            const price = configToSave.domainPrices[domain];
            if (price === null || price === undefined || price === '') {
                configToSave.domainPrices[domain] = 0;
            }
        }
        
        // 移除未选定角色的临时占位符
        if (configToSave.roleOverrides['NEW_ROLE']) {
            delete configToSave.roleOverrides['NEW_ROLE'];
        }

        await api.fetch(`/admin/domain_pricing_config`, {
            method: 'POST',
            body: JSON.stringify(configToSave)
        });
        message.success(t('successTip'));
        await fetchData(); // 重新加载数据以标准化显示
    } catch (error) {
        message.error(error.message || "保存失败");
    }
}

/**
 * 添加一个新的角色重写项
 */
const addRoleOverride = () => {
    // 检查是否存在临时的 'NEW_ROLE'，防止重复添加
    if (config.value.roleOverrides['NEW_ROLE']) {
         message.warning('请先选择或删除现有未命名角色。');
         return;
    }
    
    config.value.roleOverrides['NEW_ROLE'] = {
        defaultCostOverride: undefined,
        domainPricesOverride: {}
    };
}

/**
 * 删除指定的角色重写项
 */
const deleteRoleOverride = (role) => {
    delete config.value.roleOverrides[role];
}

/**
 * 将临时角色重命名为选定的系统角色
 */
const selectRoleForOverride = (oldRole, newRole) => {
    if (oldRole !== newRole && newRole && !config.value.roleOverrides[newRole]) {
        // 移动配置到新的角色名
        config.value.roleOverrides[newRole] = config.value.roleOverrides[oldRole];
        delete config.value.roleOverrides[oldRole];
    } else if (config.value.roleOverrides[newRole]) {
        message.warning(`角色 ${newRole} 的重写配置已存在。`);
    }
}

onMounted(fetchData);
</script>

<template>
    <div class="center">
        <n-card :bordered="false" embedded style="max-width: 800px; overflow: auto;">
            <n-alert type="info" :bordered="false" style="margin-bottom: 20px;">
                {{ t('domainPricingDesc') }}
            </n-alert>
            <n-flex justify="end" style="margin-bottom: 12px;">
                <n-button @click="save" type="primary">
                    {{ t('save') }}
                </n-button>
            </n-flex>

            <n-form-item-row :label="t('defaultCost')">
                <n-input-number v-model:value="config.defaultCost" :min="0" :placeholder="t('costUnit')" style="width: 200px;" />
                <n-tag v-if="config.defaultCost === 0 || config.defaultCost === 'free'" type="success" style="margin-left: 10px;">Free</n-tag>
            </n-form-item-row>

            <n-divider>{{ t('domainPrices') }}</n-divider>

            <div v-for="(price, domain) in config.domainPrices" :key="domain" style="margin-bottom: 15px;">
                <n-form-item-row :label="`${t('domain')}: ${domain}`">
                    <n-input-number v-model:value="config.domainPrices[domain]" :min="0" :placeholder="t('price')" style="width: 200px;" />
                    <n-tag v-if="config.domainPrices[domain] === 0 || config.domainPrices[domain] === 'free'" type="success" style="margin-left: 10px;">{{ t('setToFree') }}</n-tag>
                    <n-button v-else style="margin-left: 10px;" @click="config.domainPrices[domain] = 'free'" tertiary type="info" size="small">
                        {{ t('setToFree') }}
                    </n-button>
                </n-form-item-row>
            </div>

            <n-divider>{{ t('roleOverrides') }}</n-divider>
            <n-button @click="addRoleOverride" type="info" style="margin-bottom: 15px;">
                {{ t('addRoleOverride') }}
            </n-button>

            <n-collapse default-expanded-names="new-role" v-for="(override, role) in config.roleOverrides" :key="role">
                <n-collapse-item :title="`${t('role')}: ${role === 'NEW_ROLE' ? t('newRolePlaceholder') : role}`" :name="role">
                    <template #header-extra>
                        <n-button size="small" type="error" @click.stop="deleteRoleOverride(role)">
                            {{ t('delete') }}
                        </n-button>
                    </template>

                    <n-form-item-row v-if="role === 'NEW_ROLE'" :label="t('selectRole')">
                        <n-select
                            :value="''"
                            @update:value="(newRole) => selectRoleForOverride(role, newRole)"
                            :options="systemRoles.filter(r => !config.roleOverrides[r]).map(r => ({ label: r, value: r }))"
                            :placeholder="t('selectRole')"
                            filterable
                            style="width: 200px;"
                        />
                    </n-form-item-row>

                    <n-form-item-row :label="t('defaultCostOverride')">
                        <n-input-number v-model:value="override.defaultCostOverride" :min="0" :placeholder="t('costUnit')" style="width: 200px;" />
                        <n-tag v-if="override.defaultCostOverride === 0 || override.defaultCostOverride === 'free'" type="success" style="margin-left: 10px;">Free</n-tag>
                        <n-button v-else style="margin-left: 10px;" @click="override.defaultCostOverride = 'free'" tertiary type="info" size="small">
                            {{ t('setToFree') }}
                        </n-button>
                        <n-button 
                            v-if="override.defaultCostOverride !== undefined"
                            style="margin-left: 10px;" 
                            @click="override.defaultCostOverride = undefined" 
                            tertiary 
                            type="warning" 
                            size="small"
                        >
                            {{ t('setToDefault') }}
                        </n-button>
                    </n-form-item-row>
                    
                    <n-divider>{{ t('domainPricesOverride') }} ({{ role === 'NEW_ROLE' ? t('newRolePlaceholder') : role }})</n-divider>
                    
                    <div v-for="domainOption in domainsOptions" :key="domainOption.value" style="margin-bottom: 15px;">
                        <n-form-item-row :label="`${t('domain')}: ${domainOption.label}`">
                            <n-input-number 
                                v-model:value="override.domainPricesOverride[domainOption.value]" 
                                :min="0" 
                                :placeholder="t('price')" 
                                style="width: 200px;"
                            />
                            <n-tag 
                                v-if="override.domainPricesOverride[domainOption.value] === 0 || override.domainPricesOverride[domainOption.value] === 'free'" 
                                type="success" 
                                style="margin-left: 10px;"
                            >
                                Free
                            </n-tag>
                            <n-button 
                                v-else 
                                style="margin-left: 10px;" 
                                @click="override.domainPricesOverride[domainOption.value] = 'free'" 
                                tertiary 
                                type="info" 
                                size="small"
                            >
                                {{ t('setToFree') }}
                            </n-button>
                            <n-button 
                                v-if="override.domainPricesOverride[domainOption.value] !== undefined"
                                style="margin-left: 10px;" 
                                @click="delete override.domainPricesOverride[domainOption.value]" 
                                tertiary 
                                type="warning" 
                                size="small"
                            >
                                {{ t('setToDefault') }}
                            </n-button>
                        </n-form-item-row>
                    </div>

                </n-collapse-item>
            </n-collapse>
        </n-card>
    </div>
</template>

<style scoped>
.center {
    display: flex;
    text-align: left;
    place-items: center;
    justify-content: center;
    margin: 20px;
}
</style>