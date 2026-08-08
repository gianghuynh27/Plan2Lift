import nodemailer from 'nodemailer';

import config from '../config/config';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpPort == 465,
  auth:
    config.smtpUser && config.smtpPass
      ? {
          user: config.smtpUser,
          pass: config.smtpPass,
        }
      : undefined,
});

class EmailService {
  async sendVerificationEmail(
    email: string,
    verificationUrl: string,
  ): Promise<void> {
    const safeUrl = verificationUrl
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');

    await transporter.sendMail({
      from: config.smtpFrom,
      to: email,
      subject: 'Verify your Plan2Lift email address',
      text: [
        'Welcome to Plan2Lift.',
        '',
        'Verify your email address using this link:',
        verificationUrl,
        '',
        `This link expires in ${config.emailVerificationTtlMinutes} minutes.`,
        '',
        'If you did not create this account, you can ignore this email.',
      ].join('\n'),
      html: `
        <h1>Welcome to Plan2Lift</h1>
        <p>Please verify your email address to activate your account.</p>
        <p>
          <a href="${safeUrl}">Verify email address</a>
        </p>
        <p>
          This link expires in
          ${config.emailVerificationTtlMinutes} minutes.
        </p>
        <p>
          If you did not create this account, you can ignore this email.
        </p>
      `,
    });
  }

  async verifyConnection(): Promise<void> {
    await transporter.verify();
  }
}

const emailService = new EmailService();

export default emailService;
