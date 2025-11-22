import type {
    AuthenticatorTransportFuture,
    CredentialDeviceType,
    Base64URLString,
} from '@simplewebauthn/types';

export type Passkey = {
    id: Base64URLString;
    publicKey: string;
    counter: number;
    deviceType: CredentialDeviceType;
    backedUp: boolean;
    transports?: AuthenticatorTransportFuture[];
};

export class AdminWebhookSettings {
    enableAllowList: boolean;
    allowList: string[];

    constructor(enableAllowList: boolean, allowList: string[]) {
        this.enableAllowList = enableAllowList;
        this.allowList = allowList;
    }
}

export type WebhookMail = {
    id: string;
    url?: string;
    from: string;
    to: string;
    subject: string;
    raw: string;
    parsedText: string;
    parsedHtml: string;
}

export type CleanupSettings = {
    enableMailsAutoCleanup: boolean | undefined;
    cleanMailsDays: number;
    enableUnknowMailsAutoCleanup: boolean | undefined;
    cleanUnknowMailsDays: number;
    enableSendBoxAutoCleanup: boolean | undefined;
    cleanSendBoxDays: number;
    enableAddressAutoCleanup: boolean | undefined;
    cleanAddressDays: number;
    enableInactiveAddressAutoCleanup: boolean | undefined;
    cleanInactiveAddressDays: number;
    enableUnboundAddressAutoCleanup: boolean | undefined;
    cleanUnboundAddressDays: number;
}

export class GeoData {
    ip: string;
    country: string | undefined;
    city: string | undefined;
    timezone: string | undefined;
    postalCode: string | undefined;
    region: string | undefined;
    latitude: number | undefined;
    longitude: number | undefined;
    regionCode: string | undefined;
    asOrganization: string | undefined;

    constructor(ip: string | null, data: GeoData | undefined | null) {
        const {
            country, city, timezone, postalCode, region,
            latitude, longitude, regionCode, asOrganization
        } = data || {};
        this.ip = ip || "unknown";
        this.country = country;
        this.city = city;
        this.timezone = timezone;
        this.postalCode = postalCode;
        this.region = region;
        this.latitude = latitude;
        this.longitude = longitude;
        this.regionCode = regionCode;
        this.asOrganization = asOrganization;
    }
}

export class UserSettings {
    enable: boolean | undefined;
    enableMailVerify: boolean | undefined;
    verifyMailSender: string | undefined;
    enableMailAllowList: boolean | undefined;
    mailAllowList: string[] | undefined;
    maxAddressCount: number;

    constructor(data: UserSettings | undefined | null) {
        const {
            enable, enableMailVerify, verifyMailSender,
            enableMailAllowList, mailAllowList, maxAddressCount
        } = data || {};
        this.enable = enable;
        this.enableMailVerify = enableMailVerify;
        this.verifyMailSender = verifyMailSender;
        this.enableMailAllowList = enableMailAllowList;
        this.mailAllowList = mailAllowList;
        this.maxAddressCount = maxAddressCount || 5;
    }
}

export class UserInfo {
    geoData: GeoData;
    userEmail: string;

    constructor(geoData: GeoData, userEmail: string) {
        this.geoData = geoData;
        this.userEmail = userEmail;
    }
}

export class WebhookSettings {
    enabled: boolean = false
    url: string = ''
    method: string = 'POST'
    headers: string = JSON.stringify({
        "Content-Type": "application/json"
    }, null, 2)
    body: string = JSON.stringify({
        "id": "${id}",
        "url": "${url}",
        "from": "${from}",
        "to": "${to}",
        "subject": "${subject}",
        "raw": "${raw}",
        "parsedText": "${parsedText}",
        "parsedHtml": "${parsedHtml}",
    }, null, 2)
}

export type UserOauth2Settings = {
    name: string;
    clientID: string;
    clientSecret: string;
    authorizationURL: string;
    accessTokenURL: string;
    accessTokenFormat: string;
    userInfoURL: string;
    redirectURL: string;
    logoutURL?: string;
    userEmailKey: string;
    scope: string;
    enableMailAllowList?: boolean | undefined;
    mailAllowList?: string[] | undefined;
}

export type EmailRuleSettings = {
    blockReceiveUnknowAddressEmail: boolean;
    emailForwardingList: SubdomainForwardAddressList[]
}

export type RoleConfig = {
    maxAddressCount?: number;
    // future configs can be added here
}

export type RoleAddressConfig = Record<string, RoleConfig>;

// --- 补充类型定义 ---

export type UserRole = {
    domains: string[] | undefined | null,
    role: string,
    prefix: string | undefined | null
}

