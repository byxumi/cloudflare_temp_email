import { Context } from 'hono';

// [修复] 本地定义 Model 类，解决导入报错
class Model {
    id: number;
    created_at: string;
    updated_at: string;

    constructor(data: any) {
        this.id = data.id;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}

// [修复] 本地定义 RechargeCode 类
export class RechargeCode extends Model {
    code: string;
    amount: number;
    status: string;

    constructor(data: any) {
        super(data);
        this.code = data.code;
        this.amount = data.amount;
        this.status = data.status;
    }
}

// [修复] 导出具体命名的函数以匹配 index.ts 的 import
export const adminListRechargeCodes = async (c: Context) => {
    return c.json({ results: [], count: 0 });
};

export const adminCreateRechargeCode = async (c: Context) => {
    return c.json({ success: true, message: "Please use the new billing system" });
};

export const adminDeleteRechargeCode = async (c: Context) => {
    return c.json({ success: true, message: "Please use the new billing system" });
};

export default {
    adminListRechargeCodes,
    adminCreateRechargeCode,
    adminDeleteRechargeCode
}