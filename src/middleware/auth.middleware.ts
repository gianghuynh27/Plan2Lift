import { NextFunction, Request, Response } from 'express';
import jwtUtils from '../utils/jwt.utils';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'Unauthorized: No token provided',
    });
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({
      message: 'Unauthorized: Invalid token format',
    });
  }

  try {
    const decode = jwtUtils.verifyAccessToken(token);

    if (typeof decode === 'string' || typeof decode.userId !== 'string') {
      return res.status(401).json({
        message: 'Unauthorized: Invalid token',
      });
    }

    req.auth = {
      userId: decode.userId,
    };

    return next();
  } catch {
    return res.status(401).json({
      message: 'Unauthorized: Invalid token',
    });
  }
}
