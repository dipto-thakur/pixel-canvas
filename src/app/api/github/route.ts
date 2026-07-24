import { NextResponse } from "next/server";
import { emptyMatrix } from "@/lib/github-contributions";

// Stub endpoint so pc2's github-client.ts has something to hit.
// Replace with real GraphQL/normalization logic when wiring up actual
// GitHub contribution data.
export async function GET() {
  return NextResponse.json({ contributions: emptyMatrix() });
}
