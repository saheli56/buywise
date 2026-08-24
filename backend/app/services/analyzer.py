import re
from typing import List
from app.models.schemas import ProductInput, UserProfile, SafetyState, Flag
from app.services.graph_engine import GraphEngine

class AnalyzerService:
    def __init__(self):
        self.graph_engine = GraphEngine()

    def _normalize_text(self, text: str) -> str:
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return text

    def analyze(self, product: ProductInput, profile: UserProfile) -> tuple[SafetyState, str, List[Flag]]:
        if not product.ingredients_text or product.ingredients_text.strip() == "":
            return (
                SafetyState.CANNOT_VERIFY,
                "Ingredient list is empty or missing. Cannot verify safety.",
                []
            )
        
        normalized_ingredients = self._normalize_text(product.ingredients_text)
        flags: List[Flag] = []
        
        for allergy in profile.allergies:
            # Query the Knowledge Graph for all possible derivatives/aliases of the allergy
            synonyms_to_check = self.graph_engine.get_all_aliases(allergy)
            
            for synonym in synonyms_to_check:
                # Use word boundaries to prevent partial matches (e.g. 'wheat' matching 'buckwheat')
                pattern = r'\b' + re.escape(synonym) + r'\b'
                if re.search(pattern, normalized_ingredients):
                    flags.append(
                        Flag(
                            type="allergen",
                            severity=SafetyState.HIGH_RISK,
                            matched_ingredient=synonym.capitalize(),
                            reason=f"Conflicts with your '{allergy}' allergy."
                        )
                    )
                    # We can break early for this specific allergy if we found a match
                    break 

        if flags:
            summary = "Contains " + ", ".join(f"{f.matched_ingredient} ({f.reason})" for f in flags) + "."
            return SafetyState.HIGH_RISK, summary, flags
        
        return SafetyState.COMPATIBLE, "Product appears compatible with your profile.", []
