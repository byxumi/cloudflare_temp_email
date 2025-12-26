import { useGlobalState } from '../store'
import { h } from 'vue'
import axios from 'axios'

import i18n from '../i18n'
import { getFingerprint } from '../utils/fingerprint'

const API_BASE = import.meta.env.VITE_API_BASE || "";
const {
    loading, auth, jwt, settings, openSettings,
    userOpenSettings, userSettings, announcement,
    showAuth, adminAuth, showAdminAuth, userJwt,
    userBalance
} = useGlobalState();

const instance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    validateStatus: (status) => status >= 200 && status <= 500
});

const apiFetch = async (path, options = {}) => {
    loading.value = true;
    try {
        const fingerprint = await getFingerprint();
        const response = await instance.request(path, {
            method: options.method || 'GET',
            data: options.body || null,
            headers: {
                'x-lang': i18n.global.locale.value,
                'x-user-token': options.userJwt || userJwt.value,
                'x-user-access-token': userSettings.value.access_token,
                'x-custom-auth': auth.value,
                'x-admin-auth': adminAuth.value,
                'x-fingerprint': fingerprint,
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
        const res = await api.fetch("/open_api/settings");
        const domainLabels = res["domainLabels"] || [];
        if (res["domains"]?.length < 1) {
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
            domains: res["domains"].map((domain, index) => {
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
    } catch (error) {
        message.error(error.message || "error");
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
        Object.assign(userSettings.value, res)
        // auto refresh user jwt
        if (userSettings.value.new_user_token) {
            try {
                await api.fetch("/user_api/settings", {
                    userJwt: userSettings.value.new_user_token,
                })
                userJwt.value = userSettings.value.new_user_token;
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

export const api = {
    fetch: apiFetch,
    getSettings,
    getOpenSettings,
    getUserOpenSettings,
    getUserSettings,
    adminShowAddressCredential,
    adminDeleteAddress,
    bindUserAddress,

    // --- 计费系统 API ---
    
    getUserBalance: async () => {
        try {
            const res = await apiFetch('/user_api/billing/balance');
            userBalance.value = res.balance || 0;
            return {
                balance: res.balance || 0,
                checkin_balance: res.checkin_balance || 0
            };
        } catch (error) {
            console.error(error);
            return { balance: 0, checkin_balance: 0 };
        }
    },
    getDomainPrice: async (domain) => {
        return await apiFetch(`/user_api/billing/price?domain=${domain}`);
    },
    getUserDomainPrices: async () => {
        return await apiFetch(`/user_api/billing/prices-list`);
    },
    redeemCard: async (code) => {
        return await apiFetch('/user_api/billing/redeem', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    },
    buyAddress: async (name, domain) => {
        return await apiFetch('/user_api/billing/buy_address', {
            method: 'POST',
            body: JSON.stringify({ name, domain })
        });
    },
    getUserTransactions: async (limit, offset) => {
        return await apiFetch(`/user_api/billing/transactions?limit=${limit}&offset=${offset}`);
    },
    updateAddressRemark: async (address_id, remark) => {
        return await apiFetch('/user_api/update_remark', {
            method: 'POST',
            body: JSON.stringify({ address_id, remark })
        });
    },
    userCheckin: async () => {
        return await apiFetch('/user_api/checkin', {
            method: 'POST'
        });
    },

    // --- 抽奖 API ---
    getLotteryStatus: async () => {
        return await apiFetch('/user_api/lottery/status');
    },
    drawLottery: async () => {
        return await apiFetch('/user_api/lottery/draw', {
            method: 'POST'
        });
    },
    adminGetLotterySettings: async () => {
        return await apiFetch('/admin/lottery/settings');
    },
    adminSaveLotterySettings: async (settings) => {
        return await apiFetch('/admin/lottery/settings', {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    },
    
    // --- 管理员 API ---
    adminGetTransactions: async (limit, offset) => {
        return await apiFetch(`/admin/billing/transactions?limit=${limit}&offset=${offset}`);
    },
    adminGetCards: async (limit, offset) => {
        return await apiFetch(`/admin/billing/cards?limit=${limit}&offset=${offset}`);
    },
    adminGenerateCards: async (amount, count, starts_at, expires_at, max_uses) => {
        return await apiFetch('/admin/billing/cards/generate', {
            method: 'POST',
            body: JSON.stringify({ amount, count, starts_at, expires_at, max_uses })
        });
    },
    adminGetPrices: async (limit, offset, query = '') => {
        return await apiFetch(`/admin/billing/prices?limit=${limit}&offset=${offset}&query=${query}`);
    },
    adminSetPrice: async (domain, role_text, price) => {
        return await apiFetch('/admin/billing/prices', {
            method: 'POST',
            body: JSON.stringify({ domain, role_text, price })
        });
    },
    adminDeletePrice: async (id) => {
        return await apiFetch(`/admin/billing/prices/${id}`, {
            method: 'DELETE'
        });
    },
    adminBatchDeletePrices: async (ids) => {
        return await apiFetch('/admin/billing/prices/batch_delete', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
    },
    adminDeleteCard: async (id) => {
        return await apiFetch(`/admin/billing/cards/${id}`, {
            method: 'DELETE'
        });
    },
    adminUpdateCardStatus: async (id, status) => {
        return await apiFetch(`/admin/billing/cards/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
    },
    adminBatchDeleteCards: async (ids) => {
        return await apiFetch('/admin/billing/cards/batch_delete', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
    },
    adminBatchUpdateCardStatus: async (ids, status) => {
        return await apiFetch('/admin/billing/cards/batch_status', {
            method: 'POST',
            body: JSON.stringify({ ids, status })
        });
    },
    adminGetUserRoles: async () => {
        return await apiFetch('/admin/user_roles');
    },
    adminTopUpUser: async (user_id, amount) => {
        return await apiFetch(`/admin/users/${user_id}/topup`, {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
    }
}
