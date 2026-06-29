import nodemailer from 'nodemailer';
import { env } from './env.js';

/**
 * Nodemailer transport against the CHR internal SMTP/Exchange server.
 * No third-party email service. STARTTLS on port 587.
 * See docs/ARCHITECTURE.md "Email via Nodemailer".
 */
export const emailTransport = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: false, // STARTTLS
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

/**
 * From addresses. Customer-facing mail must never carry Planix branding
 * (CLAUDE.md rule #4) — it goes out as CHR Solutions.
 */
export const fromAddresses = {
  internal: 'Planix <planix@chrsolutions.com>',
  customer: 'CHR Solutions Project Updates <projects@chrsolutions.com>',
} as const;
