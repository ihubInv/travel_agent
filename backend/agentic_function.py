
import json
import os
import traceback
from datetime import datetime
from semantic_kernel import Kernel
from semantic_kernel.agents import AgentGroupChat, ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.functions.kernel_arguments import KernelArguments
from semantic_kernel.agents.strategies import (
    KernelFunctionSelectionStrategy,
    KernelFunctionTerminationStrategy,
)
from semantic_kernel.connectors.ai.ollama import OllamaChatCompletion
from semantic_kernel.contents import ChatHistoryTruncationReducer
from semantic_kernel.functions import KernelFunctionFromPrompt
from semantic_kernel.connectors.ai import FunctionChoiceBehavior
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.functions import KernelArguments
from amadeus import Client
from dotenv import load_dotenv
from plugins.flightplugin2 import FlightSearchPlugin
from messages import (
    TRAVEL_MANAGER_AGENT_instru, ROUTER_AGENT_instru, AIRPORT_SEARCH_AGENT_instru,
    FLIGHT_SEARCH_AGENT_instru, FLIGHT_BOOK_AGENT_instru,  VALIDATOR_AGENT_instru, EXCEPTION_AGENT_instru,
    selection_function_prompt, termination_function_prompt, add_on,FLIGHT_CANCEL_AGENT_instru,FLIGHT_INFO_AGENT_instru,RAG_AGENT_instru,GREETING_AGENT_instru
)
from logger import setup_logging, log_function_entry_exit, log_async_function_entry_exit, error_logger, logger


# Initialize Amadeus client
load_dotenv()
amadeus_api_key = os.getenv("AMADEUS_API_KEY")
amadeus_api_secret = os.getenv("AMADEUS_API_SECRET")
# Chat history file path
CHAT_HISTORY_FILE = "chat-history.json"

if not all([amadeus_api_key, amadeus_api_secret]):
    error_logger.critical("❌ Missing required API keys. Please check your .env file.")

try:
    amadeus = Client(
        client_id=amadeus_api_key,
        client_secret=amadeus_api_secret
    )
    logger.info("Amadeus client initialized successfully")
except Exception as e:
    error_details = traceback.format_exc()
    error_logger.critical(f"Failed to initialize Amadeus client: {str(e)}\n{error_details}")

# Global dictionary to store active chat sessions
active_sessions = {}

# Define agent names
TRAVEL_MANAGER_AGENT_NAME = "TravelManagerAgent"
ROUTER_AGENT_NAME = "RouterAgent"
VALIDATOR_AGENT_NAME = "ValidatorAgent"
AIRPORT_SEARCH_AGENT_NAME = "AirportSearchAgent"
FLIGHT_SEARCH_AGENT_NAME = "FlightSearchAgent"
FLIGHT_BOOK_AGENT_NAME = "FlightBookAgent"
FLIGHT_INFO_AGENT_NAME = "FlightInfoAgent"
FLIGHT_CANCEL_AGENT_NAME = "FlightCancelAgent"
EXCEPTION_AGENT_NAME = "ExceptionAgent"
SUGGESTION_AGENT_NAME = "SuggestionAgent"
RAG_AGENT_NAME="RagAgent"
GREETING_AGENT_NAME="GreetingAgent"



current_date =datetime.now().strftime("%Y-%m-%d"),  # Format as needed

@log_function_entry_exit
def create_kernel() -> Kernel:
    """Creates a Kernel instance with an ollama ChatCompletion service."""
    logger.debug("Creating new Semantic Kernel instance")
    try:
        # AI service setup
        service_id = "ollama_service"
        kernel = Kernel()
        
        # Add plugins
        logger.debug("Adding FlightSearchPlugin to kernel")
        kernel.add_plugin(FlightSearchPlugin(amadeus), "flight")
        
        # Add service
        logger.debug("Adding OllamaChatCompletion service to kernel")
        kernel.add_service(
            OllamaChatCompletion(
                service_id=service_id,
                host="http://115.241.186.203/",
                ai_model_id="llama3.1:8b",
            )
        )
        
        settings = kernel.get_prompt_execution_settings_from_service_id(service_id=service_id)
        settings.function_choice_behavior = FunctionChoiceBehavior.Auto()
        logger.info("Kernel created successfully")
        return kernel
    except Exception as e:
        error_details = traceback.format_exc()
        error_logger.error(f"Failed to create kernel: {str(e)}\n{error_details}")
        raise



