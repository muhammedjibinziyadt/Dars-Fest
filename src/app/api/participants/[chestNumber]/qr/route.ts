import { NextRequest, NextResponse } from "next/server";
import { generateParticipantQR } from "@/lib/qr-utils";
import { connectDB } from "@/lib/db";
import { StudentModel } from "@/lib/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chestNumber: string }> }
) {
  try {
    const { chestNumber } = await params;
    
    // Verify student exists
    await connectDB();
    const student = await StudentModel.findOne({ chest_no: chestNumber }).lean();
    
    if (!student) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Get base URL from request
    const baseUrl = request.nextUrl.origin;
    const qrCodeDataUrl = await generateParticipantQR(chestNumber, baseUrl);
    
    // Return as JSON with data URL
    return NextResponse.json({ qrCode: qrCodeDataUrl, chestNumber });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}

