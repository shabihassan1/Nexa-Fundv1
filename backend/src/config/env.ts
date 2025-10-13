import dotenv from 'dotenv';
import path from 'path';

// Load environment variables - handle both development and production paths
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../../.env')
  : path.join(process.cwd(), '.env');

dotenv.config({ path: envPath });

// Debug: Log if env variables are loaded (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Environment variables loaded from:', envPath);
  console.log('🔧 DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('🔧 JWT_SECRET exists:', !!process.env.JWT_SECRET);
}

export interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  frontendUrl: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  recommenderUrl: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
};

export const config: Config = {
  port: parseInt(getEnvVar('PORT', '5050'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  databaseUrl: getEnvVar('DATABASE_URL'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:8080'),
  rateLimitWindowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  rateLimitMax: parseInt(getEnvVar('RATE_LIMIT_MAX', '100'), 10),
  recommenderUrl: getEnvVar('RECOMMENDER_URL', 'http://localhost:8001'),
}; 