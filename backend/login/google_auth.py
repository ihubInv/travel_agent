from flask import Blueprint, request, jsonify, current_app, redirect
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime, timedelta
import logging
from bson import ObjectId
import jwt
import os
import json

logger = logging.getLogger(__name__)

google_auth_bp = Blueprint('google_auth', __name__, url_prefix='/api')

@google_auth_bp.route("/auth/callback/google", methods=["GET"])
def google_callback():
    try:
        # Get the authorization code from the request
        code = request.args.get('code')
        if not code:
            logger.error("No authorization code received")
            return redirect("http://localhost:3000/login?error=no_code")
            
        logger.debug("Received Google callback with code")
        
        # Exchange the code for tokens
        try:
            # Get client ID and secret
            client_id = current_app.config["GOOGLE_CLIENT_ID"]
            client_secret = current_app.config["GOOGLE_CLIENT_SECRET"]
            
            if not client_id or not client_secret:
                logger.error("Missing Google OAuth credentials")
                return redirect("http://localhost:3000/login?error=config_error")
            
            # Exchange code for tokens
            token_url = "https://oauth2.googleapis.com/token"
            token_data = {
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': current_app.config["GOOGLE_REDIRECT_URI"],
                'grant_type': 'authorization_code'
            }
            
            token_response = requests.post(token_url, data=token_data)
            token_response.raise_for_status()
            tokens = token_response.json()
            
            # Get user info using the access token
            userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {'Authorization': f'Bearer {tokens["access_token"]}'}
            userinfo_response = requests.get(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            userinfo = userinfo_response.json()
            
            # Get or create user
            email = userinfo["email"]
            user = current_app.mongo.db.users.find_one({"email": email})
            
            if not user:
                user = {
                    "name": userinfo["name"],
                    "email": email,
                    "google_id": userinfo["id"],
                    "created_at": datetime.utcnow()
                }
                result = current_app.mongo.db.users.insert_one(user)
                user["_id"] = result.inserted_id
            
            # Generate JWT token
            token = generate_token(user["_id"])
            
            # Convert ObjectId to string for JSON serialization
            user["_id"] = str(user["_id"])
            
            # Redirect directly to chat page with token and user data
            return redirect(f"http://localhost:3000/chat?token={token}&user={json.dumps(user)}")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to exchange code for tokens: {str(e)}")
            return redirect("http://localhost:3000/login?error=token_exchange_failed")
            
    except Exception as e:
        logger.error(f"Unexpected error in Google callback: {str(e)}")
        return redirect("http://localhost:3000/login?error=internal_error")

@google_auth_bp.route("/google-login", methods=["POST", "OPTIONS"])
def google_login():
    if request.method == "OPTIONS":
        return jsonify(), 200
        
    try:
        # Get and validate request data
        data = request.get_json()
        if not data or "credential" not in data:
            return jsonify({"success": False, "error": "Missing credential"}), 400
        
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            data["credential"], 
            requests.Request(), 
            current_app.config["GOOGLE_CLIENT_ID"]
        )
        
        # Only validate email
        email = idinfo.get("email")
        if not email:
            return jsonify({"success": False, "error": "No email in token"}), 400
        
        # Generate username from email
        username = email.split('@')[0]  # Use part before @ as username
        
        # Get or create user
        user = current_app.mongo.db.users.find_one({"email": email})
        
        if not user:
            user = {
                "name": idinfo.get("name", ""),
                "email": email,
                "username": username,  # Add username field
                "google_id": idinfo.get("sub", ""),
                "created_at": datetime.utcnow()
            }
            result = current_app.mongo.db.users.insert_one(user)
            user["_id"] = result.inserted_id
        
        # Generate JWT token
        token = generate_token(user["_id"])
        
        return jsonify({
            "success": True,
            "data": {
                "token": token,
                "user": {
                    "id": str(user["_id"]),
                    "name": user["name"],
                    "email": user["email"],
                    "username": user.get("username", "")
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error in Google login: {str(e)}")
        return jsonify({"success": False, "error": "Authentication failed"}), 500

def generate_token(user_id):
    try:
        # Convert ObjectId to string if it's not already a string
        user_id_str = str(user_id)
        
        # Generate token with standard claims
        token = jwt.encode(
            {
                "user_id": user_id_str,
                "exp": datetime.utcnow() + timedelta(days=1),
                "iat": datetime.utcnow(),
                "type": "access"  # Add token type for future extensibility
            },
            current_app.config["SECRET_KEY"],
            algorithm="HS256"
        )
        
        # jwt.encode in PyJWT >= 2.0.0 returns a string
        # but we'll ensure it's a string for compatibility
        return token if isinstance(token, str) else token.decode('utf-8')
    except Exception as e:
        logger.error(f"Token generation error: {str(e)}")
        raise 