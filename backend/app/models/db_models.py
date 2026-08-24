from sqlalchemy import Column, Integer, String, Text
from pgvector.sqlalchemy import Vector
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, unique=True, index=True)
    title = Column(String, index=True)
    url = Column(String)
    ingredients_text = Column(Text)
    nutrition_text = Column(Text)
    category = Column(String, index=True)
    tags = Column(String) # Stored as comma-separated string
    
    # 384 dimensions is standard for the all-MiniLM-L6-v2 model we will use
    embedding = Column(Vector(384))
