import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { rejectReplacementRequest } from "@/lib/team-data";
import { revalidatePath } from "next/cache";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;

  try {
    await rejectReplacementRequest(requestId, "admin");
    revalidatePath("/admin/request-approvals");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reject replacement request:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reject request" },
      { status: 500 },
    );
  }
}

