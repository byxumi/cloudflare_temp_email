import { D1Database, D1Result } from '@cloudflare/workers-types';
import { RechargeCode, DomainSettings, User, EmailRecord } from '../types';
import { AuthenticatorTransportFuture, CredentialDeviceType, Base64URLString } from '@simplewebauthn/types';

export * from '../types';

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
    frontendVersion: string;

    constructor(data: UserSettings | undefined | null) {
        const {
            enable, enableMailVerify, verifyMailSender,
            enableMailAllowList, mailAllowList, maxAddressCount,
            frontendVersion
        } = data || {};
        this.enable = enable;
        this.enableMailVerify = enableMailVerify;
        this.verifyMailSender = verifyMailSender;
        this.enableMailAllowList = enableMailAllowList;
        this.mailAllowList = mailAllowList;
        this.maxAddressCount = maxAddressCount || 5;
        this.frontendVersion = frontendVersion || "";
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

export type RoleConfig = {
    maxAddressCount?: number;
    noAutoCleanup?: boolean;
    allowSend?: boolean;
    unlimitedSend?: boolean;
    cleanInboxDays?: number;
    cleanSentDays?: number;
}

export type RoleAddressConfig = {
    [key: string]: RoleConfig;
} & {
    specificAddresses?: Record<string, RoleConfig>;
};

// [修改] 增加 emoji 字段
export type LotteryPrize = {
    id: string;
    name: string;
    emoji?: string; // [新增]
    type: 'balance' | 'checkin_balance' | 'ticket' | 'none'; 
    value: number; 
    weight: number; 
}

export type LotterySettings = {
    enabled: boolean;
    costType: 'balance' | 'checkin_balance' | 'ticket'; 
    costAmount: number; 
    prizes: LotteryPrize[]; 
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
    enableEmptyAddressAutoCleanup: boolean | undefined;
    cleanEmptyAddressDays: number;
}

export class Model {
    private db: D1Database;

    constructor(db: D1Database) {
        this.db = db;
    }

    async getUser(userId: string): Promise<User | null> {
        const { results } = await this.db.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).all<User>();
        return results ? (results[0] || null) : null;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const { results } = await this.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).all<User>();
        return results ? (results[0] || null) : null;
    }

    async getUsers(limit: number, offset: number): Promise<User[]> {
        const { results } = await this.db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all<User>();
        return results || [];
    }

    async countUsers(): Promise<number> {
        const { results } = await this.db.prepare('SELECT COUNT(*) as count FROM users').all<{ count: number }>();
        return results ? results[0].count : 0;
    }

    async insertUser(user: Omit<User, 'id'>): Promise<D1Result> {
        return this.db.prepare(
            'INSERT INTO users (user_id, email, password, quota_size, used_quota_size, free_email_time_expire, role, created_at, updated_at, telegram_chat_id, telegram_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(user.user_id, user.email, user.password, user.quota_size, user.used_quota_size, user.free_email_time_expire, user.role, user.created_at, user.updated_at, user.telegram_chat_id, user.telegram_user_id).run();
    }

    async updateUser(user: User): Promise<D1Result> {
        return this.db.prepare(
            'UPDATE users SET email = ?, password = ?, quota_size = ?, used_quota_size = ?, free_email_time_expire = ?, role = ?, updated_at = ?, telegram_chat_id = ?, telegram_user_id = ? WHERE user_id = ?'
        ).bind(user.email, user.password, user.quota_size, user.used_quota_size, user.free_email_time_expire, user.role, user.updated_at, user.telegram_chat_id, user.telegram_user_id, user.user_id).run();
    }

    async deleteUser(userId: string): Promise<D1Result> {
        return this.db.prepare('DELETE FROM users WHERE user_id = ?').bind(userId).run();
    }

    async insertEmail(email: EmailRecord): Promise<D1Result> {
        return this.db.prepare(
            'INSERT INTO emails (user_id, receiver, sender, subject, body, created_at, updated_at, mail_id, seen, s3_key, sender_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(email.user_id, email.receiver, email.sender, email.subject, email.body, email.created_at, email.updated_at, email.mail_id, email.seen, email.s3_key, email.sender_ip).run();
    }

    async countEmailsByUserId(userId: string): Promise<number> {
        const { results } = await this.db.prepare('SELECT COUNT(*) as count FROM emails WHERE user_id = ?').bind(userId).all<{ count: number }>();
        return results ? results[0].count : 0;
    }

    async insertRechargeCode(code: Omit<RechargeCode, 'id' | 'used_at' | 'user_id'>): Promise<D1Result> {
        return this.db.prepare(
            'INSERT INTO recharge_codes (code, value, created_at, used_at, user_id) VALUES (?, ?, ?, ?, ?)'
        ).bind(code.code, code.value, code.created_at, null, null).run();
    }

    async getRechargeCode(code: string): Promise<RechargeCode | null> {
        const { results } = await this.db.prepare('SELECT * FROM recharge_codes WHERE code = ?').bind(code).all<RechargeCode>();
        return results ? (results[0] || null) : null;
    }

    async getRechargeCodes(limit: number, offset: number): Promise<RechargeCode[]> {
        const { results } = await this.db.prepare('SELECT * FROM recharge_codes ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all<RechargeCode>();
        return results || [];
    }

    async countRechargeCodes(): Promise<number> {
        const { results } = await this.db.prepare('SELECT COUNT(*) as count FROM recharge_codes').all<{ count: number }>();
        return results ? results[0].count : 0;
    }

    async deleteRechargeCode(code: string): Promise<D1Result> {
        return this.db.prepare('DELETE FROM recharge_codes WHERE code = ?').bind(code).run();
    }

    async useRechargeCode(code: string, userId: string, usedAt: number): Promise<D1Result> {
        return this.db.prepare(
            'UPDATE recharge_codes SET used_at = ?, user_id = ? WHERE code = ? AND used_at IS NULL'
        ).bind(usedAt, userId, code).run();
    }
    
    async getAllDomainSettings(): Promise<DomainSettings[]> {
        const { results } = await this.db.prepare('SELECT * FROM domain_settings').all<DomainSettings>();
        return results || [];
    }

    async upsertDomainSetting(domain: string, price: number): Promise<D1Result> {
        const now = Math.floor(Date.now() / 1000);
        return this.db.prepare(
            `INSERT INTO domain_settings (domain, price, updated_at) VALUES (?, ?, ?)
             ON CONFLICT(domain) DO UPDATE SET price = ?, updated_at = ?`
        ).bind(domain, price, now, price, now).run();
    }
}