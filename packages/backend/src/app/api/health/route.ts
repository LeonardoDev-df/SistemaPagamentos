import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ? "set" : "MISSING";
  checks.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ? "set" : "MISSING";
  checks.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY
    ? `set (${process.env.FIREBASE_PRIVATE_KEY.length} chars, starts with: ${process.env.FIREBASE_PRIVATE_KEY.substring(0, 30)}...)`
    : "MISSING";
  checks.FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET ? "set" : "MISSING";
  checks.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? "set" : "MISSING";
  checks.FRONTEND_URL = process.env.FRONTEND_URL ?? "MISSING";

  // Check Firebase Admin init
  try {
    const { adminAuth } = await import("@/lib/firebase/admin");
    await adminAuth.listUsers(1);
    checks.firebaseAdmin = "OK";
  } catch (err) {
    checks.firebaseAdmin = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  const allOk = checks.firebaseAdmin === "OK" &&
    !Object.values(checks).includes("MISSING");

  return NextResponse.json({
    status: allOk ? "healthy" : "unhealthy",
    checks,
  }, { status: allOk ? 200 : 500 });
}
