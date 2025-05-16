from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime
import logging
from .auth import token_required

logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__)

@chat_bp.route("/sessions", methods=["GET"])
@token_required
def get_sessions(current_user):
    try:
        # Get all sessions for the user
        sessions = list(current_app.mongo.db.sessions.find(
            {"user_id": current_user["_id"]}
        ).sort("updated_at", -1))
        
        # For each session, get its messages
        for session in sessions:
            messages = list(current_app.mongo.db.messages.find(
                {"session_id": session["_id"]}
            ).sort("created_at", 1))
            
            session["messages"] = {
                "messages": [{
                    "id": str(msg["_id"]),
                    "type": msg["type"],
                    "content": msg["content"],
                    "timestamp": msg["created_at"]
                } for msg in messages]
            }
            session["_id"] = str(session["_id"])
            session["user_id"] = str(session["user_id"])
        
        return jsonify({
            "success": True,
            "sessions": sessions
        })
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@chat_bp.route("/session/<session_id>", methods=["GET"])
@token_required
def get_session(current_user, session_id):
    try:
        # Get session
        session = current_app.mongo.db.sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": current_user["_id"]
        })
        
        if not session:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Get session messages
        messages = list(current_app.mongo.db.messages.find(
            {"session_id": session["_id"]}
        ).sort("created_at", 1))
        
        session["messages"] = {
            "messages": [{
                "id": str(msg["_id"]),
                "type": msg["type"],
                "content": msg["content"],
                "timestamp": msg["created_at"]
            } for msg in messages]
        }
        session["_id"] = str(session["_id"])
        session["user_id"] = str(session["user_id"])
        
        return jsonify({
            "success": True,
            "session": session
        })
    except Exception as e:
        logger.error(f"Error fetching session: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@chat_bp.route("/new-chat", methods=["POST"])
@token_required
def create_session(current_user):
    try:
        # Create new session
        session = {
            "user_id": current_user["_id"],
            "chat_name": "New Chat",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = current_app.mongo.db.sessions.insert_one(session)
        session["_id"] = str(result.inserted_id)
        session["user_id"] = str(session["user_id"])
        
        return jsonify({
            "success": True,
            "session_id": session["_id"]
        })
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@chat_bp.route("/session/<session_id>", methods=["DELETE"])
@token_required
def delete_session(current_user, session_id):
    try:
        # Delete session and its messages
        current_app.mongo.db.sessions.delete_one({
            "_id": ObjectId(session_id),
            "user_id": current_user["_id"]
        })
        current_app.mongo.db.messages.delete_many({
            "session_id": ObjectId(session_id)
        })
        
        return jsonify({
            "success": True,
            "message": "Session deleted successfully"
        })
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@chat_bp.route("/chat", methods=["POST"])
@token_required
def save_message(current_user):
    try:
        data = request.get_json()
        if not data or "instructions" not in data:
            return jsonify({
                "success": False,
                "error": "Missing required fields"
            }), 400
        
        # Get or create session
        session_id = data.get("session_id")
        if not session_id:
            # Create new session
            session = {
                "user_id": current_user["_id"],
                "chat_name": data["instructions"][:50] + "..." if len(data["instructions"]) > 50 else data["instructions"],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = current_app.mongo.db.sessions.insert_one(session)
            session_id = str(result.inserted_id)
        else:
            # Update session timestamp
            current_app.mongo.db.sessions.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"updated_at": datetime.utcnow()}}
            )
        
        # Save user message
        user_message = {
            "session_id": ObjectId(session_id),
            "type": "user",
            "content": data["instructions"],
            "created_at": datetime.utcnow()
        }
        current_app.mongo.db.messages.insert_one(user_message)
        
        # Get bot response (this would come from your AI model)
        bot_response = "Bot response here"  # Replace with actual AI response
        
        # Save bot message
        bot_message = {
            "session_id": ObjectId(session_id),
            "type": "bot",
            "content": bot_response,
            "created_at": datetime.utcnow()
        }
        current_app.mongo.db.messages.insert_one(bot_message)
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "responses": [{
                "content": bot_response,
                "type": "bot"
            }],
            "suggestions": []  # Add suggestions if needed
        })
    except Exception as e:
        logger.error(f"Error saving message: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@chat_bp.route("/reset", methods=["POST"])
@token_required
def reset_session(current_user):
    try:
        data = request.get_json()
        if not data or "session_id" not in data:
            return jsonify({
                "success": False,
                "error": "Missing session_id"
            }), 400
        
        # Delete all messages in the session
        current_app.mongo.db.messages.delete_many({
            "session_id": ObjectId(data["session_id"]),
            "user_id": current_user["_id"]
        })
        
        # Reset session name
        current_app.mongo.db.sessions.update_one(
            {
                "_id": ObjectId(data["session_id"]),
                "user_id": current_user["_id"]
            },
            {
                "$set": {
                    "chat_name": "New Chat",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            "success": True,
            "message": "Session reset successfully"
        })
    except Exception as e:
        logger.error(f"Error resetting session: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@chat_bp.route("/chat-history/<user_id>", methods=["GET"])
@token_required
def get_chat_history(current_user, user_id):
    try:
        # Ensure user can only access their own chat history
        if str(current_user["_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized"
            }), 403

        chats = list(current_app.mongo.db.chats.find({"user_id": ObjectId(user_id)}).sort("created_at", -1))
        return jsonify({
            "success": True,
            "data": [{
                "id": str(chat["_id"]),
                "message": chat["message"],
                "response": chat["response"],
                "created_at": chat["created_at"],
                "metadata": chat.get("metadata", {})
            } for chat in chats]
        })
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500 