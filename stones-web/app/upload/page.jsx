"use client"

import React, { useState, useRef } from 'react';
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Upload, FileText, Zap, Calendar, Star, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Upload Medical Scan</h1>
          <p className="text-gray-600 text-sm mt-2">AI-powered kidney stone detection</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
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
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
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
              <Button
                onClick={handleViewResult}
                variant="uiverse"
                className="w-full"
                leftIcon={<Eye className="w-4 h-4" />}
              >
                View Detailed Results
              </Button>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4">
          {/* Water Feature */}
          <div 
            onClick={() => handleFeatureClick('Hydration Tips')}
            className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Stay Hydrated</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Drinking plenty of water helps prevent kidney stone formation and promotes overall kidney health.
                </p>
              </div>
            </div>
          </div>

          {/* Energy Feature */}
          <div 
            onClick={() => handleFeatureClick('Dietary Guidelines')}
            className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Healthy Diet</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Balanced nutrition and limiting sodium can help prevent kidney stone recurrence.
                </p>
              </div>
            </div>
          </div>

          {/* Daily Routine Feature */}
          <div 
            onClick={() => handleFeatureClick('Exercise Routine')}
            className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-800">Stay Active</h3>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Regular physical activity improves overall health and may help prevent kidney stones.
                </p>
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