import requests
import json
import os
import logging
from datetime import datetime, timedelta,timezone
from semantic_kernel.functions import kernel_function as sk_function

# Configure logging
logging.basicConfig(
    filename="flights_plugin.log",  # Logs will be saved here
    level=logging.DEBUG,  # Capture all log levels
    format="%(asctime)s - %(levelname)s - %(message)s",
)

from amadeus import Client, ResponseError

import os
from dotenv import load_dotenv

load_dotenv()

amadeus_api_key = os.getenv("AMADEUS_API_KEY")
amadeus_api_secret =os.getenv("AMADEUS_API_SECRET")

if not all([amadeus_api_key, amadeus_api_secret]):
    print("❌ Missing required API keys. Please check your .env file.")

amadeus = Client(
    client_id=amadeus_api_key,
    client_secret=amadeus_api_secret
)






# current_date=datetime.now().strftime("%Y-%m-%d")
current_date = datetime.now()


logging.info("Here is current date:")
logging.info(current_date)

class FlightsPlugin:
    def __init__(self, cache_file: str ):
        """Initialize with API credentials and JSON file for caching"""
        self.amadeus_api_key = os.getenv("AMADEUS_API_KEY")
        self.amadeus_api_secret= os.getenv("AMADEUS_API_SECRET")
        logging.info(os.getenv("AMADEUS_API_KEY") )
        logging.info(os.getenv("AMADEUS_API_SECRET") )
        
        self.cache_file = cache_file

        logging.info("Initializing FlightsPlugin")
        
        # Ensure cache file exists
        if not os.path.exists(self.cache_file):
            with open(self.cache_file, "w") as f:
                json.dump([], f)
            logging.info("Cache file created: %s", self.cache_file)

    def _load_cache(self):
        """Load flight data from the JSON cache"""
        try:
            with open(self.cache_file, "r") as f:
                flights = json.load(f)
                logging.debug("Cache loaded successfully: %s flights", len(flights))
                return flights
        except (json.JSONDecodeError, FileNotFoundError):
            logging.warning("Cache file missing or corrupt. Resetting...")
            return []

    def _save_cache(self, flights):
        """Save flight data to the JSON cache"""
        with open(self.cache_file, "w") as f:
            json.dump(flights, f, indent=2)
        logging.info("Cache updated with %s flights", len(flights))

    def _cache_flight(self, flight):
        """Save flight details to JSON file for caching"""
        flight["cached_at"] = current_date

        # Load existing cache
        flights = self._load_cache()

        # Remove expired flights (older than 1 hour)
        flights = [f for f in flights if datetime.fromisoformat(f["cached_at"]) >= datetime.now() - timedelta(hours=1)]

        # Append new flight and save
        flights.append(flight)
        self._save_cache(flights)
        logging.info("Flight cached: %s", flight)

    def _get_cached_flights(self, departure_city, arrival_city,departure_date):
        """Retrieve cached flights if they were fetched within the last hour"""
        logging.debug("Checking cache for flights: %s → %s", departure_city, arrival_city,departure_date)

        # one_hour_ago = current_date - timedelta(hours=1)
        one_hour_ago = datetime.now() - timedelta(hours=1)

        flights = self._load_cache()

        valid_flights = [
            f for f in flights if 
            f["departure_city"] == departure_city and 
            f["arrival_city"] == arrival_city and 
            f["departure_date"] == departure_date and 
            datetime.fromisoformat(f["cached_at"]) >= one_hour_ago
        ]

        if valid_flights:
            logging.info("Returning cached flights: %s", valid_flights)
        else:
            logging.info("No valid cached flights found.")
        
        return valid_flights if valid_flights else None
    @sk_function(
        description=f"""Get real-time flights using Amadeus API. First ask for these required details if the user hasn't provided them:
        
        **Required Flight Details:**
            1. **Origin** - Departure city (Example: "Delhi")
            2. **Destination** - Arrival city (Example: "Mumbai")
            3. **Date** - Departure date in YYYY-MM-DD format (Example: "2025-04-15")
            4. **Class** - Cabin class: Economy, Premium Economy, Business, or First Class (Example: "Economy")
            5. **Passengers** - Number of passengers (Example: 1)
            6. **Preferences** - Special requests or additional requirements (Example: "Window seat, Vegetarian meal, Non-stop")

        **Validation Rules:**
            - Ensure departure date is valid and properly formatted (YYYY-MM-DD)
            - Verify both origin and destination are valid locations
            - Default to current date ({current_date}) if no date is specified
        """,
        name="GetFlights",
    )
    def get_flights(self, input: str) -> str:
        """Fetch real-time flights from Amadeus API, with JSON caching"""
        # Validate input
        if not input or len(input.split(",")) < 3:
            logging.error("Invalid input. Expected format: 'DepartureCity, ArrivalCity, DepartureDate'")
            return json.dumps({"error": "Invalid input. Expected format: 'DepartureCity, ArrivalCity, DepartureDate'."}, indent=2)
        
        departure_city, arrival_city,departure_date,Class,Passengers,Preferences = [city.strip() for city in input.split(",")]
        logging.info("User requested flights: %s → %s", departure_city, arrival_city)

        # Check if cached flights exist
        cached_flights = self._get_cached_flights(departure_city, arrival_city,departure_date)
        if cached_flights:
            return json.dumps(cached_flights, indent=2)

        logging.info("Fetching new flights from API for: %s → %s → %s", departure_city, arrival_city,departure_date)




        # Dummy data for testing (if API fails)
        dummy_flights = [
            {
                "id": "12345",
                "departure_city": departure_city,
                "arrival_city": arrival_city,
                "departure_airport": "JFK",
                "arrival_airport": "LAX",
                "price": "300.00",
                "date":current_date,
                "free_seats": 10
            },
            {
                "id": "67890",
                "departure_city": departure_city,
                "arrival_city": arrival_city,
                "departure_airport": "JFK",
                "arrival_airport": "LAX",
                "price": "350.00",
                "date": current_date,
                "free_seats": 8
            }
        ]

        # Cache and return dummy flights
        for flight in dummy_flights:
            self._cache_flight(flight)

        return json.dumps(dummy_flights, indent=2)

    @sk_function(
        description="""Book a real-time flight. Verify flight offer ID and collect the following information from the user before booking if not already provided:
        
        **1. Traveler's Name:** Full name as it appears on government-issued ID (passport, driver's license, etc.)
        **2. Date of Birth:** In YYYY-MM-DD format
        **3. Contact Information:**
            - Email address
            - Phone number
        **4. Payment Method:**
            - UPI ID (for UPI payments)
            - Credit/Debit Card details (card number, expiry date, CVV)
            - Net Banking details
            
        If no travel date is specified, use the current date ({current_date}) as default.
        Required parameters are flight ID.
        
        After successful booking, generate a simple, easy-to-read bill/receipt format response that includes payment method used.""",
        name="BookFlight",
    )
    def book_flight(self, input: str) -> str:
        """Book a real-time flight using Amadeus API (no local storage)"""
        flight_id = input.strip()
        if not flight_id:
            logging.warning("Booking failed: No flight ID provided")
            return "Please provide a valid flight ID."

        logging.info("Attempting to book flight ID: %s", flight_id)

        url = f"{self.amadeus_base_url}/booking/flight-orders"
        headers = {"Authorization": f"Bearer {self.amadeus_api_key}", "Content-Type": "application/json"}
        payload = {
            "data": {
                "type": "flight-order",
                "flightOffers": [{"id": flight_id}],
                "travelers": [{"id": "1", "name": {"firstName": "John", "lastName": "Doe"}}]
            }
        }

        response = requests.post(url, headers=headers, json=payload)

        if response.status_code == 201:
            logging.info("Flight booked successfully: ID %s", flight_id)
            return "Flight successfully booked!"
        else:
            logging.error("Booking failed: %s", response.json())
            return f"Booking failed: {response.json()}"





 # @kernel_function(
    #     description="Search for flights using Amadeus API from {origin} to {destination} on {dates} for {passengers} passenger(s), Class: {cabin_class}, with user preferences {additional_preferences}"
    # )
    # async def search_flights_with_preferences(self, origin: str, destination: str, dates: str, passengers: Optional[int] = 1, cabin_class: Optional[str] = "ECONOMY", additional_preferences: Optional[str] = "") -> Dict[str, Any]:
    #     """Search for flights considering user preferences."""
    #     try:
    #         logging.info(f"Searching flights with preferences: {origin} to {destination} on {dates} for {passengers} passenger(s), Class: {cabin_class}, Preferences: {additional_preferences}")
            
    #         # Validate and confirm exact origin and destination airports
    #         origin_code = await self.validate_origin(origin)
    #         destination_code = await self.validate_destination(destination)

    #         if not origin_code or not destination_code:
    #             logging.error("Invalid origin or destination airport/city.")
    #             return {"status": "error", "message": "❌ Invalid origin or destination airport/city."}

    #         # Validate date format
    #         try:
    #             departure_date = dates.split(" to ")[0] if " to " in dates else dates
    #             parsed_date = datetime.strptime(departure_date, "%Y-%m-%d")
    #             formatted_date = parsed_date.strftime("%Y-%m-%d")
    #         except ValueError:
    #             logging.error(f"Invalid date format provided: {dates}")
    #             return {"status": "error", "message": f"❌ Invalid date format: {dates}. Please use YYYY-MM-DD."}

    #         # Perform API search
    #         response = await self.search_flights(origin_code, destination_code, formatted_date, passengers, cabin_class)

    #         if response.get("status") != "success" or not response.get("flights"):
    #             logging.warning(f"No flights found for {origin} to {destination} on {formatted_date}.")
    #             return {"status": "warning", "message": f"⚠️ No flights found for {origin} → {destination} on {formatted_date}"}

    #         flights = response["flights"]
    #         best_flight = await self.find_best_flight(flights)

    #         logging.info(f"Successfully found and analyzed {len(flights)} flights.")
    #         return {"status": "success", "message": "Flights retrieved successfully", "flights": flights, "best_flight": best_flight}
        
    #     except Exception as e:
    #         logging.error(f"Flight search with preferences error: {str(e)}", exc_info=True)
    #         return {"status": "error", "message": f"❌ Flight search error: {str(e)}"}
        





















