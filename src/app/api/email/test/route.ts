import { NextResponse } from "next/server";
import { sendTestEmail, sendEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetEmail = body.to || process.env.RESEND_REPLY_TO || "jawharathululoomsuffadars@gmail.com";

    const result = await sendTestEmail(targetEmail);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${targetEmail}`,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const isConfigured = Boolean(process.env.RESEND_API_KEY);
  return NextResponse.json({
    service: "Resend",
    configured: isConfigured,
    fromEmail: process.env.RESEND_FROM_EMAIL || "Not configured",
    replyTo: process.env.RESEND_REPLY_TO || "Not configured",
  });
}
