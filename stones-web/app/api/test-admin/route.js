import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

export async function GET() {
  try {
    console.log("Testing Firebase Admin configuration...");
    
    // Test environment variables
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    console.log("Environment variables check:");
    console.log("- FIREBASE_ADMIN_PROJECT_ID:", projectId ? "✓ Set" : "✗ Missing");
    console.log("- FIREBASE_ADMIN_CLIENT_EMAIL:", clientEmail ? "✓ Set" : "✗ Missing");
    console.log("- FIREBASE_ADMIN_PRIVATE_KEY:", privateKey ? "✓ Set" : "✗ Missing");
    
    if (!projectId || !clientEmail || !privateKey) {
      return NextResponse.json({ 
        error: "Missing environment variables",
        details: {
          projectId: !!projectId,
          clientEmail: !!clientEmail,
          privateKey: !!privateKey
        }
      }, { status: 500 });
    }
    
    // Test Firebase Admin initialization
    const auth = getFirebaseAdminAuth();
    console.log("Firebase Admin Auth initialized successfully");
    
    return NextResponse.json({ 
      success: true,
      message: "Firebase Admin is properly configured",
      projectId: projectId
    });
    
  } catch (error) {
    console.error("Firebase Admin test failed:", error);
    return NextResponse.json({ 
      error: "Firebase Admin initialization failed",
      details: error.message
    }, { status: 500 });
  }
}