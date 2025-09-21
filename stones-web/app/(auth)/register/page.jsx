"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  
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
            console.log("Redirect sign-up successful for user:", user.email);
            router.push('/ask_doc');
          } else {
            setError("Failed to create session after redirect");
          }
        }
      } catch (error) {
        console.error("Redirect result error:", error);
        setError("Sign-up failed after redirect");
      }
    };

    handleRedirectResult();
  }, [auth, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  async function handleSubmit() {
    setError("");
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.mobileNumber || !formData.dateOfBirth || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      setError("Please agree to terms and privacy policy");
      return;
    }
    
    setLoading(true);
    
    try {
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
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
      
      console.log("Registration successful for user:", user.email);
      
      // Redirect to ask_doc page
      router.push('/ask_doc');
      
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        setError("Email already in use. Please try a different email.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password is too weak. Please use a stronger password.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email address");
      } else if (error.code === 'auth/operation-not-allowed') {
        setError("Email/password accounts are not enabled. Please contact support.");
      } else {
        setError(error.message || "Registration failed. Please try again");
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
        
        console.log("Google sign-up successful for user:", user.email);
        router.push('/ask_doc');
        
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
      console.error("Google sign-up error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-up was cancelled");
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
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError("An account already exists with this email using a different sign-in method.");
      } else {
        setError(error.message || "Google sign-up failed. Please try again");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: '#febacd',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-60"></div>
      
      {/* Back Button */}
      <button
        onClick={() => router.push("/login")}
        className="absolute top-6 left-6 z-20 p-3 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>
      
      <div className="relative z-10 max-w-6xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white mb-2">
            Create Account
          </h2>
          <p className="text-pink-100">
            Join us to start your health journey
          </p>
        </div>

        <div className="flex flex-col lg:flex-row bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Image Section */}
          <div className="lg:w-1/2 flex items-center justify-center p-8">
            <img
              src="/login.png"
              alt="Medical illustration"
              className="w-full max-w-md h-auto object-contain"
            />
          </div>

          {/* Form Section */}
          <div className="lg:w-1/2 p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Enter your email"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number *
              </label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Enter your mobile number"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Enter your password"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Confirm your password"
              />
            </div>

            {/* Terms and Privacy */}
            <div className="space-y-2">
              <label className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">
                  I agree to the <a href="#" className="text-pink-600 hover:text-pink-800">Terms of Service</a>
                </span>
              </label>
              
              <label className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  name="agreePrivacy"
                  checked={formData.agreePrivacy}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">
                  I agree to the <a href="#" className="text-pink-600 hover:text-pink-800">Privacy Policy</a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 px-4 rounded-md border border-gray-300 transition duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{googleLoading ? "Signing up..." : "Sign up with Google"}</span>
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-pink-600 hover:text-pink-800 font-medium"
                >
                  Sign in here
                </a>
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}