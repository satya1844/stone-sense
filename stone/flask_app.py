import os
import base64
import io
from flask import Flask, request, render_template, send_file, jsonify, session
from flask_cors import CORS
from PIL import Image as PILImage
from PIL import ImageDraw, ImageFont
from ultralytics import YOLO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.utils import ImageReader
from datetime import datetime
from chatbot_service import get_health_advice, get_stone_specific_info

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = 'your_secret_key_here'  # Required for session
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['REPORTS_FOLDER'] = 'reports'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['REPORTS_FOLDER'], exist_ok=True)

def calculate_pixel_to_mm_scale(image_width, image_height):
    """
    Calculate a more accurate pixel-to-mm scale factor for medical imaging.
    
    For kidney stone imaging, typical scale factors are:
    - CT scans: 0.1-0.3 mm/pixel (depending on slice thickness and FOV)
    - Ultrasound: 0.05-0.2 mm/pixel (depending on depth and transducer)
    - X-ray: 0.1-0.4 mm/pixel (depending on technique and magnification)
    
    This function provides a more reasonable estimate based on image dimensions.
    """
    # Assume typical kidney imaging field of view
    # Standard abdominal CT FOV is about 35-50cm
    # Standard kidney dimensions: 10-12cm length, 5-7cm width
    
    # If image is very large (>1000px), likely high-resolution scan
    if max(image_width, image_height) > 1000:
        return 0.15  # Fine resolution CT or high-res ultrasound
    # If image is medium (500-1000px), standard resolution
    elif max(image_width, image_height) > 500:
        return 0.25  # Standard CT or ultrasound
    # If image is small (<500px), lower resolution or cropped
    else:
        return 0.35  # Lower resolution or zoomed view
        
def draw_annotations_on_image(image_path, detections, output_path):
    """
    Draw yellow bounding boxes on the image for detected stones.
    
    Args:
        image_path: Path to the original image
        detections: List of detection dictionaries with bbox coordinates
        output_path: Path to save the annotated image
    
    Returns:
        Path to the annotated image
    """
    # Open the image
    img = PILImage.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    
    # Try to load a font, fallback to default if not available
    try:
        # Try to use a larger font
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 16)
        except:
            font = ImageFont.load_default()
    
    # Define colors
    box_color = "yellow"
    text_color = "black"
    text_bg_color = "yellow"
    
    # Draw each detection
    for i, detection in enumerate(detections):
        bbox = detection["bbox"]
        stone_id = detection["id"]
        diameter_mm = detection["diameter_mm"]
        
        # Extract coordinates
        x1, y1, x2, y2 = bbox
        
        # Draw bounding box
        draw.rectangle([x1, y1, x2, y2], outline=box_color, width=3)
        
        # Prepare label text - only show diameter
        label = f"{diameter_mm:.1f}mm"
        
        # Get text size for background rectangle
        try:
            bbox_text = draw.textbbox((0, 0), label, font=font)
            text_width = bbox_text[2] - bbox_text[0]
            text_height = bbox_text[3] - bbox_text[1]
        except:
            # Fallback for older PIL versions
            text_width, text_height = draw.textsize(label, font=font)
        
        # Position label above the bounding box
        label_x = x1
        label_y = max(0, y1 - text_height - 5)
        
        # Draw background rectangle for text
        draw.rectangle(
            [label_x, label_y, label_x + text_width + 4, label_y + text_height + 4],
            fill=text_bg_color,
            outline=box_color
        )
        
        # Draw text
        draw.text((label_x + 2, label_y + 2), label, fill=text_color, font=font)
    
    # Save the annotated image
    img.save(output_path, "JPEG", quality=95)
    return output_path

def image_to_base64(image_path):
    """Convert image to base64 string for JSON response"""
    with open(image_path, "rb") as img_file:
        img_data = img_file.read()
        base64_string = base64.b64encode(img_data).decode('utf-8')
        return f"data:image/jpeg;base64,{base64_string}"

