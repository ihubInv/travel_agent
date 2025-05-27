import logging
from semantic_kernel.functions import kernel_function
from datetime import datetime
from typing import List, Optional, Dict, Any
import json
import ast
import os 
import uuid
import re
from amadeus import Client, ResponseError, Location
from dotenv import load_dotenv
from rag_response.rag_queries import get_rag_response
import requests
# Configure logging
logging.basicConfig(
    filename="flight_search_plugin.log",  # Log file
    level=logging.DEBUG,  # Capture all logs
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# Initialize Amadeus client
load_dotenv()

# amadeus_api_key = "SAqTj7IE9hX0H4I5Z0mIUtxQYIe50fyS"
# amadeus_api_secret = "JUKGVmFPr3WePeDN"

# amadeus_api_key = "Ye25LNf7gOa0xy7Teqdp8oo0b8d1Gif6"
# amadeus_api_secret = "NFrtr6cdyy8eRM67"
amadeus_api_key = os.getenv("AMADEUS_API_KEY")
amadeus_api_secret =os.getenv("AMADEUS_API_SECRET")
serper_api_key = os.getenv("SERPER_API_KEY")



# Global dictionary
global_data = {
    "function_name": "",
    "function_response": ""
}



if not all([amadeus_api_key, amadeus_api_secret]):
    print("❌ Missing required API keys. Please check your .env file.")

amadeus = Client(
    client_id=amadeus_api_key,
    client_secret=amadeus_api_secret
)

class FlightSearchPlugin:
    def __init__(self, amadeus_service):
        """
        Initialize the FlightSearchPlugin with Amadeus service
        
        :param amadeus_service: The Amadeus API service for flight searches
        """
        self.amadeus_service = amadeus_service
        logging.info("FlightSearchPlugin initialized.")


    async def serper_search(self, query):
        """Perform web search using Serper API and return up to 3 valid results with title, snippet, and link"""
        try:
            url = "https://google.serper.dev/search"
            headers = {
                "X-API-KEY": serper_api_key,
                "Content-Type": "application/json"
            }
            payload = {"q": query}

            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                results = data.get("organic", [])

                top_results = []
                for item in results:
                    title = item.get("title", "").strip()
                    snippet = item.get("snippet", "").strip()
                    link = item.get("link", "").strip()

                    # Skip if any of the required fields are missing
                    if not (title and snippet and link):
                        continue

                    index = len(top_results) + 1
                    top_results.append(f"{index}. {title}\n{snippet}\n{link}")

                    if len(top_results) == 3:
                        break

                if top_results:
                    return "\n\n".join(top_results)
                else:
                    return "No valid results with title, snippet, and link found."
            else:
                return f"❌ Serper API error: {response.status_code}"
        except Exception as e:
            return f"❌ Error: {str(e)}"


    @kernel_function(description="Handle user greetings with appropriate responses")
    async def getGreetingResponse(self, query: str) -> str:
        """
        Handle greeting interactions with users in any format or language.
        This function specifically focuses on recognizing and responding to greeting queries
        with appropriate welcome messages based on time of day and greeting style.
        
        This function ONLY handles:
        1. Basic greetings (hello, hi, hey, etc.)
        2. Time-specific greetings (good morning, good afternoon, good evening)
        3. Formal and informal greetings
        4. Language-specific greetings
        5. Return user acknowledgments when applicable
        
        Args:
            query (str): The user's greeting text
            
        Returns:
            str: Appropriate greeting response with a brief inquiry about travel needs
        """
        try:
            logging.info(f"Greeting Agent processing query: {query}")
            
            if not query or len(query.strip()) < 2:
                logging.warning(f"Invalid greeting input: {query}")
                return f"Hello! How can I help with your travel plans today?"
            
            # Convert to lowercase for easier matching
            query_lower = query.lower()
            
            # Check for time-specific greetings
            import datetime
            current_hour = datetime.datetime.now().hour
            
            # Time-specific greeting patterns
            if any(pattern in query_lower for pattern in ["morning", "dawn", "sunrise"]):
                return "Good morning! How can I assist with your travel plans today?"
            elif any(pattern in query_lower for pattern in ["afternoon", "noon", "day"]):
                return "Good afternoon! What travel assistance do you need today?"
            elif any(pattern in query_lower for pattern in ["evening", "night"]):
                return "Good evening! How can I help with your travel needs?"
            
            # Language-specific greetings
            if any(pattern in query_lower for pattern in ["hola", "buenos", "ola"]):
                return "¡Hola! How can I help with your travel plans today?"
            elif any(pattern in query_lower for pattern in ["bonjour", "salut"]):
                return "Bonjour! How can I assist with your travel plans today?"
            elif any(pattern in query_lower for pattern in ["namaste", "namaskar"]):
                return "Namaste! How can I help with your travel needs today?"
            
            # Formal vs informal greeting patterns
            if any(pattern in query_lower for pattern in ["greetings", "good day", "pleasure"]):
                return "Greetings! How may I assist with your travel arrangements today?"
            elif any(pattern in query_lower for pattern in ["hey", "sup", "yo", "what's up"]):
                return "Hey there! What travel plans can I help you with today?"
            
            # Return user patterns
            if any(pattern in query_lower for pattern in ["back", "again", "return"]):
                return "Welcome back! How can I help with your travel needs today?"
            
            # Default greeting response for anything else
            return "Hello! How can I assist with your travel plans today?"
            
        except Exception as e:
            logging.error(f"Error in Greeting Agent processing {query}: {str(e)}", exc_info=True)
            return "Hello! How can I help with your travel plans today?"
    


    @kernel_function(description="Check if query is a greeting and should be handled by Greetings Agent")
    def isGreetingQuery(self, query: str) -> bool:
        """
        Determines if the user query is a greeting that should be handled by the Greetings Agent.
        
        This function checks if the query contains greeting patterns and doesn't contain
        other travel-related content that would require specialized agent handling.
        
        Args:
            query (str): The user's query text
            
        Returns:
            bool: True if the query is a greeting that should be handled by Greetings Agent, False otherwise
        """
        try:
            if not query or len(query.strip()) < 2:
                return False
            
            # Convert to lowercase for easier matching
            query_lower = query.lower()
            
            # Basic greeting patterns
            greeting_patterns = [
                "hello", "hi", "hey", "greetings", "good morning", "good afternoon", 
                "good evening", "morning", "afternoon", "evening", "bonjour", "hola", 
                "namaste", "what's up", "sup", "yo", "howdy", "aloha", "welcome"
            ]
            
            # Check if query contains greeting patterns
            has_greeting = any(pattern in query_lower for pattern in greeting_patterns)
            
            # Check if query contains non-greeting travel content that would be handled by other agents
            travel_patterns = [
                "flight", "book", "search", "cancel", "advisory", "airport", "ticket", 
                "restriction", "safe", "danger", "warning", "travel alert", 
                "recommendation", "suggest", "best time", "weather", "popular"
            ]
            
            has_travel_content = any(pattern in query_lower for pattern in travel_patterns)
            
            # Count words in query (simple approximation - queries with many words are likely not just greetings)
            word_count = len(query_lower.split())
            
            # Return True if query contains greeting patterns, doesn't contain travel content, and is relatively short
            return has_greeting and not has_travel_content and word_count < 10
            
        except Exception as e:
            logging.error(f"Error in isGreetingQuery for {query}: {str(e)}", exc_info=True)
            return False
        


    @kernel_function(description="Get information including travel advisories from knowledge base")
    async def getRAGResponse(self, query: str) -> str:
        """
        Get RAG (Retrieval-Augmented Generation) response for a given query,
        particularly useful for travel advisory information and handling
        miscellaneous travel-related questions not handled by other agents.
        
        This function can:
        1. Retrieve travel advisory information, safety details, restrictions, and recommendations
        2. Provide general travel knowledge and recommendations
        3. Handle miscellaneous queries that other agents cannot process
        4. Serve as a fallback for ambiguous or non-flight related queries
        
        If no relevant information is found in the knowledge base, the function
        will indicate that no data is available and suggest alternative approaches.
        
        Note: This function no longer handles greeting queries as those are now
        processed by the dedicated Greetings Agent.
        
        Args:
            query (str): The user's query text, which can be a travel advisory request
                        or miscellaneous travel-related question
            
        Returns:
            str: Travel advisory information or other helpful content based on the query
        """
        try:
            logging.info(f"RAG Agent processing query: {query}")
            
            if not query or len(query.strip()) < 2:
                logging.warning(f"Invalid query input: {query}")
                return f"❌ Invalid input: {query}"
            
            # Check if query is about travel advisories
            advisory_patterns = ["advisory", "restriction", "safe", "danger", "warning", "travel alert", 
                                "covid", "requirement", "visa", "security", "risk"]
            if any(pattern in query.lower() for pattern in advisory_patterns):
                # Call specific travel advisory knowledge base
                response = await self.serper_search(query)
                if response:
                    logging.info(f"RAG Agent processing query: {response}")
                    return response
                
                # Fallback for unknown advisory requests
                return (f"""🙏 Thank you for your question! I'm here to help, but I don't have specific information about this topic at the moment.
                You might want to ask something else or try a different travel-related question! Is there something else I can help you with?""")
            
            # For general travel information
            travel_patterns = ["recommendation", "suggest", "best time", "weather", "popular", "attraction", 
                            "culture", "custom", "packing", "currency", "language", "time zone"]
            if any(pattern in query.lower() for pattern in travel_patterns):
                # Call general travel information knowledge base
                response = await self.serper_search(query)
                if response:
                    logging.info(f"RAG Agent processing query: {response}")
                    return response
            
                        # Check if query is about travel advisories
            advisory = ["advisory", "travel alert"]
            if any(pattern in query.lower() for pattern in advisory):
                # Call specific travel advisory knowledge base
                # Call the general RAG function for other queries
                response = await get_rag_response(query)
                if response:
                    logging.info(f"RAG Agent processing query: {response}")
                    return response

            # General fallback search for any other query
            response = await self.serper_search(query)
            if response:
                logging.info(f"RAG Agent processing query: {response}")
                return response
        
            # If no relevant information was found
            if not response or response.strip() == "":
                return ("I don't have specific information about that query. Would you like help with flight searches, "
                    "bookings, travel advisories, or general travel recommendations instead?")
                
            logging.info(f"RAG response: {response}")
            return response
            
        except Exception as e:
            logging.error(f"Error in RAG Agent processing {query}: {str(e)}", exc_info=True)
            return f"❌ Error processing your request: {str(e)}"        
    

    @kernel_function(description="Get IATA code for a city or airport")
    async def get_iata_code(self, city: str) -> str:
        """Fetch IATA code for a given city or airport."""
        try:
            logging.info(f"Fetching IATA code for input: {city}")

            if not city or len(city.strip()) < 2:
                logging.warning(f"Invalid city/airport input: {city}")
                return f"❌ Invalid input: {city}"

            city = city.strip()

            # If the input looks like an IATA code (3 letters), just return it in uppercase
            if len(city) == 3 and city.isalpha():
                logging.debug(f"'{city}' appears to be a valid IATA code.")
                return city.upper()

            # First, try airport subtype
            airport_response = self.amadeus_service.reference_data.locations.get(
                keyword=city, subType="AIRPORT", view="LIGHT"
            )

            #   data = amadeus.reference_data.locations.get(
            #     keyword=request.GET.get("term", None), subType=Location.ANY
            # ).data

            if airport_response.data:
                iata_code = airport_response.data[0].get("iataCode")
                logging.info(f"Found IATA code (airport) for '{city}': {iata_code}")
                return iata_code

            # Then, try city subtype
            city_response = self.amadeus_service.reference_data.locations.get(
                keyword=city, subType="CITY", view="LIGHT"
            )
            if city_response.data:
                iata_code = city_response.data[0].get("iataCode")
                logging.info(f"Found IATA code (city) for '{city}': {iata_code}")
                return iata_code

            # Fallback: Search without subtype to try any location
            general_response = self.amadeus_service.reference_data.locations.get(
                keyword=city, view="LIGHT"
            )
            if general_response.data:
                iata_code = general_response.data[0].get("iataCode")
                logging.info(f"Found general IATA code for '{city}': {iata_code}")
                return iata_code

            logging.warning(f"No IATA code found for: {city}")
            return f"❌ No IATA code found for: {city}"

        except Exception as e:
            logging.error(f"Error fetching IATA code for {city}: {str(e)}", exc_info=True)
            return f"❌ Error getting IATA code: {str(e)}"

    @kernel_function(description="Get flight check-in links for a given airline code")
    async def get_checkin_links(self, airline_code: str) -> dict:
        """Fetch check-in links for a specific airline code."""
        try:
            logging.info(f"Getting check-in links for airline: {airline_code}")

            if not airline_code or len(airline_code) != 2:
                logging.warning(f"Invalid airline code provided: {airline_code}")
                return {"error": f"❌ Invalid airline code: {airline_code}"}

            response = self.amadeus_service.reference_data.urls.checkin_links.get(
                airlineCode=airline_code.upper()
            )

            if response.data:
                logging.info(f"Check-in links retrieved successfully for {airline_code}")
                return response.data

            logging.warning(f"No check-in links found for: {airline_code}")
            return {"message": f"ℹ️ No check-in links found for: {airline_code}"}

        except Exception as e:
            logging.error(f"Error fetching check-in links for {airline_code}: {str(e)}", exc_info=True)
            return {"error": f"❌ Error fetching check-in links: {str(e)}"}
        

    @kernel_function(description="Get flight order details by order ID")
    async def get_flight_order(self, order_id: str) -> dict:
        """Fetch flight order details using the flight order ID."""
        global global_data
        try:
            logging.info(f"Fetching flight order with ID: {order_id}")

            if not order_id:
                logging.warning("No order ID provided.")
                return {"error": "❌ No order ID provided."}

            response = self.amadeus_service.booking.flight_order(order_id).get()

            if response.data:
                logging.info(f"Flight order retrieved successfully for ID: {order_id}")
                global_data["function_name"] = "order_flight"
                global_data["function_response"] = response.data
                return response.data

            logging.warning(f"No flight order found for ID: {order_id}")
            return {"message": f"ℹ️ No flight order found for ID: {order_id}"}

        except ResponseError as error:
            logging.error(f"Error retrieving flight order for ID {order_id}: {str(error)}", exc_info=True)
            body = getattr(error.response, "body", str(error))
            message = f"❌ Error retrieving flight order: {body}"
            logging.error(message, exc_info=True)
            global_data["function_name"] = ""
            global_data["function_response"] = ""
            return {
                "status": "error",
                "message": message,
                "details": body
            }
    
        
   
    @kernel_function(description="Cancle a flight order by order ID")
    async def cancle_flight_order(self, order_id: str) -> dict:
        """Cancle a flight order using the order ID."""
        try:
            logging.info(f"Attempting to Cancle flight order with ID: {order_id}")
            
            if not order_id:
                logging.warning("No order ID provided.")
                return {"error": "❌ No order ID provided."}

            response = self.amadeus_service.booking.flight_order(order_id).delete()

            if response.status_code == 204:
                logging.info(f"Flight order with ID {order_id} successfully cancled.")
                return {"message": f"✅ Flight order with ID {order_id} cancled successfully."}

            logging.warning(f"Unexpected response while cancling order: {response.status_code}")
            return {"message": f"⚠️ canclation returned unexpected status code: {response.status_code}"}

        except ResponseError as error:
            logging.error(f"Error cancling flight order for ID {order_id}: {str(error)}", exc_info=True)
            body = getattr(error.response, "body", str(error))
            message = f"❌Error cancling flight order: {body}"
            logging.error(message, exc_info=True)
            return {
                "status": "error",
                "message": message,
                "details": body
            }
        

    async def format_flight_response(self, response_data):
        """
        Format flights from response.data into a simplified table structure
        using only dynamic values from the response and IATA codes for airports.

        Args:
            response_data (list): The response.data list from Amadeus API
            
        Returns:
            list: A list of dictionaries with formatted flight information
        """
        formatted_flights = []

        def get_airline_logo(carrier_code):
            return "https://s1.apideeplink.com/images/airlines/" + carrier_code + ".png"
        
        airline_codes = {
            "AI": "Air India",
            "UK": "Vistara",
            "6E": "IndiGo",
            "SG": "SpiceJet",
            "G8": "GoAir",
            "I5": "AirAsia India",
            # Add more as needed
        }

        cheapest_offer_id = None
        fastest_offer_id = None
        lowest_price = float('inf')
        shortest_duration = float('inf')

        for idx, flight in enumerate(response_data, 1):
            try:
                offer_id = f"{idx}"
                segments = flight['itineraries'][0]['segments']
                carrier_code = segments[0]['carrierCode']
                airline_logo = get_airline_logo(carrier_code)
                airline_name = airline_codes.get(carrier_code, carrier_code)

                origin_iata = segments[0]['departure']['iataCode']
                origin_terminal = segments[0]['departure'].get('terminal', '')
                origin_with_terminal = f"{origin_iata}" + (f" (T{origin_terminal})" if origin_terminal else "")

                destination_iata = segments[-1]['arrival']['iataCode']
                destination_terminal = segments[-1]['arrival'].get('terminal', '')
                destination_with_terminal = f"{destination_iata}" + (f" (T{destination_terminal})" if destination_terminal else "")

                departure_datetime = segments[0]['departure']['at']
                departure_time = departure_datetime.split('T')[1][:5]
                departure_date = departure_datetime.split('T')[0]

                arrival_datetime = segments[-1]['arrival']['at']
                arrival_time = arrival_datetime.split('T')[1][:5]
                arrival_date = arrival_datetime.split('T')[0]

                next_day_indicator = "+1" if arrival_date != departure_date else ""
                formatted_arrival_time = f"{arrival_time}{next_day_indicator}"

                flight_numbers = [f"{segment['carrierCode']} {segment['number']}" for segment in segments]
                flight_numbers_str = ', '.join(flight_numbers)

                duration = flight['itineraries'][0]['duration']
                hours = 0
                minutes = 0
                if 'H' in duration:
                    hours = int(duration.split('PT')[1].split('H')[0])
                if 'M' in duration:
                    if 'H' in duration:
                        minutes = int(duration.split('H')[1].split('M')[0])
                    else:
                        minutes = int(duration.split('PT')[1].split('M')[0])
                formatted_duration = f"{hours}h {minutes}m"
                total_minutes = hours * 60 + minutes

                stops = len(segments) - 1
                stops_str = "Direct" if stops == 0 else f"{stops} Stop{'s' if stops > 1 else ''}"

                connecting_airports = [
                    segments[i]['arrival']['iataCode'] for i in range(len(segments) - 1)
                ] if stops > 0 else []
                connecting_airports_str = ', '.join(connecting_airports) if connecting_airports else "N/A"

                cabin_class = flight['travelerPricings'][0]['fareDetailsBySegment'][0]['cabin']
                branded_fare = flight['travelerPricings'][0]['fareDetailsBySegment'][0].get('brandedFareLabel', 'Standard')

                checked_bags = None
                cabin_bags = None
                for fare_segment in flight['travelerPricings'][0]['fareDetailsBySegment']:
                    if 'includedCheckedBags' in fare_segment:
                        checked = fare_segment['includedCheckedBags']
                        if 'weight' in checked:
                            checked_bags = f"{checked['weight']}{checked.get('weightUnit', 'KG').lower()}"
                        elif 'quantity' in checked:
                            checked_bags = f"{checked['quantity']} bag{'s' if checked['quantity'] > 1 else ''}"

                    if 'includedCabinBags' in fare_segment:
                        cabin = fare_segment['includedCabinBags']
                        if 'weight' in cabin:
                            cabin_bags = f"{cabin['weight']}{cabin.get('weightUnit', 'KG').lower()}"
                        elif 'quantity' in cabin:
                            cabin_bags = f"{cabin['quantity']} bag{'s' if cabin['quantity'] > 1 else ''}"

                baggage_allowance = "Not specified"
                if checked_bags and cabin_bags:
                    baggage_allowance = f"{checked_bags} checked + {cabin_bags} cabin"
                elif checked_bags:
                    baggage_allowance = f"{checked_bags} checked"
                elif cabin_bags:
                    baggage_allowance = f"{cabin_bags} cabin"

                price = flight['price']['grandTotal']
                price_value = float(price)
                price_inr = f"{int(price_value):,}"
                base_price = flight['price']['base']
                tax_amount = price_value - float(base_price)
                tax_amount_str = f"{int(tax_amount):,}"

                if price_value < lowest_price:
                    lowest_price = price_value
                    cheapest_offer_id = offer_id
                if total_minutes < shortest_duration:
                    shortest_duration = total_minutes
                    fastest_offer_id = offer_id

                meal_status = "Not included"
                for fare_segment in flight['travelerPricings'][0]['fareDetailsBySegment']:
                    for amenity in fare_segment.get('amenities', []):
                        if amenity.get('amenityType') == 'MEAL' or 'MEAL' in amenity.get('description', ''):
                            meal_status = "Included" if not amenity.get('isChargeable', True) else "Available (Paid)"
                            break

                seats_available = flight.get('numberOfBookableSeats', 0)
                seats_left = f"{seats_available} Seat{'s' if seats_available != 1 else ''} Left"

                aircraft_type = segments[0]['aircraft'].get('code', 'N/A')

                formatted_flight = {
                    "Offer ID": offer_id,
                    "Airline Logo": airline_logo,
                    "Airline": airline_name,
                    "Flight Number": flight_numbers_str,
                    "Origin": origin_with_terminal,
                    "Destination": destination_with_terminal,
                    "Departure Date": departure_date,
                    "Departure Time": departure_time,
                    "Arrival Time": formatted_arrival_time,
                    "Duration": formatted_duration,
                    "Stops": stops_str,
                    "Connecting Airports": connecting_airports_str,
                    "Aircraft": aircraft_type,
                    "Cabin Class": cabin_class.capitalize(),
                    "Branded Fare": branded_fare,
                    "Baggage Allowance": baggage_allowance,
                    "Price (INR)": price_inr,
                    "Base Price": base_price,
                    "Taxes & Fees": tax_amount_str,
                    "Price Category": "Standard",
                    "Speed Category": "Standard",
                    "Meal": meal_status,
                    "Seat Availability": seats_left
                }

                formatted_flights.append(formatted_flight)

            except Exception as e:
                print(f"Error formatting flight {idx}: {str(e)}")

        # Add tags for cheapest and fastest
        for flight in formatted_flights:
            if flight["Offer ID"] == cheapest_offer_id:
                flight["Price Category"] = "⭐ Cheapest"
            if flight["Offer ID"] == fastest_offer_id:
                flight["Speed Category"] = "⚡ Fastest"

        # Bring cheapest and fastest flights to top
        pinned_flights = []
        added_offers = set()

        for flight in formatted_flights:
            if flight["Offer ID"] == cheapest_offer_id and flight["Offer ID"] not in added_offers:
                pinned_flights.append(flight)
                added_offers.add(flight["Offer ID"])
            elif flight["Offer ID"] == fastest_offer_id and flight["Offer ID"] not in added_offers:
                pinned_flights.append(flight)
                added_offers.add(flight["Offer ID"])

        pinned_flights.extend([f for f in formatted_flights if f["Offer ID"] not in added_offers])

        return pinned_flights




    @kernel_function(description="Search for flights using Amadeus API by from {origin_IATA_code} to {destination_IATA_code} on {departure_date} for {passengers} passenger(s), Class: {cabin_class}")
    async def search_flights(
        self,
        origin_IATA_code: str,
        destination_IATA_code: str,
        departure_date: str,
        passengers: Optional[int] = 1,
        cabin_class: Optional[str] = "ECONOMY"
    ) -> Dict[str, Any]:
        """Search for flights using Amadeus API with support for city names or IATA codes."""
        try:
            logging.info(f"Searching flights from {origin_IATA_code} to {destination_IATA_code} on {departure_date} for {passengers} passenger(s), Class: {cabin_class}")

            global global_data
            # Validate and format the departure date
            try:
                parsed_date = datetime.strptime(departure_date, "%Y-%m-%d")
                formatted_date = parsed_date.strftime("%Y-%m-%d")
            except ValueError as date_error:
                logging.error(f"Invalid date format provided: {departure_date}", exc_info=True)
                return {
                    "status": "error",
                    "message": "❌ Invalid date format provided. Please use YYYY-MM-DD.",
                    "details": str(date_error)
                }

            passengers = passengers or 1
            cabin_class = (cabin_class or "ECONOMY").upper()

            logging.info(f"Formatted date and parameters: {origin_IATA_code} → {destination_IATA_code}, Date: {formatted_date}, Passengers: {passengers}, Class: {cabin_class}")

            # Search flights
            try:
                response = self.amadeus_service.shopping.flight_offers_search.get(
                    originLocationCode=origin_IATA_code,
                    destinationLocationCode=destination_IATA_code,
                    departureDate=formatted_date,
                    adults=passengers,
                    max=4,
                    currencyCode="INR",
                    travelClass=cabin_class
                )
            except ResponseError as error:
                body = getattr(error.response, "body", str(error))
                message = f"❌ Amadeus API error during flight search: {body}"
                logging.error(message, exc_info=True)
                return {
                    "status": "error",
                    "message": message,
                    "details": body
                }
            except (KeyError, AttributeError, ValueError) as error:
                message = f"❌ Internal error during flight search: {str(error)}"
                logging.error(message, exc_info=True)
                return {
                    "status": "error",
                    "message": message,
                    "details": str(error)
                }

            if not response.data:
                logging.warning(f"No flights found from {origin_IATA_code} to {destination_IATA_code} on {formatted_date}")
                return {
                    "status": "warning",
                    "message": f"⚠️ No flights found from {origin_IATA_code} to {destination_IATA_code} on {formatted_date}"
                }

            logging.info(f"Found {len(response.data)} flight offers.")

            # Cache flight offers
            self.flight_offers_cache = {}
            for flight_offer in response.data:
                offer_id = flight_offer.get('id', str(uuid.uuid4()))
                self.flight_offers_cache[offer_id] = flight_offer
            self.last_search_results = response.data
            

            # Save cache to file
            try:
                cache_file = 'flight_offers_cache.json'

                # Check if file exists, if not create it
                if not os.path.exists(cache_file):
                    logging.info(f"Cache file '{cache_file}' does not exist. Creating a new one.")

                with open(cache_file, 'w') as f:
                    json.dump({
                        "timestamp": datetime.now().isoformat(),
                        "search_params": {
                            "origin": origin_IATA_code,
                            "destination": destination_IATA_code,
                            "departure_date": formatted_date,
                            "passengers": passengers,
                            "cabin_class": cabin_class
                        },
                        "offers": self.flight_offers_cache
                    }, f, default=str, indent=2)

                logging.info("✅ Flight offers cached to file successfully")

            except Exception as cache_error:
                logging.warning(f"⚠️ Could not save flight offers to file: {str(cache_error)}", exc_info=True)


            # Format and return flight results
            formatted_flights = await self.format_flight_response(response.data)
            
            global_data["function_name"] = "search_flight"
            global_data["function_response"] = formatted_flights

            return {
                "status": "success",
                "message": "✅ Flights retrieved successfully!",
                "responder": "search_flight",
                "offer_ids": list(self.flight_offers_cache.keys()),
                "flights": formatted_flights
            }

        except Exception as e:
            logging.error(f"Unexpected error during flight search: {str(e)}", exc_info=True)
            global_data["function_name"] = ""
            global_data["function_response"] = ""
            return {
                "status": "error",
                "message": "❌ Unexpected error occurred during flight search.",
                "details": str(e)
            }


    @kernel_function(
        description="Search for flights using Amadeus API from {origin_IATA_code} to {destination_IATA_code} on {dates} for {passengers} passenger(s), Class: {cabin_class}, with user preferences {additional_preferences}"
    )
    async def search_flights_with_preferences(self, origin_IATA_code: str, destination_IATA_code: str, departure_date: str, passengers: Optional[int] = 1, cabin_class: Optional[str] = "ECONOMY", additional_preferences: Optional[str] = "") -> Dict[str, Any]:
        """Search for flights considering user preferences."""
        try:
            logging.info(f"Searching flights from {origin_IATA_code} to {destination_IATA_code} on {departure_date} for {passengers} passenger(s), Class: {cabin_class}")

            # origin_code = await self.get_iata_code(origin)
            # destination_code = await self.get_iata_code(destination)
            
            # origin_code = origin
            # destination_code = destination

            if not all([origin_IATA_code, destination_IATA_code, departure_date]):
                logging.error("Missing required flight search parameters.")
                return {"status": "error", "message": "❌ Missing required flight search parameters, please mention all parameters."}
                
            # Handle default values properly with type annotations instead of runtime checks
            # This is redundant with default parameters but keeping for robustness
            if passengers is None:
                passengers = 1
            if cabin_class is None:
                cabin_class = "ECONOMY"
                
            # Validate date format
            try:
                parsed_date = datetime.strptime(departure_date, "%Y-%m-%d")
                formatted_date = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                logging.error(f"Invalid date format provided: {departure_date}")
                return {"status": "error", "message": f"❌ Invalid date format: {departure_date}"}

            # Perform API search
            response = self.amadeus_service.shopping.flight_offers_search.get(
                originLocationCode=origin_IATA_code,
                destinationLocationCode=destination_IATA_code,
                departureDate=formatted_date,
                adults=passengers,
                max=10,
                currencyCode="INR",
                travelClass=cabin_class  # Added the cabin_class parameter
            )

            if not response.data:
                logging.warning(f"No flights found from {origin_IATA_code} to {destination_IATA_code} on {formatted_date}")
                return {"status": "warning", "message": f"⚠️ No flights found for {origin_IATA_code} → {destination_IATA_code} on {formatted_date}"}

            logging.info(f"Found {len(response.data)} flight offers.")
            logging.info(f"Here is the flight search result: {response.data}")  # Fixed typo: logging.inf -> logging.info
            flights=response.data
            """Find the best flight based on price, non-stop travel, and included meals."""
        
            if not flights:
                logging.warning("No flights available for analysis.")
                return {"status": "warning", "message": "⚠️ No flights available to analyze."}

            best_flight = None
            cheapest_flight = None
            cheapest_price = float("inf")

            for flight in flights:
                itineraries = flight["itineraries"]
                price = float(flight["price"]["total"])

                # Identify the cheapest flight
                if price < cheapest_price:
                    cheapest_flight = flight
                    cheapest_price = price
 
                is_non_stop = all(len(itinerary["segments"]) == 1 for itinerary in itineraries)
                includes_meal = any(
                    "includedCheckedBags" in segment for itinerary in itineraries for segment in itinerary["segments"]
                )

                # Prioritize non-stop flights with meals
                if is_non_stop and includes_meal:
                    if best_flight is None or price < float(best_flight["price"]["total"]):
                        best_flight = flight

            if best_flight:
                logging.info("Best flight selected based on non-stop and meal inclusion.")
                logging.info(f"Here are best flights options; {best_flight}")
                return {"status": "success", "message": "🏆 Best flight found!", "flight": best_flight}

            logging.info("No ideal flight found, returning the cheapest available option.")
            logging.info(f"Here are cheapest flights options; {cheapest_flight}")
            return {"status": "warning", "message": "⚠️ No non-stop meal-included flights. Showing cheapest option.", "flight": cheapest_flight}

        except Exception as e:
            logging.error(f"Error finding best flight: {str(e)}", exc_info=True)
            return {"status": "error", "message": f"❌ Error finding best flight: {str(e)}"}
       
        

    # @kernel_function(description="Check seat availability for a flight")
    async def check_seat_availability(self, flight_offer_id: str) -> Dict[str, Any]:
        """Check seat availability using Amadeus SDK."""
        try:
            logging.info(f"Checking seat availability for flight offer ID: {flight_offer_id}")
            response = self.amadeus_service.shopping.seatmaps.get(flightOfferId=flight_offer_id)

            if response.data:
                logging.info("Seat information retrieved successfully.")
                logging.info(f"Here are details: {response.data}")
                return {"status": "success", "message": "✅ Seat information retrieved successfully", "seat_maps": response.data}

            logging.warning("No seat information available.")
            return {"status": "warning", "message": "⚠️ No seat information available for this flight"}

        except Exception as e:
            logging.error(f"Error checking seat availability: {str(e)}", exc_info=True)
            return {"status": "error", "message": f"❌ Error checking seat availability: {str(e)}"}
        


    
        
    # Updated book flight function with enhanced pricing and booking logic and better error responses
    @kernel_function(description="Book a flight by flight_offer_id")
    async def book_flight(self, flight_offer_id: str) -> Dict[str, Any]:
        """Book a flight using Amadeus API."""
        global global_data
        try:
            logging.info(f"📦 Booking flight with offer ID: {flight_offer_id}")
            # Validate offer ID: must be a 1 or 2 digit number
            if not re.fullmatch(r"\d{1,2}", flight_offer_id):
                message = "❌ Invalid offer ID. Please enter a valid offer ID from the search result (1-2 digit number)."
                logging.error(message)
                return {"status": "error", "message": message}
            
            # Retrieve the flight offer
            flight_offer = await self.get_flight_offer_by_id(flight_offer_id)
            if not flight_offer:
                message = f"❌ Flight offer with ID {flight_offer_id} not found."
                logging.error(message)
                return {"status": "error", "message": message}

            # Traveler profile for booking
            traveler = {
                "id": "1",
                "dateOfBirth": "1982-01-16",
                "name": {"firstName": "JORGE", "lastName": "GONZALES"},
                "gender": "MALE",
                "contact": {
                    "emailAddress": "jorge.gonzales833@telefonica.es",
                    "phones": [
                        {
                            "deviceType": "MOBILE",
                            "countryCallingCode": "34",
                            "number": "480080076",
                        }
                    ],
                },
                "documents": [
                    {
                        "documentType": "PASSPORT",
                        "birthPlace": "Madrid",
                        "issuanceLocation": "Madrid",
                        "issuanceDate": "2015-04-14",
                        "number": "00000000",
                        "expiryDate": "2027-05-14",
                        "issuanceCountry": "ES",
                        "validityCountry": "ES",
                        "nationality": "ES",
                        "holder": True,
                    }
                ],
            }

            # Confirm flight pricing
            try:
                logging.info(f"💰 Confirming pricing for flight offer...")
                flight_offer_str = str(flight_offer)
                flight_price_confirmed = self.amadeus_service.shopping.flight_offers.pricing.post(
                    ast.literal_eval(flight_offer_str)
                ).data["flightOffers"]
                logging.info(f"💸 Pricing confirmed successfully.")
            except ResponseError as error:
                body = getattr(error.response, "body", str(error))
                message = f"❌ Pricing confirmation failed: {body}"
                logging.error(message, exc_info=True)
                return {"status": "error", "message": message}
            except (KeyError, AttributeError, ValueError) as error:
                message = f"❌ Pricing confirmation internal error: {str(error)}"
                logging.error(message, exc_info=True)
                return {"status": "error", "message": message}

            # Book the flight
            try:
                logging.info("📝 Proceeding to book the flight...")
                booked_flight = self.amadeus_service.booking.flight_orders.post(
                    flight_price_confirmed, traveler
                ).data
                logging.info(f"✅ Flight booking completed.")
            except ResponseError as error:
                body = getattr(error.response, "body", str(error))
                message = f"❌ Booking API call failed: {body}"
                logging.error(message, exc_info=True)
                return {"status": "error", "message": message}
            except (KeyError, AttributeError, ValueError) as error:
                message = f"❌ Flight booking internal error: {str(error)}"
                logging.error(message, exc_info=True)
                return {"status": "error", "message": message}

            # Get web check-in link
            airline_code = booked_flight.get("flightOffers", [{}])[0].get("itineraries", [{}])[0].get("segments", [{}])[0].get("carrierCode", "N/A")
            check_in_link = await self.get_checkin_links(airline_code)
            logging.info(f"🔗 Web check-in link retrieved for airline code {airline_code}.")

            # Build booking details
            booking_details = {
                "order_id": booked_flight.get("id"),
                "booking_code": booked_flight.get("associatedRecords", [{}])[0].get("reference", "N/A"),
                "status": booked_flight.get("status", "confirmed"),
                "type": booked_flight.get("type", "flight-order"),
                "traveler_name": f"{traveler['name']['firstName']} {traveler['name']['lastName']}",
                "flight_details": {
                    "departure": booked_flight.get("flightOffers", [{}])[0].get("itineraries", [{}])[0].get("segments", [{}])[0].get("departure", {}).get("iataCode", "N/A"),
                    "arrival": booked_flight.get("flightOffers", [{}])[0].get("itineraries", [{}])[0].get("segments", [{}])[0].get("arrival", {}).get("iataCode", "N/A"),
                    "date": booked_flight.get("flightOffers", [{}])[0].get("itineraries", [{}])[0].get("segments", [{}])[0].get("departure", {}).get("at", "N/A"),
                    "airline": airline_code,
                },
                "webcheck-in": check_in_link,
            }

            logging.info(f"📃 Booking details prepared successfully: {booking_details}")
            global_data["function_name"] = "book_flight"
            global_data["function_response"] = booking_details
            return {
                "status": "success",
                "message": "✅ Flight booked successfully!",
                "booking": booking_details
            }

        except Exception as e:
            global_data["function_name"] = ""
            global_data["function_response"] = ""
            message = f"❌ General flight booking error: {str(e)}"
            logging.error(message, exc_info=True)
            return {"status": "error", "message": message}


    
    
    async def get_flight_offer_by_id(self, flight_offer_id: str):
        """Retrieves a flight offer by its ID."""
        try:
            logging.info(f"Retrieving flight offer with ID: {flight_offer_id}")
            
            # First check in-memory cache
            if hasattr(self, 'flight_offers_cache') and flight_offer_id in self.flight_offers_cache:
                logging.info(f"Found flight offer {flight_offer_id} in memory cache")
                return self.flight_offers_cache[flight_offer_id]
            
            # If not in memory, try to load from saved JSON file
            try:
                with open('flight_offers_cache.json', 'r') as f:
                    cache_data = json.load(f)
                    
                if 'offers' in cache_data and flight_offer_id in cache_data['offers']:
                    flight_offer = cache_data['offers'][flight_offer_id]
                    logging.info(f"Found flight offer {flight_offer_id} in saved cache file")
                    
                    # Update in-memory cache
                    if not hasattr(self, 'flight_offers_cache'):
                        self.flight_offers_cache = {}
                    self.flight_offers_cache[flight_offer_id] = flight_offer
                    
                    return flight_offer
            except (FileNotFoundError, json.JSONDecodeError, KeyError) as e:
                logging.warning(f"Could not load flight offer from file: {str(e)}")
                    
            logging.error(f"Flight offer with ID {flight_offer_id} not found in any storage")
            return None
        except Exception as e:
            logging.error(f"Error retrieving flight offer: {str(e)}", exc_info=True)
            return None
        
    

        


    @kernel_function(description="Validate and confirm exact origin airport/city from multiple airports in a city")
    async def origin_airport_search(self, keyword: str) -> Dict[str, Any]:
        """Validate and confirm origin airport or city from user input (IATA or city name)."""
        try:
            logging.info(f"Validating origin location: {keyword}")

            if not keyword or len(keyword.strip()) < 2:
                logging.warning("Invalid origin input.")
                return {"status": "error", "message": f"❌ Invalid origin input: '{keyword}'"}

            keyword = keyword.strip()

            try:
                location_response = self.amadeus_service.reference_data.locations.get(
                    keyword=keyword,
                    subType=Location.ANY,
                    view="LIGHT"
                )
            except ResponseError as api_error:
                body = getattr(api_error.response, "body", str(api_error))
                logging.error(f"Amadeus API error during origin validation: {body}", exc_info=True)
                return {
                    "status": "error",
                    "message": "❌ Error while searching for origin location",
                    "details": body
                }

            if not location_response.data:
                logging.warning(f"No matching origin found for '{keyword}'")
                return {
                    "status": "error",
                    "message": f"❌ No matching origin location found for '{keyword}'"
                }

            locations = [
                {
                    "name": loc.get("name"),
                    "iataCode": loc.get("iataCode"),
                    "cityName": loc.get("address", {}).get("cityName"),
                    "countryName": loc.get("address", {}).get("countryName"),
                    "subType": loc.get("subType")
                }
                for loc in location_response.data
            ]

            logging.info(f"Found origin locations for '{keyword}': {locations}")

            return {
                "status": "success",
                "message": f"✅ Origin '{keyword}' validated successfully",
                "locations": locations
            }

        except Exception as e:
            logging.error(f"Unexpected error during origin validation for '{keyword}': {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"❌ Unexpected error validating origin location",
                "details": str(e)
            }


    @kernel_function(description="Validate and confirm exact destination airport/city from multiple airports in a city")
    async def destination_airport_search(self, keyword: str) -> Dict[str, Any]:
        """Validate and confirm destination airport or city from user input (IATA or city name)."""
        try:
            logging.info(f"Validating destination location: {keyword}")

            if not keyword or len(keyword.strip()) < 2:
                logging.warning("Invalid destination input.")
                return {"status": "error", "message": f"❌ Invalid destination input: '{keyword}'"}

            keyword = keyword.strip()

            try:
                location_response = self.amadeus_service.reference_data.locations.get(
                    keyword=keyword,
                    subType=Location.ANY,
                    view="LIGHT"
                )
            except ResponseError as api_error:
                body = getattr(api_error.response, "body", str(api_error))
                logging.error(f"Amadeus API error during destination validation: {body}", exc_info=True)
                return {
                    "status": "error",
                    "message": "❌ Error while searching for destination location",
                    "details": body
                }

            if not location_response.data:
                logging.warning(f"No matching destination found for '{keyword}'")
                return {
                    "status": "error",
                    "message": f"❌ No matching destination location found for '{keyword}'"
                }

            locations = [
                {
                    "name": loc.get("name"),
                    "iataCode": loc.get("iataCode"),
                    "cityName": loc.get("address", {}).get("cityName"),
                    "countryName": loc.get("address", {}).get("countryName"),
                    "subType": loc.get("subType")
                }
                for loc in location_response.data
            ]

            logging.info(f"Found destination locations for '{keyword}': {locations}")

            return {
                "status": "success",
                "message": f"✅ Destination '{keyword}' validated successfully",
                "locations": locations
            }

        except Exception as e:
            logging.error(f"Unexpected error during destination validation for '{keyword}': {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"❌ Unexpected error validating destination location",
                "details": str(e)
            }



    @kernel_function(description="Search for airports or cities by keyword")
    async def search_locations(self, keyword: str) -> Dict[str, Any]:
        """Search for airports or cities by keyword."""
        try:
            if not keyword or len(keyword) < 2:
                logging.warning(f"Invalid search keyword: {keyword}")
                return {"status": "error", "message": f"❌ Invalid search keyword: {keyword}"}
                
            logging.info(f"Searching locations for keyword: {keyword}")
            
            # Corrected subType value
            location_data = self.amadeus_service.reference_data.locations.get(
                keyword=keyword, subType="AIRPORT,CITY"
            ).data
            
            if not location_data:
                logging.warning(f"No locations found for keyword: {keyword}")
                return {"status": "warning", "message": f"⚠️ No locations found for: {keyword}"}
            
            formatted_locations = self.format_location_results(location_data)
            logging.info(f"Here are the locations: {location_data}")
            logging.info(f"Found {len(formatted_locations)} locations for keyword: {keyword}")
            
            return {
                "status": "success", 
                "message": "✅ Locations retrieved successfully", 
                "locations": formatted_locations
            }
            
        except Exception as e:
            logging.error(f"Error searching locations for {keyword}: {str(e)}", exc_info=True)
            return {"status": "error", "message": f"❌ Location search error: {str(e)}"}


    def format_location_results(self, data: List[Dict[str, Any]]) -> List[str]:
        """Format location data into a list of airport/city names with IATA codes."""
        result = []
        for location in data:
            formatted_entry = f"{location.get('iataCode', 'N/A')}, {location.get('name', 'Unknown')}"
            result.append(formatted_entry)
        
        # Remove duplicates while preserving order
        unique_results = list(dict.fromkeys(result))
        logging.debug(f"Formatted {len(data)} locations into {len(unique_results)} unique entries")
        
        return unique_results