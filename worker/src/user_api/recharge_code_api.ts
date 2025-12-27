import { Context } from 'hono';

// [修复] 本地定义 Model 类
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

// [修复] 导出 userUseRechargeCode 以匹配 index.ts
export const userUseRechargeCode = async (c: Context) => {
    return c.json({ success: false, message: "Use new billing api" });
};

export default {
    userUseRechargeCode
}