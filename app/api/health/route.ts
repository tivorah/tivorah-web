import { NextResponse } from "next/server";
import { webEnvErrors } from "../../../lib/env-validation";

export const dynamic = "force-dynamic";

export function GET() {
  const valid = webEnvErrors(process.env).length === 0;
  return NextResponse.json(
    { status: valid ? "ok" : "configuration_error" },
    { status: valid ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
