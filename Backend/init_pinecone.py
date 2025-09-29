import os
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# Read environment variables
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV", "us-east-1-aws")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "ispg-rag-index")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", 1536))

# Parse env into cloud and region
cloud, region = PINECONE_ENV.split("-")[0], "-".join(PINECONE_ENV.split("-")[1:])

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# List indexes
indexes = pc.list_indexes().names()

# Create index if it doesn’t exist
if PINECONE_INDEX_NAME not in indexes:
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=EMBEDDING_DIMENSION,
        metric="cosine",
        spec=ServerlessSpec(
            cloud=cloud,
            region=region
        )
    )
    print(f"✅ Created index: {PINECONE_INDEX_NAME}")
else:
    print(f"ℹ️ Index already exists: {PINECONE_INDEX_NAME}")
