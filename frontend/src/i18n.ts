import { createI18n } from 'vue-i18n'

const messages = {
    en: {
        title: 'Cloudflare Temp Email',
        dark: 'Dark',
        light: 'Light',
        mailbox: 'Mailbox',
        address_management: 'Address Management',
        bind_address: 'Bind Address',
        settings: 'Settings',
        about: 'About',
        copy: 'Copy',
        copied: 'Copied',
        delete: 'Delete',
        cancel: 'Cancel',
        confirm: 'Confirm',
        login: 'Login',
        logout: 'Logout',
        refresh: 'Refresh',
        loading: 'Loading',
        success: 'Success',
        error: 'Error',
        // 新增卡密相关
        recharge: 'Recharge',
        recharge_tip: 'Enter your redemption code to extend validity or add quota.',
        recharge_code_placeholder: 'Please enter recharge code',
        redeem: 'Redeem',
    },
    zh: {
        title: 'Cloudflare 临时邮件',
        dark: '暗色',
        light: '亮色',
        mailbox: '收件箱',
        address_management: '地址管理',
        bind_address: '绑定地址',
        settings: '设置',
        about: '关于',
        copy: '复制',
        copied: '已复制',
        delete: '删除',
        cancel: '取消',
        confirm: '确认',
        login: '登录',
        logout: '登出',
        refresh: '刷新',
        loading: '加载中',
        success: '成功',
        error: '错误',
        // 新增卡密相关
        recharge: '卡密充值',
        recharge_tip: '请输入您的卡密以延长使用时间或增加额度。',
        recharge_code_placeholder: '请输入卡密',
        redeem: '立即兑换',
    }
}

const i18n = createI18n({
    locale: 'zh',
    fallbackLocale: 'en',
    messages,
})

export default i18n;