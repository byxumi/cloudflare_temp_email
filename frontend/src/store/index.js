import { computed, ref, watch } from "vue";
import {
    createGlobalState, useStorage, useDark, useToggle,
    useLocalStorage, useSessionStorage
} from '@vueuse/core'

export const useGlobalState = createGlobalState(
    () => {
        const isDark = useDark()
        const toggleDark = useToggle(isDark)
        const loading = ref(false);
        const announcement = useLocalStorage('announcement', '');
        const useSimpleIndex = useLocalStorage('useSimpleIndex', false);
        const openSettings = ref({
            fetched: false,
            title: '',
            announcement: '',
            alwaysShowAnnouncement: false,
            prefix: '',
            addressRegex: '',
            needAuth: false,
            adminContact: '',
            enableUserCreateEmail: false,
            disableAnonymousUserCreateEmail: false,
            disableCustomAddressName: false,
            enableUserDeleteEmail: false,
            enableAutoReply: false,
            enableIndexAbout: false,
            /** @type {string[]} */
            defaultDomains: [],
            /** @type {Array<{label: string, value: string}>} */
            domains: [],
            copyright: 'Dream Hunter',
            cfTurnstileSiteKey: '',
            enableWebhook: false,
            isS3Enabled: false,
            showGithub: true,
            disableAdminPasswordCheck: false,
            enableAddressPassword: false,
        })
        const settings = ref({
            fetched: false,
            send_balance: 0,
            address: '',
            auto_reply: {
                subject: '',
                message: '',
                enabled: false,
                source_prefix: '',
                name: '',
            }
        });
        const sendMailModel = useSessionStorage('sendMailModel', {
            fromName: "",
            toName: "",
            toMail: "",
            subject: "",
            contentType: 'text',
            content: "",
        });
        const showAuth = ref(false);
        const showAddressCredential = ref(false);
        const showAdminAuth = ref(false);
        const auth = useStorage('auth', '');
        const adminAuth = useStorage('adminAuth', '');
        
        // [关键] 定义 Admin 登录时间戳
        const adminLoginTime = useStorage('adminLoginTime', 0);

        // 检查 Admin 是否过期 (3天 = 259200000 毫秒)
        if (adminAuth.value) {
            const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            if (!adminLoginTime.value || (now - adminLoginTime.value > threeDaysMs)) {
                adminAuth.value = '';
                adminLoginTime.value = 0;
            }
        }

        // 监听 adminAuth 变化，登录时更新时间戳
        watch(adminAuth, (newVal) => {
            if (newVal) {
                if (!adminLoginTime.value) {
                    adminLoginTime.value = Date.now();
                }
            } else {
                adminLoginTime.value = 0;
            }
        });

        const jwt = useStorage('jwt', '');
        const addressPassword = useSessionStorage('addressPassword', '');
        const adminTab = useSessionStorage('adminTab', "account");
        const adminMailTabAddress = ref("");
        const adminSendBoxTabAddress = ref("");
        const mailboxSplitSize = useStorage('mailboxSplitSize', 0.25);
        const useIframeShowMail = useStorage('useIframeShowMail', false);
        const preferShowTextMail = useStorage('preferShowTextMail', false);
        const userJwt = useStorage('userJwt', '');
        
        // 默认 Tab 改回收件箱
        const userTab = useSessionStorage('userTab', 'user_mail_box_tab');
        
        const indexTab = useSessionStorage('indexTab', 'mailbox');
        const globalTabplacement = useStorage('globalTabplacement', 'top');
        const useSideMargin = useStorage('useSideMargin', true);
        const useUTCDate = useStorage('useUTCDate', false);
        const autoRefresh = useStorage('autoRefresh', false);
        const configAutoRefreshInterval = useStorage("configAutoRefreshInterval", 60);
        const userOpenSettings = ref({
            fetched: false,
            enable: false,
            enableMailVerify: false,
            /** @type {{ clientID: string, name: string }[]} */
            oauth2ClientIDs: [],
        });
        const userSettings = ref({
            /** @type {boolean} */
            fetched: false,
            /** @type {string} */
            user_email: '',
            /** @type {number} */
            user_id: 0,
            /** @type {boolean} */
            is_admin: false,
            /** @type {string | null} */
            access_token: null,
            /** @type {string | null} */
            new_user_token: null,
            /** @type {null | {domains: string[] | undefined | null, role: string, prefix: string | undefined | null}} */
            user_role: null,
        });
        
        const userBalance = ref(0);

        const showAdminPage = computed(() =>
            !!adminAuth.value
            || userSettings.value.is_admin
            || openSettings.value.disableAdminPasswordCheck
        );
        const telegramApp = ref(window.Telegram?.WebApp || {});
        const isTelegram = ref(!!window.Telegram?.WebApp?.initData);
        const userOauth2SessionState = useSessionStorage('userOauth2SessionState', '');
        const userOauth2SessionClientID = useSessionStorage('userOauth2SessionClientID', '');
        const browserFingerprint = ref('');
        
        return {
            isDark,
            toggleDark,
            loading,
            settings,
            sendMailModel,
            announcement,
            openSettings,
            showAuth,
            showAddressCredential,
            auth,
            jwt,
            adminAuth,
            showAdminAuth,
            adminTab,
            adminMailTabAddress,
            adminSendBoxTabAddress,
            mailboxSplitSize,
            useIframeShowMail,
            preferShowTextMail,
            userJwt,
            userTab,
            indexTab,
            userOpenSettings,
            userSettings,
            userBalance,
            globalTabplacement,
            useSideMargin,
            useUTCDate,
            autoRefresh,
            configAutoRefreshInterval,
            telegramApp,
            isTelegram,
            showAdminPage,
            userOauth2SessionState,
            userOauth2SessionClientID,
            useSimpleIndex,
            addressPassword,
            browserFingerprint,
            adminLoginTime, // [关键] 必须在这里导出
        }
    },
)