export type Bindings = {
    // bindings
    DB: D1Database
    KV: KVNamespace
    RATE_LIMITER: any
    SEND_MAIL: any
    ASSETS: Fetcher

    // config
    DEFAULT_LANG: string | undefined
    TITLE: string | undefined
    ANNOUNCEMENT: string | undefined | null
    ALWAYS_SHOW_ANNOUNCEMENT: string | boolean | undefined
    PREFIX: string | undefined
    ADDRESS_CHECK_REGEX: string | undefined
    ADDRESS_REGEX: string | undefined
    MIN_ADDRESS_LEN: string | number | undefined
    MAX_ADDRESS_LEN: string | number | undefined
    DEFAULT_DOMAINS: string | string[] | undefined
    DOMAINS: string | string[] | undefined
    DISABLE_CUSTOM_ADDRESS_NAME: string | boolean | undefined
    CREATE_ADDRESS_DEFAULT_DOMAIN_FIRST: string | boolean | undefined
    ADMIN_USER_ROLE: string | undefined
    USER_DEFAULT_ROLE: string | UserRole | undefined
    USER_ROLES: string | UserRole[] | undefined
    DOMAIN_LABELS: string | string[] | undefined
    PASSWORDS: string | string[] | undefined
    ADMIN_PASSWORDS: string | string[] | undefined
    DISABLE_ADMIN_PASSWORD_CHECK: string | boolean | undefined
    JWT_SECRET: string
    BLACK_LIST: string | undefined
    ENABLE_AUTO_REPLY: string | boolean | undefined
    ENABLE_WEBHOOK: string | boolean | undefined
    ENABLE_USER_CREATE_EMAIL: string | boolean | undefined
    DISABLE_ANONYMOUS_USER_CREATE_EMAIL: string | boolean | undefined
    ENABLE_USER_DELETE_EMAIL: string | boolean | undefined
    ENABLE_ADDRESS_PASSWORD: string | boolean | undefined
    ENABLE_INDEX_ABOUT: string | boolean | undefined
    DEFAULT_SEND_BALANCE: number | string | undefined
    NO_LIMIT_SEND_ROLE: string | undefined | null
    ADMIN_CONTACT: string | undefined
    COPYRIGHT: string | undefined
    DISABLE_SHOW_GITHUB: string | boolean | undefined
    FORWARD_ADDRESS_LIST: string | string[] | undefined

    ENABLE_CHECK_JUNK_MAIL: string | boolean | undefined
    JUNK_MAIL_CHECK_LIST: string | string[] | undefined
    JUNK_MAIL_FORCE_PASS_LIST: string | string[] | undefined

    ENABLE_ANOTHER_WORKER: string | boolean | undefined
    ANOTHER_WORKER_LIST: string | AnotherWorker[] | undefined

    SUBDOMAIN_FORWARD_ADDRESS_LIST: string | SubdomainForwardAddressList[] | undefined

    REMOVE_ALL_ATTACHMENT: string | boolean | undefined
    REMOVE_EXCEED_SIZE_ATTACHMENT: string | boolean | undefined

    // s3 config
    S3_ENDPOINT: string | undefined
    S3_ACCESS_KEY_ID: string | undefined
    S3_SECRET_ACCESS_KEY: string | undefined
    S3_BUCKET: string | undefined
    S3_URL_EXPIRES: number | undefined

    // cf turnstile
    CF_TURNSTILE_SITE_KEY: string | undefined
    CF_TURNSTILE_SECRET_KEY: string | undefined

    // resend
    RESEND_TOKEN: string | undefined
    [key: `RESEND_TOKEN_${string}`]: string | undefined

    // SMTP config
    SMTP_CONFIG: string | object | undefined

    // telegram config
    TELEGRAM_BOT_TOKEN: string
    TG_MAX_ADDRESS: number | string | undefined
    TG_BOT_INFO: string | object | undefined

    // webhook config
    FRONTEND_URL: string | undefined
}

export type JwtPayload = {
    address: string
    address_id: number
}

export type UserPayload = {
    user_email: string
    user_id: number
    exp: number
    iat: number
}

export type Variables = {
    userPayload: UserPayload,
    userRolePayload: string | undefined | null,
    jwtPayload: JwtPayload,
    lang: string | undefined | null
}

export type HonoCustomType = {
    "Bindings": Bindings;
    "Variables": Variables;
}

export type AnotherWorker = {
    binding: string | undefined | null,
    method: string | undefined | null,
    keywords: string[] | undefined | null
}

export type RPCEmailMessage = {
    from: string | undefined | null,
    to: string | undefined | null,
    rawEmail: string | undefined | null,
    headers: object | undefined | null,
}

export type ParsedEmailContext = {
    rawEmail: string,
    parsedEmail?: {
        sender: string,
        subject: string,
        text: string,
        html: string,
        headers?: Record<string, string>[]
    } | undefined
}

export type SubdomainForwardAddressList = {
    domains: string[] | undefined | null,
    forward: string,
}

export interface User {
    id: number;
    user_id: string;
    email: string;
    password?: string;
    quota_size: number;
    used_quota_size: number;
    free_email_time_expire: number;
    role: string;
    created_at: number;
    updated_at: number;
    telegram_chat_id?: string;
    telegram_user_id?: string;
}

export interface EmailRecord {
    id: number;
    user_id: string;
    receiver: string;
    sender: string;
    subject: string;
    body: string;
    created_at: number;
    updated_at: number;
    mail_id: string;
    seen: boolean;
    s3_key?: string;
    sender_ip?: string;
}

// 【新增】卡密类型定义
export interface RechargeCode {
    id: number;
    code: string;
    value: number; // 充值天数
    created_at: number;
    used_at: number | null;
    user_id: string | null;
}