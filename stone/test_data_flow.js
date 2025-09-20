// Test to verify data flow from Flask API to Results page
console.log("=== Testing Data Flow ===");

// Simulate what the Flask API returns
const mockFlaskResponse = {
  "analysis_timestamp": "2025-09-21T03:02:52.298830",
  "detections": [
    {
      "bbox": [1.49, 48.74, 223.98, 221.90],
      "confidence": 0.7692809104919434,
      "diameter_mm": 111.25,
      "diameter_px": 222.49,
      "id": 1,
      "position": "middle-center",
      "type": "person"
    }
  ],
  "metadata": {
    "api_version": "2.0",
    "filename": "test.jpeg",
    "filesize": 6198,
    "filetype": "image/jpeg",
    "image_dimensions": "226x223",
    "processed_at": "2025-09-21T03:02:52.298931"
  },
  "recommendations": [
    "Drink plenty of water (2-3 liters daily)",
    "Consider consultation with urologist",
    "Urgent medical attention recommended",
    "Monitor symptoms and pain levels"
  ],
  "summary": {
    "average_confidence": 0.769,
    "largest_stone_mm": 111.25,
    "risk_level": "severe",
    "severity": {
      "color": "red",
      "description": "Severe stone burden - immediate medical attention recommended",
      "level": "Severe"
    },
    "total_stones": 1
  }
};

// Simulate what Next.js API adds
const enhancedResult = {
  ...mockFlaskResponse,
  metadata: {
    ...mockFlaskResponse.metadata,
    filename: "test.jpeg",
    filesize: 6198,
    filetype: "image/jpeg",
    processed_at: new Date().toISOString(),
    api_version: "1.0"  // Note: This overwrites Flask's "2.0"
  }
};

console.log("1. Flask API Response:");
console.log(JSON.stringify(mockFlaskResponse, null, 2));

console.log("\n2. Enhanced Result (after Next.js processing):");
console.log(JSON.stringify(enhancedResult, null, 2));

console.log("\n3. Data Structure Validation:");
console.log("✓ Has detections:", !!enhancedResult.detections);
console.log("✓ Detections count:", enhancedResult.detections?.length);
console.log("✓ Has summary:", !!enhancedResult.summary);
console.log("✓ Total stones:", enhancedResult.summary?.total_stones);
console.log("✓ Has severity:", !!enhancedResult.summary?.severity);
console.log("✓ Severity level:", enhancedResult.summary?.severity?.level);
console.log("✓ Has recommendations:", !!enhancedResult.recommendations);
console.log("✓ Recommendations count:", enhancedResult.recommendations?.length);
console.log("✓ Has metadata:", !!enhancedResult.metadata);

console.log("\n4. Expected Results Page Display:");
console.log("- Stone count:", enhancedResult.summary?.total_stones || 0);
console.log("- Largest stone:", enhancedResult.summary?.largest_stone_mm?.toFixed(1) + "mm");
console.log("- Confidence:", (enhancedResult.summary?.average_confidence * 100)?.toFixed(1) + "%");
console.log("- Severity:", enhancedResult.summary?.severity?.level);
console.log("- Risk level:", enhancedResult.summary?.risk_level);

// Test sessionStorage simulation
const testSessionStorage = JSON.stringify(enhancedResult);
const parsedFromStorage = JSON.parse(testSessionStorage);

console.log("\n5. SessionStorage Round-trip Test:");
console.log("✓ Data survives JSON round-trip:", JSON.stringify(parsedFromStorage) === JSON.stringify(enhancedResult));

console.log("\n=== Test Complete ===");