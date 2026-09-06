import { NextRequest, NextResponse } from "next/server";
import { generateParticipantQR } from "@/lib/qr-utils";
import { studentsCol } from "@/lib/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chestNumber: string }> }
) {
  try {
    const { chestNumber } = await params;
    const snap = await studentsCol
      .where("chest_no", "==", chestNumber.trim().toUpperCase())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const baseUrl = request.nextUrl.origin;
    const qrCodeDataUrl = await generateParticipantQR(chestNumber, baseUrl);

    return NextResponse.json({ qrCode: qrCodeDataUrl, chestNumber });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
