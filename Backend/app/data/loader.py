import trafilatura

def extract_text_from_url(url: str) -> str:
    """Fetch and clean main content from a URL."""
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        return ""
    return trafilatura.extract(downloaded)

def load_multiple_urls(url_list: list[str]) -> list[dict]:
    """Fetch multiple URLs and return list of cleaned content blocks."""
    documents = []
    for url in url_list:
        text = extract_text_from_url(url)
        if text:
            documents.append({"url": url, "content": text})
    return documents