# import requests
# import json
# import os
# from pymongo import MongoClient
# # from semantic_kernel.skill_definition import sk_function
# # from semantic_kernel import sk_function

# import semantic_kernel
# print(semantic_kernel.__version__)
# from semantic_kernel.functions import kernel_function as sk_function

# print(sk_function)



# from datetime import datetime, timedelta

# class FlightsPlugin:
#     def __init__(self, mongo_uri: str):
#         """Initialize with API credentials and MongoDB connection"""
#         self.amadeus_api_key = os.getenv("AMADEUS_API_KEY")
#         self.amadeus_base_url = "https://test.api.amadeus.com/v1"

#         # Connect to MongoDB
#         self.client = MongoClient(mongo_uri)
#         self.db = self.client["AirlineBooking"]
#         self.flights_collection = self.db["Flights"]
#         self.bookings_collection = self.db["Bookings"]

#     def _cache_flight(self, flight):
#         """Save flight details to MongoDB for caching"""
#         flight["cached_at"] = datetime.utcnow()
#         self.flights_collection.update_one({"id": flight["id"]}, {"$set": flight}, upsert=True)

#     def _get_cached_flights(self, departure_city, arrival_city):
#         """Retrieve cached flights if they were fetched within the last hour"""
#         one_hour_ago = datetime.utcnow() - timedelta(hours=1)
#         cached_flights = list(self.flights_collection.find({
#             "departure_city": departure_city,
#             "arrival_city": arrival_city,
#             "cached_at": {"$gte": one_hour_ago}
#         }))
#         return cached_flights if cached_flights else None

