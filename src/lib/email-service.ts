import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL || "Maerika 2K26 <onboarding@resend.dev>";
export const DEFAULT_REPLY_TO =
  process.env.RESEND_REPLY_TO || "jawharathululoomsuffadars@gmail.com";

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
  from = DEFAULT_FROM,
  replyTo = DEFAULT_REPLY_TO,
}: SendEmailOptions) {
  if (!resend) {
    console.warn("⚠️ Resend is not configured (missing RESEND_API_KEY). Email skipped:", subject);
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      replyTo,
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

            ${
              winners.length > 0
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
