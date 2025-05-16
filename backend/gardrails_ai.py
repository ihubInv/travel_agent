# flight_argument_validator.py

import re
import json
import datetime
from typing import Dict, Any, Optional, List, Union
from guardrails import Guard
from guardrails.hub import FreeformStringCheck, DateFormatCheck, EnumCheck, IntegerCheck

class FlightArgumentValidator:
    """
    A validator agent that serves as middleware between the router agent and route agents.
    It validates function arguments against user queries before passing them to flight-related functions.
    """
    
    def __init__(self):
        # List of valid airport IATA codes (abbreviated example, would be much larger in production)
        self.valid_iata_codes = [
            "DEL", "BOM", "GOI", "CCU", "MAA", "BLR", "HYD", "COK", "PNQ", "AMD",
            "JFK", "LAX", "ORD", "DFW", "LHR", "CDG", "DXB", "SIN", "HKG", "SYD"
        ]
        
        # List of common city names and their corresponding airports (abbreviated)
        self.city_to_airport = {
            "new delhi": "DEL",
            "delhi": "DEL",
            "mumbai": "BOM",
            "goa": "GOI",
            "kolkata": "CCU",
            "chennai": "MAA",
            "bangalore": "BLR",
            "bengaluru": "BLR",
            "hyderabad": "HYD",
            "kochi": "COK",
            "pune": "PNQ",
            "ahmedabad": "AMD",
            "new york": "JFK",
            "los angeles": "LAX",
            "chicago": "ORD",
            "dallas": "DFW",
            "london": "LHR",
            "paris": "CDG",
            "dubai": "DXB",
            "singapore": "SIN",
            "hong kong": "HKG",
            "sydney": "SYD"
        }
        
        # Valid cabin classes
        self.valid_cabin_classes = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]
        
        # Initialize guardrails validators
        self.initialize_validators()
        
    def initialize_validators(self):
        """Initialize various Guards for different validations"""
        # City name validator
        self.city_name_guard = Guard().use(
            FreeformStringCheck(
                min_length=2,
                max_length=50
            )
        )
        
        # IATA code validator
        self.iata_code_guard = Guard().use(
            EnumCheck(
                allowed_values=self.valid_iata_codes,
                on_fail="exception"
            )
        )
        
        # Date format validator
        self.date_format_guard = Guard().use(
            DateFormatCheck(
                format="%Y-%m-%d",
                on_fail="exception"
            )
        )
        
        # Cabin class validator
        self.cabin_class_guard = Guard().use(
            EnumCheck(
                allowed_values=self.valid_cabin_classes,
                on_fail="exception"
            )
        )
        
        # Passenger count validator
        self.passenger_count_guard = Guard().use(
            IntegerCheck(
                min_value=1,
                max_value=9,
                on_fail="exception"
            )
        )
    
    def validate_origin_airport_search(self, args: Dict[str, Any], user_query: str) -> Dict[str, Any]:
        """Validate arguments for origin_airport_search function"""
        validated_args = args.copy()
        
        try:
            # Check if city name is provided
            if 'origin_city_name' not in validated_args or not validated_args['origin_city_name']:
                # Try to extract city name from user query
                possible_cities = self._extract_cities_from_query(user_query)
                if possible_cities:
                    validated_args['origin_city_name'] = possible_cities[0]
                else:
                    raise ValueError("Origin city name is required but not provided")
            
            # Validate city name format
            self.city_name_guard.validate(validated_args['origin_city_name'])
            
            # Check for spelling mistakes and correct them
            validated_args['origin_city_name'] = self._correct_city_spelling(validated_args['origin_city_name'])
            
            return {"function": "flight-origin_airport_search", "args": validated_args}
        
        except Exception as e:
            raise ValueError(f"Origin airport search validation failed: {str(e)}")
    
    def validate_destination_airport_search(self, args: Dict[str, Any], user_query: str) -> Dict[str, Any]:
        """Validate arguments for destination_airport_search function"""
        validated_args = args.copy()
        
        try:
            # Check if city name is provided
            if 'destination_city_name' not in validated_args or not validated_args['destination_city_name']:
                # Try to extract city name from user query
                possible_cities = self._extract_cities_from_query(user_query)
                if len(possible_cities) > 1:
                    validated_args['destination_city_name'] = possible_cities[1]
                elif possible_cities:
                    raise ValueError("Destination city seems to be missing. Query has only one city mentioned.")
                else:
                    raise ValueError("Destination city name is required but not provided")
            
            # Validate city name format
            self.city_name_guard.validate(validated_args['destination_city_name'])
            
            # Check for spelling mistakes and correct them
            validated_args['destination_city_name'] = self._correct_city_spelling(validated_args['destination_city_name'])
            
            return {"function": "flight-destination_airport_search", "args": validated_args}
        
        except Exception as e:
            raise ValueError(f"Destination airport search validation failed: {str(e)}")
    
    def validate_search_flights(self, args: Dict[str, Any], user_query: str) -> Dict[str, Any]:
        """Validate arguments for search_flights function"""
        validated_args = args.copy()
        current_date = datetime.datetime.now()
        
        try:
            # Validate required parameters
            if 'origin_IATA_code' not in validated_args or not validated_args['origin_IATA_code']:
                raise ValueError("Origin IATA code is required")
            
            if 'destination_IATA_code' not in validated_args or not validated_args['destination_IATA_code']:
                raise ValueError("Destination IATA code is required")
            
            if 'departure_date' not in validated_args or not validated_args['departure_date']:
                # Try to extract date from user query
                extracted_date = self._extract_date_from_query(user_query)
                if extracted_date:
                    validated_args['departure_date'] = extracted_date
                else:
                    # Default to tomorrow if no date provided
                    tomorrow = current_date + datetime.timedelta(days=1)
                    validated_args['departure_date'] = tomorrow.strftime('%Y-%m-%d')
            
            # Validate IATA codes
            validated_args['origin_IATA_code'] = validated_args['origin_IATA_code'].upper()
            validated_args['destination_IATA_code'] = validated_args['destination_IATA_code'].upper()
            
            self.iata_code_guard.validate(validated_args['origin_IATA_code'])
            self.iata_code_guard.validate(validated_args['destination_IATA_code'])
            
            # Validate date format
            self.date_format_guard.validate(validated_args['departure_date'])
            
            # Ensure departure date is not in the past
            departure_date = datetime.datetime.strptime(validated_args['departure_date'], '%Y-%m-%d')
            if departure_date.date() < current_date.date():
                # Set to tomorrow if date is in the past
                tomorrow = current_date + datetime.timedelta(days=1)
                validated_args['departure_date'] = tomorrow.strftime('%Y-%m-%d')
            
            # Set default values for optional parameters
            if 'passengers' not in validated_args or not validated_args['passengers']:
                validated_args['passengers'] = 1
            else:
                validated_args['passengers'] = int(validated_args['passengers'])
                self.passenger_count_guard.validate(validated_args['passengers'])
            
            if 'cabin_class' not in validated_args or not validated_args['cabin_class']:
                validated_args['cabin_class'] = "ECONOMY"
            else:
                validated_args['cabin_class'] = validated_args['cabin_class'].upper()
                self.cabin_class_guard.validate(validated_args['cabin_class'])
            
            return {"function": "flight-search_flights", "args": validated_args}
        
        except Exception as e:
            raise ValueError(f"Search flights validation failed: {str(e)}")
    
    def validate_book_flight(self, args: Dict[str, Any], user_query: str) -> Dict[str, Any]:
        """Validate arguments for book_flight function"""
        validated_args = args.copy()
        
        try:
            # Check if flight_offer_id is provided
            if 'flight_offer_id' not in validated_args or not validated_args['flight_offer_id']:
                # Try to extract flight_offer_id from user query
                flight_id = self._extract_flight_id_from_query(user_query)
                if flight_id:
                    validated_args['flight_offer_id'] = flight_id
                else:
                    raise ValueError("Flight offer ID is required but not provided")
            
            # Ensure flight_offer_id is a string
            validated_args['flight_offer_id'] = str(validated_args['flight_offer_id'])
            
            return {"function": "flight-book_flight", "args": validated_args}
        
        except Exception as e:
            raise ValueError(f"Book flight validation failed: {str(e)}")
    
    def validate(self, function_name: str, args: Dict[str, Any], user_query: str) -> Dict[str, Any]:
        """Main validation method that routes to specific validators based on function name"""
        if function_name == "flight-origin_airport_search":
            return self.validate_origin_airport_search(args, user_query)
        elif function_name == "flight-destination_airport_search":
            return self.validate_destination_airport_search(args, user_query)
        elif function_name == "flight-search_flights":
            return self.validate_search_flights(args, user_query)
        elif function_name == "flight-book_flight":
            return self.validate_book_flight(args, user_query)
        else:
            raise ValueError(f"Unknown function: {function_name}")
    
    def _correct_city_spelling(self, city_name: str) -> str:
        """Correct common spelling mistakes in city names"""
        city_name = city_name.lower()
        
        # Simple spelling corrections for common cities
        corrections = {
            "deli": "delhi",
            "delihi": "delhi",
            "mumba": "mumbai",
            "bombay": "mumbai",
            "banglore": "bangalore",
            "bangluru": "bengaluru",
            "calcutta": "kolkata",
            "madras": "chennai",
            "cochin": "kochi",
            "poona": "pune",
            "goaa": "goa",
            "gowa": "goa"
        }
        
        if city_name in corrections:
            return corrections[city_name]
        
        # Check for best match if direct match not found
        for correct_name in self.city_to_airport.keys():
            # Simple fuzzy matching - if a substantial portion of letters match
            if len(set(city_name) & set(correct_name)) >= min(3, len(city_name) * 0.7):
                return correct_name
        
        return city_name
    
    def _extract_cities_from_query(self, query: str) -> List[str]:
        """Extract potential city names from user query"""
        query = query.lower()
        found_cities = []
        
        for city in self.city_to_airport.keys():
            if city in query:
                found_cities.append(city)
        
        return found_cities
    
    def _extract_date_from_query(self, query: str) -> Optional[str]:
        """Extract date from user query using regex patterns"""
        # Check for ISO format dates (YYYY-MM-DD)
        iso_pattern = r'\b\d{4}-\d{2}-\d{2}\b'
        iso_matches = re.findall(iso_pattern, query)
        if iso_matches:
            return iso_matches[0]
        
        # Check for other common date formats and convert to ISO
        # DD/MM/YYYY or MM/DD/YYYY
        slash_pattern = r'\b(\d{1,2})/(\d{1,2})/(\d{4})\b'
        slash_matches = re.findall(slash_pattern, query)
        if slash_matches:
            day, month, year = slash_matches[0]
            try:
                # Try to parse as DD/MM/YYYY
                date_obj = datetime.datetime(int(year), int(month), int(day))
                return date_obj.strftime('%Y-%m-%d')
            except ValueError:
                try:
                    # Try to parse as MM/DD/YYYY
                    date_obj = datetime.datetime(int(year), int(day), int(month))
                    return date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    pass
        
        # Check for date keywords
        current_date = datetime.datetime.now()
        if "today" in query.lower():
            return current_date.strftime('%Y-%m-%d')
        elif "tomorrow" in query.lower():
            next_day = current_date + datetime.timedelta(days=1)
            return next_day.strftime('%Y-%m-%d')
        elif "next week" in query.lower():
            next_week = current_date + datetime.timedelta(days=7)
            return next_week.strftime('%Y-%m-%d')
        
        return None
    
    def _extract_flight_id_from_query(self, query: str) -> Optional[str]:
        """Extract flight offer ID from user query"""
        # Look for patterns like "flight #123", "offer 123", etc.
        id_patterns = [
            r'flight\s+(?:#|number|no\.?|id)?\s*(\d+)',
            r'(?:book|select)\s+(?:flight|offer)?\s*(?:#|number|no\.?|id)?\s*(\d+)',
            r'(?:flight|offer)\s+(?:#|number|no\.?|id)?\s*(\d+)',
            r'(?:#|number|no\.?|id)\s*(\d+)'
        ]
        
        for pattern in id_patterns:
            matches = re.search(pattern, query, re.IGNORECASE)
            if matches:
                return matches.group(1)
        
        return None


