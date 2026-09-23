import { Resend } from "resend";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendInstance) {
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

export function getDefaultFrom(): string {
  return process.env.RESEND_FROM_EMAIL || "Maerika 2K26 <admin@maerika2k26.jawharathululoomsuffadars.online>";
}

export function getDefaultReplyTo(): string {
  return process.env.RESEND_REPLY_TO || "jawharathululoomsuffadars@gmail.com";
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Core sendEmail function
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: SendEmailOptions) {
  const client = getResendClient();
  if (!client) {
    console.warn("⚠️ Resend is not configured (missing RESEND_API_KEY). Email skipped:", subject);
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const sender = from || getDefaultFrom();
  const reply = replyTo || getDefaultReplyTo();

  try {
    const data = await client.emails.send({
      from: sender,
      to,
      replyTo: reply,
      subject,
      html,
      text,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("❌ Resend email send error:", error);
    return { success: false, error: error?.message || "Failed to send email" };
  }
}

/**
 * Result Published notification email template
 */
export async function sendResultPublishedEmail({
  to,
  programName,
  programId,
  winners = [],
}: {
  to: string | string[];
  programName: string;
  programId: string;
  winners?: { position: number; studentName?: string; teamName?: string; grade?: string }[];
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://maerika2k26.vercel.app";
  const resultUrl = `${baseUrl}/results/${programId}`;

  const winnersListHtml = winners
    .map(
      (w) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; font-weight: bold; color: #b45309;">${w.position === 1 ? "🥇 1st" : w.position === 2 ? "🥈 2nd" : "🥉 3rd"}</td>
        <td style="padding: 10px;">${w.studentName || "Participant"}</td>
        <td style="padding: 10px; color: #4b5563;">${w.teamName || ""}</td>
        <td style="padding: 10px; font-weight: 600;">${w.grade && w.grade !== "none" ? `Grade ${w.grade}` : "-"}</td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e7e5e4; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 24px; text-align: center; color: white; }
          .content { padding: 32px 24px; }
          .btn { display: inline-block; background-color: #d97706; color: white !important; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #78716c; background-color: #f5f5f4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎉 Result Published!</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Maerika 2K26 Arts Fest</p>
          </div>
          <div class="content">
            <h2 style="color: #1c1917; margin-top: 0;">${programName}</h2>
            <p style="color: #44403c; line-height: 1.6;">
              The official results for <strong>${programName}</strong> have been finalized and approved.
            </p>

            ${winners.length > 0
      ? `
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <thead>
                <tr style="background-color: #f5f5f4; text-align: left;">
                  <th style="padding: 10px;">Rank</th>
                  <th style="padding: 10px;">Student</th>
                  <th style="padding: 10px;">Team</th>
                  <th style="padding: 10px;">Grade</th>
                </tr>
              </thead>
              <tbody>
                ${winnersListHtml}
              </tbody>
            </table>
            `
      : ""
    }

            <div style="text-align: center; margin-top: 30px;">
              <a href="${resultUrl}" class="btn">View Full Results & Poster</a>
            </div>
          </div>
          <div class="footer">
            <p>Maerika 2K26 - Arts Fest Management System</p>
            <p>Jawharathul Uloom Suffa Dars</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `🏆 Result Announced: ${programName} - Maerika 2K26`,
    html,
  });
}

/**
 * Replacement Request Status notification email
 */
export async function sendReplacementStatusEmail({
  to,
  teamName,
  programName,
  oldStudentName,
  newStudentName,
  status,
  reason,
}: {
  to: string | string[];
  teamName: string;
  programName: string;
  oldStudentName: string;
  newStudentName: string;
  status: "approved" | "rejected";
  reason?: string;
}) {
  const isApproved = status === "approved";

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; background: #fafaf9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 24px; border: 1px solid #e7e5e4;">
          <h2 style="color: ${isApproved ? "#059669" : "#dc2626"}; margin-top: 0;">
            ${isApproved ? "✅ Replacement Request Approved" : "❌ Replacement Request Rejected"}
          </h2>
          <p>Hello <strong>${teamName}</strong>,</p>
          <p>Your candidate replacement request for <strong>${programName}</strong> has been <strong>${status.toUpperCase()}</strong> by the admin.</p>
          
          <div style="background: #f5f5f4; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Previous Candidate:</strong> ${oldStudentName}</p>
            <p style="margin: 4px 0;"><strong>New Candidate:</strong> ${newStudentName}</p>
            ${reason ? `<p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>` : ""}
          </div>

          <p style="color: #78716c; font-size: 13px; margin-top: 24px;">Maerika 2K26 Fest Coordination Committee</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Candidate Replacement ${isApproved ? "Approved" : "Rejected"}: ${programName} - ${teamName}`,
    html,
  });
}

/**
 * Quick Test Email
 */
export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    subject: "✨ Maerika 2K26: Resend Email Service Test",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #d97706;">Resend Email Service Active! 🚀</h2>
        <p>This is a test email from <strong>Maerika 2K26 Arts Fest</strong>.</p>
        <p>Your Resend API key and domain configuration are working perfectly.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">Sent via Resend Email Service</p>
      </div>
    `,
  });
}

/**
 * Team Leader Welcome & Credentials Email
 */
export async function sendTeamWelcomeEmail({
  to,
  leaderName,
  teamName,
  loginEmail,
  password,
}: {
  to: string;
  leaderName: string;
  teamName: string;
  loginEmail: string;
  password: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://maerika2k26.vercel.app";
  const loginUrl = `${baseUrl}/team/login`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px; color: #1c1917; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #8B4513, #6B3410); padding: 36px 24px; text-align: center; color: white; }
          .content { padding: 32px 28px; }
          .credential-box { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .btn { display: inline-block; background-color: #8B4513; color: white !important; font-weight: 600; padding: 14px 32px; border-radius: 10px; text-decoration: none; margin-top: 20px; }
          .instructions { background: #fffcf5; border-left: 4px solid #8B4513; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0; font-size: 14px; line-height: 1.6; }
          .footer { padding: 24px; text-align: center; font-size: 12px; color: #78716c; background-color: #f5f5f4; border-top: 1px solid #e7e5e4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700;">Welcome to Maerika 2K26</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">Team Leader Portal Access Credentials</p>
          </div>
          <div class="content">
            <h2 style="color: #1c1917; margin-top: 0; font-size: 20px;">Assalamu Alaikum, ${leaderName}!</h2>
            <p style="color: #44403c; line-height: 1.6;">
              Congratulations! Your team <strong>${teamName}</strong> has been successfully registered for <strong>Maerika 2k26</strong>.
              Below are your official credentials to access the Team Portal.
            </p>

            <div class="credential-box">
              <div style="margin-bottom: 12px; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px;">
                <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Login Credentials</span>
              </div>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Festival:</strong> Maerika 2K26</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Team Name:</strong> ${teamName}</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Login Email:</strong> <code style="background: #e7e5e4; padding: 3px 8px; border-radius: 4px; font-size: 14px; font-weight: 600; color: #8B4513;">${loginEmail}</code></p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #e7e5e4; padding: 3px 8px; border-radius: 4px; font-size: 14px; font-weight: 600; color: #8B4513;">${password}</code></p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #78716c;">(You can also log in using your Team Name: <strong>${teamName}</strong>)</p>
            </div>

            <div class="instructions">
              <strong style="color: #8B4513; font-size: 15px;">Instructions for Accessing & Managing Your Team:</strong>
              <ol style="margin: 8px 0 0 0; padding-left: 20px;">
                <li style="margin-bottom: 6px;">Sign in to the Team Portal using the button below or via <a href="${loginUrl}" style="color: #8B4513;">${loginUrl}</a>.</li>
                <li style="margin-bottom: 6px;">Register participants for available single and group programs before the registration window closes.</li>
                <li style="margin-bottom: 6px;">Track your team's live scores, rankings, and event schedules in real time.</li>
                <li>Submit candidate replacement requests if needed before festival deadlines.</li>
              </ol>
            </div>

            <div style="text-align: center; margin-top: 28px;">
              <a href="${loginUrl}" class="btn">Log In to Team Portal</a>
            </div>

            <p style="text-align: center; font-size: 13px; color: #a8a29e; margin-top: 18px;">
              Portal Link: <a href="${loginUrl}" style="color: #8B4513;">${loginUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 4px 0;"><strong>Maerika 2K26</strong> · Arts & Cultural Fest</p>
            <p style="margin: 4px 0;">Jawharathul Uloom Suffa Dars</p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #a8a29e;">This is an automated notification. Keep your password confidential.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `🎉 Welcome to Maerika 2K26 - Team Portal Credentials for ${teamName}`,
    html,
    text: `Welcome to Maerika 2K26!\n\nFestival: Maerika 2K26\nTeam: ${teamName}\nLeader: ${leaderName}\nLogin Email: ${loginEmail}\nPassword: ${password}\n\nTeam Portal Link: ${loginUrl}\n\nPlease sign in to register participants and manage your team.`,
  });
}

