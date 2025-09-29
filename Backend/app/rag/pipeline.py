# --- START OF FILE app/rag/pipeline.py (Final Version) ---

import json
from langchain_openai import ChatOpenAI
from app.rag.retriever import get_retriever
from app.rag.prompt_template import get_structured_prompt_template
from app.config import settings
from langchain.prompts import PromptTemplate

def get_rag_answer(query: str, lang: str = "en"):
    # 1. Prepare retriever
    retriever = get_retriever()
    
    # 2. Get the raw source documents
    source_documents = retriever.invoke(query) 

    # 3. Format the context for the prompt, making citations very clear
    context_with_citations = ""
    citations_map = []
    for i, doc in enumerate(source_documents):
        source_id = i + 1
        source_name = doc.metadata.get("source", "Unknown Source")
        
        # This format is easy for the LLM to parse
        context_with_citations += f"--- [CITATION id={source_id}, source=\"{source_name}\"] ---\n"
        context_with_citations += f"{doc.page_content}\n\n"
        
        citations_map.append({"id": source_id, "source": source_name})

    # 4. Prepare the LLM with JSON Mode enabled
    llm = ChatOpenAI(
        temperature=0.0, # Set to 0 for more deterministic, factual JSON output
        model_name=settings.LLM_MODEL_NAME, # e.g., "gpt-4-1106-preview" or "gpt-3.5-turbo-1106"
        openai_api_key=settings.OPENAI_API_KEY,
        model_kwargs={"response_format": {"type": "json_object"}},
    )

    # 5. Setup prompt using the new, more detailed template
    template_str = get_structured_prompt_template(lang)
    prompt = PromptTemplate(input_variables=["context", "question"], template=template_str)
    
    # 6. Format the final prompt
    final_prompt = prompt.format(context=context_with_citations, question=query)

    # 7. Run the LLM directly
    llm_response_str = llm.invoke(final_prompt).content
    
    try:
        # 8. Parse the JSON string response
        response_json = json.loads(llm_response_str)
        print("Successfully parsed LLM JSON response.") # For debugging
    except json.JSONDecodeError as e:
        print(f"Error: LLM did not return valid JSON. Response was:\n{llm_response_str}\nError: {e}")
        response_json = {
            "type": "answer",
            "text": "Sorry, I had trouble formatting my response. Please try rephrasing your question.",
            "citations": [],
            "follow_ups": []
        }
        
    # Before returning, we need to map the citation IDs the LLM used back to the full source names
    if 'citations' in response_json and isinstance(response_json['citations'], list):
        resolved_citations = []
        for citation in response_json['citations']:
            if isinstance(citation, dict) and 'id' in citation:
                 # Find the matching source from our original map
                 match = next((c for c in citations_map if c['id'] == citation['id']), None)
                 if match:
                     resolved_citations.append(match)
        response_json['citations'] = resolved_citations

    print(response_json)


    return response_json