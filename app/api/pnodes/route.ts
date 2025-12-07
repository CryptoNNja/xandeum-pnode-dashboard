import { NextResponse } from "next/server";
import { getAllPNodesStats } from "@/lib/api";

export async function GET() {
  try {
    const data = await getAllPNodesStats();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch pNodes" },
      { status: 500 }
    );
  }
}