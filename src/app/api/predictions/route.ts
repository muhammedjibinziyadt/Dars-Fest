import { NextResponse } from "next/server";
import { predictionEventsCol, docsToData } from "@/lib/models";
import { randomUUID } from "node:crypto";
import type { PredictionEvent } from "@/lib/types";

export async function GET() {
  try {
    const snap = await predictionEventsCol.orderBy("createdAt", "desc").get();
    const events = docsToData<PredictionEvent>(snap);
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prediction events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { programId, programName, question, options, deadline, points } = body;

    const id = randomUUID();
    const newEvent: PredictionEvent = {
      id,
      programId,
      programName,
      question,
      options,
      deadline,
      status: "open",
      points: points || 10,
      createdAt: new Date().toISOString(),
    };

    await predictionEventsCol.doc(id).set(newEvent);

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Create prediction event error:", error);
    return NextResponse.json({ error: "Failed to create prediction event" }, { status: 500 });
  }
}
