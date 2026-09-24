from rag.extracting import extract
from rag.splitting import split
from rag.vectorizing import embed
from app.database import get_db, insert_document, insert_content
from fastapi import UploadFile

from rag.typesense_client import client, COLLECTION



def ingest_data(file: UploadFile, file_path: str, conv_id: str, db):
    extracted = extract(file_path)
    tokenized = split(extracted)
    doc_results = embed(tokenized)
    doc_id = str(insert_document(db, str(file.filename), conv_id))
    print(doc_id)
    for chunk in doc_results:
        chunk_id = insert_content(db, chunk["string"], doc_id)
        record = {
            "id": str(chunk_id),
            "embedding": chunk["vector"]
        }
        client.collections[COLLECTION].documents.upsert(record)
        
        