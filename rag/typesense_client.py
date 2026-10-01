import typesense



client = typesense.Client({
    "nodes": [{"host": "localhost", "port": "8108", "protocol": "http"}],
    "api_key": "xyz",
    "connection_timeout_seconds": 10,
})

COLLECTION = "documents"
DIM = 384  # all-MiniLM-L6-v2 output size

schema = {
    "name": COLLECTION,
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "embedding", "type": "float[]", "num_dim": DIM},
    ],
}

def ensure_collection():
    try:
        client.collections[COLLECTION].retrieve()
    except typesense.exceptions.ObjectNotFound:
        client.collections.create(schema)