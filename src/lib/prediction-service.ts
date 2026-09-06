import {
  predictionEventsCol,
  predictionsCol,
  userScoresCol,
  docsToData,
} from "./models";
import { adminDb } from "./firebase-admin";
import { Prediction, PredictionEvent, ResultEntry } from "./types";
import { revalidatePath } from "next/cache";

export async function evaluatePredictionsForProgram(programId: string, results: ResultEntry[]) {
  const winnerEntry = results.find((r) => r.position === 1);
  if (!winnerEntry) return;

  const winnerId = winnerEntry.student_id || winnerEntry.team_id;
  if (!winnerId) return;

  const eventsSnap = await predictionEventsCol.where("programId", "==", programId).get();
  const events = docsToData<PredictionEvent>(eventsSnap);
  const event = events.find((e) => e.status !== "evaluated");

  if (!event) return;

  const winningOption = event.options.find((opt) => opt.id === winnerId);

  if (!winningOption) {
    console.log(`Prediction evaluation skipped: No matching option found for winner ${winnerId} in event ${event.id}`);
    return;
  }

  await predictionEventsCol.doc(event.id).update({
    status: "evaluated",
    correctOptionId: winningOption.id,
  });

  const predsSnap = await predictionsCol
    .where("eventId", "==", event.id)
    .where("selectedOptionId", "==", winningOption.id)
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

  revalidatePath("/predictions");
  revalidatePath("/predictions/leaderboard");

  console.log(`Auto-evaluated prediction event ${event.id}. Winner: ${winningOption.label}, Correct Guesses: ${correctPredictions.length}`);
}
