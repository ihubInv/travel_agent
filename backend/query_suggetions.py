import json
import os
import traceback
from datetime import datetime
import requests
import re
from logger import logger

# The system prompt for the suggestion generation
from messages import SUGGESTION_AGENT_instru

def format_chat_history(chat_history, max_entries=5):
    """Format the recent chat history for the prompt."""
    # Get last N entries from chat history
    recent_history = chat_history[-max_entries:] if len(chat_history) > max_entries else chat_history
    
    formatted_history = ""
    for entry in recent_history:
        role = entry.get("role", "Unknown")
        content = entry.get("content", "")
        formatted_history += f"{role}: {content}\n\n"
        
    return formatted_history

def extract_suggestions_from_text(text):
    """Extract suggestions from plain text response."""
    # Look for bullet points, numbered lists, or line breaks
    suggestions = []
    
    # Try to find JSON array in the text
    json_match = re.search(r'\[.*?\]', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except:
            pass
    
    # Try to extract bullet points or numbered items
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        # Match bullet points, numbers, or quotes
        if re.match(r'^[\*\-\•\d\.\"\']', line):
            # Clean up the line
            clean_line = re.sub(r'^[\*\-\•\d\.\"\']+\s*', '', line)
            if clean_line and len(clean_line) > 3:  # Avoid empty or very short suggestions
                suggestions.append(clean_line)
    
    # If no structured format found, split by lines and take non-empty ones
    if not suggestions:
        suggestions = [line.strip() for line in lines if line.strip() and len(line.strip()) > 3]
        
    return suggestions

def get_default_suggestions(context):
    """Provide default suggestions based on context keywords."""
    context_lower = context.lower()
    
    if "flight" in context_lower and "search" in context_lower:
        return [
            "Book this flight",
            "Show cheaper options",
            "Find hotels at destination",
            "Search for a different date",
            "Check baggage allowance"
        ]
    elif "hotel" in context_lower:
        return [
            "Book this hotel",
            "Show more hotels",
            "Check hotel amenities",
            "Find nearby attractions",
            "Search for restaurants nearby"
        ]
    elif "booking" in context_lower and "confirm" in context_lower:
        return [
            "Find activities at destination",
            "Book airport transfer",
            "Check weather forecast",
            "Show my itinerary",
            "Add to calendar"
        ]
    else:
        # Generic travel suggestions
        return [
            "Search for flights",
            "Find hotels",
            "Explore popular destinations",
            "Check travel requirements",
            "View my bookings"
        ]

async def get_next_query_suggestions(chat_history, current_response, model="llama3.1:8b"):
    """Generate suggestions for next user queries based on the current chat state."""
    try:
        # Extract context from current response - handle both list and string formats
        if isinstance(current_response, list):
            try:
                current_context = "\n".join([msg.get("content", "") for msg in current_response if isinstance(msg, dict)])
            except Exception:
                # If any issues, convert to string safely
                current_context = str(current_response)
        else:
            current_context = str(current_response)
        
        # Prepare user prompt with conversation history and current context
        user_prompt = f"""
Review this conversation history and current context to suggest next user actions:

CONVERSATION HISTORY:
{format_chat_history(chat_history)}

CURRENT CONTEXT:
{current_context}

Based on this context, generate 4-5 suggestions for what the user might want to do next.
"""
        
        # Call Ollama API directly
        suggestions = generate_suggestions_with_ollama(user_prompt, model)
        
        # Handle empty responses
        if not suggestions:
            logger.warning("No suggestions generated, using defaults")
            return get_default_suggestions(current_context)
        
        # Limit to 5 suggestions maximum
        return suggestions[:5]
        
    except Exception as e:
        logger.error(f"Error getting query suggestions: {str(e)}")
        logger.error(traceback.format_exc())
        # Return default suggestions as fallback
        return get_default_suggestions(current_context)

def generate_suggestions_with_ollama(prompt, model):
    """Generate suggestions using Ollama API."""
    try:
        # Use the generate endpoint instead of chat for more consistent responses
        url = "http://115.241.186.203/api/generate"
        payload = {
            "model": model,
            "system": SUGGESTION_AGENT_instru,
            "prompt": prompt,
            "temperature": 0.7,
            "stream": False
        }
        

        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        # Extract the response text
        response_data = response.json()
        response_text = response_data.get("response", "")
        
        # Parse the response to extract suggestions
        try:
            # Try to parse as JSON
            suggestions = json.loads(response_text)
            if not isinstance(suggestions, list):
                # If not a list, try to extract array from text
                suggestions = extract_suggestions_from_text(response_text)
        except json.JSONDecodeError:
            # If not valid JSON, extract from text
            suggestions = extract_suggestions_from_text(response_text)
            
        return suggestions
        
    except Exception as e:
        logger.error(f"Error calling Ollama API: {str(e)}, Response: {getattr(response, 'text', 'No response')}")
        # Return empty list on error
        return []

# Example of how the FastAPI endpoint would look with updated code
"""
@app.post("/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    # Process chat messages and return agent responses.
    
    # After generating the response, add suggestions
    try:
        chat_data = load_chat_history(session_id)
        suggestions = await get_next_query_suggestions(chat_data, response)
    except Exception as e:
        logger.error(f"Error generating suggestions: {str(e)}")
        suggestions = []
    
    # Return response with suggestions
    return {
        "session_id": session_id,
        "responses": response,
        "request_id": request_id,
        "processing_time_seconds": total_time,
        "suggestions": suggestions  # Add suggestions to response
    }
"""

import asyncio

origin_IATA_code = 'DEL'
destination_IATA_code = 'GOX'
departure_date = '2025-05-12'
passengers = "1"
cabin_class = "Economy"
flight_offer_id = "1"
order_ID="eJzTd9f3cjI29TcDAAp2Ah8%3D"


chat_history = [
      {
        "role": "User",
        "content": "search flight from New Delhi to Mumbai on 17 May 2025, economy class for one passenger",
        "timestamp": "2025-05-02 10:13:33"
      },
      {
        "role": "ReceptionAgent",
        "content": "## Search Flight Results\n### Offer IDs: `1`, `2`, `3`, `4`\n#### Flights:\n\n| **Offer ID** | **Airline** | **Flight Number** | **Origin (Airport Code)** | **Destination (Airport Code)** | **Departure Date** | **Departure Time** | **Arrival Time** | **Duration** | **Stops** | **Cabin Class** | **Price (INR)** |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 1      | Air India  | AI 636         | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 14:30             | 18:15            | 3h 45m     | Direct       | Economy        | \u20b96,981      |\n| 2      | Air India  | AI 2993        | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 12:35             | 14:50            | 2h 15m     | Direct       | Economy        | \u20b97,548      |\n| 3      | Air India  | AI 2933        | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 15:20             | 17:45            | 2h 25m     | Direct       | Economy        | \u20b97,548      |\n| 4      | Air India  | AI 2999        | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 22:00             | 00:25+1         | 2h 25m     | Direct       | Economy        | \u20b97,548      |\n\n#### Tool Call Response:\n```json\n{\n    'status': 'success',\n    'message': '\u2705 Flights retrieved successfully!',\n    'responder': 'search_flight',\n    'offer_ids': ['1', '2', '3', '4'],\n    'flights': [{'Offer ID': '1', ...}, {'Offer ID': '2', ...}, {'Offer ID': '3', ...}, {'Offer ID': '4', ...}]\n}\n```\n\n### Select an Offer ID to view flight details.\n\nChoose a valid offer ID from the list above (e.g. `1`, `2`, etc.) and press Enter to proceed.\n```markdown\nPlease select an Offer ID:\n```\nInput: `2`",
        "timestamp": "2025-05-02 10:13:45"
      },
      {
        "role": "User",
        "content": "1",
        "timestamp": "2025-05-02 10:14:35"
      },
      {
        "role": "ReceptionAgent",
        "content": "## Search Flight Results\n### Offer IDs: `1`, `2`, `3`, `4`\n#### Flights:\n\n| **Offer ID** | **Airline** | **Flight Number** | **Origin (Airport Code)** | **Destination (Airport Code)** | **Departure Date** | **Departure Time** | **Arrival Time** | **Duration** | **Stops** | **Cabin Class** | **Price (INR)** |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 1      | Air India  | AI 636         | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 14:30             | 18:15            | 3h 45m     | Direct       | Economy        | \u20b96,981      |\n| 2      | Air India  | AI 2993        | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 12:35             | 14:50            | 2h 15m     | Direct       | Economy        | \u20b97,548      |\n| 3      | Air India  | AI 2933        | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 15:20             | 17:45            | 2h 25m     | Direct       | Economy        | \u20b97,548      |\n| 4      | Air India  | AI 2999        | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 22:00             | 00:25+1         | 2h 25m     | Direct       | Economy        | \u20b97,548      |\n\n#### Tool Call Response:\n```json\n{\n    'status': 'success',\n    'message': '\u2705 Flights retrieved successfully!',\n    'responder': 'search_flight',\n    'offer_ids': ['1', '2', '3', '4'],\n    'flights': [{'Offer ID': '1', ...}, {'Offer ID': '2', ...}, {'Offer ID': '3', ...}, {'Offer ID': '4', ...}]\n}\n```\n\n### Select an Offer ID to view flight details.\n\nChoose a valid offer ID from the list above (e.g. `1`, `2`, etc.) and press Enter to proceed.\n```markdown\nPlease select an Offer ID:\n```\nInput: `2`",
        "timestamp": "2025-05-02 10:13:45"
      }]

current_response = "## Search Flight Results\n### Offer IDs: `1`, `2`, `3`, `4`\n#### Flights:\n\n| **Offer ID** | **Airline** | **Flight Number** | **Origin (Airport Code)** | **Destination (Airport Code)** | **Departure Date** | **Departure Time** | **Arrival Time** | **Duration** | **Stops** | **Cabin Class** | **Price (INR)** |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 1      | Air India  | AI 636         | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 14:30             | 18:15            | 3h 45m     | Direct       | Economy        | \u20b96,981      |\n| 2      | Air India  | AI 2993        | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 12:35             | 14:50            | 2h 15m     | Direct       | Economy        | \u20b97,548      |\n| 3      | Air India  | AI 2933        | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 15:20             | 17:45            | 2h 25m     | Direct       | Economy        | \u20b97,548      |\n| 4      | Air India  | AI 2999        | DEL (T3)                | BOM (T2)                  | 2025-05-17          | 22:00             | 00:25+1         | 2h 25m     | Direct       | Economy        | \u20b97,548      |\n\n#### Tool Call Response:\n```json\n{\n    'status': 'success',\n    'message': '\u2705 Flights retrieved successfully!',\n    'responder': 'search_flight',\n    'offer_ids': ['1', '2', '3', '4'],\n    'flights': [{'Offer ID': '1', ...}, {'Offer ID': '2', ...}, {'Offer ID': '3', ...}, {'Offer ID': '4', ...}]\n}\n```\n\n### Select an Offer ID to view flight details.\n\nChoose a valid offer ID from the list above (e.g. `1`, `2`, etc.) and press Enter to proceed.\n```markdown\nPlease select an Offer ID:\n```\nInput: `2`",


async def main():
    # result = await flight.search_flights(
    #     origin_IATA_code,
    #     destination_IATA_code,
    #     departure_date,
    #     passengers,
    #     cabin_class
    # )
    # ## Travel Recommendations
    # # # result=amadeus.reference_data.recommended_locations.get(cityCodes='GOX', travelerCountryCode='IN')
    # result = await flight.destination_airport_search("GOA")
    # result = await flight.book_flight(flight_offer_id)
    # result = await flight.get_flight_order(order_ID)
    result = await get_next_query_suggestions(chat_history, current_response)
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
