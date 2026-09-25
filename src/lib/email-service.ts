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
  const from = process.env.RESEND_FROM_EMAIL || "Maerika 2K26 <admin@maerika2k26.jawharathululoomsuffadars.online>";
  return from.replace(/^["']|["']$/g, "").trim();
}

export function getDefaultReplyTo(): string {
  const reply = process.env.RESEND_REPLY_TO || "jawharathululoomsuffadars@gmail.com";
  return reply.replace(/^["']|["']$/g, "").trim();
}

export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://maerika-2k26.jawharathululoomsuffadars.online";
  return url.replace(/\/+$/, "");
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
 * Core sendEmail function.
 * If multiple recipients are provided, dispatches to each individually so recipient email addresses are kept private.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: SendEmailOptions): Promise<{ success: boolean; data?: any; error?: string; count?: number }> {
  const client = getResendClient();
  if (!client) {
    console.warn("⚠️ Resend is not configured (missing RESEND_API_KEY). Email skipped:", subject);
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const sender = from || getDefaultFrom();
  const reply = replyTo || getDefaultReplyTo();

  const recipients = Array.isArray(to) ? to.map((e) => e.trim()).filter(Boolean) : [to.trim()];
  if (recipients.length === 0) {
    return { success: false, error: "No recipients provided" };
  }

  if (recipients.length === 1) {
    try {
      const data = await client.emails.send({
        from: sender,
        to: recipients[0],
        replyTo: reply,
        subject,
        html,
        text,
      });
      return { success: true, data };
    } catch (error: any) {
      console.error("❌ Resend email send error to", recipients[0], error);
      return { success: false, error: error?.message || "Failed to send email" };
    }
  }

  // Multiple recipients: dispatch individually for privacy and deliverability
  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      client.emails.send({
        from: sender,
        to: recipient,
        replyTo: reply,
        subject,
        html,
        text,
      })
    )
  );

  const successfulCount = results.filter((r) => r.status === "fulfilled").length;
  console.log(`✉️ Batch email dispatched (${successfulCount}/${recipients.length} delivered): "${subject}"`);
  return { success: successfulCount > 0, count: successfulCount };
}

/**
 * Fetch all registered Team Leader email addresses
 */
export async function getAllTeamLeaderEmails(): Promise<string[]> {
  try {
    const { connectDB } = await import("./db");
    const { TeamModel } = await import("./models");
    await connectDB();
    const teams = await TeamModel.find().lean();
    const emails = teams
      .map((t: any) => t.leader_email?.trim().toLowerCase())
      .filter((email: any): email is string => Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)));
    return Array.from(new Set(emails));
  } catch (error) {
    console.error("Failed to fetch team leader emails:", error);
    return [];
  }
}

/**
 * Fetch Team Leader details by teamId
 */
export async function getTeamLeaderInfo(teamId: string): Promise<{ leaderName: string; leaderEmail: string; teamName: string } | null> {
  try {
    const { connectDB } = await import("./db");
    const { TeamModel } = await import("./models");
    await connectDB();
    const team = await TeamModel.findOne({ id: teamId }).lean();
    if (!team) return null;
    return {
      leaderName: team.leader || "Team Leader",
      leaderEmail: team.leader_email?.trim().toLowerCase() || "",
      teamName: team.name || "Team",
    };
  } catch (error) {
    console.error("Failed to fetch team leader info for", teamId, error);
    return null;
  }
}

