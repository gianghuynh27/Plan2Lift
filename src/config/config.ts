import dotenv from 'dotenv';

dotenv.config();

interface IConfig {
  port: number;
  appMode: 'DEV' | 'STAGING' | 'PROD';
  mongoUri: string;
  tokenSecret: string;
  refreshTokenSecret: string;
  tokenTtl: string;
  refreshTokenTtl: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  appPublicUrl: string;
  emailVerificationTtlMinutes: number;
  emailVerificationResendCooldownSeconds: number;
}

const config: IConfig = {
  port: parseInt(process.env.PORT || '8000', 10),
  appMode: (process.env.APP_MODE as 'DEV' | 'STAGING' | 'PROD') || 'DEV',
  mongoUri:
    process.env[`${process.env.APP_MODE}_MONGO_URI`] ||
    'mongodb://localhost:27017/plan2lift',
  tokenSecret: process.env.TOKEN_SECRET || 'default_token_secret',
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || 'default_refresh_token_secret',
  tokenTtl: process.env.TOKEN_TTL || '1h',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  smtpHost: process.env.SMTP_HOST || 'smtp.example.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_EMAIL || '',
  smtpPass: process.env.SMTP_APP_SPECIFIC_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || 'Plan2Lift <no-reply@plan2lift.com>',
  appPublicUrl:
    process.env.APP_PUBLIC_URL ||
    `http://localhost:${process.env.PORT} || '8000`,
  emailVerificationTtlMinutes: parseInt(
    process.env.EMAIL_VERIFICATION_TTL_MINUTES || '1440',
    10,
  ),
  emailVerificationResendCooldownSeconds: parseInt(
    process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS || '60',
    10,
  ),
};

export default config;
