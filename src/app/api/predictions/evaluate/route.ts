import { NextResponse } from "next/server";
import { predictionEventsCol, predictionsCol, userScoresCol, docsToData } from "@/lib/models";
import { adminDb } from "@/lib/firebase-admin";
import type { Prediction, PredictionEvent } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { eventId, correctOptionId } = await request.json();

    const doc = await predictionEventsCol.doc(eventId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = doc.data() as PredictionEvent;
    if (event.status === "evaluated") {
      return NextResponse.json({ error: "Event already evaluated" }, { status: 400 });
    }

    await predictionEventsCol.doc(eventId).update({
      status: "evaluated",
      correctOptionId,
    });

    const predsSnap = await predictionsCol
      .where("eventId", "==", eventId)
      .where("selectedOptionId", "==", correctOptionId)
      .get();

    const correctPredictions = docsToData<Prediction>(predsSnap);
    const points = event.points || 10;

    if (correctPredictions.length > 0) {
      const { FieldValue } = await import("firebase-admin/firestore");
      const batch = adminDb.batch();

      for (const pred of correctPredictions) {
        const userRef = userScoresCol.doc(pred.userId);
        batch.set(
          userRef,
          {
            userId: pred.userId,
            userName: pred.userName,
            score: FieldValue.increment(points),
          },
          { merge: true }
        );
      }

      await batch.commit();
    }

    return NextResponse.json({
      message: "Evaluated successfully",
      correctCount: correctPredictions.length,
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json({ error: "Failed to evaluate" }, { status: 500 });
  }
}
