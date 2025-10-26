export type UserOauth2Settings = {
    name: string;
    clientID: string;
    clientSecret: string;
    authorizationURL: string;
    accessTokenURL: string;
    accessTokenFormat?: string;
    userInfoURL: string;
    redirectURL: string;
    logoutURL?: string;
    userEmailKey: string;
    scope: string;
    enableMailAllowList?: boolean | undefined;
    mailAllowList?: string[] | undefined;
}

export type DomainPricingConfig = {
    defaultCost: number;
    domainPrices: Record<string, number | 'free'>;
    roleOverrides: Record<string, {
        defaultCostOverride?: number | 'free';
        domainPricesOverride?: Record<string, number | 'free'>;
    }>;
};
