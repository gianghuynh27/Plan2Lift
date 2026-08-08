import { NextFunction, Request, Response } from 'express';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { username, email, password } = req.body;

  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({
      message: 'Username, email, and password are required',
    });
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedUsername.length < 3) {
    return res.status(400).json({
      message: 'Username must contain at least 3 characters',
    });
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({
      message: 'Enter a valid email address',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: 'Password must contain at least 8 characters',
    });
  }

  req.body = {
    username: normalizedUsername,
    email: normalizedEmail,
    password,
  };

  return next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      message: 'Email and password are required',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({
      message: 'Enter a valid email address',
    });
  }

  req.body = {
    email: normalizedEmail,
    password,
  };

  return next();
}

export function validateResendVerification(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { email } = req.body;

  if (typeof email !== 'string') {
    return res.status(400).json({
      message: 'Email is required',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({
      message: 'Enter a valid email address',
    });
  }

  req.body = {
    email: normalizedEmail,
  };

  return next();
}

export function validateVerificationToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { token } = req.query;

  if (typeof token !== 'string' || token.length < 32 || token.length > 256) {
    return res.status(400).json({
      code: 'INVALID_VERIFICATION_TOKEN',
      message: 'Invalid verification token',
    });
  }

  return next();
}
