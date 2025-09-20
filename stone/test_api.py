import requests
import json

# Test the Flask API with the sample image
url = "http://localhost:5000/predict"

# Open file and specify correct MIME type
with open('test.jpeg', 'rb') as f:
    files = {'image': ('test.jpeg', f, 'image/jpeg')}
    
    try:
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print("\n=== API Response Structure ===")
        
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2))
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")