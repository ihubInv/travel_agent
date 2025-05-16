from flask import Blueprint, current_app, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
from bson import ObjectId
from functools import wraps
import logging
from flask_mail import Message

from routes.google_auth import generate_token

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            logger.error("Token is missing in request headers")
            return jsonify({"success": False, "error": "Token is missing"}), 401
        try:
            # Extract token from "Bearer <token>"
            token = token.split(" ")[1]
            
            # Decode the token
            data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            
            # Convert string user_id to ObjectId
            try:
                user_id = ObjectId(data["user_id"])
            except Exception as e:
                logger.error(f"Invalid user_id format in token: {str(e)}")
                return jsonify({"success": False, "error": "Invalid token format"}), 401
            
            # Find the user
            current_user = current_app.mongo.db.users.find_one({"_id": user_id})
            if not current_user:
                logger.error(f"User not found for id: {user_id}")
                return jsonify({"success": False, "error": "User not found"}), 401
                
            return f(current_user, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            return jsonify({"success": False, "error": "Token has expired"}), 401
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {str(e)}")
            return jsonify({"success": False, "error": "Invalid token"}), 401
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return jsonify({"success": False, "error": "Token validation failed"}), 401
    return decorated

@auth_bp.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return jsonify(), 200
        
    try:
        data = request.get_json()
        logger.debug(f"Received registration data: {data}")
        
        if not data:
            logger.error("No data received in request")
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        required_fields = ["name", "email", "password"]
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({"success": False, "error": "Missing required fields", "fields": missing_fields}), 400
        
        # Validate email format
        if not "@" in data["email"] or not "." in data["email"]:
            logger.error(f"Invalid email format: {data['email']}")
            return jsonify({"success": False, "error": "Invalid email format"}), 400
        
        # Generate username from email
        username = data["email"].split('@')[0]
        
        # Check if user already exists by email
        existing_user = current_app.mongo.db.users.find_one({"email": data["email"]})
        if existing_user:
            logger.error(f"User with email {data['email']} already exists")
            return jsonify({"success": False, "error": "User with this email already exists"}), 409
        
        # Create new user
        hashed_password = generate_password_hash(data["password"])
        user_data = {
            "name": data["name"],
            "email": data["email"],
            "username": username,  # Add username field
            "password": hashed_password,
            "created_at": datetime.utcnow()
        }
        
        try:
            result = current_app.mongo.db.users.insert_one(user_data)
            user_id = result.inserted_id
            
            # Generate token
            token = generate_token(user_id)
            
            logger.info(f"User registered successfully: {data['email']}")
            return jsonify({
                "success": True,
                "data": {
                    "token": token,
                    "user": {
                        "id": str(user_id),
                        "name": data["name"],
                        "email": data["email"],
                        "username": username
                    }
                }
            }), 201
        except Exception as e:
            logger.error(f"Database error during registration: {str(e)}")
            return jsonify({"success": False, "error": "Database error during registration"}), 500
            
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ["email", "password"]):
            return jsonify({"success": False, "error": "Missing required fields"}), 400
            
        user = current_app.mongo.db.users.find_one({"email": data["email"]})
        
        if not user or not check_password_hash(user["password"], data["password"]):
            return jsonify({"success": False, "error": "Invalid credentials"}), 401
        
        token = generate_token(user["_id"])
        
        return jsonify({
            "success": True,
            "data": {
                "token": token,
                "user": {
                    "id": str(user["_id"]),
                    "name": user["name"],
                    "email": user["email"]
                }
            }
        })
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

# @auth_bp.route("/forgot-password", methods=["POST", "OPTIONS"])
# def forgot_password():
#     if request.method == "OPTIONS":
#         return jsonify(), 200
        
#     try:
#         data = request.get_json()
#         if not data or "email" not in data:
#             return jsonify({"success": False, "error": "Email is required"}), 400
            
#         email = data["email"]
        
#         # Check if user exists
#         user = current_app.mongo.db.users.find_one({"email": email})
#         if not user:
#             # Return success even if user doesn't exist (security through obscurity)
#             return jsonify({"success": True, "message": "If your email is registered, you will receive a password reset link"})
        
