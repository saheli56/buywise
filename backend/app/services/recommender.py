import logging
from typing import List
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.db_models import Product
from app.models.schemas import ProductInput, UserProfile, Recommendation, SafetyState
from app.services.analyzer import AnalyzerService
from app.services.embedding import EmbeddingService

logger = logging.getLogger(__name__)

class RecommenderService:
    def __init__(self, analyzer: AnalyzerService, embedder: EmbeddingService):
        self.analyzer = analyzer
        self.embedder = embedder

    def get_recommendations(self, target_product: ProductInput, profile: UserProfile, category: str = None, limit: int = 3) -> List[Recommendation]:
        """
        Uses pgvector to find the most semantically similar products to the target product,
        and then filters them to ensure they are safe for the user's specific allergy profile.
        """
        # 1. Generate an embedding for the product we want alternatives for
        text_to_embed = f"Title: {target_product.title}. Category: {target_product.category or ''}. Ingredients: {target_product.ingredients_text}"
        target_vector = self.embedder.generate_embedding(text_to_embed)
        
        db: Session = SessionLocal()
        recommendations = []
        
        try:
            # 2. Query Postgres for nearest neighbors using cosine distance
            query = db.query(Product)
            if category:
                query = query.filter(Product.category == category)
                
            # We fetch a larger pool (10) because some close matches might be unsafe
            similar_products = query.order_by(Product.embedding.cosine_distance(target_vector)).limit(10).all()
            
            # 3. Filter out unsafe products
            for prod in similar_products:
                # Skip the exact same product if it's already in our DB
                if prod.title.lower() == target_product.title.lower():
                    continue
                    
                prod_input = ProductInput(
                    url=prod.url,
                    title=prod.title,
                    ingredients_text=prod.ingredients_text,
                    nutrition_text=prod.nutrition_text,
                    category=prod.category
                )

                state, _, _ = self.analyzer.analyze(prod_input, profile)
                
                if state == SafetyState.COMPATIBLE:
                    # In a production app, you can calculate a % match from the vector distance
                    recommendations.append(
                        Recommendation(
                            title=prod.title,
                            url=prod.url,
                            match_score=95, # Placeholder for semantic score
                            reason="Semantically similar to your choice, but free of your allergens."
                        )
                    )
                    
                if len(recommendations) >= limit:
                    break
                    
        except Exception as e:
            logger.error(f"Error fetching recommendations: {e}")
        finally:
            db.close()
            
        return recommendations
