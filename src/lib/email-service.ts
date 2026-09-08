import nodemailer from "nodemailer";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Maerika 2K26 <onboarding@resend.dev>";

  if (!resend) {
    console.warn(
      "[Resend Email Service] RESEND_API_KEY is not set in environment variables. Email could not be sent to:",
      leaderEmail
    );
    return {
      success: false,
      error: "RESEND_API_KEY is not set in environment variables. Please add it to your .env file.",
    };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Maerika 2K26 - Team Portal Credentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #0d1527; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
          
          <!-- Top Accent Banner -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #E5A00D, #f59e0b, #0ea5e9);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <span style="display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">
                Official Fest Portal Provisioning
              </span>
              <h1 style="margin: 16px 0 6px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Maerika 2K26
              </h1>
              <p style="margin: 0; font-size: 13px; color: #94a3b8; font-style: italic;">
                കലായുഗ ഭാവുകം · Arts &amp; Cultural Festival
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 36px 28px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong>${leaderName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Congratulations! You have been appointed as the Team Leader for <strong>${teamName}</strong> at Maerika 2K26. Your squad account has been created by the Fest Administration.
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #fbbf24;">
                      Portal Access Credentials
                    </p>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8; width: 40%;">Team Name:</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #ffffff;">${teamName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8;">Team Leader:</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #ffffff;">${leaderName}</td>
                      </tr>
                      ${
                        password
                          ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8;">Access Password:</td>
                        <td style="padding: 6px 0; font-size: 14px; font-family: monospace; font-weight: 700; color: #38bdf8; letter-spacing: 0.5px;">${password}</td>
                      </tr>
                      `
                          : ""
                      }
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8;">Login URL:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #38bdf8;">
                          <a href="${resolvedPortalUrl}" style="color: #38bdf8; text-decoration: none;">${resolvedPortalUrl}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${resolvedPortalUrl}" style="display: inline-block; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #020617; background: linear-gradient(90deg, #E5A00D, #f59e0b); text-decoration: none; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35);">
                      Sign In to Team Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Key Instructions -->
              <div style="background-color: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 18px 20px; border-left: 3px solid #E5A00D;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
                  What you should do next:
                </p>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; color: #94a3b8;">
                  <li>Log in to the Team Leader Portal with your credentials.</li>
                  <li>Register your squad participants and review assigned chest numbers.</li>
                  <li>Submit stage &amp; off-stage program registrations within the scheduled window.</li>
                  <li>Monitor live podium standings and scoring in real time.</li>
                </ul>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Security Note: Please do not forward or share this email. If you did not expect this communication or have trouble accessing your account, please contact the Maerika 2K26 Administration Desk.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #080d19; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; 2026 Maerika Fest Organising Committee. All rights reserved.
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
      to: [leaderEmail],
      replyTo: replyToEmail,
      headers: {
        "X-Entity-Ref-ID": `team-${teamName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      },
      subject: `Welcome to Maerika 2K26 - Team Portal Credentials for ${teamName}`,
      html: htmlContent,
      text: textContent,
    });

    if (result.error) {
      const errorMsg = result.error.message || "";
      const isSandboxRestriction =
        errorMsg.includes("only send testing emails") ||
        errorMsg.includes("resend.com/domains");

      if (isSandboxRestriction) {
        // Extract allowed account email from error message e.g. "(jawharathululoomsuffadars@gmail.com)"
        const match = errorMsg.match(/\(([^)]+@.+?)\)/);
        const sandboxOwnerEmail = match
          ? match[1]
          : process.env.RESEND_TEST_EMAIL || "jawharathululoomsuffadars@gmail.com";

        console.warn(
          `[Resend Sandbox Warning] Domain unverified. Re-routing test email to registered account: ${sandboxOwnerEmail} (intended for: ${leaderEmail})`
        );

        const sandboxNotice = `
          <div style="background-color: #451a03; border: 1px solid #f59e0b; padding: 14px 18px; border-radius: 12px; margin-bottom: 22px; font-family: sans-serif; font-size: 13px; color: #fef3c7; line-height: 1.5;">
            <strong style="color: #fbbf24;">⚠️ Sandbox Test Mode Notice:</strong><br/>
            This email was generated for Team Leader: <strong>${leaderName}</strong> (&lt;${leaderEmail}&gt;).<br/>
            Because your Resend account is currently using the test address (<em>${fromEmail}</em>), Resend delivered this copy to your registered inbox: <strong>${sandboxOwnerEmail}</strong>.<br/>
            <em>To send directly to external recipients, verify your domain at <a href="https://resend.com/domains" style="color: #38bdf8;">resend.com/domains</a> and update RESEND_FROM_EMAIL.</em>
          </div>
        `;

        const fallbackResult = await resend.emails.send({
          from: fromEmail,
          to: [sandboxOwnerEmail],
          replyTo: replyToEmail,
          subject: `[TEST FOR ${leaderEmail}] Welcome to Maerika 2K26 - Credentials for ${teamName}`,
          html: `${sandboxNotice}${htmlContent}`,
          text: `[Sandbox Test for ${leaderEmail}]\n\n${textContent}`,
        });

        if (!fallbackResult.error) {
          console.log(
            `[Resend Email Success] Delivered sandbox test email to ${sandboxOwnerEmail} (ID: ${fallbackResult.data?.id})`
          );
          return {
            success: true,
            note: `Test email delivered to your Resend account (${sandboxOwnerEmail})! To send to any recipient, verify your domain at resend.com/domains.`,
          };
        }
      }

      console.error("[Resend Email Error]", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(
      `[Resend Email Success] Sent team welcome email to ${leaderEmail} (ID: ${result.data?.id})`
    );
    return { success: true };
  } catch (err: unknown) {
    console.error("[Resend Send Failed]", err);
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

