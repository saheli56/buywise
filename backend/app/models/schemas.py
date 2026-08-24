from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class SafetyState(str, Enum):
    COMPATIBLE = "Compatible"
    CAUTION = "Caution"
    HIGH_RISK = "High Risk"
    CANNOT_VERIFY = "Cannot Verify"

class ProductInput(BaseModel):
    url: str
    title: str
    ingredients_text: str
    nutrition_text: str
    category: Optional[str] = None

class UserProfile(BaseModel):
    allergies: List[str] = []
    diets: List[str] = []
    goals: List[str] = []

class AnalysisRequest(BaseModel):
    product: ProductInput
    user_profile: UserProfile

class Flag(BaseModel):
    type: str
    severity: SafetyState
    matched_ingredient: str
    reason: str

class Recommendation(BaseModel):
    title: str
    url: str
    match_score: int
    reason: str

class AnalysisResponse(BaseModel):
    safety_state: SafetyState
    analysis_summary: str
    flags: List[Flag]
    recommendations: List[Recommendation]
