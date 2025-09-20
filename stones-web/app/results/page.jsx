"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileImage, 
  Target,
  TrendingUp,
  MapPin,
  Info,
  Download,
  FileText
} from "lucide-react";
import Button from "@/components/ui/button";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportGenerating, setReportGenerating] = useState(false);

  useEffect(() => {
    const uploadedFile = sessionStorage.getItem("uploadedFile");
    const uploadedFileData = sessionStorage.getItem("uploadedFileData");
    
    if (uploadedFile && uploadedFileData) {
      // Call Flask API for detection
      processImageWithAPI(uploadedFileData, uploadedFile);
    } else {
      // Fallback to existing data if available
      const data = sessionStorage.getItem("detectionResult");
      if (data) {
        const parsedResult = JSON.parse(data);
        console.log("Results page - received data:", parsedResult);
        setResult(parsedResult);
        setLoading(false);
      } else {
        console.log("No detection result or uploaded file found in sessionStorage");
        router.push("/upload");
      }
    }
  }, [router]);

  const processImageWithAPI = async (fileData, fileName) => {
    try {
      setLoading(true);
      setError(null);

      // Convert base64 to blob if needed
      let formData = new FormData();
      
      if (fileData.startsWith('data:')) {
        // Convert base64 to blob
        const response = await fetch(fileData);
        const blob = await response.blob();
        formData.append('image', blob, fileName);
      } else {
        // If fileData is already a File object
        formData.append('image', fileData);
      }

      // Call Flask API
      const apiResponse = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || `HTTP error! status: ${apiResponse.status}`);
      }

      const detectionResult = await apiResponse.json();
      console.log("API Response:", detectionResult);

      // Transform API response to match expected format
      const transformedResult = {
        detections: detectionResult.detections || [],
        summary: {
          total_stones: detectionResult.summary?.total_stones || 0,
          largest_stone_mm: detectionResult.summary?.largest_stone_mm || 0,
          average_confidence: detectionResult.summary?.average_confidence || 0,
          severity: detectionResult.summary?.severity || {
            level: detectionResult.summary?.risk_level === 'normal' ? 'Normal' : 
                   detectionResult.summary?.risk_level === 'moderate' ? 'Moderate' : 'Severe',
            description: getDefaultSeverityDescription(detectionResult.summary?.risk_level)
          }
        },
        recommendations: detectionResult.recommendations || [],
        metadata: detectionResult.metadata || {},
        annotated_image: detectionResult.annotated_image || null,
        analysis_timestamp: detectionResult.analysis_timestamp || new Date().toISOString()
      };

      setResult(transformedResult);
      
      // Save to sessionStorage for future reference
      sessionStorage.setItem("detectionResult", JSON.stringify(transformedResult));
      
    } catch (err) {
      console.error("Error processing image:", err);
      setError(err.message || "Failed to process image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSeverityDescription = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'normal':
        return 'No immediate concerns detected';
      case 'moderate':
        return 'Moderate stone burden - regular monitoring recommended';
      case 'severe':
        return 'Severe stone burden - immediate medical attention recommended';
      default:
        return 'Assessment completed';
    }
  };

  // Helper function to get severity color classes
  const getSeverityColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'normal':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: CheckCircle
        };
      case 'moderate':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: AlertCircle
        };
      case 'severe':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: AlertTriangle
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: Info
        };
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const downloadAnnotatedImage = () => {
    if (result?.annotated_image) {
      const link = document.createElement('a');
      link.href = result.annotated_image;
      link.download = `kidney_analysis_${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateReport = async () => {
    if (!result) return;
    
    try {
      setReportGenerating(true);
      
      // Prepare data for report generation
      const reportData = {
        detections: result.detections || [],
        summary: result.summary || {},
        metadata: result.metadata || {},
        annotated_image: result.annotated_image || null,
        analysis_timestamp: result.analysis_timestamp || new Date().toISOString()
      };

      // Call Flask API to generate report
      const response = await fetch('http://localhost:5000/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kidney_scan_report_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Error generating report:", err);
      alert(`Failed to generate report: ${err.message}`);
    } finally {
      setReportGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Activity className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Image...</h2>
          <p className="text-gray-600">Our AI is detecting kidney stones in your image</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Analysis Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => router.push("/upload")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Activity className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Results...</h2>
        </div>
      </div>
    );
  }

  const severityConfig = getSeverityColor(result.summary?.severity?.level || result.summary?.risk_level);
  const SeverityIcon = severityConfig.icon;

  return (
    <div className="min-h-screen bg-[#] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => router.push("/upload")}
              variant="ghost"
              className="p-2"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="w-8"></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">AI Analysis Complete</h1>
          <p className="text-gray-600 mt-2">Detailed kidney stone detection results</p>
        </div>

        {/* Annotated Image Display */}
        {result.annotated_image && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FileImage className="w-5 h-5 mr-2 text-indigo-600" />
                Annotated Scan
              </h2>
              <Button
                onClick={downloadAnnotatedImage}
                variant="outline"
                className="px-4 py-2"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download
              </Button>
            </div>
            <div className="flex justify-center">
              <img 
                src={result.annotated_image} 
                alt="Annotated kidney scan with detected stones"
                className="max-w-full h-auto rounded-lg shadow-md"
                style={{ maxHeight: '400px' }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detection Summary Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-indigo-600" />
              Detection Summary
            </h2>
            
            {/* Main Stats */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                {result.summary?.total_stones || 0}
              </div>
              <div className="text-lg text-gray-600">Stones Detected</div>
            </div>

            {/* Summary Grid */}
            {result.summary?.total_stones > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {result.summary.largest_stone_mm?.toFixed(1)}mm
                  </div>
                  <div className="text-sm text-gray-600">Largest Stone</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">
                    {(result.summary.average_confidence * 100)?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </div>
              </div>
            )}

            {/* Severity Level */}
            {result.summary?.severity && (
              <div className={`p-4 rounded-lg border-2 ${severityConfig.bg} ${severityConfig.border}`}>
                <div className="flex items-center justify-center mb-2">
                  <SeverityIcon className={`w-6 h-6 mr-2 ${severityConfig.text}`} />
                  <span className={`text-lg font-bold ${severityConfig.text}`}>
                    {result.summary.severity.level}
                  </span>
                </div>
                <p className={`text-sm text-center ${severityConfig.text}`}>
                  {result.summary.severity.description}
                </p>
              </div>
            )}
          </div>

          {/* Individual Detections Card */}
          {result.detections && result.detections.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                Individual Stones ({result.detections.length})
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {result.detections.map((stone, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-800">Stone #{stone.id}</span>
                      <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                        {stone.type || 'kidney_stone'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Size:</span>
                        <span className="font-medium ml-1">{stone.diameter_mm}mm</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Position:</span>
                        <span className="font-medium ml-1">{stone.position}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-medium ml-1">{(stone.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pixels:</span>
                        <span className="font-medium ml-1">{stone.diameter_px?.toFixed(0)}px</span>
                      </div>
                    </div>

                    {/* Bounding Box Info */}
                    {stone.bbox && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span>Coordinates: [{stone.bbox.map(coord => coord.toFixed(0)).join(', ')}]</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Card */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                Medical Recommendations
              </h3>
              <ul className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata Card */}
          {result.metadata && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-indigo-600" />
                Analysis Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed:</span>
                  <span className="font-medium">{formatDate(result.analysis_timestamp)}</span>
                </div>
                {result.metadata.filename && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Filename:</span>
                    <span className="font-medium truncate ml-2">{result.metadata.filename}</span>
                  </div>
                )}
                {result.metadata.image_dimensions && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium">{result.metadata.image_dimensions}</span>
                  </div>
                )}
                {result.metadata.scale_factor_mm_per_pixel && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scale Factor:</span>
                    <span className="font-medium">{result.metadata.scale_factor_mm_per_pixel.toFixed(3)} mm/px</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8 mb-6">
          <Button
            onClick={() => {
              // Clear previous results when starting new analysis
              sessionStorage.removeItem("detectionResult");
              sessionStorage.removeItem("uploadedFile");
              sessionStorage.removeItem("uploadedFileData");
              router.push("/upload");
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3"
          >
            Analyze Another Image
          </Button>
          <Button
            onClick={generateReport}
            disabled={reportGenerating}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={reportGenerating ? 
              <Activity className="w-4 h-4 animate-spin" /> : 
              <FileText className="w-4 h-4" />
            }
          >
            {reportGenerating ? 'Generating...' : 'Download Report'}
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="px-6 py-3"
          >
            Print Results
          </Button>
        </div>
      </div>
    </div>
  );
}