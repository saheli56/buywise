import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initializes the sentence transformer model.
        all-MiniLM-L6-v2 is a great balance of size (80MB) and performance for semantic search.
        """
        self.model = None
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {model_name}...")
            self.model = SentenceTransformer(model_name)
            logger.info("Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load embedding model (Network issue or HuggingFace is down): {e}")
            logger.warning("Falling back to empty embeddings. Recommendations will be randomized.")

    def generate_embedding(self, text: str) -> list[float]:
        """
        Converts text into a 384-dimensional dense vector.
        """
        if not text or not self.model:
            return [0.0] * 384
            
        try:
            embedding = self.model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to encode text: {e}")
            return [0.0] * 384
