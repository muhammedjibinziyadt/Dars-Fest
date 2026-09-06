import { NextResponse } from "next/server";
import { predictionsCol, predictionEventsCol } from "@/lib/models";
import { randomUUID } from "node:crypto";
import type { PredictionEvent } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { eventId, userId, userName, selectedOptionId } = await request.json();

    if (!userId || !eventId || !selectedOptionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const doc = await predictionEventsCol.doc(eventId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = doc.data() as PredictionEvent;
    if (event.status !== "open") {
      return NextResponse.json({ error: "Prediction is closed" }, { status: 400 });
    }

    const now = new Date();
    const deadline = new Date(event.deadline);
    if (now > deadline) {
      return NextResponse.json({ error: "Deadline has passed" }, { status: 400 });
    }

    const predDocId = `${eventId}_${userId}`;
    const existing = await predictionsCol.doc(predDocId).get();
    if (existing.exists) {
      return NextResponse.json({ error: "You have already submitted a prediction" }, { status: 403 });
    }

    const id = randomUUID();
    await predictionsCol.doc(predDocId).set({
      id,
      eventId,
      userId,
      userName,
      selectedOptionId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Prediction submitted" });
  } catch (error) {
    console.error("Prediction submit error:", error);
    return NextResponse.json({ error: "Failed to submit prediction" }, { status: 500 });
  }
}
