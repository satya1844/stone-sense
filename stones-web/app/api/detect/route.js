import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Get the uploaded file from the request
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPEG or PNG images only.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Create FormData for Flask API
    const flaskFormData = new FormData();
    flaskFormData.append('image', file);

    // Forward the request to Flask API
    const flaskApiUrl = process.env.FLASK_API_URL || 'http://localhost:5000';
    
    console.log('Sending request to Flask API:', `${flaskApiUrl}/predict`);
    
    const flaskResponse = await fetch(`${flaskApiUrl}/predict`, {
      method: 'POST',
      body: flaskFormData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary for multipart/form-data
      }
    });

    if (!flaskResponse.ok) {
      console.error('Flask API error:', flaskResponse.status, flaskResponse.statusText);
      const errorText = await flaskResponse.text();
      console.error('Flask error details:', errorText);
      
      return NextResponse.json(
        { 
          error: 'AI model processing failed',
          details: `Flask API returned ${flaskResponse.status}: ${flaskResponse.statusText}`
        },
        { status: 502 }
      );
    }

    const result = await flaskResponse.json();
    console.log('Flask API response:', result);

    // Add metadata to the response
    const enhancedResult = {
      ...result,
      metadata: {
        filename: file.name,
        filesize: file.size,
        filetype: file.type,
        processed_at: new Date().toISOString(),
        api_version: '1.0'
      }
    };

    return NextResponse.json(enhancedResult);

  } catch (error) {
    console.error('API error:', error);
    
    // Handle different types of errors
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout. Please try again.' },
        { status: 408 }
      );
    }
    
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'AI service is currently unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const flaskApiUrl = process.env.FLASK_API_URL || 'http://localhost:5000';
    
    // Quick health check to Flask API
    const response = await fetch(`${flaskApiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const isFlaskHealthy = response.ok;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        nextjs: 'healthy',
        flask_api: isFlaskHealthy ? 'healthy' : 'unhealthy',
        flask_url: flaskApiUrl
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'partial',
      timestamp: new Date().toISOString(),
      services: {
        nextjs: 'healthy',
        flask_api: 'unreachable',
        error: error.message
      }
    }, { status: 200 }); // Still return 200 since Next.js is working
  }
}