def enhance_instructions(original_instructions, session_id):
    """
    Enhances agent instructions with context awareness, session-specific metadata, 
    and markdown formatting guidelines.

    Args:
        original_instructions (str): The base system instructions.
        session_id (str): Unique identifier for the session.

    Returns:
        str: Enhanced instructions string.
    """
    
  
    # Combine the original instructions with the add_on content
    enhanced_instructions = f"{original_instructions.strip()}\n\n{add_on.strip()}"

    return enhanced_instructions




@log_function_entry_exit
def save_chat_history(session_id, chat_data):
    """Save chat history to JSON file."""
    logger.debug(f"Saving chat history for session {session_id}")
    try:
        if os.path.exists(CHAT_HISTORY_FILE):
            with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
                all_history = json.load(f)
        else:
            all_history = {}
        
        all_history[session_id] = {
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "messages": chat_data
        }
        
        with open(CHAT_HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_history, f, indent=2)
            
        logger.info(f"Chat history saved for session {session_id}")
    except Exception as e:
        error_details = traceback.format_exc()
        error_logger.error(f"Error saving chat history for session {session_id}: {str(e)}\n{error_details}")
        raise

@log_function_entry_exit
def load_chat_history(session_id):
    """Load chat history from JSON file."""
    logger.debug(f"Loading chat history for session {session_id}")
    try:
        if os.path.exists(CHAT_HISTORY_FILE):
            with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
                all_history = json.load(f)
                history = all_history.get(session_id, {}).get("messages", [])
                logger.debug(f"Loaded {len(history)} messages for session {session_id}")
                return history
        logger.debug(f"No history found for session {session_id}")
        return []
    except Exception as e:
        error_details = traceback.format_exc()
        error_logger.error(f"Error loading chat history for session {session_id}: {str(e)}\n{error_details}")
        return []

