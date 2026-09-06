import { NextResponse } from "next/server";
import { pollsCol, votesCol } from "@/lib/models";
import { Poll } from "@/lib/types";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { optionId } = await request.json();

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const acceptLanguage = request.headers.get("accept-language") || "unknown";

    const cookieStore = await cookies();
    let deviceId = cookieStore.get("poll_device_id")?.value;
    if (!deviceId) {
      deviceId = crypto.randomUUID();
    }

    const fingerprintString = `${ip}-${userAgent}-${acceptLanguage}`;
    const voterHash = crypto.createHash("sha256").update(fingerprintString).digest("hex");

    const voteDocId = `${id}_${voterHash}`;
    const existingVote = await votesCol.doc(voteDocId).get();

    if (existingVote.exists) {
      return NextResponse.json(
        { error: "You have already voted in this poll (Device Detected)" },
        { status: 403 }
      );
    }

    const pollDoc = await pollsCol.doc(id).get();
    if (!pollDoc.exists) {
      return NextResponse.json({ error: "Poll not found or inactive" }, { status: 404 });
    }

    const poll = pollDoc.data() as Poll;
    if (!poll.active) {
      return NextResponse.json({ error: "Poll is inactive" }, { status: 404 });
    }

    const option = poll.options.find((opt) => opt.id === optionId);
    if (!option) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    await votesCol.doc(voteDocId).set({
      pollId: id,
      optionId,
      voterHash,
      timestamp: new Date().toISOString(),
    });

    const updatedOptions = poll.options.map((opt) => {
      if (opt.id === optionId) {
        return { ...opt, votes: (opt.votes || 0) + 1 };
      }
      return opt;
    });

    await pollsCol.doc(id).update({ options: updatedOptions });

    const response = NextResponse.json({ message: "Vote submitted" });
    response.cookies.set({
      name: "poll_device_id",
      value: deviceId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error: any) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 });
  }
}
