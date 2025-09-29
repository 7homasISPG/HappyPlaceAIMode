try:
    from deep_translator import GoogleTranslator
except ImportError:
    GoogleTranslator = None

def translate(text: str, source: str = "auto", target: str = "en") -> str:
    if GoogleTranslator is None:
        raise ImportError("Install `deep-translator` for translation support.")
    
    try:
        return GoogleTranslator(source=source, target=target).translate(text)
    except Exception:
        return text  # fallback to original if translation fails