@log_async_function_entry_exit
async def create_agent_group_chat(session_id):
    """Creates an agent group chat for a given session ID."""
    logger.info(f"Creating agent group chat for session {session_id}")
    kernel = create_kernel()
    
    try:
        # Create all agents with enhanced instructions
        logger.debug(f"Creating {TRAVEL_MANAGER_AGENT_NAME}")
        travel_manager_agent = ChatCompletionAgent(
            kernel=kernel,
            name=TRAVEL_MANAGER_AGENT_NAME,
            instructions=enhance_instructions(TRAVEL_MANAGER_AGENT_instru,session_id)
        )
        logger.debug(f"Creating {FLIGHT_INFO_AGENT_NAME}")
        flight_info_agent = ChatCompletionAgent(
            kernel=kernel,
            name=FLIGHT_INFO_AGENT_NAME,
            instructions=enhance_instructions(FLIGHT_INFO_AGENT_instru,session_id)
        )

        logger.debug(f"Creating {FLIGHT_CANCEL_AGENT_NAME}")
        flight_cancel_agent = ChatCompletionAgent(
            kernel=kernel,
            name=FLIGHT_CANCEL_AGENT_NAME,
            instructions=enhance_instructions(FLIGHT_CANCEL_AGENT_instru,session_id)
        )


        logger.debug(f"Creating {ROUTER_AGENT_NAME}")
        router_agent = ChatCompletionAgent(
            kernel=kernel,
            name=ROUTER_AGENT_NAME,
            instructions=enhance_instructions(ROUTER_AGENT_instru,session_id)
        )

        logger.debug(f"Creating {VALIDATOR_AGENT_NAME}")
        validator_agent = ChatCompletionAgent(
            kernel=kernel,
            name=VALIDATOR_AGENT_NAME,
            instructions=enhance_instructions(VALIDATOR_AGENT_instru,session_id)
        )

        logger.debug(f"Creating {AIRPORT_SEARCH_AGENT_NAME}")
        airport_search_agent = ChatCompletionAgent(
            kernel=kernel,
            name=AIRPORT_SEARCH_AGENT_NAME,
            instructions=enhance_instructions(AIRPORT_SEARCH_AGENT_instru,session_id)
        )

        logger.debug(f"Creating {FLIGHT_SEARCH_AGENT_NAME}")
        flight_search_agent = ChatCompletionAgent(
            kernel=kernel,
            name=FLIGHT_SEARCH_AGENT_NAME,
            instructions=enhance_instructions(FLIGHT_SEARCH_AGENT_instru,session_id)
        )

        logger.debug(f"Creating {FLIGHT_BOOK_AGENT_NAME}")
        flight_book_agent = ChatCompletionAgent(
            kernel=kernel,
            name=FLIGHT_BOOK_AGENT_NAME,
            instructions=enhance_instructions(FLIGHT_BOOK_AGENT_instru,session_id)
            # Use the KernelArguments here
        )

        logger.debug(f"Creating {EXCEPTION_AGENT_NAME}")
        exception_agent= ChatCompletionAgent(
            kernel=kernel,
            name=EXCEPTION_AGENT_NAME,
            instructions=enhance_instructions(EXCEPTION_AGENT_instru,session_id)
        )

        logger.debug(f"Creating {RAG_AGENT_NAME}")
        rag_agent = ChatCompletionAgent(
            kernel=kernel,
            name=RAG_AGENT_NAME,
            instructions=enhance_instructions(RAG_AGENT_instru,session_id)
        )

        logger.debug(f"Creating {GREETING_AGENT_NAME}")
        greeting_agent = ChatCompletionAgent(
            kernel=kernel,
            name=GREETING_AGENT_NAME,
            instructions=enhance_instructions(GREETING_AGENT_instru,session_id)
        )

        # Enhanced selection function to provide context
        logger.debug("Creating selection function")
        enhanced_selection_prompt = f"""
        {{lastmessage}}
        
        Based on the conversation history above and the most recent message, 
        determine which agent should respond next:
        
        {selection_function_prompt}
        
        Remember to consider the full context of the conversation when making your decision.
        """
        
        selection_function = KernelFunctionFromPrompt(
            function_name="selection",
            prompt=enhanced_selection_prompt
        )

        # Enhanced termination function with context awareness
        logger.debug("Creating termination function")
        enhanced_termination_prompt = f"""
        {{lastmessage}}
        
        Based on the entire conversation history above, determine if this conversation is complete:
        
        {termination_function_prompt}
        
        Consider the full context of what has been discussed and if all user needs have been addressed.
        """
        
        termination_function = KernelFunctionFromPrompt(
            function_name="termination",
            prompt=enhanced_termination_prompt
        )
        
        def safe_result_parser(result):
            try:
                if isinstance(result, dict):
                    value = result.get("value")
                    if isinstance(value, list) and value and value[0]:
                        return str(value[0]).strip()
            except Exception as e:
                print(f"[Result Parser Error] {e} | Result: {result}")
            return TRAVEL_MANAGER_AGENT_NAME

        # Preserve more context
        history_reducer = ChatHistoryTruncationReducer(target_count=10)
       
        agents=[travel_manager_agent, router_agent, validator_agent, airport_search_agent, 
                flight_search_agent, flight_book_agent, exception_agent, flight_info_agent, flight_cancel_agent, rag_agent,greeting_agent]
        
        selection_strategy=KernelFunctionSelectionStrategy(
            initial_agent=travel_manager_agent,
            function=selection_function,
            kernel=kernel,
            result_parser=safe_result_parser,
            # result_parser=lambda result: str(result.value[0]).strip() if result.value[0] is not None else TRAVEL_MANAGER_AGENT_NAME,
            # result_parser=lambda result: str(result["value"][0]).strip() if isinstance(result.get("value"), list) and result["value"] and result["value"][0] else TRAVEL_MANAGER_AGENT_NAME,
            history_variable_name="lastmessage",
            history_reducer=history_reducer,
        )

        logger.debug(f"Raw selection result: {selection_strategy.result_parser({'value': ['TravelManagerAgent']})}")
       
        termination_strategy=KernelFunctionTerminationStrategy(
            agents=[travel_manager_agent],
            function=termination_function,
            kernel=kernel,
            result_parser=lambda result: "complete" in str(result.value[0]).lower(),
            history_variable_name="lastmessage",
            maximum_iterations=100,
            history_reducer=history_reducer,
        )


        # Create the AgentGroupChat
        logger.debug("Creating the AgentGroupChat")
        chat = AgentGroupChat(
        agents=agents,
        selection_strategy=selection_strategy,
        termination_strategy=termination_strategy,
        )
        

        # Initialize the chat with a system message
        system_message = f"Travel booking conversation started at {datetime.now().strftime('%Y-%m-%d %H:%M')}."
        logger.debug(f"Adding system message: {system_message}")
        await chat.add_chat_message(f"System: {system_message} and here is current date: {current_date} for reference")
        
        logger.info(f"Agent group chat created successfully for session {session_id}")
        return chat
    except Exception as e:
        error_details = traceback.format_exc()
        error_logger.error(f"Failed to create agent group chat for session {session_id}: {str(e)}\n{error_details}")
        raise

