import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { createLogger } from "@spotting/config/logger";
import nodemailer, { type Transporter } from "nodemailer";

const logger = createLogger("email");

function awsRegion(): string | undefined {
  return process.env.SMTP_REGION?.trim() || process.env.AWS_REGION?.trim();
}

function smtpHost(): string | undefined {
  const region = awsRegion();
  if (region) {
    return `email-smtp.${region}.amazonaws.com`;
  }
  return process.env.SMTP_HOST?.trim();
}

function awsAccessKeyId(): string | undefined {
  return process.env.AWS_ACCESS_KEY_ID?.trim();
}

function awsSecretAccessKey(): string | undefined {
  return process.env.AWS_SECRET_ACCESS_KEY?.trim();
}

function smtpUsername(): string | undefined {
  return process.env.SMTP_USER?.trim() || process.env.SMTP_USERNAME?.trim();
}

function smtpPassword(): string | undefined {
  return process.env.SMTP_PASS?.trim() || process.env.SMTP_PASSWORD?.trim();
}

function fromAddress(): string | undefined {
  return process.env.SMTP_FROM?.trim() || process.env.MAIL_FROM?.trim();
}

function mailFrom(): string {
  const from = fromAddress();
  if (!from) {
    throw new Error("SMTP_FROM (or MAIL_FROM) is required");
  }
  return from;
}

export function isSesApiConfigured(): boolean {
  return Boolean(awsRegion() && awsAccessKeyId() && awsSecretAccessKey() && fromAddress());
}

export function isSmtpConfigured(): boolean {
  return Boolean(smtpHost() && smtpUsername() && smtpPassword() && fromAddress());
}

export function isEmailConfigured(): boolean {
  return isSesApiConfigured() || isSmtpConfigured();
}

let sesClient: SESClient | null = null;

function getSesClient(): SESClient {
  if (sesClient) return sesClient;

  const region = awsRegion();
  const accessKeyId = awsAccessKeyId();
  const secretAccessKey = awsSecretAccessKey();
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("SES API is not configured (SMTP_REGION, AWS/SMTP credentials)");
  }

  sesClient = new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  return sesClient;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = smtpHost();
  const user = smtpUsername();
  const pass = smtpPassword();
  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured (SMTP_REGION, SMTP_USERNAME, SMTP_PASSWORD)");
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure =
    process.env.SMTP_SECURE?.trim().toLowerCase() === "true" || port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
  });

  return transporter;
}

function buildRawEmail(input: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): string {
  const boundary = `----=_Spotting_${Date.now()}`;
  return [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    input.text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    input.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

async function sendViaSesApi(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const from = mailFrom();
  const raw = buildRawEmail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  await getSesClient().send(
    new SendRawEmailCommand({
      Source: from,
      Destinations: [input.to],
      RawMessage: { Data: Buffer.from(raw) },
    }),
  );
}

async function sendViaSmtp(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  await getTransporter().sendMail({
    from: mailFrom(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

function formatEmailError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/535|Authentication Credentials Invalid/i.test(message)) {
    return [
      message,
      "Hint: IAM access keys are not SMTP passwords.",
      "Use AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY for SES API (recommended),",
      "or create dedicated SMTP credentials in SES → SMTP settings.",
    ].join(" ");
  }
  return message;
}

export async function sendVerificationEmail(input: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  const subject =
    process.env.MAIL_VERIFICATION_SUBJECT?.trim() ||
    "Verify your Spotting email";
  const appName = process.env.MAIL_APP_NAME?.trim() || "Spotting";

  const text = [
    `Hi ${input.name},`,
    "",
    `Your ${appName} verification code is: ${input.code}`,
    "",
    "This code expires in 30 minutes.",
    "",
    "If you did not create an account, you can ignore this email.",
  ].join("\n");

  const html = `
    <p>Hi ${escapeHtml(input.name)},</p>
    <p>Your ${escapeHtml(appName)} verification code is:</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:0.25em;margin:16px 0">${escapeHtml(input.code)}</p>
    <p style="color:#64748b;font-size:14px">This code expires in 30 minutes.</p>
    <p style="color:#64748b;font-size:14px">If you did not create an account, you can ignore this email.</p>
  `.trim();

  if (!isEmailConfigured()) {
    logger.warn("verification_email_dev_fallback", {
      to: input.to,
      code: input.code,
      hint: "Set SMTP_USERNAME/SMTP_PASSWORD + SMTP_REGION in apps/api/.env",
    });
    return;
  }

  const payload = { to: input.to, subject, text, html };
  const transport = isSesApiConfigured() ? "ses_api" : "smtp";

  try {
    if (transport === "ses_api") {
      await sendViaSesApi(payload);
    } else {
      await sendViaSmtp(payload);
    }
    logger.info("verification_email_sent", { to: input.to, transport });
  } catch (error) {
    const formatted = formatEmailError(error);
    logger.error("verification_email_failed", {
      to: input.to,
      transport,
      error: formatted,
    });
    throw new Error(`Failed to send verification email: ${formatted}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
