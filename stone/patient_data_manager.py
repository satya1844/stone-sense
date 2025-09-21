import csv
import os
import uuid
from datetime import datetime
import pandas as pd

class PatientDataManager:
    def __init__(self, csv_file_path='patient_data.csv'):
        self.csv_file_path = csv_file_path
        self.ensure_csv_exists()
    
    def ensure_csv_exists(self):
        """Create CSV file with headers if it doesn't exist"""
        if not os.path.exists(self.csv_file_path):
            headers = [
                'patient_id',
                'first_name',
                'last_name',
                'date_of_birth',
                'age',
                'gender',
                'email',
                'phone',
                'address',
                'emergency_contact_name',
                'emergency_contact_phone',
                'medical_history',
                'current_medications',
                'allergies',
                'previous_kidney_stones',
                'registration_date',
                'last_scan_date',
                'total_scans'
            ]
            
            with open(self.csv_file_path, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow(headers)
    
    def generate_patient_id(self):
        """Generate unique patient ID"""
        return f"PT-{str(uuid.uuid4())[:8].upper()}"
    
    def add_patient(self, patient_data):
        """Add new patient to CSV"""
        try:
            # Generate patient ID if not provided
            if 'patient_id' not in patient_data or not patient_data['patient_id']:
                patient_data['patient_id'] = self.generate_patient_id()
            
            # Add registration date
            patient_data['registration_date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            patient_data['total_scans'] = 0
            
            # Calculate age from date of birth if provided
            if 'date_of_birth' in patient_data and patient_data['date_of_birth']:
                try:
                    dob = datetime.strptime(patient_data['date_of_birth'], '%Y-%m-%d')
                    age = datetime.now().year - dob.year
                    if datetime.now() < dob.replace(year=datetime.now().year):
                        age -= 1
                    patient_data['age'] = age
                except:
                    pass
            
            # Ensure all required fields exist
            required_fields = [
                'patient_id', 'first_name', 'last_name', 'date_of_birth', 'age', 
                'gender', 'email', 'phone', 'address', 'emergency_contact_name',
                'emergency_contact_phone', 'medical_history', 'current_medications',
                'allergies', 'previous_kidney_stones', 'registration_date', 
                'last_scan_date', 'total_scans'
            ]
            
            for field in required_fields:
                if field not in patient_data:
                    patient_data[field] = ''
            
            # Write to CSV
            with open(self.csv_file_path, 'a', newline='', encoding='utf-8') as file:
                writer = csv.DictWriter(file, fieldnames=required_fields)
                writer.writerow(patient_data)
            
            return patient_data['patient_id']
            
        except Exception as e:
            print(f"Error adding patient: {str(e)}")
            return None
    
    def get_patient_by_id(self, patient_id):
        """Retrieve patient data by ID"""
        try:
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['patient_id'] == patient_id:
                        return row
            return None
        except Exception as e:
            print(f"Error retrieving patient: {str(e)}")
            return None
    
    def get_patient_by_email(self, email):
        """Retrieve patient data by email"""
        try:
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['email'].lower() == email.lower():
                        return row
            return None
        except Exception as e:
            print(f"Error retrieving patient by email: {str(e)}")
            return None
    
    def update_patient_scan_info(self, patient_id):
        """Update patient's last scan date and increment scan count"""
        try:
            # Read all data
            patients = []
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                patients = list(reader)
            
            # Update the specific patient
            for patient in patients:
                if patient['patient_id'] == patient_id:
                    patient['last_scan_date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    patient['total_scans'] = str(int(patient.get('total_scans', 0)) + 1)
                    break
            
            # Write back to CSV
            if patients:
                with open(self.csv_file_path, 'w', newline='', encoding='utf-8') as file:
                    fieldnames = patients[0].keys()
                    writer = csv.DictWriter(file, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(patients)
                
                return True
            
        except Exception as e:
            print(f"Error updating patient scan info: {str(e)}")
            return False
    
    def search_patients(self, search_term):
        """Search patients by name, email, or patient ID"""
        try:
            results = []
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if (search_term.lower() in row['first_name'].lower() or
                        search_term.lower() in row['last_name'].lower() or
                        search_term.lower() in row['email'].lower() or
                        search_term.lower() in row['patient_id'].lower()):
                        results.append(row)
            return results
        except Exception as e:
            print(f"Error searching patients: {str(e)}")
            return []
    
    def get_all_patients(self):
        """Get all patients (for admin purposes)"""
        try:
            patients = []
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                patients = list(reader)
            return patients
        except Exception as e:
            print(f"Error retrieving all patients: {str(e)}")
            return []
    
    def validate_patient_data(self, data):
        """Validate patient data before saving"""
        errors = []
        
        # Required fields
        required_fields = ['first_name', 'last_name', 'email']
        for field in required_fields:
            if not data.get(field, '').strip():
                errors.append(f"{field.replace('_', ' ').title()} is required")
        
        # Email validation (basic)
        email = data.get('email', '')
        if email and '@' not in email:
            errors.append("Please enter a valid email address")
        
        # Phone validation (basic)
        phone = data.get('phone', '')
        if phone and len(phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '')) < 10:
            errors.append("Please enter a valid phone number")
        
        return errors