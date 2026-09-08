import nodemailer from "nodemailer";
import { Resend } from "resend";
import { programsCol, teamsCol, studentsCol, docsToData } from "./models";
import type { ResultRecord, Program, Team, Student } from "./types";

const DEFAULT_FROM_EMAIL =
  "Maerika 2K26 <noreply@maerika2k26.jawharathululoomsuffadars.online>";

/**
 * Returns a freshly initialized Resend client using the current RESEND_API_KEY environment variable.
 * Ensures the client is never stale across runtime requests.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Returns the verified Resend sender address from environment or default,
 * ensuring quotes are stripped and common transliteration typos are normalized.
 */
export function getResendFromEmail(): string {
  let from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  from = from.replace(/^["']|["']$/g, "").trim();
  if (from.includes("jawharathuloomsuffadars.online")) {
    from = from.replace(
      "jawharathuloomsuffadars.online",
      "jawharathululoomsuffadars.online"
    );
  }
  return from || DEFAULT_FROM_EMAIL;
}

export interface SendTeamWelcomeEmailOptions {
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  password?: string;
  portalUrl?: string;
}

/**
 * Sends a festival-branded welcome email with portal credentials to a newly provisioned team leader via Resend.
 */
export async function sendTeamWelcomeEmail(
  options: SendTeamWelcomeEmailOptions
): Promise<{ success: boolean; error?: string; note?: string }> {
  const { teamName, leaderName, leaderEmail, password, portalUrl } = options;

  if (!leaderEmail || !leaderEmail.includes("@")) {
    return { success: false, error: "A valid team leader email is required." };
  }

  const resolvedPortalUrl =
    portalUrl ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/team/login`;

  const fromEmail = getResendFromEmail();
  const resend = getResendClient();

  if (!resend) {
    console.warn(
      `[Resend Email Service] RESEND_API_KEY is not set in environment variables. Email could not be sent to: ${leaderEmail}`
    );
    return {
      success: false,
      error: "RESEND_API_KEY is not set in environment variables. Please add it to your .env file.",
    };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Welcome to Maerika 2K26 - Team Portal Credentials</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Baseline Reset */
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

    /* Responsive Device Rules */
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 14px !important; }
      .header-cell { padding: 26px 18px 16px 18px !important; }
      .body-cell { padding: 12px 18px 26px 18px !important; }
      .card-box { padding: 16px 14px !important; }
      .btn-container { width: 100% !important; display: block !important; }
      .btn-cta { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; padding: 14px 16px !important; }
      .title-h1 { font-size: 22px !important; line-height: 28px !important; }
      .subtitle-p { font-size: 12px !important; }
      .cred-label { display: block !important; width: 100% !important; padding: 4px 0 2px 0 !important; font-size: 11px !important; }
      .cred-val { display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <!-- Outer Wrapper Table -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-wrapper" style="background-color: #070B14; padding: 36px 12px; margin: 0 auto; width: 100%;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Inner Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-card" style="max-width: 580px; margin: 0 auto; background-color: #0d1527; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
          
          <!-- Top Accent Banner -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #E5A00D 0%, #f59e0b 50%, #0ea5e9 100%);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td align="center" class="header-cell" style="padding: 34px 32px 18px 32px; text-align: center;">
              <span style="display: inline-block; padding: 5px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);">
                Official Fest Portal Provisioning
              </span>
              <h1 class="title-h1" style="margin: 14px 0 6px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2;">
                Maerika 2K26
              </h1>
              <p class="subtitle-p" style="margin: 0; font-size: 13px; color: #94a3b8; font-style: italic;">
                കലായുഗ ഭാവുകം &bull; Arts &amp; Cultural Festival
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="body-cell" style="padding: 10px 32px 30px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #e2e8f0;">
                Hello <strong>${leaderName}</strong>,
              </p>
              <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Congratulations! You have been appointed as the Team Leader for <strong style="color: #ffffff;">${teamName}</strong> at Maerika 2K26. Your squad account has been created by the Fest Administration.
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(15, 23, 42, 0.85); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td class="card-box" style="padding: 20px 22px;">
                    <p style="margin: 0 0 14px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #fbbf24;">
                      Portal Access Credentials
                    </p>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Team Name:</td>
                        <td class="cred-val" style="padding: 7px 0; font-size: 14px; font-weight: 700; color: #ffffff;">${teamName}</td>
                      </tr>
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Team Leader:</td>
                        <td class="cred-val" style="padding: 7px 0; font-size: 14px; font-weight: 700; color: #ffffff;">${leaderName}</td>
                      </tr>
                      ${
                        password
                          ? `
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Access Password:</td>
                        <td class="cred-val" style="padding: 7px 0;">
                          <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 6px; padding: 4px 10px; font-size: 14px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #38bdf8; letter-spacing: 0.5px;">
                            ${password}
                          </span>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Login URL:</td>
                        <td class="cred-val" style="padding: 7px 0; font-size: 13px; word-break: break-all;">
                          <a href="${resolvedPortalUrl}" style="color: #38bdf8; text-decoration: none; font-weight: 600;">
                            ${resolvedPortalUrl}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="btn-container" style="margin-bottom: 26px;">
                <tr>
                  <td align="center">
                    <a href="${resolvedPortalUrl}" class="btn-cta" style="display: inline-block; padding: 14px 34px; border-radius: 12px; font-size: 15px; font-weight: 800; color: #070B14 !important; background: linear-gradient(90deg, #E5A00D, #f59e0b); text-decoration: none; text-align: center; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35); letter-spacing: 0.2px;">
                      Sign In to Team Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Key Instructions -->
              <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px 20px; border-left: 3px solid #E5A00D;">
                <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
                  What you should do next:
                </p>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; color: #94a3b8;">
                  <li style="margin-bottom: 4px;">Log in to the Team Leader Portal with your credentials.</li>
                  <li style="margin-bottom: 4px;">Register your squad participants and review assigned chest numbers.</li>
                  <li style="margin-bottom: 4px;">Submit stage &amp; off-stage program registrations within the scheduled window.</li>
                  <li>Monitor live podium standings and scoring in real time.</li>
                </ul>
              </div>

              <!-- Security Note -->
              <p style="margin: 22px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Security Note: Please keep these credentials confidential. If you did not expect this communication or need assistance, contact the Maerika 2K26 Festival Desk.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 24px; background-color: #080d19; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.5;">
                &copy; 2026 Maerika Fest Organising Committee &bull; All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
Welcome to Maerika 2K26 - Team Leader Portal

Hello ${leaderName},

You have been registered as the Team Leader for ${teamName} at Maerika 2K26 Arts Festival.

Your Portal Access Credentials:
- Team Name: ${teamName}
- Leader Name: ${leaderName}
${password ? `- Password: ${password}` : ""}
- Portal URL: ${resolvedPortalUrl}

Next steps:
1. Log in to your Team Portal: ${resolvedPortalUrl}
2. Register your student squad and verify chest numbers.
3. Submit candidate entries for programs before the registration deadline.

Best regards,
Maerika 2K26 Organising Committee
  `.trim();

  const replyToEmail =
    process.env.RESEND_REPLY_TO || "jawharathululoomsuffadars@gmail.com";

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: [leaderEmail.trim()],
      replyTo: replyToEmail,
      headers: {
        "X-Entity-Ref-ID": `team-${teamName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      },
      subject: `Welcome to Maerika 2K26 - Team Portal Credentials for ${teamName}`,
      html: htmlContent,
      text: textContent,
    });

    if (result.error) {
      console.error("[Resend Email Error]", {
        action: "sendTeamWelcomeEmail",
        to: leaderEmail,
        from: fromEmail,
        name: result.error.name,
        message: result.error.message,
      });
      return { success: false, error: result.error.message };
    }

    console.log(
      `[Resend Email Success] Sent team welcome email to ${leaderEmail} (ID: ${result.data?.id})`
    );
    return { success: true };
  } catch (err: unknown) {
    console.error("[Resend Send Failed]", {
      action: "sendTeamWelcomeEmail",
      to: leaderEmail,
      from: fromEmail,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to send welcome email via Resend.",
    };
  }
}

