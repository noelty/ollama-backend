from rag.vectorizing import vectorize_query
from rag.typesense_client import client, COLLECTION
from app.database import search_content, get_db
from fastapi import Depends
# from typesense.api.multi_search import MultiSearchRequestSchema
import sqlite3

def query(prompt: str, db: sqlite3.Connection):
    query_embedding = vectorize_query(prompt)["vector"]
    search_requests = {
        "searches": [
            {
                "collection": "documents",
                "q": "*",
                "vector_query": f"embedding:([{",".join(map(str, query_embedding))}], k:10)",
                "exclude_fields": ["embedding"],
            },
        ]
    }
    # req_payload = MultiSearchRequestSchema(**search_requests)
    print("-------------------------------------")
    retrieved_chunk_ids = []
    retrieved_chunks = []
    result = client.multi_search.perform(search_requests, {})
    for value in result["results"][0]["hits"]:
        retrieved_chunk_ids.append(value["document"]["id"])
    for id in retrieved_chunk_ids:
        value, = search_content(id, db)
        content, = value
        print(content)
        retrieved_chunks.append(content)

    print(retrieved_chunk_ids)
    print(retrieved_chunks)
    return retrieved_chunks
