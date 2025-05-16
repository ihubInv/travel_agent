from flask_pymongo import PyMongo
import os
from dotenv import load_dotenv
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError
import socket
import time

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(override=True)  # Force reload of environment variables

def init_db(app):
    # MongoDB Configuration
    MONGODB_URI = os.getenv("MONGODB_URI")
    if not MONGODB_URI:
        logger.error("MONGODB_URI environment variable is not set")
        raise ValueError("MONGODB_URI environment variable is not set")
    
    logger.info(f"Attempting to connect to MongoDB with URI: {MONGODB_URI}")

    # Set socket timeout and connection options
    socket.setdefaulttimeout(30)  # Increased timeout
    
    app.config["MONGO_URI"] = MONGODB_URI
    app.config["MONGO_CONNECT"] = False  # Lazy connection
    app.config["MONGO_MAXPOOLSIZE"] = 50
    app.config["MONGO_CONNECT_TIMEOUT_MS"] = 30000  # 30 seconds
    app.config["MONGO_SOCKET_TIMEOUT_MS"] = 30000   # 30 seconds
    app.config["MONGO_SERVER_SELECTION_TIMEOUT_MS"] = 30000  # 30 seconds
    
    try:
        # Initialize Flask-PyMongo with direct connection
        mongo = PyMongo(app, connect=False)
        
        # Test connection with retry logic
        retry_count = 3
        while retry_count > 0:
            try:
                mongo.cx.server_info()
                logger.info("Successfully connected to MongoDB")
                break
            except Exception as e:
                retry_count -= 1
                if retry_count == 0:
                    raise
                logger.warning(f"Connection attempt failed, retrying... ({retry_count} attempts left)")
                time.sleep(2)  # Wait 2 seconds before retrying
        
        # Set up indexes
        mongo.db.users.create_index("email", unique=True)
        mongo.db.users.create_index("username", unique=True)
        logger.info("Successfully created MongoDB indexes")
        
        return mongo
    except (ConnectionFailure, ConfigurationError) as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB: {str(e)}")
        raise 