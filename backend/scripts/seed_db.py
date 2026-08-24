import sys
import os
import json
from sqlalchemy import text

# Add backend directory to sys.path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base, SessionLocal
from app.models.db_models import Product
from app.services.embedding import EmbeddingService

def seed_database():
    # 1. Create tables
    print("Creating database tables...")
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
        
    Base.metadata.create_all(bind=engine)
    
    # 2. Load seed data
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "data", "seed_products.json")
    with open(data_path, 'r') as f:
        products_data = json.load(f)
        
    # 3. Initialize Embedding Service
    print("Initializing embedding service (this may download the model)...")
    embedder = EmbeddingService()
    
    db = SessionLocal()
    
    # 4. Insert data
    print("Generating embeddings and saving to database...")
    for item in products_data:
        exists = db.query(Product).filter(Product.product_id == item["id"]).first()
        if exists:
            print(f"Product {item['id']} already exists, skipping.")
            continue
            
        tags_str = ", ".join(item.get("tags", []))
        text_to_embed = f"Title: {item['title']}. Category: {item['category']}. Tags: {tags_str}. Ingredients: {item['ingredients_text']}"
        
        print(f"Embedding {item['id']}...")
        vector = embedder.generate_embedding(text_to_embed)
        
        new_product = Product(
            product_id=item["id"],
            title=item["title"],
            url=item["url"],
            ingredients_text=item["ingredients_text"],
            nutrition_text=item["nutrition_text"],
            category=item.get("category"),
            tags=tags_str,
            embedding=vector
        )
        db.add(new_product)
        
    db.commit()
    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