/* =========================================================================
 * 1. TEAM LEADER WELCOME EMAIL (On team creation)
 * ========================================================================= */
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
  const baseUrl = getBaseUrl();
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
          .header { background: linear-gradient(135deg, #78350f, #92400e, #b45309); padding: 36px 24px; text-align: center; color: white; }
          .content { padding: 32px 28px; }
          .credential-box { background: #fdf8f6; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .btn { display: inline-block; background-color: #b45309; color: white !important; font-weight: 600; padding: 14px 32px; border-radius: 10px; text-decoration: none; margin-top: 20px; }
          .instructions { background: #fffcf5; border-left: 4px solid #b45309; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0; font-size: 14px; line-height: 1.6; }
          .footer { padding: 24px; text-align: center; font-size: 12px; color: #78716c; background-color: #f5f5f4; border-top: 1px solid #e7e5e4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700;">Welcome to Maerika 2K26</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.95; font-size: 15px;">Official Team Leader Portal Credentials</p>
          </div>
          <div class="content">
            <h2 style="color: #1c1917; margin-top: 0; font-size: 20px;">Assalamu Alaikum, ${leaderName}!</h2>
            <p style="color: #44403c; line-height: 1.6;">
              Congratulations! Your team <strong>${teamName}</strong> has been officially registered for <strong>Maerika 2K26</strong>.
              Below are your exclusive access credentials to manage your team through the Team Portal.
            </p>

            <div class="credential-box">
              <div style="margin-bottom: 12px; border-bottom: 1px solid #fed7aa; padding-bottom: 8px;">
                <span style="color: #9a3412; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Login Credentials</span>
              </div>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Festival:</strong> Maerika 2K26</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Team Name:</strong> ${teamName}</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Login Email:</strong> <code style="background: #fed7aa; padding: 3px 8px; border-radius: 4px; font-size: 14px; font-weight: 700; color: #78350f;">${loginEmail}</code></p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #fed7aa; padding: 3px 8px; border-radius: 4px; font-size: 14px; font-weight: 700; color: #78350f;">${password}</code></p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #78716c;">(You can log in using either your Email or your Team Name: <strong>${teamName}</strong>)</p>
            </div>

            <div class="instructions">
              <strong style="color: #9a3412; font-size: 15px;">Your Team Leader Actions:</strong>
              <ol style="margin: 8px 0 0 0; padding-left: 20px;">
                <li style="margin-bottom: 6px;">Sign in to your Team Portal using the button below.</li>
                <li style="margin-bottom: 6px;">Enroll students and verify chest numbers.</li>
                <li style="margin-bottom: 6px;">Register your participants into competition programs before the deadline.</li>
                <li>Monitor live team scores, standings, and announced results.</li>
              </ol>
            </div>

            <div style="text-align: center; margin-top: 28px;">
              <a href="${loginUrl}" class="btn">Log In to Team Portal</a>
            </div>

            <p style="text-align: center; font-size: 13px; color: #a8a29e; margin-top: 18px;">
              Direct Portal Link: <a href="${loginUrl}" style="color: #b45309;">${loginUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 4px 0;"><strong>Maerika 2K26</strong> · Arts & Cultural Fest</p>
            <p style="margin: 4px 0;">Jawharathul Uloom Suffa Dars</p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #a8a29e;">This automated notification is intended solely for the team leader. Keep your credentials secure.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `🎉 Welcome to Maerika 2K26 - Team Leader Access Credentials for ${teamName}`,
    html,
    text: `Welcome to Maerika 2K26!\n\nFestival: Maerika 2K26\nTeam: ${teamName}\nLeader: ${leaderName}\nLogin Email: ${loginEmail}\nPassword: ${password}\n\nTeam Portal Link: ${loginUrl}\n\nPlease sign in to register participants and manage your team.`,
  });
}

/* =========================================================================
 * 2. TEAM UPDATES EMAIL (Profile / Credential updates)
 * ========================================================================= */
export async function sendTeamUpdatedEmail({
  to,
  leaderName,
  teamName,
  loginEmail,
  password,
  changedSummary,
}: {
  to: string;
  leaderName: string;
  teamName: string;
  loginEmail: string;
  password?: string;
  changedSummary?: string;
}) {
  const baseUrl = getBaseUrl();
  const loginUrl = `${baseUrl}/team/login`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px; color: #1c1917; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
          .header { background: linear-gradient(135deg, #0284c7, #0369a1); padding: 32px 24px; text-align: center; color: white; }
          .content { padding: 32px 28px; }
          .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .btn { display: inline-block; background-color: #0284c7; color: white !important; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #78716c; background-color: #f5f5f4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🔄 Team Information Updated</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.95; font-size: 14px;">Maerika 2K26 Arts Fest</p>
          </div>
          <div class="content">
            <h2 style="color: #1c1917; margin-top: 0; font-size: 18px;">Hello ${leaderName},</h2>
            <p style="color: #44403c; line-height: 1.6;">
              Your team profile or credentials for <strong>${teamName}</strong> have been updated by administration.
            </p>

            ${changedSummary ? `<p style="background: #f5f5f4; padding: 12px; border-radius: 8px; font-size: 13px; color: #57534e;"><strong>Updates:</strong> ${changedSummary}</p>` : ""}

            <div class="info-box">
              <strong style="color: #0369a1; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Current Portal Credentials:</strong>
              <p style="margin: 10px 0 6px 0; font-size: 14px;"><strong>Team Name:</strong> ${teamName}</p>
              <p style="margin: 6px 0; font-size: 14px;"><strong>Team Leader:</strong> ${leaderName}</p>
              <p style="margin: 6px 0; font-size: 14px;"><strong>Login Email:</strong> <code>${loginEmail}</code></p>
              ${password ? `<p style="margin: 6px 0; font-size: 14px;"><strong>Current Password:</strong> <code>${password}</code></p>` : ""}
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${loginUrl}" class="btn">Access Team Portal</a>
            </div>
          </div>
          <div class="footer">
            <p>Maerika 2K26 - Arts Fest Management System · Jawharathul Uloom Suffa Dars</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `🔄 Team Details Updated: ${teamName} - Maerika 2K26`,
    html,
    text: `Team Update for ${teamName}\nLeader: ${leaderName}\nLogin Email: ${loginEmail}\n${password ? `Password: ${password}\n` : ""}Portal: ${loginUrl}`,
  });
}

/* =========================================================================
 * 3. NEW MEMBERS ADDED EMAIL (Students registered to team)
 * ========================================================================= */
export async function sendMembersAddedEmail({
  to,
  leaderName,
  teamName,
  members,
}: {
  to: string;
  leaderName: string;
  teamName: string;
  members: Array<{ name: string; chestNumber: string }>;
}) {
  const baseUrl = getBaseUrl();
  const studentsUrl = `${baseUrl}/team/register-students`;

  const rowsHtml = members
    .map(
      (m, idx) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; color: #78716c;">${idx + 1}</td>
        <td style="padding: 10px; font-weight: 600; color: #1c1917;">${m.name}</td>
        <td style="padding: 10px; font-weight: bold; color: #b45309;"><code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">${m.chestNumber}</code></td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px; color: #1c1917; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center; color: white; }
          .content { padding: 32px 28px; }
          .btn { display: inline-block; background-color: #059669; color: white !important; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #78716c; background-color: #f5f5f4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">👥 New Member${members.length > 1 ? "s" : ""} Added</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.95; font-size: 14px;">Maerika 2K26 Arts Fest</p>
          </div>
          <div class="content">
            <h2 style="color: #1c1917; margin-top: 0; font-size: 18px;">Assalamu Alaikum, ${leaderName}!</h2>
            <p style="color: #44403c; line-height: 1.6;">
              ${members.length === 1 ? "A new student member has" : `${members.length} new student members have`} been successfully added to <strong>${teamName}</strong>.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <thead>
                <tr style="background-color: #f5f5f4; text-align: left;">
                  <th style="padding: 10px; width: 40px;">#</th>
                  <th style="padding: 10px;">Student Name</th>
                  <th style="padding: 10px;">Chest Number</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <p style="font-size: 13px; color: #57534e;">
              You can now register these members for eligible single and group programs in the Team Portal.
            </p>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${studentsUrl}" class="btn">View All Team Members</a>
            </div>
          </div>
          <div class="footer">
            <p>Maerika 2K26 - Arts Fest Management System · Jawharathul Uloom Suffa Dars</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `👥 ${members.length} New Member${members.length > 1 ? "s" : ""} Enrolled: ${teamName} - Maerika 2K26`,
    html,
    text: `New member(s) enrolled in ${teamName}:\n` + members.map((m) => `- ${m.name} (Chest: ${m.chestNumber})`).join("\n"),
  });
}

/* =========================================================================
 * 4. NEW PROGRAMS ADDED EMAIL (Broadcast to all team leaders)
 * ========================================================================= */
export async function sendNewProgramsEmail({
  to,
  programs,
}: {
  to?: string | string[];
  programs: Array<{
    name: string;
    section: string;
    stage: boolean;
    candidateLimit?: number;
  }>;
}) {
  const recipients = to && to !== "all-leaders" ? to : await getAllTeamLeaderEmails();
  if (Array.isArray(recipients) && recipients.length === 0) return { success: false, error: "No recipients" };

  const baseUrl = getBaseUrl();
  const registerUrl = `${baseUrl}/team/program-register`;

  const rowsHtml = programs
    .map(
      (p) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 10px; font-weight: 600; color: #1c1917;">${p.name}</td>
        <td style="padding: 12px 10px; text-transform: capitalize; color: #4b5563;">
          <span style="background: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${p.section}</span>
        </td>
        <td style="padding: 12px 10px; color: #4b5563;">${p.stage ? "🎭 On-Stage" : "📝 Off-Stage"}</td>
        <td style="padding: 12px 10px; font-weight: 600; color: #b45309;">${p.candidateLimit ?? 1} max</td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px; color: #1c1917; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
          .header { background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 32px 24px; text-align: center; color: white; }
          .content { padding: 32px 28px; }
          .btn { display: inline-block; background-color: #7c3aed; color: white !important; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #78716c; background-color: #f5f5f4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">✨ New Competition Program${programs.length > 1 ? "s" : ""} Added</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.95; font-size: 14px;">Maerika 2K26 Arts Fest</p>
          </div>
          <div class="content">
            <h2 style="color: #1c1917; margin-top: 0; font-size: 18px;">Attention Team Leaders,</h2>
            <p style="color: #44403c; line-height: 1.6;">
              Administration has announced <strong>${programs.length === 1 ? "a new competition program" : `${programs.length} new competition programs`}</strong> for Maerika 2K26.
              Review the requirements below and register your team candidates before the deadline.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <thead>
                <tr style="background-color: #f5f5f4; text-align: left;">
                  <th style="padding: 10px;">Program</th>
                  <th style="padding: 10px;">Section</th>
                  <th style="padding: 10px;">Type</th>
                  <th style="padding: 10px;">Limit</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${registerUrl}" class="btn">Register Candidates Now</a>
            </div>
          </div>
          <div class="footer">
            <p>Maerika 2K26 - Arts Fest Management System · Jawharathul Uloom Suffa Dars</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipients,
    subject: `✨ New Program${programs.length > 1 ? "s" : ""} Announced: ${programs[0]?.name || "Competitions"} - Maerika 2K26`,
    html,
    text: `New program(s) announced for Maerika 2K26:\n` + programs.map((p) => `- ${p.name} (${p.section}, ${p.stage ? "On-Stage" : "Off-Stage"}, Limit: ${p.candidateLimit ?? 1})`).join("\n"),
  });
}

/* =========================================================================
 * 5. PROGRAM REGISTRATION SUCCESS & SUMMARY EMAIL
 * ========================================================================= */
export async function sendRegistrationSuccessEmail({
  to,
  leaderName,
  teamName,
  programName,
  section,
  candidates,
}: {
  to: string;
  leaderName: string;
  teamName: string;
  programName: string;
  section: string;
  candidates: Array<{ name: string; chestNumber: string }>;
}) {
  const baseUrl = getBaseUrl();
  const viewUrl = `${baseUrl}/team/program-register`;
  const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  const rowsHtml = candidates
    .map(
      (c, idx) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; color: #78716c;">${idx + 1}</td>
        <td style="padding: 10px; font-weight: 600; color: #1c1917;">${c.name}</td>
        <td style="padding: 10px; font-weight: bold; color: #0284c7;"><code style="background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${c.chestNumber}</code></td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px; color: #1c1917; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
          .header { background: linear-gradient(135deg, #059669, #047857); padding: 32px 24px; text-align: center; color: white; }
          .content { padding: 32px 28px; }
          .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0; }
          .btn { display: inline-block; background-color: #059669; color: white !important; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #78716c; background-color: #f5f5f4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">✅ Registration Confirmed!</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.95; font-size: 14px;">Maerika 2K26 Arts Fest</p>
          </div>
          <div class="content">
            <h2 style="color: #1c1917; margin-top: 0; font-size: 18px;">Assalamu Alaikum, ${leaderName}!</h2>
            <p style="color: #44403c; line-height: 1.6;">
              Your candidate registration for <strong>${programName}</strong> has been successfully submitted and saved in the system.
            </p>

            <div class="card">
              <p style="margin: 4px 0; font-size: 14px;"><strong>Program:</strong> ${programName} (${section.toUpperCase()})</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Team:</strong> ${teamName}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Timestamp:</strong> ${submittedAt}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #047857; font-weight: bold;">Verified & Enrolled</span></p>
            </div>

            <h3 style="font-size: 15px; color: #1c1917; margin-top: 24px;">Registered Candidates:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 12px 0 20px 0; font-size: 14px;">
              <thead>
                <tr style="background-color: #f5f5f4; text-align: left;">
                  <th style="padding: 10px; width: 40px;">#</th>
                  <th style="padding: 10px;">Candidate Name</th>
                  <th style="padding: 10px;">Chest Number</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${viewUrl}" class="btn">View & Download Registration Slip</a>
            </div>
          </div>
          <div class="footer">
            <p>Maerika 2K26 - Arts Fest Management System · Jawharathul Uloom Suffa Dars</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `✅ Registration Success: ${programName} - ${teamName} (Maerika 2K26)`,
    html,
    text: `Registration Successful for ${teamName} in ${programName} (${section}):\n` + candidates.map((c) => `- ${c.name} (Chest: ${c.chestNumber})`).join("\n"),
  });
}

/* =========================================================================
 * 6. RESULTS PUBLISHED EMAIL (Broadcast to all team leaders)
 * ========================================================================= */
export async function sendResultPublishedEmail({
  to,
  programName,
  programId,
  winners = [],
}: {
  to?: string | string[];
  programName: string;
  programId: string;
  winners?: { position: number; studentName?: string; teamName?: string; grade?: string }[];
}) {
  const recipients = to && to !== "all-leaders" ? to : await getAllTeamLeaderEmails();
  if (Array.isArray(recipients) && recipients.length === 0) return { success: false, error: "No recipients" };

  const baseUrl = getBaseUrl();
  const resultUrl = `${baseUrl}/results/${programId}`;

  const winnersListHtml = winners
    .map(
      (w) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; font-weight: bold; color: #b45309;">${w.position === 1 ? "🥇 1st" : w.position === 2 ? "🥈 2nd" : "🥉 3rd"}</td>
        <td style="padding: 10px; font-weight: 600;">${w.studentName || "Participant"}</td>
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
          .header { background: linear-gradient(135deg, #d97706, #b45309); padding: 32px 24px; text-align: center; color: white; }
          .content { padding: 32px 24px; }
          .btn { display: inline-block; background-color: #b45309; color: white !important; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #78716c; background-color: #f5f5f4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🏆 Official Result Announced!</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.95;">Maerika 2K26 Arts Fest</p>
          </div>
          <div class="content">
            <h2 style="color: #1c1917; margin-top: 0;">${programName}</h2>
            <p style="color: #44403c; line-height: 1.6;">
              The official results for <strong>${programName}</strong> have been published and recorded into the scoreboard.
            </p>

            ${winners.length > 0
      ? `
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <thead>
                <tr style="background-color: #f5f5f4; text-align: left;">
                  <th style="padding: 10px;">Rank</th>
                  <th style="padding: 10px;">Winner</th>
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
              <a href="${resultUrl}" class="btn">View Live Poster & Full Scores</a>
            </div>
          </div>
          <div class="footer">
            <p>Maerika 2K26 - Arts Fest Management System · Jawharathul Uloom Suffa Dars</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipients,
    subject: `🏆 Result Announced: ${programName} - Maerika 2K26`,
    html,
  });
}

/* =========================================================================
 * 7. SCHEDULE UPDATED EMAIL (Broadcast to all team leaders)
 * ========================================================================= */
export async function sendScheduleUpdatedEmail({
  to,
  startDateTime,
  endDateTime,
  note,
}: {
  to?: string | string[];
  startDateTime: string;
  endDateTime: string;
  note?: string;
}) {
  const recipients = to && to !== "all-leaders" ? to : await getAllTeamLeaderEmails();
  if (Array.isArray(recipients) && recipients.length === 0) return { success: false, error: "No recipients" };

  const baseUrl = getBaseUrl();
  const portalUrl = `${baseUrl}/team/dashboard`;

  const formatDt = (dtStr: string) => {
    try {
      return new Date(dtStr).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "short",
      });
    } catch {
      return dtStr;
    }
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px; color: #1c1917; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
          .header { background: linear-gradient(135deg, #ea580c, #c2410c); padding: 32px 24px; text-align: center; color: white; }
          .content { padding: 32px 28px; }
          .box { background: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .btn { display: inline-block; background-color: #ea580c; color: white !important; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #78716c; background-color: #f5f5f4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📅 Registration Schedule Updated</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.95; font-size: 14px;">Maerika 2K26 Arts Fest</p>
          </div>
          <div class="content">
            <h2 style="color: #1c1917; margin-top: 0; font-size: 18px;">Attention All Team Leaders,</h2>
            <p style="color: #44403c; line-height: 1.6;">
              The official registration timeline and deadlines for <strong>Maerika 2K26</strong> have been updated by festival administration.
            </p>

            <div class="box">
              <p style="margin: 8px 0; font-size: 15px;">
                <strong>🟢 Registration Opens:</strong><br/>
                <span style="color: #047857; font-weight: 600;">${formatDt(startDateTime)}</span>
              </p>
              <div style="border-top: 1px solid #fed7aa; margin: 12px 0;"></div>
              <p style="margin: 8px 0; font-size: 15px;">
                <strong>🔴 Registration Deadline (Closes):</strong><br/>
                <span style="color: #b91c1c; font-weight: 700;">${formatDt(endDateTime)}</span>
              </p>
            </div>

            ${note ? `<p style="font-size: 14px; color: #431407; background: #ffedd5; padding: 12px; border-radius: 8px;"><strong>Note:</strong> ${note}</p>` : ""}

            <p style="font-size: 14px; color: #7c2d12;">
              ⚠️ Please ensure all participant details and program registrations are completed and verified before the deadline closes.
            </p>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${portalUrl}" class="btn">Go to Team Portal</a>
            </div>
          </div>
          <div class="footer">
            <p>Maerika 2K26 - Arts Fest Management System · Jawharathul Uloom Suffa Dars</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipients,
    subject: `📅 Schedule Update: Registration Deadlines Revised - Maerika 2K26`,
    html,
    text: `Registration Schedule Updated for Maerika 2K26:\nOpens: ${formatDt(startDateTime)}\nDeadline (Closes): ${formatDt(endDateTime)}\nPortal: ${portalUrl}`,
  });
}

/* =========================================================================
 * 8. BROADCAST NOTIFICATION EMAIL (All general system notifications)
 * ========================================================================= */
export async function sendBroadcastNotificationEmail({
  to,
  title,
  message,
  link,
}: {
  to?: string | string[];
  title: string;
  message: string;
  link?: string;
}) {
  const recipients = to && to !== "all-leaders" ? to : await getAllTeamLeaderEmails();
  if (Array.isArray(recipients) && recipients.length === 0) return { success: false, error: "No recipients" };

  const baseUrl = getBaseUrl();
  const actionUrl = link ? (link.startsWith("http") ? link : `${baseUrl}${link.startsWith("/") ? "" : "/"}${link}`) : `${baseUrl}/team/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px; color: #1c1917; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
          .header { background: linear-gradient(135deg, #1e293b, #0f172a); padding: 32px 24px; text-align: center; color: white; }
          .content { padding: 32px 28px; }
          .btn { display: inline-block; background-color: #b45309; color: white !important; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #78716c; background-color: #f5f5f4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📢 Official Fest Notification</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.95; font-size: 14px;">Maerika 2K26 Arts Fest</p>
          </div>
          <div class="content">
            <h2 style="color: #1c1917; margin-top: 0; font-size: 18px;">${title}</h2>
            <div style="background: #f8fafc; border-left: 4px solid #b45309; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
              ${message}
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${actionUrl}" class="btn">Open Portal</a>
            </div>
          </div>
          <div class="footer">
            <p>Maerika 2K26 - Arts Fest Management System · Jawharathul Uloom Suffa Dars</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipients,
    subject: `📢 Notification: ${title} - Maerika 2K26`,
    html,
    text: `${title}\n\n${message}\n\nLink: ${actionUrl}`,
  });
}

/* =========================================================================
 * 9. REPLACEMENT REQUEST STATUS EMAIL
 * ========================================================================= */
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
          <p>Your candidate replacement request for <strong>${programName}</strong> has been <strong>${status.toUpperCase()}</strong> by the administration.</p>
          
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

/* =========================================================================
 * 10. QUICK DIAGNOSTIC TEST EMAIL
 * ========================================================================= */
export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    subject: "✨ Maerika 2K26: Resend Email Service Test",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #d97706;">Resend Email Service Active! 🚀</h2>
        <p>This is a test email from <strong>Maerika 2K26 Arts Fest</strong>.</p>
        <p>Your Resend API key and domain sender configuration are working properly.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">Sent via Resend Transactional Email Service</p>
      </div>
    `,
  });
}
