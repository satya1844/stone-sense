import requests
import json
import base64

def test_flask_api():
    """Test the updated Flask API with annotation features"""
    
    print("=== Testing Updated Flask API ===")
    
    # Test health endpoint first
    try:
        health_response = requests.get("http://localhost:5000/health")
        print(f"Health Check Status: {health_response.status_code}")
        if health_response.status_code == 200:
            print("✓ Flask API is running")
        else:
            print("✗ Flask API health check failed")
            return
    except Exception as e:
        print(f"✗ Cannot connect to Flask API: {e}")
        return
    
    # Test prediction endpoint
    try:
        with open('test.jpeg', 'rb') as f:
            files = {'image': ('test.jpeg', f, 'image/jpeg')}
            response = requests.post("http://localhost:5000/predict", files=files)
            
        print(f"\nPrediction Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for key components
            print("✓ Prediction successful")
            print(f"✓ Detections: {len(data.get('detections', []))}")
            print(f"✓ Summary: {data.get('summary', {}).get('total_stones', 0)} stones")
            
            # Check for new features
            if 'annotated_image' in data:
                print("✓ Annotated image included")
                # Check if it's a valid base64 image
                if data['annotated_image'].startswith('data:image/'):
                    print("✓ Annotated image is in base64 format")
                else:
                    print("✗ Annotated image format issue")
            else:
                print("✗ No annotated image in response")
            
            # Check scale factor
            metadata = data.get('metadata', {})
            if 'scale_factor_mm_per_pixel' in metadata:
                scale = metadata['scale_factor_mm_per_pixel']
                print(f"✓ Scale factor: {scale} mm/pixel")
                if scale != 0.5:  # Should not be the old hardcoded value
                    print("✓ Using improved scale calculation")
                else:
                    print("✗ Still using old hardcoded scale")
            else:
                print("✗ No scale factor in metadata")
                
            # Print summary of results
            if data.get('detections'):
                print(f"\nDetection Results:")
                for det in data['detections']:
                    print(f"- Stone #{det['id']}: {det['diameter_mm']:.1f}mm, {det['confidence']*100:.1f}% confidence")
                    
            print(f"\nResponse size: {len(json.dumps(data))} characters")
            
        else:
            print(f"✗ Prediction failed: {response.text}")
            
    except Exception as e:
        print(f"✗ Prediction test failed: {e}")

if __name__ == "__main__":
    test_flask_api()