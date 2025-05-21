import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_ollama import OllamaEmbeddings, OllamaLLM

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# Paths
pdf_path = './rag_response/travel_advisery.pdf'
faiss_index_path = './rag_response/faiss_index_'

# Load embedding model
embeddings = OllamaEmbeddings(
    model="llama3.1:8b",
    base_url="http://115.241.186.203"
)

# Check if FAISS index already exists
if os.path.exists(faiss_index_path) and os.path.isdir(faiss_index_path):
    print("Loading existing FAISS index...")
    vectorstore = FAISS.load_local(faiss_index_path, embeddings, allow_dangerous_deserialization=True)
else:
    print("Creating new FAISS index from PDF...")
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=30, separator="\n")
    docs = text_splitter.split_documents(documents)

    vectorstore = FAISS.from_documents(docs, embeddings)
    vectorstore.save_local(faiss_index_path)

# Set up retriever and LLM
retriever = vectorstore.as_retriever()
llm = OllamaLLM(model="llama3.1:8b", base_url="http://115.241.186.203")

qa = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)

# Async function for querying
async def get_rag_response(query):
    enhanced_query = (
        "you are a flight booking assistant. you can greet to traveler if required like - "
        "Hello! Welcome to your flight booking assistant. How can I help you today?, and tell every answer "
        "in a short summary including all info, based on the following context: " + query
    )
    
    result = qa.invoke(enhanced_query)
    return result['result']



# # Main loop for user interaction
# print("Welcome to the Flight Booking Assistant!")
# while True:

#     query = input("Type your query (or type 'Exit' to quit): \n")
#     if query.lower() == "exit":
#         print("Exiting the program. Goodbye!") 
#         break
    
#     enhanced_query = (
#         "you are a flight booking assistant. you can greet to traveler if required like - "
#         "Hello! Welcome to your flight booking assistant. How can I help you today?, and tell every answer "
#         "in a short summary including all info, based on the following context: " + query
#     )
    
#     result = qa.invoke(enhanced_query)
#     print(result['result'])  # Print only the actual response