export async function sendCredentialUpdateEmail(credentials: {
  username: string;
  password: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "mishabvibwdddddes@gmail.com",
      subject: "Security Alert: Admin Credentials Updated - Funoon Fiesta",
      text: `
Hello,

This is a security notification to inform you that the admin credentials for the Funoon Fiesta portal have just been updated.

New Username: ${credentials.username}
New Password: ${credentials.password}

Time of change: ${new Date().toLocaleString()}

If you did not authorize this change, please take immediate action to secure your application.

Best regards,
Funoon Fiesta Security
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Credential update email sent successfully.");
  } catch (error) {
    console.error("Failed to send credential update email:", error);
    // We don't throw here to avoid breaking the user flow, but we log it.
  }
}

/**
 * Universal email notification sender via Resend with automatic Sandbox fallback.
 */
export async function sendEmailNotification(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  entityRefId?: string;
}): Promise<{ success: boolean; error?: string; note?: string }> {
  const { to, subject, html, text, entityRefId } = options;

  if (!to || !to.includes("@")) {
    return { success: false, error: "A valid recipient email is required." };
  }

  const fromEmail = getResendFromEmail();
  const replyToEmail =
    process.env.RESEND_REPLY_TO || "jawharathululoomsuffadars@gmail.com";
  const resend = getResendClient();

  if (!resend) {
    console.warn(
      `[Resend Email Service] RESEND_API_KEY is not set. Email could not be sent to: ${to}`
    );
    return {
      success: false,
      error: "RESEND_API_KEY is not set in environment variables.",
    };
  }

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: [to.trim()],
      replyTo: replyToEmail,
      headers: entityRefId ? { "X-Entity-Ref-ID": entityRefId } : undefined,
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error("[Resend Email Error]", {
        action: "sendEmailNotification",
        to,
        from: fromEmail,
        name: result.error.name,
        message: result.error.message,
      });
      return { success: false, error: result.error.message };
    }

    console.log(`[Resend Email Success] Sent email to ${to} (ID: ${result.data?.id})`);
    return { success: true };
  } catch (err: unknown) {
    console.error("[Resend Send Failed]", {
      action: "sendEmailNotification",
      to,
      from: fromEmail,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email via Resend.",
    };
  }
}

export interface SendStudentRegisteredEmailOptions {
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  studentName: string;
  chestNo: string;
}

/**
 * Notifies a team leader when a new student is enrolled into their squad.
 */
export async function sendStudentRegisteredEmail(
  options: SendStudentRegisteredEmailOptions
) {
  const { teamName, leaderName, leaderEmail, studentName, chestNo } = options;
  if (!leaderEmail || !leaderEmail.includes("@")) return { success: false };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const portalUrl = `${appUrl}/team/register-students`;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>New Student Registered - ${teamName}</title>
  <style>
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 14px !important; }
      .header-cell { padding: 26px 18px 16px 18px !important; }
      .body-cell { padding: 12px 18px 24px 18px !important; }
      .card-box { padding: 16px 14px !important; }
      .btn-container { width: 100% !important; display: block !important; }
      .btn-cta { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; padding: 14px 16px !important; }
      .title-h1 { font-size: 22px !important; line-height: 28px !important; }
      .cred-label { display: block !important; width: 100% !important; padding: 4px 0 2px 0 !important; font-size: 11px !important; }
      .cred-val { display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-wrapper" style="background-color: #070B14; padding: 36px 12px; margin: 0 auto; width: 100%;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-card" style="max-width: 580px; margin: 0 auto; background-color: #0d1527; border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #10b981 0%, #059669 50%, #0ea5e9 100%);"></td>
          </tr>
          <tr>
            <td align="center" class="header-cell" style="padding: 32px 32px 18px 32px; text-align: center;">
              <span style="display: inline-block; padding: 5px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background-color: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35);">
                Squad Roster Update
              </span>
              <h1 class="title-h1" style="margin: 14px 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.25;">
                Student Registered Successfully
              </h1>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                ${teamName} &bull; Maerika 2K26
              </p>
            </td>
          </tr>
          <tr>
            <td class="body-cell" style="padding: 10px 32px 28px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #e2e8f0;">
                Hello <strong>${leaderName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                A new participant has been successfully registered under your squad. Below are the enrolled student details:
              </p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(15, 23, 42, 0.85); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td class="card-box" style="padding: 20px 22px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Student Name:</td>
                        <td class="cred-val" style="padding: 7px 0; font-size: 15px; font-weight: 700; color: #ffffff;">${studentName}</td>
                      </tr>
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Chest Number:</td>
                        <td class="cred-val" style="padding: 7px 0;">
                          <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 6px; padding: 4px 10px; font-size: 15px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 800; color: #34d399;">
                            ${chestNo}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Team Squad:</td>
                        <td class="cred-val" style="padding: 7px 0; font-size: 14px; font-weight: 600; color: #ffffff;">${teamName}</td>
                      </tr>
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Enrollment Status:</td>
                        <td class="cred-val" style="padding: 7px 0; font-size: 13px; font-weight: 600; color: #38bdf8;">Verified & Enrolled</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="btn-container" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" class="btn-cta" style="display: inline-block; padding: 14px 34px; border-radius: 12px; font-size: 14px; font-weight: 800; color: #020617 !important; background: linear-gradient(90deg, #10b981, #34d399); text-decoration: none; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35); letter-spacing: 0.2px;">
                      View Team Roster &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px; background-color: #080d19; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; 2026 Maerika Fest Organising Committee &bull; Automated notification.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `New Student Registered - ${teamName}\n\nHello ${leaderName},\n\nA new student has been registered to your squad:\nName: ${studentName}\nChest No: ${chestNo}\nTeam: ${teamName}\n\nView squad roster at: ${portalUrl}`;

  return sendEmailNotification({
    to: leaderEmail,
    subject: `✅ New Student Registered: ${studentName} (${chestNo}) - ${teamName}`,
    html,
    text,
    entityRefId: `reg-${chestNo.toLowerCase()}`,
  });
}

export interface SendProgramRegistrationEmailOptions {
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  programName: string;
  studentName: string;
  studentChest: string;
}

/**
 * Notifies a team leader when a candidate is registered for a competition program.
 */
export async function sendProgramRegistrationEmail(
  options: SendProgramRegistrationEmailOptions
) {
  const { teamName, leaderName, leaderEmail, programName, studentName, studentChest } = options;
  if (!leaderEmail || !leaderEmail.includes("@")) return { success: false };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const portalUrl = `${appUrl}/team/program-register`;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Program Entry Confirmed - ${programName}</title>
  <style>
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 14px !important; }
      .header-cell { padding: 26px 18px 16px 18px !important; }
      .body-cell { padding: 12px 18px 24px 18px !important; }
      .card-box { padding: 16px 14px !important; }
      .btn-container { width: 100% !important; display: block !important; }
      .btn-cta { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; padding: 14px 16px !important; }
      .title-h1 { font-size: 22px !important; line-height: 28px !important; }
      .cred-label { display: block !important; width: 100% !important; padding: 4px 0 2px 0 !important; font-size: 11px !important; }
      .cred-val { display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-wrapper" style="background-color: #070B14; padding: 36px 12px; margin: 0 auto; width: 100%;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-card" style="max-width: 580px; margin: 0 auto; background-color: #0d1527; border: 1px solid rgba(14, 165, 233, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
          <tr><td style="height: 4px; background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%);"></td></tr>
          <tr>
            <td align="center" class="header-cell" style="padding: 32px 32px 18px 32px; text-align: center;">
              <span style="display: inline-block; padding: 5px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.35); letter-spacing: 1px;">
                Competition Entry Confirmed
              </span>
              <h1 class="title-h1" style="margin: 14px 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.25;">
                ${programName}
              </h1>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                ${teamName} Candidate Registration Receipt
              </p>
            </td>
          </tr>
          <tr>
            <td class="body-cell" style="padding: 10px 32px 28px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #e2e8f0;">Hello <strong>${leaderName}</strong>,</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Your participant entry for <strong style="color: #ffffff;">${programName}</strong> has been officially confirmed:
              </p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(15, 23, 42, 0.85); border: 1px solid rgba(14, 165, 233, 0.25); border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td class="card-box" style="padding: 20px 22px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Program:</td>
                        <td class="cred-val" style="padding: 7px 0; font-size: 14px; font-weight: 700; color: #ffffff;">${programName}</td>
                      </tr>
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Candidate:</td>
                        <td class="cred-val" style="padding: 7px 0; font-size: 14px; font-weight: 700; color: #38bdf8;">${studentName}</td>
                      </tr>
                      <tr>
                        <td class="cred-label" style="padding: 7px 0; font-size: 13px; color: #94a3b8; width: 36%;">Chest Number:</td>
                        <td class="cred-val" style="padding: 7px 0;">
                          <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 6px; padding: 4px 10px; font-size: 15px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 800; color: #fbbf24;">
                            ${studentChest}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="btn-container" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" class="btn-cta" style="display: inline-block; padding: 14px 34px; border-radius: 12px; font-size: 14px; font-weight: 800; color: #020617 !important; background: linear-gradient(90deg, #0ea5e9, #38bdf8); text-decoration: none; box-shadow: 0 8px 24px rgba(14, 165, 233, 0.35); letter-spacing: 0.2px;">
                      Manage Program Entries &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px; background-color: #080d19; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">&copy; 2026 Maerika Fest Organising Committee &bull; Automated notification.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Program Entry Confirmed: ${programName}\n\nCandidate: ${studentName} (${studentChest})\nTeam: ${teamName}\n\nManage entries at: ${portalUrl}`;

  return sendEmailNotification({
    to: leaderEmail,
    subject: `📋 Program Entry Confirmed: ${programName} - ${studentName}`,
    html,
    text,
    entityRefId: `prog-reg-${studentChest.toLowerCase()}`,
  });
}

/**
 * Sends branded result announcement emails to all team leaders when a program result is published/approved.
 */
export async function sendResultPublishedEmails(record: ResultRecord): Promise<void> {
  try {
    const [progDoc, teamsSnap, studentsSnap] = await Promise.all([
      programsCol.doc(record.program_id).get(),
      teamsCol.get(),
      studentsCol.get(),
    ]);

    if (!progDoc.exists) return;
    const program = progDoc.data() as Program;
    const teams = docsToData<Team>(teamsSnap);
    const students = docsToData<Student>(studentsSnap);

    const teamMap = new Map(teams.map((t) => [t.id, t]));
    const studentMap = new Map(students.map((s) => [s.id, s]));

    // Format winners list
    const sortedEntries = [...record.entries].sort((a, b) => a.position - b.position);

    const winnersList = sortedEntries.map((entry) => {
      const student = entry.student_id ? studentMap.get(entry.student_id) : undefined;
      const team = entry.team_id ? teamMap.get(entry.team_id) : student ? teamMap.get(student.team_id) : undefined;
      const medal =
        entry.position === 1 ? "🥇 1st" :
        entry.position === 2 ? "🥈 2nd" :
        entry.position === 3 ? "🥉 3rd" : `${entry.position}th`;

      return {
        position: entry.position,
        medal,
        name: student?.name || team?.name || "Entry",
        chestNo: student?.chest_no || "",
        teamName: team?.name || "Squad",
        teamId: team?.id || "",
        grade: entry.grade && entry.grade !== "none" ? `Grade ${entry.grade}` : "—",
        score: entry.score,
      };
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resultsUrl = `${appUrl}/results`;

    // Filter teams that have leader_email
    const eligibleTeams = teams.filter(
      (t) => t.leader_email && t.leader_email.includes("@")
    );

    if (eligibleTeams.length === 0) return;

    // Send emails in parallel with Promise.allSettled
    await Promise.allSettled(
      eligibleTeams.map(async (team) => {
        const teamWins = winnersList.filter((w) => w.teamId === team.id);
        const hasWins = teamWins.length > 0;
        const totalTeamPointsInProg = teamWins.reduce((sum, w) => sum + w.score, 0);

        const winnersHtml = winnersList
          .map(
            (w) => `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td style="padding: 10px 8px; font-weight: 700; color: #fbbf24; font-size: 13px;">${w.medal}</td>
            <td style="padding: 10px 8px; font-weight: 600; color: #ffffff; font-size: 13px;">
              ${w.name} ${w.chestNo ? `<span style="color:#94a3b8; font-size: 11px;">(${w.chestNo})</span>` : ""}
            </td>
            <td style="padding: 10px 8px; color: #cbd5e1; font-size: 12px;">${w.teamName}</td>
            <td style="padding: 10px 8px; color: #38bdf8; font-size: 12px; font-weight: 600;">${w.grade}</td>
            <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: #34d399; font-size: 13px;">+${w.score}</td>
          </tr>`
          )
          .join("");

        const squadHighlightsHtml = hasWins
          ? `
          <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05)); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px;">
              🎉 Squad Achievement Alert!
            </p>
            <p style="margin: 0; font-size: 14px; color: #fef3c7; line-height: 1.5;">
              Congratulations! <strong>${team.name}</strong> secured <strong>${totalTeamPointsInProg} points</strong> in this competition!
            </p>
          </div>`
          : "";

        const html = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Official Result: ${program.name}</title>
  <style>
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 14px !important; }
      .header-cell { padding: 26px 16px 14px 16px !important; }
      .body-cell { padding: 12px 14px 24px 14px !important; }
      .btn-container { width: 100% !important; display: block !important; }
      .btn-cta { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; padding: 14px 16px !important; }
      .title-h1 { font-size: 21px !important; line-height: 27px !important; }
      .results-table th, .results-table td { padding: 8px 4px !important; font-size: 11px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-wrapper" style="background-color: #070B14; padding: 36px 12px; margin: 0 auto; width: 100%;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-card" style="max-width: 600px; margin: 0 auto; background-color: #0d1527; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
          <tr><td style="height: 4px; background: linear-gradient(90deg, #E5A00D 0%, #f59e0b 50%, #0ea5e9 100%);"></td></tr>
          <tr>
            <td align="center" class="header-cell" style="padding: 32px 32px 16px 32px; text-align: center;">
              <span style="display: inline-block; padding: 5px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); letter-spacing: 1px;">
                Official Fest Result Announcement
              </span>
              <h1 class="title-h1" style="margin: 14px 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.25;">
                ${program.name}
              </h1>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                Section: ${program.section} &bull; Category: ${program.category} &bull; ${program.stage ? "On Stage" : "Off Stage"}
              </p>
            </td>
          </tr>
          <tr>
            <td class="body-cell" style="padding: 10px 30px 28px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #e2e8f0;">
                Hello <strong>${team.leader}</strong> (${team.name}),
              </p>
              ${squadHighlightsHtml}
              <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #fbbf24;">
                Official Placements &amp; Winners:
              </p>
              <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 24px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="results-table" style="background-color: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; overflow: hidden; min-width: 100%;">
                  <thead>
                    <tr style="background-color: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.1);">
                      <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8;">Place</th>
                      <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8;">Candidate</th>
                      <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8;">Squad</th>
                      <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8;">Grade</th>
                      <th style="padding: 10px 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #94a3b8;">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${winnersHtml}
                  </tbody>
                </table>
              </div>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="btn-container" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${resultsUrl}" class="btn-cta" style="display: inline-block; padding: 14px 34px; border-radius: 12px; font-size: 14px; font-weight: 800; color: #020617 !important; background: linear-gradient(90deg, #E5A00D, #f59e0b); text-decoration: none; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35); letter-spacing: 0.2px;">
                      View Full Live Results & Scoreboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px; background-color: #080d19; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">&copy; 2026 Maerika Fest Organising Committee &bull; Official Announcement</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const textWinners = winnersList
          .map((w) => `${w.medal}: ${w.name} (${w.teamName}) - Grade: ${w.grade}, Points: +${w.score}`)
          .join("\n");
        const text = `Official Result Published: ${program.name}\n\nWinners:\n${textWinners}\n\nLive results: ${resultsUrl}`;

        await sendEmailNotification({
          to: team.leader_email!,
          subject: `🏆 Result Published: ${program.name}`,
          html,
          text,
          entityRefId: `result-${record.id}`,
        });
      })
    );
  } catch (err) {
    console.error("Error in sendResultPublishedEmails:", err);
  }
}

