import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
const signWithExpiry = (payload, secret, expiresIn) => jwt.sign(payload, secret, { expiresIn });
export const signAccessToken = (payload) => signWithExpiry(payload, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_TTL);
export const signRefreshToken = (payload) => signWithExpiry(payload, env.JWT_REFRESH_SECRET, env.REFRESH_TOKEN_TTL);
export const signResetToken = (payload) => signWithExpiry(payload, env.JWT_RESET_SECRET, '15m');
export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);
export const verifyResetToken = (token) => jwt.verify(token, env.JWT_RESET_SECRET);
