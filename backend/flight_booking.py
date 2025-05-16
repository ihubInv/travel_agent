import asyncio
import json
import os
import uuid
import logging
import traceback
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import Query
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import nest_asyncio
import uvicorn
from pydantic import BaseModel
from logger import logger, error_logger
from agentic_function import load_chat_history,save_chat_history,get_chat_response,reset_chat_session,create_agent_group_chat,CHAT_HISTORY_FILE,active_sessions
from query_suggetions import get_next_query_suggestions
from plugins.flightplugin2 import global_data
from login.auth import auth_router
from login.mongo_db.db import close_mongo_connection, connect_to_mongo

# Apply nest_asyncio to allow running asyncio event loops concurrently
nest_asyncio.apply()

# Store WebSocket connections
websocket_connections = {}

# Define Pydantic models for API requests
class ChatRequest(BaseModel):
    instructions: str
    session_id: str = ""

class SessionRequest(BaseModel):
    session_id: str



# Define lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo(app)
    logger.info("Application startup complete")
    yield
    # Shutdown
    await close_mongo_connection(app)
    logger.info("Application shutdown complete")

app = FastAPI(lifespan=lifespan)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files and templates
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
    templates = Jinja2Templates(directory="templates")
    logger.info("Static files and templates mounted successfully")
except Exception as e:
    logger.warning(f"Failed to mount static files or templates: {str(e)}")
    # Continue without static files if they don't exist

# FastAPI Routes - Maintain compatibility with original Flask endpoints

@app.get("/")
async def home(request: Request):
    """Render the home page."""
    logger.info("Home page requested")
    try:
        return templates.TemplateResponse("index.html", {"request": request, "allow_input": True})
    except Exception as e:
        logger.error(f"Error rendering home template: {str(e)}")
        return JSONResponse(content={"message": "Welcome to the Flight Booking API"})
  

# route for login and register
app.include_router(auth_router, prefix="/auth", tags=["auth"])


