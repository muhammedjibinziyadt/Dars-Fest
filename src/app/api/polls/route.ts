import { NextResponse } from "next/server";
import { pollsCol, docsToData } from "@/lib/models";
import { randomUUID } from "node:crypto";
import type { Poll } from "@/lib/types";

export async function GET() {
  try {
    const snap = await pollsCol.orderBy("createdAt", "desc").get();
    const polls = docsToData<Poll>(snap);
    return NextResponse.json(polls);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, options } = body;

    const id = randomUUID();
    const newPoll: Poll = {
      id,
      question,
      options: options.map((opt: string) => ({
        id: randomUUID(),
        text: opt,
        votes: 0,
      })),
      active: true,
      createdAt: new Date().toISOString(),
    };

    await pollsCol.doc(id).set(newPoll);

    return NextResponse.json(newPoll, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create poll" }, { status: 500 });
  }
}
