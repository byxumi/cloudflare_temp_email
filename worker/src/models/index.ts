import { D1Database, D1Result } from '@cloudflare/workers-types';
// 确保导入了所有在 types.d.ts 中定义的类型
import { 
    Passkey, AdminWebhookSettings, WebhookMail, CleanupSettings, 
    GeoData, UserSettings, UserInfo, WebhookSettings, 
    UserOauth2Settings, EmailRuleSettings, RoleConfig, RoleAddressConfig 
} from '../types'; 

// 假设 User 和 EmailRecord 类型在您的环境中已定义（通常在 types.d.ts 或此处）
// 如果它们不在 types.d.ts，我们在这里临时定义它们（如果 User 和 EmailRecord 在 types.d.ts，请忽略这些定义）
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

// 【新增】定义 RechargeCode 接口，因为它不在您提供的 types.d.ts 中
export interface RechargeCode {
    id: number;
    code: string;
    value: number; // 充值天数
    created_at: number;
    used_at: number | null;
    user_id: string | null;
}


export class Model {
    private db: D1Database;

    constructor(db: D1Database) {
        this.db = db;
    }

    // --- User related methods (推断) ---
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

    // --- Email record methods (推断) ---
    async insertEmail(email: EmailRecord): Promise<D1Result> {
        return this.db.prepare(
            'INSERT INTO emails (user_id, receiver, sender, subject, body, created_at, updated_at, mail_id, seen, s3_key, sender_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(email.user_id, email.receiver, email.sender, email.subject, email.body, email.created_at, email.updated_at, email.mail_id, email.seen, email.s3_key, email.sender_ip).run();
    }

    async countEmailsByUserId(userId: string): Promise<number> {
        const { results } = await this.db.prepare('SELECT COUNT(*) as count FROM emails WHERE user_id = ?').bind(userId).all<{ count: number }>();
        return results ? results[0].count : 0;
    }

    // --- 【新增】Recharge Code methods ---
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
}