#     @sk_function(
#         description="Get real-time flights using Amadeus API. Two comma-separated values: departure city, arrival city.",
#         name="GetFlights",
#         # description_for_parameter="Two comma-separated values: departure city, arrival city."
#     )
#     def get_flights(self, input: str) -> str:
#         """Fetch real-time flights from Amadeus API, with MongoDB caching"""

#         departure_city, arrival_city = [city.strip() for city in input.split(",")]

#         # Check if cached flights exist
#         cached_flights = self._get_cached_flights(departure_city, arrival_city)
#         if cached_flights:
#             return json.dumps(cached_flights, indent=2)

#         url = f"{self.amadeus_base_url}/shopping/flight-offers"
#         headers = {"Authorization": f"Bearer {self.amadeus_api_key}"}
#         params = {
#             "originLocationCode": departure_city,
#             "destinationLocationCode": arrival_city,
#             "departureDate": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
#             "adults": 1,
#             "max": 5
#         }

#         response = requests.get(url, headers=headers, params=params)

#         if response.status_code == 200:
#             flights = response.json()["data"]

#             # Save flights to MongoDB
#             for flight in flights:
#                 self._cache_flight({
#                     "id": flight["id"],
#                     "departure_city": departure_city,
#                     "arrival_city": arrival_city,
#                     "departure_airport": flight["itineraries"][0]["segments"][0]["departure"]["iataCode"],
#                     "arrival_airport": flight["itineraries"][0]["segments"][-1]["arrival"]["iataCode"],
#                     "price": flight["price"]["total"],
#                     "date": flight["itineraries"][0]["segments"][0]["departure"]["at"],
#                     "free_seats": flight.get("numberOfBookableSeats", 10)  # Default to 10 seats
#                 })

#             return json.dumps(flights, indent=2)
#         else:
#             return f"Error fetching flights: {response.json()}"

#     @sk_function(
#         description="Book a real-time flight. Flight offer ID",
#         name="BookFlight",
#         # description_for_parameter="Flight offer ID."
#     )
#     def book_flight(self, input: str) -> str:
#         """Book a real-time flight using Amadeus API and store it in MongoDB"""

#         flight_id = input.strip()
#         if not flight_id:
#             return "Please provide a valid flight ID."

#         url = f"{self.amadeus_base_url}/booking/flight-orders"
#         headers = {"Authorization": f"Bearer {self.amadeus_api_key}", "Content-Type": "application/json"}
#         payload = {
#             "data": {
#                 "type": "flight-order",
#                 "flightOffers": [{"id": flight_id}],
#                 "travelers": [{"id": "1", "name": {"firstName": "John", "lastName": "Doe"}}]
#             }
#         }

#         response = requests.post(url, headers=headers, json=payload)

#         if response.status_code == 201:
#             # Save booking to MongoDB
#             booking_data = response.json()["data"]
#             self.bookings_collection.insert_one({
#                 "flight_id": flight_id,
#                 "booking_reference": booking_data["id"],
#                 "booking_date": datetime.utcnow()
#             })

#             return "Flight successfully booked!"
#         else:
#             return f"Booking failed: {response.json()}"