def generate_pdf_report(stones_data, annotated_image_path):
    report_filename = f"kidney_scan_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    report_path = os.path.join(app.config['REPORTS_FOLDER'], report_filename)
    
    doc = SimpleDocTemplate(
        report_path,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        spaceAfter=30
    )
    
    # Content elements
    elements = []
    
    # Title
    elements.append(Paragraph("Kidney Scan Report", title_style))
    elements.append(Spacer(1, 20))
    
    # Patient Info Table
    patient_data = [
        ['Patient Name: _______', 'Uploaded By: _______'],
        ['Age/Sex: _______', 'Status: Reviewed'],
        [f'Scan Date: {datetime.now().strftime("%d %b %Y")}', '✓ Reviewed']
    ]
    
    patient_table = Table(patient_data, colWidths=[4*inch, 4*inch])
    patient_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
    ]))
    elements.append(patient_table)
    elements.append(Spacer(1, 30))

    # Add the annotated image
    if os.path.exists(annotated_image_path):
        # Calculate image size to fit within margins while maintaining aspect ratio
        img = Image(annotated_image_path)
        aspect = img.imageWidth / float(img.imageHeight)
        # Set max width to 6 inches (432 points) and calculate height
        desired_width = 6 * inch
        desired_height = desired_width / aspect
        
        # If height is too large, scale based on height instead
        max_height = 4 * inch
        if desired_height > max_height:
            desired_height = max_height
            desired_width = desired_height * aspect
        
        img.drawWidth = desired_width
        img.drawHeight = desired_height
        elements.append(img)
        elements.append(Spacer(1, 20))
    
    # Stone Summary and Severity
    total_stone_burden = sum(float(stone.get('diameter_mm', '0').split()[0]) for stone in stones_data)
    severity = calculate_severity(len(stones_data), total_stone_burden)
    
    # Create custom styles for severity section
    summary_style = ParagraphStyle(
        'SummaryStyle',
        parent=styles['Normal'],
        fontSize=12,
        spaceBefore=10,
        spaceAfter=10,
        alignment=1  # Center alignment
    )
    
    severity_title_style = ParagraphStyle(
        'SeverityTitleStyle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=getattr(colors, severity['color']),
        alignment=1,  # Center alignment
        spaceBefore=5,
        spaceAfter=5,
        fontName='Helvetica-Bold'
    )
    
    severity_desc_style = ParagraphStyle(
        'SeverityDescStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.darkgrey,
        alignment=1,  # Center alignment
        spaceBefore=5,
        spaceAfter=5
    )
    
    # Create a table for the summary box
    summary_data = [
        [Paragraph(f"<strong>{len(stones_data)} stones detected</strong>", summary_style)],
        [Paragraph(f"Total Stone Burden: {total_stone_burden:.1f} mm", summary_style)]
    ]
    
    summary_table = Table(summary_data, colWidths=[5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ('BOX', (0, 0), (-1, -1), 2, colors.grey),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    
    # Create a table for the severity box
    severity_data = [
        [Paragraph(f"<strong>Severity Level: {severity['level']}</strong>", severity_title_style)],
        [Paragraph(severity['description'], severity_desc_style)]
    ]
    
    severity_table = Table(severity_data, colWidths=[5*inch])
    severity_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, getattr(colors, severity['color'])),
        ('BOX', (0, 0), (-1, -1), 2, getattr(colors, severity['color'])),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    
    # Add elements to the PDF
    elements.append(summary_table)
    elements.append(Spacer(1, 10))
    elements.append(severity_table)
    elements.append(Spacer(1, 20))
    
    # Stones Detail Table
    stones_table_data = [
        ['Stone #', 'Location', 'Size (mm)', 'Side', 'Type', 'Confidence']
    ]
    
    for stone in stones_data:
        stones_table_data.append([
            f"Stone {stone['id']}", 
            stone['position'],
            stone['diameter_mm'].split()[0],
            'Left' if 'left' in stone['position'].lower() else 'Right',
            stone['type'],
            stone['confidence']
        ])
    
    stones_table = Table(stones_table_data, colWidths=[1*inch, 1.5*inch, 1*inch, 1*inch, 1*inch, 1*inch])
    stones_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 11),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    elements.append(stones_table)
    elements.append(Spacer(1, 20))
    
    # Build the PDF
    doc.build(elements)
    return report_filename

# Load YOLO model
model_weights_path = 'C:\\Users\\dell\\Desktop\\stones\\stone\\runs\\detect\\train2\\weights\\best.pt'  # Use the local model file
stone_detection_model = YOLO(model_weights_path)

