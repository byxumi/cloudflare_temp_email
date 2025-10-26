// frontend/src/api/index.js
import { useGlobalState } from '../store'
import { h } from 'vue'
import axios from 'axios'

import i18n from '../i18n'

const API_BASE = import.meta.env.VITE_API_BASE || "";
const {
    loading, auth, jwt, settings, openSettings,
    userOpenSettings, userSettings, announcement,
    showAuth, adminAuth, showAdminAuth, userJwt
} = useGlobalState();

const instance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    validateStatus: (status) => status >= 200 && status <= 500
});

const apiFetch = async (path, options = {}) => {
    loading.value = true;
    try {
        const response = await instance.request(path, {
            method: options.method || 'GET',
            data: options.body || null,
            headers: {
                'x-lang': i18n.global.locale.value,
                'x-user-token': options.userJwt || userJwt.value,
                'x-user-access-token': userSettings.value.access_token,
                'x-custom-auth': auth.value,
                'x-admin-auth': adminAuth.value,
                'Authorization': `Bearer ${jwt.value}`,
                'Content-Type': 'application/json',
            },
        });
        if (response.status === 401 && path.startsWith("/admin")) {
            showAdminAuth.value = true;
        }
        if (response.status === 401 && openSettings.value.auth) {
            showAuth.value = true;
        }
        if (response.status >= 300) {
            throw new Error(`[${response.status}]: ${response.data}` || "error");
        }
        const data = response.data;
        return data;
    } catch (error) {
        if (error.response) {
            throw new Error(`Code ${error.response.status}: ${error.response.data}` || "error");
        }
        throw error;
    } finally {
        loading.value = false;
    }
}

const getOpenSettings = async (message, notification) => {
    try {
        const res = await apiFetch("/open_api/settings");
        
        // 关键修复 1: 确保 domains 始终是一个数组，以防 Worker 返回 null/undefined
        const domainsArray = Array.isArray(res && res["domains"]) ? res["domains"] : [];
        const domainLabels = Array.isArray(res && res["domainLabels"]) ? res["domainLabels"] : [];
        
        // 关键修复 2: 恢复错误提示 (这是用户最终的要求)
        if (domainsArray.length < 1) { 
            message.error("No domains found, please check your worker settings");
        }
        
        Object.assign(openSettings.value, {
            ...res,
            title: res["title"] || "",
            prefix: res["prefix"] || "",
            minAddressLen: res["minAddressLen"] || 1,
            maxAddressLen: res["maxAddressLen"] || 30,
            needAuth: res["needAuth"] || false,
            defaultDomains: res["defaultDomains"] || [],
            
            // 使用安全的 domainsArray 进行映射
            domains: domainsArray.map((domain, index) => {
                return {
                    label: domainLabels.length > index ? domainLabels[index] : domain,
                    value: domain
                }
            }),
            
            adminContact: res["adminContact"] || "",
            enableUserCreateEmail: res["enableUserCreateEmail"] || false,
            disableAnonymousUserCreateEmail: res["disableAnonymousUserCreateEmail"] || false,
            disableCustomAddressName: res["disableCustomAddressName"] || false,
            enableUserDeleteEmail: res["enableUserDeleteEmail"] || false,
            enableAutoReply: res["enableAutoReply"] || false,
            enableIndexAbout: res["enableIndexAbout"] || false,
            copyright: res["copyright"] || openSettings.value.copyright,
            cfTurnstileSiteKey: res["cfTurnstileSiteKey"] || "",
            enableWebhook: res["enableWebhook"] || false,
            isS3Enabled: res["isS3Enabled"] || false,
            enableAddressPassword: res["enableAddressPassword"] || false,
        });
        
        if (openSettings.value.needAuth) {
            showAuth.value = true;
        }
        if (openSettings.value.announcement
            && !openSettings.value.fetched
            && (openSettings.value.announcement != announcement.value
                || openSettings.value.alwaysShowAnnouncement)
        ) {
            announcement.value = openSettings.value.announcement;
            notification.info({
                content: () => {
                    return h("div", {
                        innerHTML: announcement.value
                    });
                }
            });
        }
        
        // 关键修复 3: 返回 API 响应数据
        return res; 
        
    } catch (error) {
        message.error(error.message || "error");
        // 关键修复 4: 错误时返回一个包含空数组的安全对象
        return { domains: [], domainLabels: [], defaultDomains: [] };
        
    } finally {
        openSettings.value.fetched = true;
    }
}

const getSettings = async () => {
    try {
        if (typeof jwt.value != 'string' || jwt.value.trim() === '' || jwt.value === 'undefined') {
            return "";
        }
        const res = await apiFetch("/api/settings");;
        settings.value = {
            address: res["address"],
            auto_reply: res["auto_reply"],
            send_balance: res["send_balance"],
        };
    } finally {
        settings.value.fetched = true;
    }
}


const getUserOpenSettings = async (message) => {
    try {
        const res = await api.fetch(`/user_api/open_settings`);
        Object.assign(userOpenSettings.value, res);
    } catch (error) {
        message.error(error.message || "fetch settings failed");
    } finally {
        userOpenSettings.value.fetched = true;
    }
}

const getUserSettings = async (message) => {
    try {
        if (!userJwt.value) return;
        const res = await api.fetch("/user_api/settings")
        Object.assign(userSettings.value, {
            ...res,
            balance: res.balance || 0 // <-- 关键新增：获取余额
        })
        // auto refresh user jwt
        if (userSettings.value.new_user_token) {
            try {
                await api.fetch("/user_api/settings", {
                    userJwt: userSettings.value.new_user_token,
                })
                userJwt.value = userSettings.value.new_user_token;
                console.log("User JWT updated successfully");
            }
            catch (error) {
                console.error("Failed to update user JWT", error);
            }
        }
    } catch (error) {
        message?.error(error.message || "error");
    } finally {
        userSettings.value.fetched = true;
    }
}

const adminShowAddressCredential = async (id) => {
    try {
        const { jwt: addressCredential } = await apiFetch(`/admin/show_password/${id}`);
        return addressCredential;
    } catch (error) {
        throw error;
    }
}

const adminDeleteAddress = async (id) => {
    try {
        await apiFetch(`/admin/delete_address/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        throw error;
    }
}

const bindUserAddress = async () => {
    if (!userJwt.value) return;
    try {
        await apiFetch(`/user_api/bind_address`, {
            method: 'POST',
        });
    } catch (error) {
        throw error;
    }
}

const redeemCode = async (code) => {
    return await apiFetch(`/user_api/redeem_code`, {
        method: 'POST',
        body: { code }
    });
}

export const api = {
    fetch: apiFetch,
    getSettings,
    getOpenSettings,
    getUserOpenSettings,
    getUserSettings,
    adminShowAddressCredential,
    adminDeleteAddress,
    bindUserAddress,
    redeemCode, // <-- 新增导出
}
