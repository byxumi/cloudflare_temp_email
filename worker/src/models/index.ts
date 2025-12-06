import { D1Database, D1Result } from '@cloudflare/workers-types';
import { RechargeCode, DomainSettings, User, EmailRecord } from '../types';

// 【关键修复】重新导出 types 中的所有类型，防止 "No matching export" 错误
export * from '../types';

export class Model {
    private db: D1Database;

    constructor(db: D1Database) {
        this.db = db;
    }

    // --- User related methods ---
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

    // --- Email record methods ---
    async insertEmail(email: EmailRecord): Promise<D1Result> {
        return this.db.prepare(
            'INSERT INTO emails (user_id, receiver, sender, subject, body, created_at, updated_at, mail_id, seen, s3_key, sender_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(email.user_id, email.receiver, email.sender, email.subject, email.body, email.created_at, email.updated_at, email.mail_id, email.seen, email.s3_key, email.sender_ip).run();
    }

    async countEmailsByUserId(userId: string): Promise<number> {
        const { results } = await this.db.prepare('SELECT COUNT(*) as count FROM emails WHERE user_id = ?').bind(userId).all<{ count: number }>();
        return results ? results[0].count : 0;
    }

    // --- 【新增】Recharge Code methods (卡密相关方法) ---
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
    
    // === 【新增】域名定价相关方法 ===

    // 获取所有已配置的域名价格
    async getAllDomainSettings(): Promise<DomainSettings[]> {
        const { results } = await this.db.prepare('SELECT * FROM domain_settings').all<DomainSettings>();
        return results || [];
    }

    // 设置域名价格 (插入或更新)
    async upsertDomainSetting(domain: string, price: number): Promise<D1Result> {
        const now = Math.floor(Date.now() / 1000);
        return this.db.prepare(
            `INSERT INTO domain_settings (domain, price, updated_at) VALUES (?, ?, ?)
             ON CONFLICT(domain) DO UPDATE SET price = ?, updated_at = ?`
        ).bind(domain, price, now, price, now).run();
    }
}