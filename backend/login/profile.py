from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime
import logging
from werkzeug.security import check_password_hash, generate_password_hash
from .auth import token_required
from werkzeug.utils import secure_filename
import os

logger = logging.getLogger(__name__)

profile_bp = Blueprint('profile', __name__)

@profile_bp.route("/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    try:
        logger.debug(f"Fetching profile for user: {current_user['_id']}")
        
        # Get user's profile data
        user_data = {
            "id": str(current_user["_id"]),
            "name": current_user["name"],
            "email": current_user["email"],
            "username": current_user.get("username"),
            "avatar": current_user.get("avatar"),
            "created_at": current_user.get("created_at", datetime.utcnow().isoformat())
        }
        
        # Get counts of related data
        try:
            user_data["stats"] = {
                "flights": current_app.mongo.db.flights.count_documents({"user_id": current_user["_id"]}),
                "chats": current_app.mongo.db.chats.count_documents({"user_id": current_user["_id"]}),
                "cards": current_app.mongo.db.cards.count_documents({"user_id": current_user["_id"]})
            }
        except Exception as e:
            logger.warning(f"Error fetching user stats: {str(e)}")
            user_data["stats"] = {
                "flights": 0,
                "chats": 0,
                "cards": 0
            }
        
        logger.info(f"Successfully fetched profile for user: {current_user['_id']}")
        return jsonify({
            "success": True,
            "data": user_data
        })
    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to fetch profile",
            "details": str(e)
        }), 500

@profile_bp.route("/update-profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400
        
        # Update user data
        update_data = {}
        
        if "name" in data:
            update_data["name"] = data["name"]
        
        if "email" in data:
            # Check if email is already taken
            existing_user = current_app.mongo.db.users.find_one({
                "email": data["email"],
                "_id": {"$ne": current_user["_id"]}
            })
            
            if existing_user:
                return jsonify({
                    "success": False,
                    "error": "Email already in use"
                }), 400
            
            update_data["email"] = data["email"]
        
        # Handle password change if provided
        if "currentPassword" in data and "newPassword" in data:
            # Verify current password
            if not check_password_hash(current_user["password"], data["currentPassword"]):
                return jsonify({
                    "success": False,
                    "error": "Current password is incorrect"
                }), 400
            
            # Update password
            update_data["password"] = generate_password_hash(data["newPassword"])
        
        # Update user in database
        if update_data:
            current_app.mongo.db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": update_data}
            )
            
            # Get updated user data
            updated_user = current_app.mongo.db.users.find_one({"_id": current_user["_id"]})
            
            return jsonify({
                "success": True,
                "data": {
                    "id": str(updated_user["_id"]),
                    "name": updated_user["name"],
                    "email": updated_user["email"],
                    "username": updated_user.get("username"),
                    "avatar": updated_user.get("avatar")
                }
            })
        else:
            return jsonify({
                "success": False,
                "error": "No valid fields to update"
            }), 400
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/cards", methods=["GET"])
@token_required
def get_cards(current_user):
    try:
        cards = list(current_app.mongo.db.cards.find({"user_id": current_user["_id"]}).sort("created_at", -1))
        return jsonify({
            "success": True,
            "data": [{
                "id": str(card["_id"]),
                "cardNumber": card["cardNumber"],
                "expiryDate": card["expiryDate"],
                "cardType": card["cardType"],
                "created_at": card.get("created_at", datetime.utcnow().isoformat())
            } for card in cards]
        })
    except Exception as e:
        logger.error(f"Error fetching cards: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/cards", methods=["POST"])
@token_required
def add_card(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ["cardNumber", "expiryDate", "cardType"]):
            return jsonify({
                "success": False,
                "error": "Missing required fields"
            }), 400
        
        # Create new card
        card_data = {
            "user_id": current_user["_id"],
            "cardNumber": data["cardNumber"],
            "expiryDate": data["expiryDate"],
            "cardType": data["cardType"],
            "created_at": datetime.utcnow()
        }
        
        # Insert card into database
        result = current_app.mongo.db.cards.insert_one(card_data)
        
        # Get the inserted card
        card = current_app.mongo.db.cards.find_one({"_id": result.inserted_id})
        
        return jsonify({
            "success": True,
            "data": {
                "id": str(card["_id"]),
                "cardNumber": card["cardNumber"],
                "expiryDate": card["expiryDate"],
                "cardType": card["cardType"],
                "created_at": card.get("created_at", datetime.utcnow().isoformat())
            }
        })
    except Exception as e:
        logger.error(f"Error adding card: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/cards/<card_id>", methods=["PUT"])
