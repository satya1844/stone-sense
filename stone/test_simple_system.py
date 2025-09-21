#!/usr/bin/env python3
"""
Simple test script for the reverted user registration and report system
"""

import requests
import json

# Configuration
FLASK_URL = "http://localhost:5000"

def test_user_data_save():
    """Test saving user data during registration"""
    print("=== Testing User Data Save ===")
    
    user_data = {
        "user_id": "test_user_123",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@test.com",
        "phone": "123-456-7890",
        "date_of_birth": "1990-01-15",
        "registration_date": "2025-09-21"
    }
    
    try:
        response = requests.post(f"{FLASK_URL}/save-user-data", json=user_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ User data saved successfully: {result['message']}")
            return True
        else:
            print(f"❌ Save failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Save error: {e}")
        return False

def test_user_data_retrieval():
    """Test retrieving user data for reports"""
    print("=== Testing User Data Retrieval ===")
    
    try:
        response = requests.get(f"{FLASK_URL}/get-user-data/test_user_123")
        if response.status_code == 200:
            result = response.json()
            user_data = result['user']
            print(f"✅ User data retrieved successfully:")
            print(f"   Name: {user_data['first_name']} {user_data['last_name']}")
            print(f"   Email: {user_data['email']}")
            print(f"   Phone: {user_data['phone']}")
            return user_data
        else:
            print(f"❌ Retrieval failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Retrieval error: {e}")
        return None

def test_report_generation_with_user():
    """Test report generation with user data"""
    print("=== Testing Report Generation with User Data ===")
    
    try:
        report_data = {
            'user_id': 'test_user_123',
            'detections': [
                {
                    'id': 1,
                    'bbox': [100, 100, 150, 150],
                    'confidence': 0.85,
                    'size_mm': 5.2
                }
            ],
            'summary': {
                'total_stones': 1,
                'largest_stone_mm': 5.2,
                'average_confidence': 0.85,
                'risk_level': 'moderate'
            },
            'metadata': {
                'image_width': 800,
                'image_height': 600,
                'timestamp': '2025-09-21T10:30:00Z'
            }
        }
        
        response = requests.post(f"{FLASK_URL}/generate-report", json=report_data)
        
        if response.status_code == 200:
            # Save the PDF response
            with open('test_user_report.pdf', 'wb') as f:
                f.write(response.content)
            print("✅ Report generated successfully with user data: test_user_report.pdf")
            return True
        else:
            print(f"❌ Report generation failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Report generation error: {e}")
        return False

def main():
    """Run simplified system tests"""
    print("🚀 Starting Simplified User Registration & Report Tests\n")
    
    # Test 1: Save user data
    save_success = test_user_data_save()
    if not save_success:
        print("❌ Testing stopped due to save failure")
        return
    
    print()
    
    # Test 2: Retrieve user data
    user_data = test_user_data_retrieval()
    if not user_data:
        print("❌ Testing stopped due to retrieval failure")
        return
    
    print()
    
    # Test 3: Generate report with user data
    report_success = test_report_generation_with_user()
    
    print("\n" + "="*50)
    if report_success:
        print("🎉 ALL SIMPLIFIED TESTS PASSED!")
        print("✅ User registration data saves to CSV")
        print("✅ User data retrieval working") 
        print("✅ Report generation with user data working")
        print("📄 Check 'test_user_report.pdf' for report with user data")
    else:
        print("⚠️  SOME TESTS FAILED")
    print("="*50)

if __name__ == "__main__":
    main()