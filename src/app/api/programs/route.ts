import { NextResponse } from "next/server";
import { programsCol, docsToData } from "@/lib/models";
import type { Program } from "@/lib/types";

export async function GET() {
  try {
    const snap = await programsCol.orderBy("name", "asc").get();
    const programs = docsToData<Program>(snap).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
    }));
    return NextResponse.json(programs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}