@token_required
def update_card(current_user, card_id):
    try:
        # Check if card exists and belongs to user
        card = current_app.mongo.db.cards.find_one({
            "_id": ObjectId(card_id),
            "user_id": current_user["_id"]
        })
        
        if not card:
            return jsonify({
                "success": False,
                "error": "Card not found"
            }), 404
        
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ["cardNumber", "expiryDate", "cardType"]):
            return jsonify({
                "success": False,
                "error": "Missing required fields"
            }), 400
        
        # Update card
        update_data = {
            "cardNumber": data["cardNumber"],
            "expiryDate": data["expiryDate"],
            "cardType": data["cardType"],
            "updated_at": datetime.utcnow()
        }
        
        current_app.mongo.db.cards.update_one(
            {"_id": ObjectId(card_id)},
            {"$set": update_data}
        )
        
        # Get updated card
        updated_card = current_app.mongo.db.cards.find_one({"_id": ObjectId(card_id)})
        
        return jsonify({
            "success": True,
            "data": {
                "id": str(updated_card["_id"]),
                "cardNumber": updated_card["cardNumber"],
                "expiryDate": updated_card["expiryDate"],
                "cardType": updated_card["cardType"],
                "created_at": updated_card.get("created_at", datetime.utcnow().isoformat())
            }
        })
    except Exception as e:
        logger.error(f"Error updating card: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/cards/<card_id>", methods=["DELETE"])
@token_required
def delete_card(current_user, card_id):
    try:
        # Check if card exists and belongs to user
        card = current_app.mongo.db.cards.find_one({
            "_id": ObjectId(card_id),
            "user_id": current_user["_id"]
        })
        
        if not card:
            return jsonify({
                "success": False,
                "error": "Card not found"
            }), 404
        
        # Delete card
        current_app.mongo.db.cards.delete_one({"_id": ObjectId(card_id)})
        
        return jsonify({
            "success": True,
            "message": "Card deleted successfully"
        })
    except Exception as e:
        logger.error(f"Error deleting card: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/chats", methods=["GET"])
@token_required
def get_chats(current_user):
    try:
        chats = list(current_app.mongo.db.chats.find({"user_id": current_user["_id"]}).sort("created_at", -1))
        return jsonify({
            "success": True,
            "data": [{
                "id": str(chat["_id"]),
                "message": chat["message"],
                "response": chat["response"],
                "created_at": chat.get("created_at", datetime.utcnow().isoformat())
            } for chat in chats]
        })
    except Exception as e:
        logger.error(f"Error fetching chats: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/chats/<chat_id>", methods=["DELETE"])
@token_required
def delete_chat(current_user, chat_id):
    try:
        # Check if chat exists and belongs to user
        chat = current_app.mongo.db.chats.find_one({
            "_id": ObjectId(chat_id),
            "user_id": current_user["_id"]
        })
        
        if not chat:
            return jsonify({
                "success": False,
                "error": "Chat not found"
            }), 404
        
        # Delete chat
        current_app.mongo.db.chats.delete_one({"_id": ObjectId(chat_id)})
        
        return jsonify({
            "success": True,
            "message": "Chat deleted successfully"
        })
    except Exception as e:
        logger.error(f"Error deleting chat: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/delete-account", methods=["DELETE"])
@token_required
def delete_account(current_user):
    try:
        # Delete user's data
        current_app.mongo.db.users.delete_one({"_id": current_user["_id"]})
        current_app.mongo.db.cards.delete_many({"user_id": current_user["_id"]})
        current_app.mongo.db.chats.delete_many({"user_id": current_user["_id"]})
        current_app.mongo.db.flights.delete_many({"user_id": current_user["_id"]})
        current_app.mongo.db.preferences.delete_many({"user_id": current_user["_id"]})
        
        return jsonify({
            "success": True,
            "message": "Account deleted successfully"
        })
    except Exception as e:
        logger.error(f"Error deleting account: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/upload-profile-image", methods=["POST"])
