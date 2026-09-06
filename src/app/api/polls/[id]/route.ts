import { NextResponse } from "next/server";
import { pollsCol, docToData } from "@/lib/models";
import type { Poll } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const doc = await pollsCol.doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }
    return NextResponse.json(docToData<Poll>(doc));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch poll" }, { status: 500 });
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
    delete body.votes;

    const ref = pollsCol.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    await ref.set(body, { merge: true });
    const updatedDoc = await ref.get();
    return NextResponse.json(docToData<Poll>(updatedDoc));
  } catch (error) {
    return NextResponse.json({ error: "Failed to update poll" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const ref = pollsCol.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }
    await ref.delete();
    return NextResponse.json({ message: "Poll deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete poll" }, { status: 500 });
  }
}
