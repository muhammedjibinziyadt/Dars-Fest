import { NextResponse } from "next/server";
import { predictionEventsCol, docToData } from "@/lib/models";
import type { PredictionEvent } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const doc = await predictionEventsCol.doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(docToData<PredictionEvent>(doc));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    delete body.id;
    delete body.createdAt;

    const ref = predictionEventsCol.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await ref.set(body, { merge: true });
    const updatedDoc = await ref.get();
    return NextResponse.json(docToData<PredictionEvent>(updatedDoc));
  } catch (error) {
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const ref = predictionEventsCol.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await ref.delete();
    return NextResponse.json({ message: "Event deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
