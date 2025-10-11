export interface Config {
    port: number;
    nodeEnv: string;
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    frontendUrl: string;
    rateLimitWindowMs: number;
    rateLimitMax: number;
}
export declare const config: Config;
//# sourceMappingURL=env.d.ts.map