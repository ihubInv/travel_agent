
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ConfigurationError
import logging
import os
import time
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
MONGODB_URI = os.getenv("MONGODB_URI")

async def connect_to_mongo(app):
    try:
        client = AsyncIOMotorClient(
            MONGODB_URI,
            maxPoolSize=50,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            serverSelectionTimeoutMS=30000
        )
        
        retries = 3
        while retries:
            try:
                # Verify connection works
                await client.server_info()
                break
            except Exception as e:
                logger.warning(f"MongoDB connection failed: {e}")
                retries -= 1
                time.sleep(2)
        
        # Get database from the connection string
        db = client.get_default_database()
        
        # Store client and database on app state
        app.mongodb_client = client
        app.mongodb = db
        
        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        logger.info("MongoDB connected and indexes created")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection(app):
    if hasattr(app, "mongodb_client"):
        app.mongodb_client.close()
        logger.info("MongoDB connection closed")