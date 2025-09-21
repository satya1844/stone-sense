import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv('OPENROUTER_API_KEY'),
    default_headers={
        "HTTP-Referer": "https://stonesense.ai",
        "X-Title": "StoneSense AI Health Advisor"
    }
)

def create_context(stone_data):
    """Create detailed context about the detected stones"""
    stone_count = len(stone_data)
    total_burden = sum(float(stone['diameter_mm'].split()[0]) for stone in stone_data)
    
    # Create detailed stone information
    stone_details = []
    for stone in stone_data:
        stone_info = {
            'id': stone['id'],
            'size': float(stone['diameter_mm'].split()[0]),
            'position': stone['position'],
            'confidence': stone['confidence'],
            'type': stone.get('type', 'unspecified')
        }
        stone_details.append(stone_info)
    
    # Analyze stone distribution
    left_stones = sum(1 for s in stone_details if 'left' in s['position'].lower())
    right_stones = sum(1 for s in stone_details if 'right' in s['position'].lower())
    
    # Calculate size distribution
    sizes = [s['size'] for s in stone_details]
    avg_size = sum(sizes) / len(sizes) if sizes else 0
    max_size = max(sizes) if sizes else 0
    
    return {
        "stone_count": stone_count,
        "total_burden": total_burden,
        "stones": stone_details,
        "distribution": {
            "left_kidney": left_stones,
            "right_kidney": right_stones
        },
        "size_analysis": {
            "average_size": avg_size,
            "largest_stone": max_size
        }
    }

def get_health_advice(stone_data, user_query):
    """Get personalized health advice based on user's question"""
    try:
        context = create_context(stone_data)
        
        system_prompt = """You are an AI health advisor for kidney stones.

Guidelines for responses:
• Keep answers concise and clear
• Use bullet points for recommendations  
• Focus on practical advice
• Be reassuring but factual
• Base advice on the stone data provided
• Structure responses with clear headings when appropriate
• Use simple, patient-friendly language

Format your responses with:
- Clear headings followed by colons (e.g., "Dietary Recommendations:")
- Bullet points using "•" for lists and recommendations
- Short paragraphs for easy reading
- Specific advice based on the scan data provided
- Use measurements like "2-3 liters", "5mm", "2 times per day" 
- Emphasize important terms like "urgent", "consult doctor", "avoid", "increase"

Example response format:
Treatment Recommendations:
• Drink 2-3 liters of water daily
• Limit sodium to less than 2300mg per day
• Consider consulting a urologist if stones are larger than 4mm

When to Seek Medical Attention:
• Severe pain or cramping
• Blood in urine
• Fever or chills
"""
        
        context_message = f"""Scan Data:
        • Stones: {context['stone_count']} total
        • Size: {context['size_analysis']['largest_stone']:.1f}mm largest, {context['size_analysis']['average_size']:.1f}mm average
        • Left kidney: {context['distribution']['left_kidney']} stones
        • Right kidney: {context['distribution']['right_kidney']} stones
        • Locations: {', '.join(f"Stone {s['id']} ({s['size']:.1f}mm) in {s['position']}" for s in context['stones'])}

        Q: {user_query}"""
        
        chat_completion = client.chat.completions.create(
            model="x-ai/grok-4-fast:free",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": context_message
                }
            ],
            temperature=0.7,
            max_tokens=1000,
            top_p=1,
            frequency_penalty=0.5,
            presence_penalty=0.3,
            stop=None,
            response_format={ "type": "text" },
            seed=42,  # For consistent responses
            extra_body={
                "safe_mode": False,  # Since we're providing medical advice
                "route": "fallback"  # Use fallback if primary route is unavailable
            }
        )
        
        return chat_completion.choices[0].message.content
    
    except Exception as e:
        return f"I apologize, but I'm unable to process your question at the moment. Error: {str(e)}"

def get_stone_specific_info(stone):
    """Get specific information about an individual stone"""
    try:
        prompt = f"""As a kidney health advisor, provide brief, specific insights about this kidney stone:
        - Size: {stone['diameter_mm']}
        - Location: {stone['position']}
        - Detection confidence: {stone['confidence']}
        
        Focus on what these measurements mean in practical terms and any relevant considerations for this specific stone location."""
        
        chat_completion = client.chat.completions.create(
            model="x-ai/grok-4-fast:free",
            messages=[
                {
                    "role": "system",
                    "content": "You are a kidney health advisor. Provide concise, practical insights about specific kidney stones without causing alarm."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500,
            top_p=1,
            frequency_penalty=0.5,
            presence_penalty=0.3,
            stop=None,
            response_format={ "type": "text" },
            seed=42,  # For consistent responses
            extra_body={
                "safe_mode": False,  # Since we're providing medical advice
                "route": "fallback"  # Use fallback if primary route is unavailable
            }
        )
        
        return chat_completion.choices[0].message.content
    
    except Exception as e:
        return f"I apologize, but I'm unable to provide specific information about this stone at the moment. Error: {str(e)}"