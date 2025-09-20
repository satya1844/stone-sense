from __future__ import annotations

import io
import os
from typing import List, Dict, Any
import base64
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

MODEL_WEIGHTS = os.environ.get("MODEL_WEIGHTS", "yolo11n.pt")
PIXEL_TO_MM = float(os.environ.get("PIXEL_TO_MM", "0.5"))

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js integration

_model = None

def load_model():
    global _model
    if _model is not None:
        return _model
    try:
        from ultralytics import YOLO
        _model = YOLO(MODEL_WEIGHTS)
    except Exception as e:
        _model = None
        app.logger.warning("YOLO load failed, using mock detections: %s", e)
    return _model


def run_inference(img: Image.Image) -> Dict[str, Any]:
    model = load_model()
    if model is None:
        # Mock response for development without GPU/weights
        w, h = img.size
        return {
            "detections": [
                {
                    "id": 1,
                    "bbox": [w * 0.3, h * 0.3, w * 0.45, h * 0.45],
                    "confidence": 0.85,
                    "diameter_px": max(w * 0.15, h * 0.15),
                    "diameter_mm": round(max(w * 0.15, h * 0.15) * PIXEL_TO_MM, 2),
                    "type": "kidney_stone"
                },
                {
                    "id": 2,
                    "bbox": [w * 0.55, h * 0.2, w * 0.65, h * 0.3],
                    "confidence": 0.72,
                    "diameter_px": max(w * 0.1, h * 0.1),
                    "diameter_mm": round(max(w * 0.1, h * 0.1) * PIXEL_TO_MM, 2),
                    "type": "kidney_stone"
                }
            ],
            "summary": {
                "total_stones": 2,
                "largest_stone_mm": round(max(w * 0.15, h * 0.15) * PIXEL_TO_MM, 2),
                "average_confidence": 0.785,
                "risk_level": "moderate"
            },
            "recommendations": [
                "Drink plenty of water (2-3 liters daily)",
                "Consider consultation with urologist",
                "Monitor symptoms and pain levels"
            ],
            "analysis_timestamp": datetime.now().isoformat(),
            "previewUrl": None,
            "mock": True,
        }

    results = model.predict(source=img, save=False)
    out: List[Dict[str, Any]] = []
    r0 = results[0]
    for i, box in enumerate(r0.boxes):
        x1, y1, x2, y2 = box.xyxy[0]
        width = (x2 - x1).item()
        height = (y2 - y1).item()
        diameter = max(width, height)
        conf = float(box.conf[0]) if hasattr(box, 'conf') else None
        out.append({
            "id": i + 1,
            "bbox": [float(x1), float(y1), float(x2), float(y2)],
            "confidence": conf,
            "diameter_px": float(diameter),
            "diameter_mm": round(float(diameter * PIXEL_TO_MM), 2),
            "type": "kidney_stone"
        })
    
    # Calculate summary
    total_stones = len(out)
    largest_stone = max([d["diameter_mm"] for d in out], default=0)
    avg_confidence = sum([d["confidence"] for d in out if d["confidence"]]) / max(total_stones, 1)
    
    # Determine risk level
    if largest_stone > 10:
        risk_level = "high"
    elif largest_stone > 5:
        risk_level = "moderate"
    else:
        risk_level = "low"
    
    # Generate recommendations
    recommendations = []
    if total_stones > 0:
        recommendations.append("Drink plenty of water (2-3 liters daily)")
        if largest_stone > 5:
            recommendations.append("Consider consultation with urologist")
        if largest_stone > 10:
            recommendations.append("Urgent medical attention recommended")
        recommendations.append("Monitor symptoms and pain levels")
    
    return {
        "detections": out,
        "summary": {
            "total_stones": total_stones,
            "largest_stone_mm": largest_stone,
            "average_confidence": round(avg_confidence, 3),
            "risk_level": risk_level
        },
        "recommendations": recommendations,
        "analysis_timestamp": datetime.now().isoformat(),
        "previewUrl": None
    }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": _model is not None,
        "version": "1.0"
    })

@app.route('/predict', methods=['POST'])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "Missing file 'image'"}), 400
    file = request.files["image"]
    try:
        img = Image.open(file.stream).convert("RGB")
    except Exception as e:
        return jsonify({"error": f"Invalid image: {e}"}), 400

    result = run_inference(img)
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=True)
