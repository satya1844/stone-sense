#!/usr/bin/env python3
"""
Test script for doctor contact saving functionality
"""

import requests
import json

# Configuration
FLASK_URL = "http://localhost:5000"

def test_save_doctor_contact():
    """Test saving doctor contact information"""
    print("=== Testing Doctor Contact Save ===")
    
    doctor_data = {
        "user_id": "test_user_123",
        "doctor_phone": "987-654-3210",
        "doctor_email": "dr.smith@hospital.com",
        "updated_date": "2025-09-21"
    }
    
    try:
        response = requests.post(f"{FLASK_URL}/save-doctor-contact", json=doctor_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Doctor contact saved successfully: {result['message']}")
            return True
        else:
            print(f"❌ Save failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Save error: {e}")
        return False

def test_update_doctor_contact():
    """Test updating existing doctor contact"""
    print("=== Testing Doctor Contact Update ===")
    
    updated_data = {
        "user_id": "test_user_123",
        "doctor_phone": "555-123-4567",
        "doctor_email": "dr.jones@clinic.com",
        "updated_date": "2025-09-21"
    }
    
    try:
        response = requests.post(f"{FLASK_URL}/save-doctor-contact", json=updated_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Doctor contact updated successfully: {result['message']}")
            return True
        else:
            print(f"❌ Update failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Update error: {e}")
        return False

def test_validation():
    """Test validation for doctor contact"""
    print("=== Testing Validation ===")
    
    # Test missing user_id
    invalid_data = {
        "doctor_phone": "123-456-7890"
    }
    
    try:
        response = requests.post(f"{FLASK_URL}/save-doctor-contact", json=invalid_data)
        if response.status_code == 400:
            print("✅ Validation working - missing user_id caught")
        else:
            print("❌ Validation failed - should have rejected missing user_id")
    except Exception as e:
        print(f"❌ Validation test error: {e}")
    
    # Test missing contact info
    invalid_data2 = {
        "user_id": "test_user_456"
    }
    
    try:
        response = requests.post(f"{FLASK_URL}/save-doctor-contact", json=invalid_data2)
        if response.status_code == 400:
            print("✅ Validation working - missing contact info caught")
        else:
            print("❌ Validation failed - should have rejected missing contact info")
    except Exception as e:
        print(f"❌ Validation test error: {e}")

def main():
    """Run doctor contact tests"""
    print("🩺 Starting Doctor Contact Save Tests\n")
    
    # Test 1: Save doctor contact
    save_success = test_save_doctor_contact()
    print()
    
    # Test 2: Update doctor contact
    if save_success:
        update_success = test_update_doctor_contact()
        print()
    
    # Test 3: Validation
    test_validation()
    
    print("\n" + "="*50)
    print("🎉 Doctor Contact Tests Completed!")
    print("✅ Check the Flask console for any errors")
    print("📄 Check 'doctor_contacts.csv' file for saved data")
    print("="*50)

if __name__ == "__main__":
    main()