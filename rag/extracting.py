from pypdf import PdfReader

def extract(file_path):
    reader = PdfReader(file_path)
    return "\n".join((p.extract_text() or "") for p in reader.pages)