@token_required
def upload_profile_image(current_user):
    try:
        if "image" not in request.files:
            return jsonify({
                "success": False,
                "error": "No image file provided"
            }), 400
        
        file = request.files["image"]
        
        if file.filename == "":
            return jsonify({
                "success": False,
                "error": "No selected file"
            }), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add user ID to filename to make it unique
            filename = f"{current_user['_id']}_{filename}"
            
            # Save file to uploads directory
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
            file.save(file_path)
            
            # Update user's avatar in database
            avatar_url = f"/uploads/{filename}"
            current_app.mongo.db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"avatar": avatar_url}}
            )
            
            return jsonify({
                "success": True,
                "data": {
                    "avatar": avatar_url
                }
            })
        else:
            return jsonify({
                "success": False,
                "error": "File type not allowed"
            }), 400
    except Exception as e:
        logger.error(f"Error uploading profile image: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# New endpoints for flight history
@profile_bp.route("/flights", methods=["GET"])
@token_required
def get_flights(current_user):
    try:
        flights = list(current_app.mongo.db.flights.find({"user_id": current_user["_id"]}).sort("date", -1))
        return jsonify({
            "success": True,
            "data": [{
                "id": str(flight["_id"]),
                "from": flight["from"],
                "to": flight["to"],
                "date": flight["date"],
                "passengers": flight["passengers"],
                "class": flight["class"],
                "status": flight["status"],
                "created_at": flight.get("created_at", datetime.utcnow().isoformat()),
                "airline": flight.get("airline", ""),
                "flightNumber": flight.get("flightNumber", ""),
                "departureTime": flight.get("departureTime", ""),
                "arrivalTime": flight.get("arrivalTime", ""),
                "duration": flight.get("duration", ""),
                "price": flight.get("price", 0)
            } for flight in flights]
        })
    except Exception as e:
        logger.error(f"Error fetching flights: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/flights/<flight_id>", methods=["GET"])
@token_required
def get_flight_by_id(current_user, flight_id):
    try:
        flight = current_app.mongo.db.flights.find_one({
            "_id": ObjectId(flight_id),
            "user_id": current_user["_id"]
        })
        
        if not flight:
            return jsonify({
                "success": False,
                "error": "Flight not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": {
                "id": str(flight["_id"]),
                "from": flight["from"],
                "to": flight["to"],
                "date": flight["date"],
                "passengers": flight["passengers"],
                "class": flight["class"],
                "status": flight["status"],
                "created_at": flight.get("created_at", datetime.utcnow().isoformat()),
                "airline": flight.get("airline", ""),
                "flightNumber": flight.get("flightNumber", ""),
                "departureTime": flight.get("departureTime", ""),
                "arrivalTime": flight.get("arrivalTime", ""),
                "duration": flight.get("duration", ""),
                "price": flight.get("price", 0)
            }
        })
    except Exception as e:
        logger.error(f"Error fetching flight: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/flights/<flight_id>", methods=["DELETE"])
@token_required
def delete_flight(current_user, flight_id):
    try:
        # Check if flight exists and belongs to user
        flight = current_app.mongo.db.flights.find_one({
            "_id": ObjectId(flight_id),
            "user_id": current_user["_id"]
        })
        
        if not flight:
            return jsonify({
                "success": False,
                "error": "Flight not found"
            }), 404
        
        # Delete flight
        current_app.mongo.db.flights.delete_one({"_id": ObjectId(flight_id)})
        
        return jsonify({
            "success": True,
            "message": "Flight deleted successfully"
        })
    except Exception as e:
        logger.error(f"Error deleting flight: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# New endpoints for user preferences
@profile_bp.route("/preferences", methods=["GET"])
@token_required
def get_preferences(current_user):
    try:
        preferences = current_app.mongo.db.preferences.find_one({"user_id": current_user["_id"]})
        
        if not preferences:
            # Return default preferences if none exist
            return jsonify({
                "success": True,
                "data": {
                    "flightPreferences": {
                        "pricePreference": "balanced",
                        "stopPreference": "any",
                        "departureTimePreference": "any",
                        "mealPreference": "any",
                        "classPreference": "any"
                    },
                    "passengers": []
                }
            })
        
        return jsonify({
            "success": True,
            "data": {
                "flightPreferences": preferences.get("flightPreferences", {}),
                "passengers": preferences.get("passengers", [])
            }
        })
    except Exception as e:
        logger.error(f"Error fetching preferences: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/preferences", methods=["PUT"])
@token_required
def update_preferences(current_user):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400
        
        # Check if preferences exist
        preferences = current_app.mongo.db.preferences.find_one({"user_id": current_user["_id"]})
        
        if preferences:
            # Update existing preferences
            update_data = {}
            
            if "flightPreferences" in data:
                update_data["flightPreferences"] = data["flightPreferences"]
            
            if "passengers" in data:
                update_data["passengers"] = data["passengers"]
            
            current_app.mongo.db.preferences.update_one(
                {"user_id": current_user["_id"]},
                {"$set": update_data}
            )
        else:
            # Create new preferences
            preferences_data = {
                "user_id": current_user["_id"],
                "flightPreferences": data.get("flightPreferences", {}),
                "passengers": data.get("passengers", []),
                "created_at": datetime.utcnow()
            }
            
            current_app.mongo.db.preferences.insert_one(preferences_data)
        
        # Get updated preferences
        updated_preferences = current_app.mongo.db.preferences.find_one({"user_id": current_user["_id"]})
        
        return jsonify({
            "success": True,
            "data": {
                "flightPreferences": updated_preferences.get("flightPreferences", {}),
                "passengers": updated_preferences.get("passengers", [])
            }
        })
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/preferences/passengers", methods=["POST"])
@token_required
def add_passenger(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ["name", "passportNumber", "nationality", "dateOfBirth"]):
            return jsonify({
                "success": False,
                "error": "Missing required fields"
            }), 400
        
        # Check if preferences exist
        preferences = current_app.mongo.db.preferences.find_one({"user_id": current_user["_id"]})
        
        if not preferences:
            # Create new preferences with passenger
            passenger_data = {
                "id": str(ObjectId()),
                "name": data["name"],
                "passportNumber": data["passportNumber"],
                "nationality": data["nationality"],
                "dateOfBirth": data["dateOfBirth"],
                "created_at": datetime.utcnow().isoformat()
            }
            
            preferences_data = {
                "user_id": current_user["_id"],
                "flightPreferences": {},
                "passengers": [passenger_data],
                "created_at": datetime.utcnow()
            }
            
            current_app.mongo.db.preferences.insert_one(preferences_data)
            
            return jsonify({
                "success": True,
                "data": passenger_data
            })
        else:
            # Add passenger to existing preferences
            passenger_data = {
                "id": str(ObjectId()),
                "name": data["name"],
                "passportNumber": data["passportNumber"],
                "nationality": data["nationality"],
                "dateOfBirth": data["dateOfBirth"],
                "created_at": datetime.utcnow().isoformat()
            }
            
            current_app.mongo.db.preferences.update_one(
                {"user_id": current_user["_id"]},
                {"$push": {"passengers": passenger_data}}
            )
            
            return jsonify({
                "success": True,
                "data": passenger_data
            })
    except Exception as e:
        logger.error(f"Error adding passenger: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/preferences/passengers/<passenger_id>", methods=["PUT"])
@token_required
def update_passenger(current_user, passenger_id):
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ["name", "passportNumber", "nationality", "dateOfBirth"]):
            return jsonify({
                "success": False,
                "error": "Missing required fields"
            }), 400
        
        # Find preferences with the passenger
        preferences = current_app.mongo.db.preferences.find_one({
            "user_id": current_user["_id"],
            "passengers.id": passenger_id
        })
        
        if not preferences:
            return jsonify({
                "success": False,
                "error": "Passenger not found"
            }), 404
        
        # Update passenger
        current_app.mongo.db.preferences.update_one(
            {
                "user_id": current_user["_id"],
                "passengers.id": passenger_id
            },
            {
                "$set": {
                    "passengers.$.name": data["name"],
                    "passengers.$.passportNumber": data["passportNumber"],
                    "passengers.$.nationality": data["nationality"],
                    "passengers.$.dateOfBirth": data["dateOfBirth"]
                }
            }
        )
        
        # Get updated passenger
        updated_preferences = current_app.mongo.db.preferences.find_one({
            "user_id": current_user["_id"],
            "passengers.id": passenger_id
        })
        
        updated_passenger = next(
            (p for p in updated_preferences["passengers"] if p["id"] == passenger_id),
            None
        )
        
        return jsonify({
            "success": True,
            "data": updated_passenger
        })
    except Exception as e:
        logger.error(f"Error updating passenger: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@profile_bp.route("/preferences/passengers/<passenger_id>", methods=["DELETE"])
@token_required
def delete_passenger(current_user, passenger_id):
    try:
        # Find preferences with the passenger
        preferences = current_app.mongo.db.preferences.find_one({
            "user_id": current_user["_id"],
            "passengers.id": passenger_id
        })
        
        if not preferences:
            return jsonify({
                "success": False,
                "error": "Passenger not found"
            }), 404
        
        # Delete passenger
        current_app.mongo.db.preferences.update_one(
            {"user_id": current_user["_id"]},
            {"$pull": {"passengers": {"id": passenger_id}}}
        )
        
        return jsonify({
            "success": True,
            "message": "Passenger deleted successfully"
        })
    except Exception as e:
        logger.error(f"Error deleting passenger: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS 