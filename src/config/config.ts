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
}

const config: IConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
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
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
};

export default config;