# Severity classification function
def calculate_severity(stone_count, total_burden_mm):
    """
    Calculate severity based on historical thresholds:
    Normal: ≤ 2 stones AND total burden < 5mm
    Moderate: 2-4 stones OR total burden 5-10mm
    Severe: > 4 stones OR total burden > 10mm
    """
    if stone_count <= 2 and total_burden_mm < 5:
        return {
            'level': 'Normal',
            'color': 'green',
            'description': 'Normal stone burden'
        }
    elif (stone_count <= 4 and total_burden_mm <= 10) or (stone_count <= 2 and total_burden_mm < 10):
        return {
            'level': 'Moderate',
            'color': 'yellow',
            'description': 'Moderate stone burden - regular monitoring recommended'
        }
    else:
        return {
            'level': 'Severe',
            'color': 'red',
            'description': 'Severe stone burden - immediate medical attention recommended'
        }

# Stone position function
def get_stone_position(x_center, y_center, img_width, img_height):
    x_third = img_width / 3
    y_third = img_height / 3
    if x_center < x_third: h_pos = "left"
    elif x_center < 2*x_third: h_pos = "center"
    else: h_pos = "right"
    if y_center < y_third: v_pos = "top"
    elif y_center < 2*y_third: v_pos = "middle"
    else: v_pos = "bottom"
    return f"{v_pos}-{h_pos}"

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Check if file uploaded
        if 'image' not in request.files:
            return "No file part"
        file = request.files['image']
        if file.filename == '':
            return "No selected file"
        
        # Save uploaded image
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(img_path)
        
        # Load image
        img_arr = PILImage.open(img_path).convert("RGB")
        h, w = img_arr.height, img_arr.width

        # Calculate appropriate scale factor based on image dimensions
        pixel_to_mm = calculate_pixel_to_mm_scale(w, h)

        # Predict stones
        results = stone_detection_model.predict(source=img_arr, save=False)
        boxes = results[0].boxes

        # Prepare drawing
        draw = ImageDraw.Draw(img_arr)
        font = ImageFont.load_default()
        stones_data = []
        no_stones_message = None

        if boxes is None or boxes.xyxy.shape[0] == 0:
            no_stones_message = "⚠ No stones detected. The input image may not be a kidney scan."
        else:
            stone_count = boxes.xyxy.shape[0]
            
            for i, box in enumerate(boxes, 1):
                x1, y1, x2, y2 = box.xyxy[0]
                width  = (x2 - x1).item()
                height = (y2 - y1).item()
                diameter = max(width, height)
                diameter_mm = diameter * pixel_to_mm  # Use calculated scale factor
                x_center = (x1 + x2) / 2
                y_center = (y1 + y2) / 2
                position = get_stone_position(x_center, y_center, w, h)
                
                # Get confidence score
                conf = box.conf[0].item()
                
                # Get class probabilities if available
                if hasattr(box, 'cls'):
                    cls_id = int(box.cls[0].item())
                    cls_name = results[0].names[cls_id]
                else:
                    cls_name = "stone"

                stone_info = {
                    "id": i,
                    "bounding_box": f"[{x1:.2f}, {y1:.2f}, {x2:.2f}, {y2:.2f}]",
                    "width_px": f"{width:.2f}px",
                    "height_px": f"{height:.2f}px",
                    "diameter_mm": f"{diameter_mm:.2f} mm",
                    "position": position,
                    "confidence": f"{conf:.1%}",
                    "type": cls_name
                }
                stones_data.append(stone_info)

                # Draw bounding box and diameter with yellow color
                draw.rectangle([x1, y1, x2, y2], outline="yellow", width=2)
                # Draw text with yellow color and black outline for better visibility
                text_position = (x1, y1 - 15)
                diameter_text = f"{diameter_mm:.1f}mm"
                # Draw text outline (black)
                for offset in [(1,1), (-1,-1), (1,-1), (-1,1)]:
                    draw.text((text_position[0]+offset[0], text_position[1]+offset[1]), 
                            diameter_text, fill="black", font=font)
                # Draw main text (yellow)
                draw.text(text_position, diameter_text, fill="yellow", font=font)

        # Save annotated image
        annotated_path = os.path.join(app.config['UPLOAD_FOLDER'], f"annotated_{file.filename}")
        img_arr.save(annotated_path)

        # Calculate severity if stones are detected
        severity = None
        
        if not no_stones_message and stones_data:
            total_burden = sum(float(stone['diameter_mm'].split()[0]) for stone in stones_data)
            severity = calculate_severity(len(stones_data), total_burden)
        elif not stones_data:
            severity = {
                'level': 'Normal',
                'color': 'green',
                'description': 'No stones detected'
            }

        return render_template('index.html', 
                            annotated_image=annotated_path, 
                            stones_data=stones_data, 
                            stone_count=len(stones_data),
                            no_stones_message=no_stones_message,
                            report_filename=None,  # No automatic report generation
                            severity=severity)

    return render_template('index.html', 
                         annotated_image=None, 
                         stones_data=None, 
                         stone_count=0, 
                         no_stones_message=None,
                         report_filename=None)

