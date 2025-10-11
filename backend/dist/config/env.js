"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables - handle both development and production paths
const envPath = process.env.NODE_ENV === 'production'
    ? path_1.default.join(__dirname, '../../.env')
    : path_1.default.join(process.cwd(), '.env');
dotenv_1.default.config({ path: envPath });
// Debug: Log if env variables are loaded (remove in production)
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Environment variables loaded from:', envPath);
    console.log('🔧 DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('🔧 JWT_SECRET exists:', !!process.env.JWT_SECRET);
}
const getEnvVar = (key, defaultValue) => {
    const value = process.env[key];
    if (!value && !defaultValue) {
        throw new Error(`Environment variable ${key} is required`);
    }
    return value || defaultValue;
};
exports.config = {
    port: parseInt(getEnvVar('PORT', '5000'), 10),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    databaseUrl: getEnvVar('DATABASE_URL'),
    jwtSecret: getEnvVar('JWT_SECRET'),
    jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
    frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:8080'),
    rateLimitWindowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    rateLimitMax: parseInt(getEnvVar('RATE_LIMIT_MAX', '100'), 10),
};
//# sourceMappingURL=env.js.map