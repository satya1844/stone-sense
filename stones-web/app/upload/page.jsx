"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Upload, FileText, Zap, Calendar, Star, Eye, AlertCircle, CheckCircle2, LogOut, User, ArrowLeft } from 'lucide-react';

const UploadPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    // Reset previous states
    setError(null);
    setDetectionResult(null);
    setUploadProgress(0);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload only JPEG or PNG images');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call our Next.js API endpoint
      const response = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Detection result:', result);
      
      setDetectionResult(result);
      
      // Store result in sessionStorage for results page
      sessionStorage.setItem('detectionResult', JSON.stringify(result));
      
    } catch (error) {
      console.error('Processing error:', error);
      setError(error.message || 'Failed to process image');
      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewResult = () => {
    if (detectionResult) {
      router.push('/results');
    }
  };

  const handleFeatureClick = (feature) => {
    alert(`${feature} feature clicked! This would show more details about this feature.`);
  };

  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth();
      
      // Clear session cookie
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-screen mx-auto">


        {/* Header with Back Button and User Info */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <button
            onClick={() => router.push("/ask_doc")}
            className="p-3 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="flex items-center space-x-3 bg-white rounded-full px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 font-medium">
                {user.displayName || user.email}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>


        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Kindly upload your scanned copy here.</h1>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Upload Section */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleUploadClick}
              >
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Upload your medical scan
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {selectedFile ? selectedFile.name : 'Click to browse or drag and drop your scan image'}
                </p>
                <p className="text-gray-400 text-xs mb-4">
                  Supported: JPEG, PNG • Max size: 10MB
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadClick();
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Choose File
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Progress Bar */}
              {selectedFile && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {isProcessing ? 'Processing...' : 'Ready to analyze'}
                    </span>
                    <span className="text-sm font-bold text-indigo-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ease-out ${
                        uploadProgress === 100 ? 'bg-gradient-to-r from-green-400 to-green-500' 
                        : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                      }`}
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {detectionResult && (
                <div className="mt-4 p-3 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 text-sm font-medium">Analysis Complete!</p>
                    <p className="text-green-600 text-xs">
                      Found {detectionResult.summary?.total_stones || 0} stone(s) • 
                      Risk level: {detectionResult.summary?.risk_level || 'Unknown'}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {selectedFile && !detectionResult && (
                  <Button
                    onClick={processImage}
                    disabled={isProcessing}
                    variant="uiverse"
                    className="w-full"
                    leftIcon={isProcessing ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4" />}
                  >
                    {isProcessing ? 'Analyzing...' : 'Analyze Scan'}
                  </Button>
                )}

                {detectionResult && (
                  <button
                    onClick={handleViewResult}
                    className="w-full mx-auto p-3 border-green-400 rounded-3xl hover:bg-green-400 hover:text-white transition"
                  >
                    View Detailed Results
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Water Feature */}
            <div 
              onClick={() => handleFeatureClick('Hydration Tips')}
              className="bg-white rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer hover:scale-[1.03] border border-gray-200 hover:border-gray-300"
            >
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-white rounded-full shadow-inner"></div>
                </div>
                <div className="space-y-1 pt-1">
                  <h3 className="text-lg font-bold text-gray-800 tracking-tight">Stay Hydrated</h3>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    Drink 8-10 glasses of water daily to prevent stone formation
                  </p>
                </div>
              </div>
            </div>

            {/* Diet Feature */}
            <div 
              onClick={() => handleFeatureClick('Dietary Guidelines')}
              className="bg-white rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer hover:scale-[1.03] border border-gray-200 hover:border-gray-300"
            >
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-1 pt-1">
                  <h3 className="text-lg font-bold text-gray-800 tracking-tight">Healthy Diet</h3>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    Balanced nutrition and low sodium intake
                  </p>
                </div>
              </div>
            </div>

            {/* Exercise Feature */}
            <div 
              onClick={() => handleFeatureClick('Exercise Routine')}
              className="bg-white rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer hover:scale-[1.03] border border-gray-200 hover:border-gray-300"
            >
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-1 pt-1">
                  <h3 className="text-lg font-bold text-gray-800 tracking-tight">Stay Active</h3>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    Regular exercise improves kidney health
                  </p>
                </div>
              </div>
            </div>

            {/* Medical Checkup Feature */}
            <div 
              onClick={() => handleFeatureClick('Medical Checkups')}
              className="bg-white rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer hover:scale-[1.03] border border-gray-200 hover:border-gray-300"
            >
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-1 pt-1">
                  <h3 className="text-lg font-bold text-gray-800 tracking-tight">Regular Checkups</h3>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    Monitor kidney health with routine medical visits
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default UploadPage;