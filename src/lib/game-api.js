import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export function enforceGameRateLimit(userId, action) {
  const result = checkRateLimit(userId, action);
  if (result.ok) return null;

  return NextResponse.json(
    {
      error: "Too many requests",
      code: "RATE_LIMITED",
      retryAfterSeconds: result.retryAfterSeconds,
      message: result.message,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}
