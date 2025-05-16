import os
import logging
import traceback


# Configure advanced logging setup
def setup_logging():
    """Configure a comprehensive logging system with rotating file handlers"""
    log_format = "%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(funcName)s() - %(message)s"
    
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            # Main log file with daily rotation
            logging.FileHandler("logs/flight_booking_api.log",encoding='utf-8'),
            # Error-specific log file
            logging.FileHandler("logs/errors.log", encoding='utf-8'),
            # Console output
            logging.StreamHandler()
        ]
    )
    
    # Create a logger for this application
    logger = logging.getLogger("flight_booking_api")
    logger.setLevel(logging.DEBUG)
    
    # Create a separate error logger that only captures errors
    error_logger = logging.getLogger("error_logger")
    error_logger.setLevel(logging.ERROR)
    error_handler = logging.FileHandler("logs/errors.log", encoding='utf-8')
    error_handler.setFormatter(logging.Formatter(log_format))
    error_logger.addHandler(error_handler)
    
    return logger, error_logger


# Set up loggers
logger, error_logger = setup_logging()


def log_function_entry_exit(func):
    """Decorator to log function entry and exit"""
    def wrapper(*args, **kwargs):
        function_name = func.__name__
        logger.debug(f"ENTER: {function_name}")
        try:
            result = func(*args, **kwargs)
            logger.debug(f"EXIT: {function_name} - Success")
            return result
        except Exception as e:
            error_details = traceback.format_exc()
            error_logger.error(f"ERROR in {function_name}: {str(e)}\n{error_details}")
            logger.error(f"ERROR in {function_name}: {str(e)}")
            raise
    return wrapper

# Apply decorator to async functions
def log_async_function_entry_exit(func):
    """Decorator to log async function entry and exit"""
    async def wrapper(*args, **kwargs):
        function_name = func.__name__
        logger.debug(f"ENTER ASYNC: {function_name}")
        try:
            result = await func(*args, **kwargs)
            logger.debug(f"EXIT ASYNC: {function_name} - Success")
            return result
        except Exception as e:
            error_details = traceback.format_exc()
            error_logger.error(f"ERROR in async {function_name}: {str(e)}\n{error_details}")
            logger.error(f"ERROR in async {function_name}: {str(e)}")
            raise
    return wrapper

