import jwt, { SignOptions } from 'jsonwebtoken';

import config from '../config/config';

class JwtUtils {
  createAccessToken(payload: object): string {
    const secret = config.tokenSecret;
    return jwt.sign(payload, secret, {
      expiresIn: config.tokenTtl as SignOptions['expiresIn'],
    });
  }

  createRefreshToken(payload: object): string {
    const secret = config.refreshTokenSecret;
    return jwt.sign(payload, secret, {
      expiresIn: config.refreshTokenTtl as SignOptions['expiresIn'],
    });
  }

  createTokens(payload: object): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.createAccessToken(payload),
      refreshToken: this.createRefreshToken(payload),
    };
  }

  verifyAccessToken(token: string) {
    const secret = config.tokenSecret;
    return jwt.verify(token, secret);
  }

  verifyRefreshToken(token: string) {
    const secret = config.refreshTokenSecret;
    return jwt.verify(token, secret);
  }
}

const jwtUtils = new JwtUtils();

export default jwtUtils;
