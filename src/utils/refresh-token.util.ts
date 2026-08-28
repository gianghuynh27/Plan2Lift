import crypto from 'crypto';
import type { CookieOptions } from 'express';

import config from '../config/config';
/**
 * Defines the name and security settings for the refresh-token cookie,
 * including its expiration date.
 */
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.appMode === 'PROD',
  sameSite: 'lax',
  path: '/api/v1/auth',
};

export function createRefreshCookieOptions(expiresAt: Date): CookieOptions {
  return {
    ...refreshTokenCookieOptions,
    expires: expiresAt,
  };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