#         # Generate reset token
#         reset_token = generate_token(user["_id"])
        
#         # Store reset token in database with expiration
#         reset_data = {
#             "user_id": user["_id"],
#             "token": reset_token,
#             "expires_at": datetime.utcnow() + timedelta(hours=1),
#             "created_at": datetime.utcnow()
#         }
        
#         # Remove any existing reset tokens for this user
#         current_app.mongo.db.password_resets.delete_many({"user_id": user["_id"]})
        
#         # Insert new reset token
#         current_app.mongo.db.password_resets.insert_one(reset_data)
        
#         # Create reset link
#         reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
        
#         # Send email
#         try:
#             msg = Message(
#                 "Password Reset Request",
#                 recipients=[email]
#             )
#             msg.body = f"""
#             Hello {user['name']},
            
#             You have requested to reset your password. Click the link below to reset it:
            
#             {reset_link}
            
#             This link will expire in 1 hour.
            
#             If you did not request this password reset, please ignore this email.
            
#             Best regards,
#             Flight Agent Team
#             """
            
#             current_app.mail.send(msg)
#             logger.info(f"Password reset email sent to {email}")
            
#             return jsonify({
#                 "success": True,
#                 "message": "Password reset link has been sent to your email"
#             })
            
#         except Exception as e:
#             logger.error(f"Failed to send password reset email: {str(e)}")
#             # Check for specific SMTP errors
#             error_message = str(e)
#             if "Authentication Required" in error_message:
#                 logger.error("SMTP Authentication failed. Please check email credentials.")
#                 return jsonify({
#                     "success": False,
#                     "error": "Email service configuration error. Please contact support."
#                 }), 500
#             elif "SSL/TLS" in error_message:
#                 logger.error("SSL/TLS error with SMTP server.")
#                 return jsonify({
#                     "success": False,
#                     "error": "Email service security error. Please contact support."
#                 }), 500
#             else:
#                 logger.error(f"Unknown email error: {error_message}")
#                 return jsonify({
#                     "success": False,
#                     "error": "Failed to send password reset email. Please try again later."
#                 }), 500
            
#     except Exception as e:
#         logger.error(f"Forgot password error: {str(e)}")
#         return jsonify({"success": False, "error": "Internal server error"}), 500

# @auth_bp.route("/reset-password", methods=["POST", "OPTIONS"])
# def reset_password():
#     if request.method == "OPTIONS":
#         return jsonify(), 200
        
#     try:
#         data = request.get_json()
#         if not data or "token" not in data or "password" not in data:
#             return jsonify({"success": False, "error": "Token and new password are required"}), 400
            
#         token = data["token"]
#         new_password = data["password"]
        
#         # Find the reset token
#         reset_data = current_app.mongo.db.password_resets.find_one({
#             "token": token,
#             "expires_at": {"$gt": datetime.utcnow()}
#         })
        
#         if not reset_data:
#             return jsonify({"success": False, "error": "Invalid or expired reset token"}), 400
        
#         # Update user's password
#         hashed_password = generate_password_hash(new_password)
#         current_app.mongo.db.users.update_one(
#             {"_id": reset_data["user_id"]},
#             {"$set": {"password": hashed_password}}
#         )
        
#         # Delete the used reset token
#         current_app.mongo.db.password_resets.delete_one({"_id": reset_data["_id"]})
        
#         return jsonify({
#             "success": True,
#             "message": "Password has been reset successfully"
#         })
        
#     except Exception as e:
#         logger.error(f"Reset password error: {str(e)}")
#         return jsonify({"success": False, "error": "Internal server error"}), 500

# def generate_token(user_id):
#     try:
#         return jwt.encode(
#             {"user_id": str(user_id), "exp": datetime.utcnow() + timedelta(days=1)},
#             current_app.config["SECRET_KEY"],
#             algorithm="HS256"
#         )
#     except Exception as e:
#         logger.error(f"Token generation error: {str(e)}")
#         raise 