from flask import Flask, request, jsonify, redirect, url_for, current_app
from flask_cors import CORS
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
import logging
from db import init_db
from routes.auth import auth_bp
from routes.google_auth import google_auth_bp
from routes.profile import profile_bp
from routes.chat import chat_bp
from routes.send_email import send_email_bp

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
logger.info(f"Loaded GOOGLE_CLIENT_ID: {os.getenv('GOOGLE_CLIENT_ID')}")

app = Flask(__name__)

# # Mail Configuration
# app.config['MAIL_SERVER'] = 'smtp.gmail.com'
# app.config['MAIL_PORT'] = 587
# app.config['MAIL_USE_TLS'] = True
# app.config['MAIL_USE_SSL'] = False
# app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
# app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')  # This should be your App Password
# app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')
# app.config['MAIL_MAX_EMAILS'] = 100
# app.config['MAIL_ASCII_ATTACHMENTS'] = False
# app.config['MAIL_DEBUG'] = True  # Enable debug mode for development

# # Initialize mail with error handling
# try:
#     mail = Mail(app)
#     logger.info("Mail configuration loaded successfully")
#     # Test the mail configuration
#     with app.app_context():
#         mail.send(Message(
#             "Test Email",
#             recipients=[os.getenv('MAIL_USERNAME')],
#             body="This is a test email to verify the mail configuration."
#         ))
#         logger.info("Test email sent successfully")
# except Exception as e:
#     logger.error(f"Failed to initialize mail: {str(e)}")
#     if "Authentication Required" in str(e):
#         logger.error("SMTP Authentication failed. Please check email credentials and ensure you're using an App Password.")
#     elif "SSL/TLS" in str(e):
#         logger.error("SSL/TLS error with SMTP server. Please check the mail configuration.")
#     else:
#         logger.error(f"Unknown mail initialization error: {str(e)}")
#     raise

# CORS Configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Initialize MongoDB
mongo = init_db(app)
app.mongo = mongo

# JWT Configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your-secret-key")

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

if not GOOGLE_CLIENT_SECRET:
    logger.error("Google OAuth credentials are not properly configured")
    raise ValueError("Google OAuth credentials are not properly configured")

logger.info(f"Google Client ID: {GOOGLE_CLIENT_ID}")

app.config["GOOGLE_CLIENT_ID"] = GOOGLE_CLIENT_ID
app.config["GOOGLE_CLIENT_SECRET"] = GOOGLE_CLIENT_SECRET
app.config["GOOGLE_REDIRECT_URI"] = "http://localhost:3000/api/auth/callback/google"

# File upload configuration
UPLOAD_FOLDER = "uploads/profile_images"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["ALLOWED_EXTENSIONS"] = ALLOWED_EXTENSIONS

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Serve static files
app.static_folder = "uploads"
app.static_url_path = "/uploads"

# Register blueprints with proper URL prefixes
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(google_auth_bp)  # URL prefix is already set in the blueprint
app.register_blueprint(profile_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(send_email_bp, url_prefix='/api')


@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = jsonify()
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

@app.before_request
def before_request():
    # Fix duplicate /api in path
    if request.path.startswith('/api/api'):
        new_path = request.path.replace('/api/api', '/api')
        return redirect(new_path, code=301)
    
    # Handle OPTIONS requests
    if request.method == 'OPTIONS':
        response = jsonify()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response

@app.route("/", methods=["GET"])
def root():
    return redirect(url_for('health_check'))

@app.route("/api", methods=["GET"])
def api_root():
    return redirect(url_for('health_check'))

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Flight Agent API is running",
        "version": "1.0.0",
        "endpoints": {
            "register": "/api/register",
            "login": "/api/login",
            "profile": "/api/profile",
            "flights": "/api/flights",
            "cards": "/api/cards",
            "chat": "/api/chat",
            "dummy-data": "/api/dummy-data",
            "send-email": "/api/send-email"
        }
    })

@app.route("/api/health", methods=["GET"])
def api_health_check():
    return health_check()

@app.route("/dummy-data", methods=["GET"])
def dummy_data():
    # Sample data for the profile page
    return jsonify({
        "success": True,
        "data": {
            "flights": [
                {
                    "id": "1",
                    "from": "New York",
                    "to": "London",
                    "date": "2023-06-15",
                    "passengers": 2,
                    "class": "Business",
                    "status": "Confirmed",
                    "created_at": "2023-05-10T10:30:00Z"
                },
                {
                    "id": "2",
                    "from": "London",
                    "to": "Paris",
                    "date": "2023-07-20",
                    "passengers": 1,
                    "class": "Economy",
                    "status": "Pending",
                    "created_at": "2023-05-15T14:45:00Z"
                }
            ],
            "cards": [
                {
                    "id": "1",
                    "cardNumber": "**** **** **** 1234",
                    "expiryDate": "12/25",
                    "cardType": "Visa"
                },
                {
                    "id": "2",
                    "cardNumber": "**** **** **** 5678",
                    "expiryDate": "10/24",
                    "cardType": "Mastercard"
                }
            ],
            "chats": [
                {
                    "id": "1",
                    "message": "I need to find flights from New York to London",
                    "response": "I found several flights from New York to London. Here are some options:\n\n1. British Airways BA-112: Departure 10:30 AM, Duration 7h 15m\n2. American Airlines AA-100: Departure 2:45 PM, Duration 7h 30m\n3. Delta DL-400: Departure 6:20 PM, Duration 7h 10m\n\nWould you like more details about any of these flights?",
                    "created_at": "2023-05-10T10:30:00Z"
                },
                {
                    "id": "2",
                    "message": "What's the cheapest option?",
                    "response": "The cheapest option is Delta DL-400 at $450 for an economy seat. Would you like me to help you book this flight?",
                    "created_at": "2023-05-10T10:35:00Z"
                }
            ],
            "stats": {
                "flights": 2,
                "chats": 2,
                "cards": 2
            }
        }
    })

@app.route("/api/dummy-data", methods=["GET"])
def api_dummy_data():
    return dummy_data()

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({
        "error": "Not Found",
        "message": "The requested URL was not found on the server",
        "status": 404,
        "requested_path": request.path
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "error": "Internal Server Error",
        "message": "An internal error occurred",
        "status": 500
    }), 500

if __name__ == "__main__":
    app.run(debug=True) 