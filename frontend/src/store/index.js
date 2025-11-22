import { createGlobalState, useStorage } from '@vueuse/core'
import { ref } from 'vue'

export const useGlobalState = createGlobalState(
    () => {
        const loading = ref(false)
        const openSettings = ref({
            title: '',
            announcement: '',
            prefix: '',
            needAuth: false,
            adminContact: '',
            enableUserCreateEmail: false,
            disableAnonymousUserCreateEmail: false,
            disableCustomAddressName: false,
            enableUserDeleteEmail: false,
            enableAutoReply: false,
            enableIndexAbout: false,
            copyright: '',
            cfTurnstileSiteKey: '',
            enableWebhook: false,
            isS3Enabled: false,
            enableAddressPassword: false,
            defaultDomains: [],
            domains: [],
            fetched: false
        })
        const settings = useStorage('settings', {
            address: '',
            auto_reply: {
                subject: '',
                message: '',
                enabled: false,
                source_prefix: '',
                name: ''
            },
            send_balance: 0,
            fetched: false
        })
        const userOpenSettings = ref({
            enable: false,
            enableMailVerify: false,
            fetched: false
        })
        const userSettings = useStorage('userSettings', {
            user_email: '',
            user_id: 0,
            access_token: '',
            fetched: false
        })
        
        // [新增] 全局余额状态
        const userBalance = ref(0)

        const auth = useStorage('auth', '')
        const adminAuth = useStorage('adminAuth', '')
        const jwt = useStorage('jwt', '')
        const userJwt = useStorage('userJwt', '')
        const locale = useStorage('locale', 'zh')
        const theme = useStorage('theme', 'auto')
        const announcement = useStorage('announcement', '')
        const indexTab = useStorage('indexTab', 'mailbox')
        const userTab = useStorage('userTab', 'address_management')
        const adminTab = useStorage('adminTab', 'account')
        const showAuth = ref(false)
        const showAdminAuth = ref(false)
        const showAddressCredential = ref(false)
        const globalTabplacement = useStorage('globalTabplacement', 'top')
        const useSimpleIndex = useStorage('useSimpleIndex', false)
        const isTelegram = ref(false)
        const telegramApp = ref(null)
        const addressPassword = ref('')

        return {
            loading,
            openSettings,
            settings,
            userOpenSettings,
            userSettings,
            userBalance, // 导出
            auth,
            adminAuth,
            jwt,
            userJwt,
            locale,
            theme,
            announcement,
            indexTab,
            userTab,
            adminTab,
            showAuth,
            showAdminAuth,
            showAddressCredential,
            globalTabplacement,
            useSimpleIndex,
            isTelegram,
            telegramApp,
            addressPassword
        }
    }
)