import { Context } from 'hono';
import { Jwt } from 'hono/utils/jwt'

import { getBooleanValue, getDomains, getStringValue, getIntValue, getUserRoles, getDefaultDomains, getJsonSetting, getAnotherWorkerList, hashPassword } from './utils';
import { unbindTelegramByAddress } from './telegram_api/common';
import { CONSTANTS } from './constants';
import { AdminWebhookSettings, WebhookMail, WebhookSettings, RoleAddressConfig, RoleConfig } from './models';

const DEFAULT_NAME_REGEX = /[^a-z0-9]/g;

// ==========================================
// 简易内存缓存系统
// ==========================================
const GlobalCache = new Map<string, { value: any, expiry: number }>();

const setCache = (key: string, value: any, ttlSeconds: number = 60) => {
    // 增加随机抖动，防止缓存雪崩
    const jitter = Math.floor(Math.random() * 10); 
    GlobalCache.set(key, { value, expiry: Date.now() + (ttlSeconds + jitter) * 1000 });
};

const getCache = (key: string) => {
    const item = GlobalCache.get(key);
    if (item && item.expiry > Date.now()) {
        return item.value;
    }
    if (item) GlobalCache.delete(key);
    return null;
};

export const clearCacheByPrefix = (prefix: string) => {
    for (const key of GlobalCache.keys()) {
        if (key.startsWith(prefix)) {
            GlobalCache.delete(key);
        }
    }
};

// ==========================================
// 基础工具函数
// ==========================================

export const generateRandomName = (c: Context<HonoCustomType>): string => {
    const minLength = Math.max(getIntValue(c.env.MIN_ADDRESS_LEN, 1), 1);
    const maxLength = Math.max(getIntValue(c.env.MAX_ADDRESS_LEN, 30), 1);
    const buildName = (currentName: string = ""): string => {
        return currentName.length >= minLength
            ? currentName
            : buildName(currentName + Math.random().toString(36).substring(2, 15));
    };
    const fullName = buildName();
    return fullName.substring(0, Math.min(fullName.length, maxLength));
};

export const generateRandomString = (length: number = 16): string => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
};

const checkNameRegex = (c: Context<HonoCustomType>, name: string) => {
    let error = null;
    try {
        const regexStr = getStringValue(c.env.ADDRESS_CHECK_REGEX);
        if (!regexStr) return;
        const regex = new RegExp(regexStr);
        if (!regex.test(name)) {
            error = new Error(`Name not match regex: /${regexStr}/`);
        }
    }
    catch (e) {
        console.error("Failed to check address regex", e);
    }
    if (error) {
        throw error;
    }
}

const getNameRegex = (c: Context<HonoCustomType>): RegExp => {
    try {
        const regex = getStringValue(c.env.ADDRESS_REGEX);
        if (!regex) {
            return DEFAULT_NAME_REGEX;
        }
        return new RegExp(regex, 'g');
    }
    catch (e) {
        console.error("Failed to get address regex", e);
    }
    return DEFAULT_NAME_REGEX;
}

export async function updateAddressUpdatedAt(
    c: Context<HonoCustomType>,
    address: string | undefined | null
): Promise<void> {
    if (!address) {
        return;
    }
    try {
        await c.env.DB.prepare(
            `UPDATE address SET updated_at = datetime('now') where name = ?`
        ).bind(address).run();
    } catch (e) {
        console.warn("Failed to update address updated_at", e);
    }
}