@app.post("/api/chats")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """Process chat messages and return agent responses."""
    request_start_time = datetime.now()
    request_id = str(uuid.uuid4())[:8]  # Short UUID for request tracking
    
    logger.info(f"[REQ-{request_id}] Chat request received")
    
    try:
        user_input = request.instructions.strip()
        session_id = request.session_id
        
        logger.debug(f"[REQ-{request_id}] Request data: session_id={session_id}, message_length={len(user_input)}")
        
        # Create a new session ID if none provided
        if not session_id:
            session_id = str(uuid.uuid4())
            logger.info(f"[REQ-{request_id}] Created new session ID: {session_id}")
        
        if not user_input:
            logger.warning(f"[REQ-{request_id}] Empty message received")
            raise HTTPException(status_code=400, detail="Empty message")

        logger.info(f"[REQ-{request_id}] Session {session_id} - User: {user_input}")
        
        # Create chat history entry for user message
        try:
            logger.debug(f"[REQ-{request_id}] Loading chat history for session {session_id}")
            chat_data = load_chat_history(session_id)
            chat_data.append({
                "role": "User", 
                "content": user_input, 
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            
            logger.debug(f"[REQ-{request_id}] Saving updated chat history with user message")
            save_chat_history(session_id, chat_data)
        except Exception as e:
            error_details = traceback.format_exc()
            error_logger.error(f"[REQ-{request_id}] Error handling chat history: {str(e)}\n{error_details}")
            logger.error(f"[REQ-{request_id}] Error handling chat history: {str(e)}")
            # Continue processing despite history error

        if user_input.lower() in ["exit", "quit"]:
            logger.info(f"[REQ-{request_id}] Session {session_id} - Chat session ended.")
            response = [{"role": "System", "content": "Exiting chat. Have a great day!"}]
        else:
            try:
                start_time = datetime.now()
                response = await get_chat_response(session_id, user_input)
                processing_time = (datetime.now() - start_time).total_seconds()
                logger.info(f"[REQ-{request_id}] Response generated in {processing_time:.2f} seconds")
                
            except Exception as e:
                error_details = traceback.format_exc()
                error_logger.error(f"[REQ-{request_id}] Error processing chat for session {session_id}: {str(e)}\n{error_details}")
                logger.error(f"[REQ-{request_id}] Error processing chat: {str(e)}")
                response = [{"role": "System", "content": f"Sorry, something went wrong: {str(e)}"}]

        # Add responses to chat history
        try:
            logger.debug(f"[REQ-{request_id}] Adding {len(response)} responses to chat history")
            for msg in response:
                chat_data.append({
                    "role": msg["role"], 
                    "content": msg["content"], 
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
            
            # Save updated chat history in the background
            background_tasks.add_task(save_chat_history, session_id, chat_data)
        except Exception as e:
            error_details = traceback.format_exc()
            error_logger.error(f"[REQ-{request_id}] Error updating chat history with responses: {str(e)}\n{error_details}")
            logger.error(f"[REQ-{request_id}] Error updating chat history: {str(e)}")
            # Continue despite history error
        
        total_time = (datetime.now() - request_start_time).total_seconds()
        logger.info(f"[REQ-{request_id}] Request completed in {total_time:.2f} seconds")
        
            # After generating the response, add suggestions
        try:
            chat_data = load_chat_history(session_id)
            suggestions = await get_next_query_suggestions(chat_data, response)
            logger.info(f"suggestions generated successfully{suggestions}")
        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}")
            suggestions = []
        
        # Return response with suggestions
        return {
            "session_id": session_id,
            "responses": response,
            "request_id": request_id,
            "processing_time_seconds": total_time,
            "suggestions": suggestions,  # Add this line
            "flag_response":global_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_details = traceback.format_exc()
        error_logger.error(f"[REQ-{request_id}] Unhandled error in /chat endpoint: {str(e)}\n{error_details}")
        logger.error(f"[REQ-{request_id}] Unhandled error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )





@app.post("/api/reset")
async def reset_chat(request: SessionRequest):
    """Reset a chat session."""
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[REQ-{request_id}] Chat reset requested")
    
    try:
        session_id = request.session_id
        
        logger.debug(f"[REQ-{request_id}] Reset requested for session: {session_id}")
        
        if not session_id:
            logger.warning(f"[REQ-{request_id}] No session ID provided for reset")
            raise HTTPException(status_code=400, detail="No session ID provided")
        
        try:
            start_time = datetime.now()
            result = await reset_chat_session(session_id)
            processing_time = (datetime.now() - start_time).total_seconds()
            logger.info(f"[REQ-{request_id}] Session reset completed in {processing_time:.2f} seconds")
            
            # Reset chat history
            logger.debug(f"[REQ-{request_id}] Clearing chat history")
            save_chat_history(session_id, [])
            
            logger.info(f"[REQ-{request_id}] Chat session {session_id} reset successfully")
            return {
                "message": "Chat session reset.",
                "request_id": request_id
            }
        
        except Exception as e:
            error_details = traceback.format_exc()
            error_logger.error(f"[REQ-{request_id}] Error resetting chat session {session_id}: {str(e)}\n{error_details}")
            logger.error(f"[REQ-{request_id}] Reset error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to reset chat session: {str(e)}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        error_details = traceback.format_exc()
        error_logger.error(f"[REQ-{request_id}] Unhandled error in /reset endpoint: {str(e)}\n{error_details}")
        logger.error(f"[REQ-{request_id}] Unhandled error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/api/new-chat")
async def new_chat():
    """Create a new chat session."""
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[REQ-{request_id}] New chat session requested")

    # 1) Generate a new session ID
    session_id = str(uuid.uuid4())
    logger.debug(f"[REQ-{request_id}] Generated session ID: {session_id}")

    start_time = datetime.now()
    try:
        # 2) Spin up your agent group chat
        await create_agent_group_chat(session_id)
        logger.info(
            f"[REQ-{request_id}] Chat session initialized "
            f"in {(datetime.now() - start_time).total_seconds():.2f}s"
        )

        # 3) Initialize empty history (but don't abort if this fails)
        try:
            logger.debug(f"[REQ-{request_id}] Saving empty chat history")
            save_chat_history(session_id, [])
        except Exception as e:
            error_details = traceback.format_exc()
            error_logger.error(
                f"[REQ-{request_id}] Failed to save chat history: {e}\n{error_details}"
            )
            # we continue even if history save fails

        # 4) All done, return the new session
        logger.info(f"[REQ-{request_id}] New chat session created: {session_id}")
        return {
            "chatName": "New chat",
            "session_id": session_id,
            "message": "New chat session created.",
            "request_id": request_id,
        }

    except Exception as e:
        # Any error in create_agent_group_chat should be surfaced as a 500
        error_details = traceback.format_exc()
        error_logger.error(
            f"[REQ-{request_id}] Error in new chat flow: {e}\n{error_details}"
        )
        logger.error(f"[REQ-{request_id}] New chat error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create new chat session: {e}",
        )



@app.get("/api/sessions")
async def get_all_sessions():
    """Get a list of all available chat sessions."""
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[REQ-{request_id}] All sessions list requested")

    try:
        if not os.path.exists(CHAT_HISTORY_FILE):
            logger.info(f"[REQ-{request_id}] No sessions found (history file doesn't exist)")
            return {
                "success": True,
                "sessions": [],
                "request_id": request_id
            }

        logger.debug(f"[REQ-{request_id}] Loading session data from {CHAT_HISTORY_FILE}")
        with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
            all_history = json.load(f)

        sessions = []
        for session_id, data in all_history.items():
            messages = data.get("messages", [])
            last_updated = data.get("last_updated", "")
            
            # Get chat name from first user message
            chat_name = "New Chat"
            for msg in messages:
                if msg.get("role") == "User":
                    content = msg.get("content", "").strip()
                    if content:
                        chat_name = " ".join(content.split()[:4])
                        break

            # Include formatted messages in the session data
            formatted_messages = {
                "messages": [
                    {
                        "type": "user" if msg.get("role") == "User" else "bot",
                        "content": msg.get("content", ""),
                        "timestamp": msg.get("timestamp", ""),
                        "id": msg.get("id", str(uuid.uuid4()))
                    }
                    for msg in messages
                ]
            }

            sessions.append({
                "_id": session_id,
                "chat_name": chat_name,
                "messages": formatted_messages,
                "created_at": data.get("created_at", last_updated),
                "updated_at": last_updated,
                "user_id": data.get("user_id", "")
            })

        # Sort by last updated
        sessions.sort(key=lambda s: s.get("updated_at", ""), reverse=True)

        logger.info(f"[REQ-{request_id}] Retrieved {len(sessions)} sessions")
        return {
            "success": True,
            "sessions": sessions,
            "request_id": request_id
        }

    except Exception as e:
        error_details = traceback.format_exc()
        error_logger.error(f"[REQ-{request_id}] Error retrieving sessions: {str(e)}\n{error_details}")
        logger.error(f"[REQ-{request_id}] Error retrieving sessions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving sessions: {str(e)}"
        )



@app.get("/api/session/{session_id}")
async def get_session_messages(session_id: str):
    """Retrieve chat history for a given session ID."""
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[REQ-{request_id}] Fetching chat history for session {session_id}")

    try:
        if not os.path.exists(CHAT_HISTORY_FILE):
            logger.warning(f"[REQ-{request_id}] No chat history file found")
            raise HTTPException(status_code=404, detail="No chat history exists")

        with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
            all_history = json.load(f)

        if session_id not in all_history:
            logger.warning(f"[REQ-{request_id}] Session {session_id} not found in history")
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

        session_data = all_history[session_id]
        messages = session_data.get("messages", [])
        
        # Format messages with proper types and timestamps
        formatted_messages = {
            "messages": [
                {
                    "type": "user" if msg.get("role") == "User" else "bot",
                    "content": msg.get("content", ""),
                    "timestamp": msg.get("timestamp", ""),
                    "id": msg.get("id", str(uuid.uuid4()))
                }
                for msg in messages
            ]
        }

        logger.info(f"[REQ-{request_id}] Retrieved {len(messages)} messages for session {session_id}")
        return {
            "success": True,
            "session": {
                "_id": session_id,
                "chat_name": session_data.get("chat_name", "New Chat"),
                "messages": formatted_messages,
                "created_at": session_data.get("created_at", ""),
                "updated_at": session_data.get("last_updated", ""),
                "user_id": session_data.get("user_id", "")
            },
            "request_id": request_id
        }

    except Exception as e:
        error_details = traceback.format_exc()
        error_logger.error(f"[REQ-{request_id}] Error fetching session {session_id}: {str(e)}\n{error_details}")
        logger.error(f"[REQ-{request_id}] Error fetching session: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving session: {str(e)}"
        )


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session and its history."""
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[REQ-{request_id}] Delete session requested for {session_id}")
    
    try:
        # Remove from active sessions if present
        if session_id in active_sessions:
            logger.debug(f"[REQ-{request_id}] Removing session {session_id} from active sessions")
            del active_sessions[session_id]
        
        # Remove session from chat history
        if os.path.exists(CHAT_HISTORY_FILE):
            logger.debug(f"[REQ-{request_id}] Updating chat history file to remove session {session_id}")
            with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
                all_history = json.load(f)
                
            if session_id in all_history:
                del all_history[session_id]
                
                with open(CHAT_HISTORY_FILE, 'w', encoding='utf-8') as f:
                    json.dump(all_history, f, indent=2)
                
                logger.info(f"[REQ-{request_id}] Session {session_id} deleted successfully")
                # Change the response to return session_id, not request_id
                return {"message": f"Session {session_id} deleted successfully", "session_id": session_id}
            else:
                logger.warning(f"[REQ-{request_id}] Session {session_id} not found in history")
                return {"message": f"Session {session_id} not found", "session_id": session_id}
        else:
            logger.warning(f"[REQ-{request_id}] Chat history file not found")
            return {"message": "No chat history exists", "session_id": session_id}
    
    except Exception as e:
        error_details = traceback.format_exc()
        error_logger.error(f"[REQ-{request_id}] Error deleting session {session_id}: {str(e)}\n{error_details}")
        logger.error(f"[REQ-{request_id}] Error deleting session: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting session: {str(e)}"
        )


@app.get("/api/health")
async def health_check():
    """API health check endpoint."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "server_id": os.environ.get("SERVER_ID", "default")
    }

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources when shutting down."""
    logger.info("Server shutting down - cleaning up resources")
    
    # Close all active WebSocket connections
    for session_id, websocket in websocket_connections.items():
        try:
            logger.debug(f"Closing WebSocket connection for session {session_id}")
            await websocket.close(code=1000, reason="Server shutting down")
        except Exception as e:
            logger.error(f"Error closing WebSocket for session {session_id}: {str(e)}")
    
    # Save all active sessions
    for session_id, chat in active_sessions.items():
        try:
            logger.debug(f"Saving final state for session {session_id}")
            chat_data = load_chat_history(session_id)
            save_chat_history(session_id, chat_data)
        except Exception as e:
            logger.error(f"Error saving final state for session {session_id}: {str(e)}")
    
    logger.info("Cleanup complete")

# Main entry point for directly running the application
if __name__ == "__main__":
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Flight Booking API Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind the server to")
    parser.add_argument("--port", type=int, default=5000, help="Port to run the server on")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")
    args = parser.parse_args()
    
    # Configure logging based on debug mode
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.setLevel(logging.DEBUG)
    
    # Print startup banner
    print(f"""
    ╔════════════════════════════════════════════════════════╗
    ║                                                        ║
    ║        Flight Booking API Server                       ║
    ║                                                        ║
    ║        Server running at http://{args.host}:{args.port}║
    ║        Debug mode: {'On' if args.debug else 'Off'}     ║
    ║        Workers: {args.workers}                         ║
    ║                                                        ║
    ╚════════════════════════════════════════════════════════╝
    """)
    
    # Start the server
    logger.info(f"Starting Uvicorn server on {args.host}:{args.port} with {args.workers} workers")
    uvicorn.run(
        "flight_booking:app",  # Assuming this code is in main.py
        host=args.host,
        port=args.port,
        reload=args.debug,
        workers=args.workers,
        log_level="debug" if args.debug else "info"
    )