@app.route('/reports/<filename>')
def download_report(filename):
    return send_file(
        os.path.join(app.config['REPORTS_FOLDER'], filename),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))

@app.route('/predict', methods=['POST'])
def predict():
    """API endpoint for stone detection - compatible with Next.js frontend"""
    try:
        # Check if file uploaded
        if 'image' not in request.files:
            return jsonify({"error": "Missing file 'image'"}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
        if file.content_type not in allowed_types:
            return jsonify({"error": "Invalid file type. Please upload JPEG or PNG images only."}), 400

        # Validate file size (10MB limit)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        max_size = 10 * 1024 * 1024  # 10MB
        if file_size > max_size:
            return jsonify({"error": "File too large. Maximum size is 10MB."}), 400

        # Save uploaded image
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(img_path)
        
        # Load image
        img_arr = PILImage.open(img_path).convert("RGB")
        h, w = img_arr.height, img_arr.width

        # Calculate appropriate scale factor based on image dimensions
        pixel_to_mm = calculate_pixel_to_mm_scale(w, h)
        print(f"Using pixel-to-mm scale factor: {pixel_to_mm} for image {w}x{h}")

        # Predict stones
        results = stone_detection_model.predict(source=img_arr, save=False)
        boxes = results[0].boxes

        stones_data = []
        
        if boxes is None or boxes.xyxy.shape[0] == 0:
            # No stones detected
            return jsonify({
                "detections": [],
                "summary": {
                    "total_stones": 0,
                    "largest_stone_mm": 0,
                    "average_confidence": 0,
                    "risk_level": "normal"
                },
                "recommendations": [
                    "No stones detected",
                    "Continue regular health monitoring",
                    "Maintain adequate hydration"
                ],
                "analysis_timestamp": datetime.now().isoformat(),
                "metadata": {
                    "filename": file.filename,
                    "filesize": file_size,
                    "filetype": file.content_type,
                    "processed_at": datetime.now().isoformat(),
                    "api_version": "2.0",
                    "image_dimensions": f"{w}x{h}"
                }
            })
        else:
            stone_count = boxes.xyxy.shape[0]
            
            for i, box in enumerate(boxes, 1):
                x1, y1, x2, y2 = box.xyxy[0]
                width = (x2 - x1).item()
                height = (y2 - y1).item()
                diameter = max(width, height)
                diameter_mm = diameter * pixel_to_mm  # Use calculated scale factor
                x_center = (x1 + x2) / 2
                y_center = (y1 + y2) / 2
                position = get_stone_position(x_center, y_center, w, h)
                
                # Get confidence score
                conf = box.conf[0].item()
                
                # Get class probabilities if available
                if hasattr(box, 'cls'):
                    cls_id = int(box.cls[0].item())
                    cls_name = results[0].names[cls_id]
                else:
                    cls_name = "kidney_stone"

                stone_info = {
                    "id": i,
                    "bbox": [float(x1), float(y1), float(x2), float(y2)],
                    "confidence": conf,
                    "diameter_px": float(diameter),
                    "diameter_mm": round(diameter_mm, 2),
                    "type": cls_name,
                    "position": position
                }
                stones_data.append(stone_info)

            # Store stones data in session for chatbot use
            session['stones_data'] = [{
                "id": stone["id"],
                "diameter_mm": f"{stone['diameter_mm']:.2f} mm",
                "position": stone["position"],
                "confidence": f"{stone['confidence']:.1%}",
                "type": stone["type"]
            } for stone in stones_data]

            # Calculate summary
            total_stones = len(stones_data)
            largest_stone = max([d["diameter_mm"] for d in stones_data], default=0)
            avg_confidence = sum([d["confidence"] for d in stones_data]) / max(total_stones, 1)
            total_burden = sum([d["diameter_mm"] for d in stones_data])
            
            # Get severity
            severity_info = calculate_severity(total_stones, total_burden)
            
            # Generate recommendations
            recommendations = []
            recommendations.append("Drink plenty of water (2-3 liters daily)")
            if largest_stone > 5:
                recommendations.append("Consider consultation with urologist")
            if largest_stone > 10:
                recommendations.append("Urgent medical attention recommended")
            recommendations.append("Monitor symptoms and pain levels")
            
            # Generate annotated image
            annotated_img_path = os.path.join(app.config['UPLOAD_FOLDER'], f"annotated_{file.filename}")
            draw_annotations_on_image(img_path, stones_data, annotated_img_path)
            
            # Convert annotated image to base64 for JSON response
            annotated_image_base64 = image_to_base64(annotated_img_path)
            
            return jsonify({
                "detections": stones_data,
                "summary": {
                    "total_stones": total_stones,
                    "largest_stone_mm": largest_stone,
                    "average_confidence": round(avg_confidence, 3),
                    "risk_level": severity_info['level'].lower(),
                    "severity": severity_info
                },
                "recommendations": recommendations,
                "annotated_image": annotated_image_base64,
                "analysis_timestamp": datetime.now().isoformat(),
                "metadata": {
                    "filename": file.filename,
                    "filesize": file_size,
                    "filetype": file.content_type,
                    "processed_at": datetime.now().isoformat(),
                    "api_version": "2.0",
                    "image_dimensions": f"{w}x{h}",
                    "scale_factor_mm_per_pixel": pixel_to_mm
                }
            })
            
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/generate-report', methods=['POST'])
def generate_report():
    """Generate PDF report on-demand from detection results"""
    try:
        # Get detection results from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        detections = data.get('detections', [])
        summary = data.get('summary', {})
        metadata = data.get('metadata', {})
        annotated_image_base64 = data.get('annotated_image', '')
        
        if not detections and summary.get('total_stones', 0) == 0:
            return jsonify({"error": "No detection data provided"}), 400
        
        # Create a temporary annotated image file if base64 is provided
        annotated_image_path = None
        if annotated_image_base64 and annotated_image_base64.startswith('data:image'):
            # Extract base64 data
            base64_data = annotated_image_base64.split(',')[1]
            image_data = base64.b64decode(base64_data)
            
            # Save temporary image
            temp_filename = f"temp_annotated_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            annotated_image_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
            
            with open(annotated_image_path, 'wb') as f:
                f.write(image_data)
        
        # Transform detections data to match the existing format
        stones_data = []
        for detection in detections:
            stone_info = {
                "id": detection.get('id', len(stones_data) + 1),
                "bounding_box": f"[{', '.join(map(str, detection.get('bbox', [0, 0, 0, 0])))}]",
                "width_px": f"{detection.get('diameter_px', 0):.2f}px",
                "height_px": f"{detection.get('diameter_px', 0):.2f}px",
                "diameter_mm": f"{detection.get('diameter_mm', 0):.2f} mm",
                "position": detection.get('position', 'unknown'),
                "confidence": f"{detection.get('confidence', 0):.1%}",
                "type": detection.get('type', 'kidney_stone')
            }
            stones_data.append(stone_info)
        
        # Generate PDF report
        report_filename = generate_pdf_report(stones_data, annotated_image_path)
        report_path = os.path.join(app.config['REPORTS_FOLDER'], report_filename)
        
        # Clean up temporary image if created
        if annotated_image_path and os.path.exists(annotated_image_path):
            try:
                os.remove(annotated_image_path)
            except:
                pass  # Ignore cleanup errors
        
        # Return the report file
        return send_file(
            report_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"kidney_scan_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )
        
    except Exception as e:
        return jsonify({"error": f"Failed to generate report: {str(e)}"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Chat endpoint for health advice based on stone detection results"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        user_query = data.get('question', '').strip()
        stones_data = data.get('stones_data', [])
        
        if not user_query:
            return jsonify({'error': 'No question provided'}), 400
        
        if not stones_data:
            return jsonify({
                'response': 'Please upload a kidney scan image first to get personalized advice based on your stone analysis.'
            })
        
        # Get health advice using the chatbot service
        response = get_health_advice(stones_data, user_query)
        
        return jsonify({'response': response})
        
    except Exception as e:
        return jsonify({
            'error': f'I apologize, but I\'m unable to process your question at the moment. Error: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": True,
        "version": "1.0"
    })

if __name__ == '__main__':
    app.run(debug=True)