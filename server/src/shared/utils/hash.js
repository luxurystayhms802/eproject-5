import crypto from 'node:crypto';
export const hashToken = (value) => crypto.createHash('sha256').update(value).digest('hex');
