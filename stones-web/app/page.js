"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) console.warn("Session creation failed, proceeding anyway");
      } catch {}

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/ask_doc";
      window.location.replace(redirect);
    } catch (err) {
      console.error(err);
      let errorMessage = "Invalid email or password.";
      if (err.code === 'auth/user-not-found') errorMessage = "No account found with this email.";
      else if (err.code === 'auth/wrong-password') errorMessage = "Incorrect password.";
      else if (err.code === 'auth/invalid-email') errorMessage = "Invalid email address.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();

      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
      } catch {}

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/ask_doc";
      window.location.replace(redirect);
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.code === 'auth/popup-closed-by-user') setError("Sign-in was cancelled.");
      else if (err.code === 'auth/popup-blocked') setError("Popup was blocked. Please allow popups.");
      else setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ddeeff] flex items-center justify-center px-4 py-12">
      {/* Card Container */}
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full grid md:grid-cols-[1fr_auto] gap-8 p-8 md:p-12 items-center">
        
        {/* Left Section - Form */}
        <div className="flex flex-col gap-6 justify-center">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-snug">
            Welcome Back!
          </h1>
          <p className="text-gray-600">
            Sign in to access your scans and receive detailed insights.
          </p>

          {/* Google Sign-In Button */}
          <Button
            variant="uiverse"
            className="w-full"
            onClick={handleGoogleSignIn}
            isLoading={googleLoading}
            leftIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
          >
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button variant="uiverse" className="w-full" type="submit" isLoading={loading}>
              Sign in
            </Button>
          </form>
        </div>

        {/* Right Section - Image */}
        <div className="hidden md:flex justify-center self-center">
          <Image
            src="/splash-screen.png"
            alt="Login Illustration"
            width={500}
            height={500}
            className="max-w-full h-auto rounded-xl shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