export const generateRandomPassword = (): string => {
    const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

const generatePasswordForAddress = async (
    c: Context<HonoCustomType>,
    address: string
): Promise<string | null> => {
    if (!getBooleanValue(c.env.ENABLE_ADDRESS_PASSWORD)) {
        return null;
    }
    const plainPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(plainPassword);
    const { success } = await c.env.DB.prepare(
        `UPDATE address SET password = ?, updated_at = datetime('now') WHERE name = ?`
    ).bind(hashedPassword, address).run();
    if (!success) {
        console.warn("Failed to set generated password for address:", address);
        return null;
    }
    return plainPassword;
}

export const newAddress = async (
    c: Context<HonoCustomType>,
    {
        name,
        domain,
        enablePrefix,
        checkLengthByConfig = true,
        addressPrefix = null,
        checkAllowDomains = true,
        enableCheckNameRegex = true,
    }: {
        name: string, domain: string | undefined | null,
        enablePrefix: boolean,
        checkLengthByConfig?: boolean,
        addressPrefix?: string | undefined | null,
        checkAllowDomains?: boolean,
        enableCheckNameRegex?: boolean,
    }
): Promise<{ address: string, jwt: string, password?: string | null }> => {
    name = name.trim().replace(getNameRegex(c), '')
    if (enableCheckNameRegex) {
        await checkNameBlockList(c, name);
        checkNameRegex(c, name);
    }
    const minAddressLength = Math.max(
        checkLengthByConfig ? getIntValue(c.env.MIN_ADDRESS_LEN, 1) : 1,
        1
    );
    const maxAddressLength = Math.max(
        checkLengthByConfig ? getIntValue(c.env.MAX_ADDRESS_LEN, 30) : 30,
        1
    );
    if (name.length < minAddressLength) {
        throw new Error(`Name too short (min ${minAddressLength})`);
    }
    if (name.length > maxAddressLength) {
        throw new Error(`Name too long (max ${maxAddressLength})`);
    }
    if (typeof addressPrefix === "string") {
        name = addressPrefix.trim() + name;
    } else if (enablePrefix) {
        name = getStringValue(c.env.PREFIX).trim() + name;
    }
    const allowDomains = checkAllowDomains ? await getAllowDomains(c) : getDomains(c);
    if (!domain && allowDomains.length > 0) {
        const createAddressDefaultDomainFirst = getBooleanValue(c.env.CREATE_ADDRESS_DEFAULT_DOMAIN_FIRST);
        if (createAddressDefaultDomainFirst) {
            domain = allowDomains[0];
        } else {
            domain = allowDomains[Math.floor(Math.random() * allowDomains.length)];
        }
    }
    if (!domain || !allowDomains.includes(domain)) {
        throw new Error("Invalid domain")
    }
    name = name + "@" + domain;
    try {
        const { success } = await c.env.DB.prepare(
            `INSERT INTO address(name) VALUES(?)`
        ).bind(name).run();
        if (!success) {
            throw new Error("Failed to create address")
        }
        await updateAddressUpdatedAt(c, name);
    } catch (e) {
        const message = (e as Error).message;
        if (message && message.includes("UNIQUE")) {
            throw new Error("Address already exists")
        }
        throw new Error("Failed to create address")
    }
    const address_id = await c.env.DB.prepare(
        `SELECT id FROM address where name = ?`
    ).bind(name).first<number>("id");
    const generatedPassword = await generatePasswordForAddress(c, name);
    const jwt = await Jwt.sign({
        address: name,
        address_id: address_id
    }, c.env.JWT_SECRET, "HS256")
    return {
        jwt: jwt,
        address: name,
        password: generatedPassword,
    }
}

const checkNameBlockList = async (
    c: Context<HonoCustomType>, name: string
): Promise<void> => {
    const blockList = [] as string[];
    try {
        const value = await getJsonSetting(c, CONSTANTS.ADDRESS_BLOCK_LIST_KEY);
        blockList.push(...(value || []));
    } catch (error) {
        console.error(error);
    }
    if (blockList.some((item) => name.includes(item))) {
        throw new Error(`Name[${name}]is blocked`);
    }
}

// ==========================================
// 增强的清理逻辑
// ==========================================
export const cleanup = async (
    c: Context<HonoCustomType>,
    cleanType: string | undefined | null,
    cleanDays: number | undefined | null
): Promise<boolean> => {
    if (!cleanType || typeof cleanDays !== 'number' || cleanDays < 0 || cleanDays > 1000) {
        throw new Error("Invalid cleanType or cleanDays")
    }
    console.log(`Cleanup ${cleanType} using default ${cleanDays} days`);

    const roleConfigs = await getJsonSetting<RoleAddressConfig>(c, CONSTANTS.ROLE_ADDRESS_CONFIG_KEY) || {};
    
    // 策略 Map
    const inboxPolicy = new Map<number, string[]>();
    const sentPolicy = new Map<number, string[]>();
    const exemptInbox: string[] = [];
    const exemptSent: string[] = [];

    const addPolicy = (map: Map<number, string[]>, days: number, address: string) => {
        if (days < 0) return;
        if (!map.has(days)) map.set(days, []);
        map.get(days)?.push(address);
    }

    // 1. 处理具体地址配置
    if (roleConfigs.specificAddresses) {
        for (const [addr, config] of Object.entries(roleConfigs.specificAddresses)) {
            if (config.noAutoCleanup) exemptInbox.push(addr);
            else if (typeof config.cleanInboxDays === 'number') addPolicy(inboxPolicy, config.cleanInboxDays, addr);
            
            if (config.noAutoCleanup) exemptSent.push(addr);
            else if (typeof config.cleanSentDays === 'number') addPolicy(sentPolicy, config.cleanSentDays, addr);
        }
    }

    // 2. 处理角色配置
    const specialRoles: { role: string, config: RoleConfig }[] = [];
    for (const [key, config] of Object.entries(roleConfigs)) {
        if (key === 'specificAddresses') continue;
        if (config.noAutoCleanup || typeof config.cleanInboxDays === 'number' || typeof config.cleanSentDays === 'number') {
            specialRoles.push({ role: key, config });
        }
    }

    if (specialRoles.length > 0) {
        const rolePlaceholders = specialRoles.map(() => '?').join(',');
        const roleNames = specialRoles.map(r => r.role);
        
        const results = await c.env.DB.prepare(`
            SELECT a.name as address, ur.role_text 
            FROM address a
            JOIN users_address ua ON a.id = ua.address_id
            JOIN user_roles ur ON ua.user_id = ur.user_id
            WHERE ur.role_text IN (${rolePlaceholders})
        `).bind(...roleNames).all<{ address: string, role_text: string }>();

        if (results.results) {
            for (const row of results.results) {
                if (roleConfigs.specificAddresses && roleConfigs.specificAddresses[row.address]) continue;

                const config = roleConfigs[row.role_text];
                if (!config) continue;

                if (config.noAutoCleanup) exemptInbox.push(row.address);
                else if (typeof config.cleanInboxDays === 'number') addPolicy(inboxPolicy, config.cleanInboxDays, row.address);

                if (config.noAutoCleanup) exemptSent.push(row.address);
                else if (typeof config.cleanSentDays === 'number') addPolicy(sentPolicy, config.cleanSentDays, row.address);
            }
        }
    }

    const executeCleanup = async (table: 'raw_mails' | 'sendbox', defaultDays: number, policyMap: Map<number, string[]>, exemptList: string[]) => {
        const allSpecialAddresses = [...exemptList];
        for (const addrs of policyMap.values()) {
            allSpecialAddresses.push(...addrs);
        }

        if (allSpecialAddresses.length > 0) {
            const placeholders = allSpecialAddresses.map(() => '?').join(',');
            await c.env.DB.prepare(`
                DELETE FROM ${table} 
                WHERE created_at < datetime('now', '-${defaultDays} day') 
                AND address NOT IN (${placeholders})
            `).bind(...allSpecialAddresses).run();
        } else {
            await c.env.DB.prepare(`
                DELETE FROM ${table} WHERE created_at < datetime('now', '-${defaultDays} day')
            `).run();
        }

        for (const [days, addresses] of policyMap.entries()) {
            if (addresses.length === 0) continue;
            const placeholders = addresses.map(() => '?').join(',');
            await c.env.DB.prepare(`
                DELETE FROM ${table} 
                WHERE created_at < datetime('now', '-${days} day') 
                AND address IN (${placeholders})
            `).bind(...addresses).run();
        }
    }

    switch (cleanType) {
        case "mails":
            await executeCleanup('raw_mails', cleanDays, inboxPolicy, exemptInbox);
            break;
        case "sendbox":
            await executeCleanup('sendbox', cleanDays, sentPolicy, exemptSent);
            break;
        case "inactiveAddress":
            await batchDeleteAddressWithData(c, `updated_at < datetime('now', '-${cleanDays} day')`);
            break;
        case "addressCreated":
            await batchDeleteAddressWithData(c, `created_at < datetime('now', '-${cleanDays} day')`);
            break;
        case "unboundAddress":
            await batchDeleteAddressWithData(c, `id NOT IN (SELECT address_id FROM users_address) AND created_at < datetime('now', '-${cleanDays} day')`);
            break;
        case "mails_unknow":
            await c.env.DB.prepare(`DELETE FROM raw_mails WHERE address NOT IN (select name from address) AND created_at < datetime('now', '-${cleanDays} day')`).run();
            break;
        case "emptyAddress":
            await batchDeleteAddressWithData(c, `name NOT IN (SELECT DISTINCT address FROM raw_mails WHERE address IS NOT NULL) AND created_at < datetime('now', '-${cleanDays} day')`);
            break;
        case "transactions":
            await c.env.DB.prepare(`DELETE FROM transactions WHERE created_at < datetime('now', '-${cleanDays} day')`).run();
            break;
        default:
            throw new Error("Invalid cleanType")
    }
    return true;
}

const batchDeleteAddressWithData = async (
    c: Context<HonoCustomType>,
    addressQueryCondition: string,
): Promise<boolean> => {
    await c.env.DB.prepare(
        `DELETE FROM raw_mails WHERE address IN ( ` +
        `SELECT name FROM address WHERE ${addressQueryCondition})`
    ).run();
    await c.env.DB.prepare(
        `DELETE FROM sendbox WHERE address IN ( ` +
        `SELECT name FROM address WHERE ${addressQueryCondition})`
    ).run();
    await c.env.DB.prepare(
        `DELETE FROM auto_reply_mails WHERE address IN ( ` +
        `SELECT name FROM address WHERE ${addressQueryCondition})`
    ).run();
    await c.env.DB.prepare(
        `DELETE FROM address_sender WHERE address IN ( ` +
        `SELECT name FROM address WHERE ${addressQueryCondition})`
    ).run();
    await c.env.DB.prepare(
        `DELETE FROM users_address WHERE address_id IN ( ` +
        `SELECT id FROM address WHERE ${addressQueryCondition})`
    ).run();
    await c.env.DB.prepare(`
        DELETE FROM address WHERE ${addressQueryCondition}`
    ).run();
    return true;
}

export const deleteAddressWithData = async (
    c: Context<HonoCustomType>,
    address: string | undefined | null,
    address_id: number | undefined | null
): Promise<boolean> => {
    if (!getBooleanValue(c.env.ENABLE_USER_DELETE_EMAIL)) {
        throw new Error("Delete email is disabled")
    }
    if (!address && !address_id) {
        throw new Error("Address or address_id required")
    }
    if (!address_id) {
        address_id = await c.env.DB.prepare(
            `SELECT id FROM address where name = ?`
        ).bind(address).first<number>("id");
    } else if (!address) {
        address = await c.env.DB.prepare(
            `SELECT name FROM address where id = ?`
        ).bind(address_id).first<string>("name");
    }
    if (!address || !address_id) {
        throw new Error("Can't find address");
    }
    await unbindTelegramByAddress(c, address);
    const { success: mailSuccess } = await c.env.DB.prepare(
        `DELETE FROM raw_mails WHERE address = ? `
    ).bind(address).run();
    const { success: sendAccess } = await c.env.DB.prepare(
        `DELETE FROM address_sender WHERE address = ? `
    ).bind(address).run();
    const { success: sendboxSuccess } = await c.env.DB.prepare(
        `DELETE FROM sendbox WHERE address = ? `
    ).bind(address).run();
    const { success: addressSuccess } = await c.env.DB.prepare(
        `DELETE FROM users_address WHERE address_id = ? `
    ).bind(address_id).run();
    const { success: autoReplySuccess } = await c.env.DB.prepare(
        `DELETE FROM auto_reply_mails WHERE address = ? `
    ).bind(address).run();
    const { success } = await c.env.DB.prepare(
        `DELETE FROM address WHERE name = ? `
    ).bind(address).run();
    if (!success || !mailSuccess || !sendboxSuccess || !addressSuccess || !sendAccess || !autoReplySuccess) {
        throw new Error("Failed to delete address")
    }
    return true;
}

export const handleListQuery = async (
    c: Context<HonoCustomType>,
    query: string, countQuery: string, params: string[],
    limit: string | number | undefined | null,
    offset: string | number | undefined | null
): Promise<Response> => {
    if (typeof limit === "string") limit = parseInt(limit);
    if (typeof offset === "string") offset = parseInt(offset);
    if (!limit || limit < 0 || limit > 100) return c.text("Invalid limit", 400)
    if (offset == null || offset == undefined || offset < 0) return c.text("Invalid offset", 400)
    
    const resultsQuery = `${query} order by id desc limit ? offset ?`;
    const { results } = await c.env.DB.prepare(resultsQuery).bind(
        ...params, limit, offset
    ).all();
    
    const count = await c.env.DB.prepare(
        countQuery
    ).bind(...params).first("count") || 0;

    return c.json({ results, count });
}

export const commonParseMail = async (parsedEmailContext: ParsedEmailContext): Promise<{
    sender: string,
    subject: string,
    text: string,
    html: string,
    headers?: Record<string, string>[]
} | undefined> => {
    if (!parsedEmailContext || !parsedEmailContext.rawEmail) return undefined;
    if (parsedEmailContext.parsedEmail) return parsedEmailContext.parsedEmail;
    const raw_mail = parsedEmailContext.rawEmail;
    try {
        const { default: PostalMime } = await import('postal-mime');
        const parsedEmail = await PostalMime.parse(raw_mail);
        parsedEmailContext.parsedEmail = {
            sender: parsedEmail.from ? `${parsedEmail.from.name} <${parsedEmail.from.address}>` : "",
            subject: parsedEmail.subject || "",
            text: parsedEmail.text || "",
            html: parsedEmail.html || "",
            headers: parsedEmail.headers || [],
        };
        return parsedEmailContext.parsedEmail;
    }
    catch (e) {
        console.error("Failed use PostalMime to parse email", e);
    }
    return undefined;
}

// ==========================================
// 优化后的角色缓存逻辑 (不再写入 KV)
// ==========================================
export const commonGetUserRole = async (
    c: Context<HonoCustomType>, user_id: number
): Promise<UserRole | undefined | null> => {
    const cacheKey = `ROLE:${user_id}`;
    const user_roles = getUserRoles(c);

    // 1. 内存缓存 (Hit = 0 Cost)
    let role_text = getCache(cacheKey);
    if (role_text) return user_roles.find((r) => r.role === role_text);

    // 2. 数据库查询 (D1 Read is cheap)
    // [优化] 不再尝试从 KV 读取或写入，直接查 DB
    role_text = await c.env.DB.prepare(
        `SELECT role_text FROM user_roles where user_id = ?`
    ).bind(user_id).first<string | undefined | null>("role_text");
    
    // 3. 写入内存缓存
    if (role_text) {
        setCache(cacheKey, role_text, 120); // 缓存 2 分钟
    }

    return role_text ? user_roles.find((r) => r.role === role_text) : null;
}

export const clearUserRoleCache = async (c: Context<HonoCustomType>, user_id: number) => {
    const cacheKey = `ROLE:${user_id}`;
    GlobalCache.delete(cacheKey);
    // 不再需要删除 KV，因为我们不再写入
}

export const getAddressPrefix = async (c: Context<HonoCustomType>): Promise<string | undefined> => {
    const user = c.get("userPayload");
    if (!user) {
        return getStringValue(c.env.PREFIX);
    }
    const user_role = await commonGetUserRole(c, user.user_id);
    if (typeof user_role?.prefix === "string") {
        return user_role.prefix;
    }
    return getStringValue(c.env.PREFIX);
}

export const getAllowDomains = async (c: Context<HonoCustomType>): Promise<string[]> => {
    const user = c.get("userPayload");
    if (!user) {
        return getDefaultDomains(c);
    }
    const user_role = await commonGetUserRole(c, user.user_id);
    return user_role?.domains || getDefaultDomains(c);;
}

export async function sendWebhook(
    settings: WebhookSettings, formatMap: WebhookMail
): Promise<{ success: boolean, message?: string }> {
    let body = settings.body;
    for (const key of Object.keys(formatMap)) {
        body = body.replace(
            new RegExp(`\\$\\{${key}\\}`, "g"),
            JSON.stringify(
                formatMap[key as keyof WebhookMail]
            ).replace(/^"(.*)"$/, '$1')
        );
    }
    const response = await fetch(settings.url, {
        method: settings.method,
        headers: JSON.parse(settings.headers),
        body: body
    });
    if (!response.ok) {
        console.log("send webhook error", settings.url, settings.method, settings.headers, body);
        return { success: false, message: `send webhook error: ${response.status} ${response.statusText}` };
    }
    return { success: true }
}

export async function triggerWebhook(
    c: Context<HonoCustomType>,
    address: string,
    parsedEmailContext: ParsedEmailContext,
    message_id: string | null
): Promise<void> {
    if (!c.env.KV || !getBooleanValue(c.env.ENABLE_WEBHOOK)) {
        return
    }
    const webhookList: WebhookSettings[] = []
    const adminMailWebhookSettings = await c.env.KV.get<WebhookSettings>(CONSTANTS.WEBHOOK_KV_ADMIN_MAIL_SETTINGS_KEY, "json");
    if (adminMailWebhookSettings?.enabled) {
        webhookList.push(adminMailWebhookSettings)
    }
    const adminSettings = await c.env.KV.get<AdminWebhookSettings>(CONSTANTS.WEBHOOK_KV_SETTINGS_KEY, "json");
    if (!adminSettings?.enableAllowList || adminSettings?.allowList.includes(address)) {
        const settings = await c.env.KV.get<WebhookSettings>(
            `${CONSTANTS.WEBHOOK_KV_USER_SETTINGS_KEY}:${address}`, "json"
        );
        if (settings?.enabled) {
            webhookList.push(settings)
        }
    }
    if (webhookList.length === 0) return
    const mailId = await c.env.DB.prepare(
        `SELECT id FROM raw_mails where address = ? and message_id = ?`
    ).bind(address, message_id).first<string>("id");

    const parsedEmail = await commonParseMail(parsedEmailContext);
    const webhookMail = {
        id: mailId || "",
        url: c.env.FRONTEND_URL ? `${c.env.FRONTEND_URL}?mail_id=${mailId}` : "",
        from: parsedEmail?.sender || "",
        to: address,
        subject: parsedEmail?.subject || "",
        raw: parsedEmailContext.rawEmail || "",
        parsedText: parsedEmail?.text || "",
        parsedHtml: parsedEmail?.html || ""
    }
    for (const settings of webhookList) {
        const res = await sendWebhook(settings, webhookMail);
        if (!res.success) console.error(res.message);
    }
}

export async function triggerAnotherWorker(
    c: Context<HonoCustomType>,
    rpcEmailMessage: RPCEmailMessage,
    parsedText: string | undefined | null
): Promise<void> {
    if (!parsedText) return;

    const anotherWorkerList: AnotherWorker[] = getAnotherWorkerList(c);
    if (!getBooleanValue(c.env.ENABLE_ANOTHER_WORKER) || anotherWorkerList.length === 0) return;

    const parsedTextLowercase: string = parsedText.toLowerCase();
    for (const worker of anotherWorkerList) {
        const keywords = worker?.keywords ?? [];
        const bindingName = worker?.binding ?? "";
        const methodName = worker.method ?? "rpcEmail";
        const serviceBinding = (c.env as any)[bindingName] ?? {};
        const method = serviceBinding[methodName];

        if (!method || typeof method !== "function") {
            console.log(`method = ${methodName} not found or not function`);
            continue;
        }
        if (!keywords.some(keyword => keyword && parsedTextLowercase.includes(keyword.toLowerCase()))) {
            continue;
        }
        try {
            const bodyObj = { ...rpcEmailMessage } as any;
            if (bodyObj.headers && typeof bodyObj.headers.forEach === "function") {
                const headerObj: any = {}
                bodyObj.headers.forEach((value: string, key: string) => {
                    headerObj[key] = value;
                });
                bodyObj.headers = headerObj
            }
            const requestBody = JSON.stringify(bodyObj);
            await method(requestBody);
        } catch (e1) {
            console.error(`execute method = ${methodName} error`, e1);
        }
    }
}