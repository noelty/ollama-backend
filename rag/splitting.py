from langchain_text_splitters import RecursiveCharacterTextSplitter

def split(content):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=0)
    texts = text_splitter.split_text(content)
    print("-----------------------------------")
    print(texts)
    
    return texts