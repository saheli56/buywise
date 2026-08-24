import pytest
from app.models.schemas import ProductInput, UserProfile, SafetyState
from app.services.analyzer import AnalyzerService

def test_compatible_product():
    analyzer = AnalyzerService()
    product = ProductInput(
        url="http://example.com",
        title="Apple",
        ingredients_text="Apples, Water",
        nutrition_text="100 cal",
        category="Fruit"
    )
    profile = UserProfile(allergies=["dairy", "peanut"])
    
    state, summary, flags = analyzer.analyze(product, profile)
    assert state == SafetyState.COMPATIBLE
    assert len(flags) == 0

def test_high_risk_product():
    analyzer = AnalyzerService()
    product = ProductInput(
        url="http://example.com",
        title="Protein Bar",
        ingredients_text="Whey protein, almonds, sugar",
        nutrition_text="200 cal",
        category="Snack"
    )
    
    profile = UserProfile(allergies=["dairy"])
    
    state, summary, flags = analyzer.analyze(product, profile)
    assert state == SafetyState.HIGH_RISK
    assert len(flags) == 1
    assert flags[0].matched_ingredient.lower() == "whey"

def test_cannot_verify_product():
    analyzer = AnalyzerService()
    product = ProductInput(
        url="http://example.com",
        title="Mystery Food",
        ingredients_text="",
        nutrition_text="",
        category="Snack"
    )
    profile = UserProfile(allergies=["dairy"])
    
    state, summary, flags = analyzer.analyze(product, profile)
    assert state == SafetyState.CANNOT_VERIFY
