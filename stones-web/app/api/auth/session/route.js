import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

// POST /api/auth/session
// Body: { idToken } — verifies with Admin SDK and sets a secure session cookie
export async function POST(request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      console.error("Missing idToken in request");
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    console.log("Attempting to verify idToken...");
    
    // Enhanced debugging for environment variables
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    console.log("Environment variables status:");
    console.log("- FIREBASE_ADMIN_PROJECT_ID:", projectId ? "✓ Present" : "✗ Missing");
    console.log("- FIREBASE_ADMIN_CLIENT_EMAIL:", clientEmail ? "✓ Present" : "✗ Missing");
    console.log("- FIREBASE_ADMIN_PRIVATE_KEY:", privateKey ? `✓ Present (${privateKey.length} chars)` : "✗ Missing");
    
    // Check if Firebase Admin is properly configured
    try {
      const auth = getFirebaseAdminAuth();
      console.log("Firebase Admin Auth initialized successfully");
    } catch (adminError) {
      console.error("Firebase Admin initialization failed:", adminError.message);
      console.error("Full error:", adminError);
      return NextResponse.json({ 
        error: "Server configuration error - Firebase Admin not properly configured",
        details: process.env.NODE_ENV === 'development' ? {
          message: adminError.message,
          hasProjectId: !!projectId,
          hasClientEmail: !!clientEmail,
          hasPrivateKey: !!privateKey,
          privateKeyLength: privateKey ? privateKey.length : 0
        } : undefined
      }, { status: 500 });
    }
    
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    console.log("Token verified successfully for uid:", decoded.uid);

    // Create a simple secure cookie with the ID token; in production prefer session cookie via createSessionCookie
    const res = NextResponse.json({ ok: true, uid: decoded.uid });
    const maxAge = 60 * 60 * 24 * 5; // 5 days
    res.cookies.set("fb_token", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    return res;
  } catch (e) {
    console.error("/api/auth/session error:", e.message, e.code);
    
    // Provide more specific error messages
    if (e.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    } else if (e.code === 'auth/invalid-id-token') {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    } else if (e.message.includes("Missing Firebase Admin")) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}

// DELETE clears the cookie (logout)
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("fb_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
