import { NextFunction, Request, Response } from 'express';
import jwtUtils from '../utils/jwt.utils';
import logger from '../logs/logger';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn('Protected route accessed without a token', {
      method: req.method,
      path: req.originalUrl,
    });
    return res.status(401).json({
      message: 'Unauthorized: No token provided',
    });
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    logger.warn('Protected route accessed with invalid token format', {
      method: req.method,
      path: req.originalUrl,
    });
    return res.status(401).json({
      message: 'Unauthorized: Invalid token format',
    });
  }

  try {
    const decode = jwtUtils.verifyAccessToken(token);

    if (typeof decode === 'string' || typeof decode.userId !== 'string') {
      logger.warn('Protected route accessed with invalid token', {
        method: req.method,
        path: req.originalUrl,
      });
      return res.status(401).json({
        message: 'Unauthorized: Invalid token',
      });
    }

    req.auth = {
      userId: decode.userId,
    };

    return next();
  } catch {
    logger.error('Token verification failed', {
      method: req.method,
      path: req.originalUrl,
    });
    return res.status(401).json({
      message: 'Unauthorized: Invalid token',
    });
  }
}
