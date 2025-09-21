import csv
import os
from datetime import datetime

class SimpleUserDataManager:
    def __init__(self, csv_file_path='user_data.csv', doctor_csv_path='doctor_contacts.csv'):
        self.csv_file_path = csv_file_path
        self.doctor_csv_path = doctor_csv_path
        self.ensure_csv_exists()
        self.ensure_doctor_csv_exists()
    
    def ensure_csv_exists(self):
        """Create CSV file with headers if it doesn't exist"""
        if not os.path.exists(self.csv_file_path):
            with open(self.csv_file_path, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow([
                    'user_id', 'first_name', 'last_name', 'email', 'phone', 
                    'date_of_birth', 'registration_date'
                ])
    
    def ensure_doctor_csv_exists(self):
        """Create doctor contacts CSV file with headers if it doesn't exist"""
        if not os.path.exists(self.doctor_csv_path):
            with open(self.doctor_csv_path, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow([
                    'user_id', 'doctor_phone', 'doctor_email', 'updated_date'
                ])
    
    def save_user_data(self, user_data):
        """Save user data to CSV file"""
        try:
            with open(self.csv_file_path, 'a', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow([
                    user_data.get('user_id', ''),
                    user_data.get('first_name', ''),
                    user_data.get('last_name', ''),
                    user_data.get('email', ''),
                    user_data.get('phone', ''),
                    user_data.get('date_of_birth', ''),
                    user_data.get('registration_date', datetime.now().strftime('%Y-%m-%d'))
                ])
            return True
        except Exception as e:
            print(f"Error saving user data: {e}")
            return False
    
    def save_doctor_contact(self, doctor_data):
        """Save or update doctor contact information"""
        try:
            # First, check if user already has doctor contact saved
            existing_contacts = []
            user_id = doctor_data.get('user_id', '')
            found_existing = False
            
            # Read existing contacts
            if os.path.exists(self.doctor_csv_path):
                with open(self.doctor_csv_path, 'r', encoding='utf-8') as file:
                    reader = csv.DictReader(file)
                    for row in reader:
                        if row['user_id'] == user_id:
                            # Update existing entry
                            row['doctor_phone'] = doctor_data.get('doctor_phone', '')
                            row['doctor_email'] = doctor_data.get('doctor_email', '')
                            row['updated_date'] = doctor_data.get('updated_date', datetime.now().strftime('%Y-%m-%d'))
                            found_existing = True
                        existing_contacts.append(row)
            
            # Write back all contacts
            with open(self.doctor_csv_path, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow(['user_id', 'doctor_phone', 'doctor_email', 'updated_date'])
                
                for contact in existing_contacts:
                    writer.writerow([
                        contact['user_id'],
                        contact['doctor_phone'],
                        contact['doctor_email'],
                        contact['updated_date']
                    ])
                
                # If no existing contact found, add new one
                if not found_existing:
                    writer.writerow([
                        doctor_data.get('user_id', ''),
                        doctor_data.get('doctor_phone', ''),
                        doctor_data.get('doctor_email', ''),
                        doctor_data.get('updated_date', datetime.now().strftime('%Y-%m-%d'))
                    ])
            
            return True
        except Exception as e:
            print(f"Error saving doctor contact: {e}")
            return False
    
    def get_user_by_email(self, email):
        """Get user data by email"""
        try:
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['email'] == email:
                        return row
            return None
        except Exception as e:
            print(f"Error reading user data: {e}")
            return None
    
    def get_user_by_id(self, user_id):
        """Get user data by user ID"""
        try:
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['user_id'] == user_id:
                        return row
            return None
        except Exception as e:
            print(f"Error reading user data: {e}")
            return None
    
    def get_doctor_contact(self, user_id):
        """Get doctor contact by user ID"""
        try:
            if not os.path.exists(self.doctor_csv_path):
                return None
                
            with open(self.doctor_csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['user_id'] == user_id:
                        return row
            return None
        except Exception as e:
            print(f"Error reading doctor contact: {e}")
            return None