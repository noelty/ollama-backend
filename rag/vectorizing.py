from langchain_huggingface import HuggingFaceEmbeddings
from splitting import split
import torch

def embed(tokenized_content: list[str]):
    device = "cuda" if torch.cuda.is_available() else "cpu"

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": device},
        encode_kwargs={"normalize_embeddings": True, "batch_size": 64},
    )

    vectors = embeddings.embed_documents(tokenized_content)[0]

    doc_result = []
    for i, chunk in enumerate(tokenized_content):
        doc_result.append({ "string": chunk,
                            "vector": vectors[i],
                           })
        
    return doc_result