@log_async_function_entry_exit
async def get_chat_response(session_id, user_input, websocket=None):
    """Process user input and get response from the agent group chat."""
    logger.info(f"Processing chat request for session {session_id}")
    logger.debug(f"User input: {user_input}")
    
    chat = active_sessions.get(session_id)
    
    if not chat:
        logger.info(f"No active chat found for session {session_id}. Creating new chat.")
        # Create a new chat session if one doesn't exist
        chat = await create_agent_group_chat(session_id)
        active_sessions[session_id] = chat
    
    # Add user message to chat
    logger.debug(f"Adding user message to chat: {user_input}")
    await chat.add_chat_message(message=user_input)
    
    # Store responses
    responses = []
    
    try:
        logger.debug("Invoking chat to generate responses")
        async for response in chat.invoke():
            if response is None or not response.name:
                logger.debug("Received invalid response (None or no name), skipping")
                continue
                
            response_text = f"{response.name}: {response.content}"
            response_data = {
                "role": response.name,
                "content": response.content
            }
            responses.append(response_data)
            
            # If we have a WebSocket connection, send the response in real-time
            if websocket:
                try:
                    await websocket.send_json(response_data)
                except Exception as e:
                    logger.error(f"Error sending response via WebSocket: {str(e)}")
                    
            logger.info(f"Response received from {response.name}")
            logger.debug(f"Response content: {response.content}")
    except Exception as e:
        error_details = traceback.format_exc()
        error_message = f"Error during chat invocation for session {session_id}: {str(e)}"
        error_logger.error(f"{error_message}\n{error_details}")
        logger.error(error_message)
        
        error_response = {
            "role": "System",
            "content": f"Error processing your request: {str(e)}"
        }
        responses.append(error_response)
        
        # Send error response via WebSocket if available
        if websocket:
            try:
                await websocket.send_json(error_response)
            except Exception as ws_err:
                logger.error(f"Error sending error response via WebSocket: {str(ws_err)}")
    
    # Reset the chat's complete flag for the new conversation round
    chat.is_complete = False
    logger.debug(f"Chat response processing complete. Generated {len(responses)} responses.")
    
    return responses

@log_async_function_entry_exit
async def reset_chat_session(session_id):
    """Reset a chat session."""
    logger.info(f"Resetting chat session {session_id}")
    
    try:
        if session_id in active_sessions:
            # Get the existing chat and reset it
            logger.debug(f"Existing session found for {session_id}, resetting it")
            chat = active_sessions[session_id]
            await chat.reset()
            
            # Add a system message
            system_message = f"Travel booking conversation reset at {datetime.now().strftime('%Y-%m-%d %H:%M')}."
            logger.debug(f"Adding system message: {system_message}")
            await chat.add_chat_message(f"System: {system_message}")
            
            logger.info(f"Chat session {session_id} reset successfully.")
        else:
            # Create a new chat session
            logger.debug(f"No existing session found for {session_id}, creating new one")
            chat = await create_agent_group_chat(session_id)
            active_sessions[session_id] = chat
            
            logger.info(f"New chat session {session_id} created.")
        
        return True
    except Exception as e:
        error_details = traceback.format_exc()
        error_logger.error(f"Failed to reset chat session {session_id}: {str(e)}\n{error_details}")
        raise