# Example usage
def example_usage():
    validator = FlightArgumentValidator()
    
    # Test case 1: Origin airport search
    print("Example 1: Origin airport search")
    try:
        user_query = "Find flights from New Deli to Mumbai"
        args = {"origin_city_name": "New Deli"}
        result = validator.validate("flight-origin_airport_search", args, user_query)
        print(f"Validated args: {json.dumps(result, indent=2)}")
    except ValueError as e:
        print(f"Validation error: {str(e)}")
    
    # Test case 2: Destination airport search
    print("\nExample 2: Destination airport search")
    try:
        user_query = "I want to fly from Delhi to Banglore next week"
        args = {"destination_city_name": "Banglore"}
        result = validator.validate("flight-destination_airport_search", args, user_query)
        print(f"Validated args: {json.dumps(result, indent=2)}")
    except ValueError as e:
        print(f"Validation error: {str(e)}")
    
    # Test case 3: Search flights with invalid date
    print("\nExample 3: Search flights with invalid date")
    try:
        user_query = "Find flights from Delhi to Mumbai on 2023-01-01"
        args = {
            "origin_IATA_code": "DEL",
            "destination_IATA_code": "BOM",
            "departure_date": "2023-01-01",
            "passengers": 2,
            "cabin_class": "economy"
        }
        result = validator.validate("flight-search_flights", args, user_query)
        print(f"Validated args: {json.dumps(result, indent=2)}")
    except ValueError as e:
        print(f"Validation error: {str(e)}")
    
    # Test case 4: Book flight
    print("\nExample 4: Book flight")
    try:
        user_query = "Book flight number 12345"
        args = {}  # Empty args to test extraction from query
        result = validator.validate("flight-book_flight", args, user_query)
        print(f"Validated args: {json.dumps(result, indent=2)}")
    except ValueError as e:
        print(f"Validation error: {str(e)}")


if __name__ == "__main__":
    example_usage()