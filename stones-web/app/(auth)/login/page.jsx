"use client";

import { useState ,useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/button";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  const router = useRouter();
  const auth = getFirebaseAuth();

  // Check for redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          const idToken = await user.getIdToken();
          
          // Set session cookie via API
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });
          
          if (response.ok) {
            console.log("Redirect sign-in successful for user:", user.email);
            router.push('/upload');
          } else {
            setError("Failed to create session after redirect");
          }
        }
      } catch (error) {
        console.error("Redirect result error:", error);
        setError("Sign-in failed after redirect");
      }
    };

    handleRedirectResult();
  }, [auth, router]);

  async function handleSubmit() {
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get ID token for session
      const idToken = await user.getIdToken();
      
      // Set session cookie via API
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      console.log("Login successful for user:", user.email);
      
      // Redirect to upload page or dashboard
      router.push('/upload');
      
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        setError("No account found with this email address");
      } else if (error.code === 'auth/wrong-password') {
        setError("Incorrect password");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email address");
      } else if (error.code === 'auth/too-many-requests') {
        setError("Too many failed attempts. Please try again later");
      } else {
        setError(error.message || "Login failed. Please try again");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      
      try {
        // Try popup first
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        // Get ID token for session
        const idToken = await user.getIdToken();
        
        // Set session cookie via API
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create session');
        }
        
        console.log("Google sign-in successful for user:", user.email);
        router.push('/upload');
        
      } catch (popupError) {
        // If popup fails, try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message.includes('popup')) {
          console.log("Popup blocked, trying redirect method...");
          await signInWithRedirect(auth, provider);
          // The redirect will complete on page reload
          return;
        } else {
          throw popupError;
        }
      }
      
    } catch (error) {
      console.error("Google sign-in error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Popup was blocked. Trying redirect method...");
        // This should not happen as we handle it above, but just in case
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          setError("Both popup and redirect failed. Please try again.");
        }
      } else {
        setError(error.message || "Google sign-in failed. Please try again");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#febacd] flex items-center justify-center p-4 relative">
      {/* Back Button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 p-3 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm z-10"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>
      
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8">
        
          <div className="w-full lg:w-1/2 flex justify-center mb-8 lg:mb-0">
            <img 
              src="/login.png" 
              alt="Login illustration" 
              className="w-[350px] lg:w-[350px] h-auto object-contain"
            />
          </div>

          {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 max-w-md">
          {/* Main Form Container */}
          <div className="bg-[#febacd] p-8">
          {/* Logo/Header Section */}
          <div className="text-center mb-8">
            
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            
          </div>

          {/* Google Sign-In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            variant="uiverse"
            className="w-full"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form Fields */}
          <div className="space-y-5">
            <div>
              
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-2 border border-[#111547] rounded-4xl  "
                placeholder="email"
              />
            </div>

            <div>
              
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-2 border border-[#111547] rounded-4xl  "
                placeholder="password"
              />
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-600 select-none">Remember me</span>
              </label>
              <button 
                onClick={() => router.push('/forgot-password')}
                className="text-sm text-[#111547] hover:text-gray-800 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-1/2"
              variant="uiverse"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </Button>
          </div>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button 
              onClick={() => router.push('/register')}
              className="font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Footer */}
        
        </div>
      </div>
    </div>
  );
}