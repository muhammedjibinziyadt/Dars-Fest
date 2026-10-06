import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SystemMetaModel } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel") || "pulse";

    await connectDB();
    const meta = await SystemMetaModel.findOne({
      $or: [{ key: channel }, { key: "pulse" }],
    })
      .sort({ timestamp: -1 })
      .lean();

    return NextResponse.json({
      timestamp: meta?.timestamp || Date.now(),
      event: meta?.event || null,
      data: meta?.data || null,
      channel: meta?.channel || channel,
    });
  } catch (err: any) {
    return NextResponse.json({ timestamp: Date.now(), error: err?.message });
  }
}
