import { Context } from 'hono';
import { HonoCustomType } from '../types';
import { Model } from '../models';
import { getDomains, jsonResponse } from '../utils';

// 获取域名价格列表 (自动合并环境变量中的域名)
export async function adminGetDomainPrices(c: Context<HonoCustomType>): Promise<Response> {
    const model = new Model(c.env.DB);
    
    // 1. 获取环境变量中的所有可用域名
    const envDomains = getDomains(c);
    
    // 2. 获取数据库中存储的配置
    const dbSettings = await model.getAllDomainSettings();
    
    // 3. 将数据库配置映射为 Map 以便查找
    const settingsMap = new Map(dbSettings.map(item => [item.domain, item]));
    
    // 4. 合并结果：优先显示环境变量中的域名，如果数据库有价格则附加，否则默认为 0
    const result = envDomains.map(domain => {
        const setting = settingsMap.get(domain);
        return {
            domain: domain,
            price: setting ? setting.price : 0, // 默认为 0
            // 可以扩展其他属性，如是否允许注册等
        };
    });

    return jsonResponse(result);
}

// 更新域名价格
export async function adminUpdateDomainPrice(c: Context<HonoCustomType>): Promise<Response> {
    const { domain, price } = await c.req.json();
    
    if (!domain) {
        return jsonResponse({ message: 'Domain is required' }, 400);
    }
    
    const model = new Model(c.env.DB);
    const success = await model.upsertDomainSetting(domain, Number(price) || 0);
    
    if (success) {
        return jsonResponse({ message: 'Domain price updated' });
    } else {
        return jsonResponse({ message: 'Failed to update' }, 500);
    }
}