from extracting import extract
from splitting import split
from vectorizing import embed
from app.database import get_db, insert_document, insert_content
from fastapi import UploadFile

input_file = "assets/fable.pdf"

def ingest_data(file: UploadFile, db):
    extracted = extract(input_file)
    tokenized = split(extracted)
    doc_results = embed(tokenized)
    doc_id = str(insert_document(db, str(file.filename)))
    for chunk in doc_results:
        print(insert_content(db, chunk.string, doc_id))