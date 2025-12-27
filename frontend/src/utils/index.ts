export const hashPassword = async (password: string) => {
    // user crypto to hash password
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export const getRouterPathWithLang = (path: string, lang: string) => {
    if (!lang || lang === 'zh') {
        return path;
    }
    return `/${lang}${path}`;
}

export const utcToLocalDate = (utcDate: string, useUTCDate: boolean = false) => {
    // 原始输入通常是 "YYYY-MM-DD HH:mm:ss"，添加 UTC 后缀以便 Date 对象正确解析
    const utcDateString = `${utcDate} UTC`;
    
    try {
        const date = new Date(utcDateString);
        // if invalid date string
        if (isNaN(date.getTime())) return utcDate;

        // 强制转换为 UTC+8 (Asia/Shanghai)
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Shanghai'
        }).format(date).replace(/\//g, '-');
    } catch (e) {
        console.error(e);
        return utcDateString;
    }
}
