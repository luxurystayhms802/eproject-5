import 'dotenv/config';
import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/luxurystay_hms'),
    JWT_SECRET: z.string().optional(),
    JWT_ACCESS_SECRET: z.string().optional(),
    JWT_REFRESH_SECRET: z.string().optional(),
    JWT_RESET_SECRET: z.string().optional(),
    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL: z.string().default('7d'),
    LOG_LEVEL: z.string().default('info'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
});
const parsedEnv = envSchema.parse(process.env);
const JWT_ACCESS_SECRET = parsedEnv.JWT_ACCESS_SECRET ?? parsedEnv.JWT_SECRET ?? 'luxurystay_access_secret';
const JWT_REFRESH_SECRET = parsedEnv.JWT_REFRESH_SECRET ?? parsedEnv.JWT_SECRET ?? 'luxurystay_refresh_secret';
const JWT_RESET_SECRET = parsedEnv.JWT_RESET_SECRET ?? parsedEnv.JWT_SECRET ?? 'luxurystay_reset_secret';
const insecureDefaults = [
    JWT_ACCESS_SECRET === 'luxurystay_access_secret',
    JWT_REFRESH_SECRET === 'luxurystay_refresh_secret',
    JWT_RESET_SECRET === 'luxurystay_reset_secret',
];
if (parsedEnv.NODE_ENV === 'production' && insecureDefaults.some(Boolean)) {
    throw new Error('Refusing to start in production with default JWT secrets. Set strong values in server/.env.');
}
export const env = {
    ...parsedEnv,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_RESET_SECRET,
};
