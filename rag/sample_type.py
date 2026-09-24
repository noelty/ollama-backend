import typesense
from typesense_client import COLLECTION
client = typesense.Client({
    "nodes": [{"host": "localhost", "port": "8108", "protocol": "http"}],
    "api_key": "xyz",
    "connection_timeout_seconds": 5,
})

for c in client.collections.retrieve():
    print(f"{c['name']}: {c['num_documents']} documents")

results = client.collections[COLLECTION].documents.search({
    "q": "*",
    "per_page": 10,
    "exclude_fields": "embedding",
})

for hit in results["hits"]:
    print(hit["document"])