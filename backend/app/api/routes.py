from fastapi import APIRouter, UploadFile, File
from app.models.schemas import AnalysisRequest, AnalysisResponse, SafetyState, ProductInput
from app.services.analyzer import AnalyzerService
from app.services.recommender import RecommenderService
from app.services.embedding import EmbeddingService
from app.services.ocr_service import OCRService
from app.services.llm_extractor import LLMExtractor

router = APIRouter()

# Initialize services
analyzer_service = AnalyzerService()
embedder_service = EmbeddingService()
recommender_service = RecommenderService(analyzer_service, embedder_service)
ocr_service = OCRService()
llm_extractor = LLMExtractor()

@router.post("/scan-label", response_model=ProductInput)
async def scan_physical_label(file: UploadFile = File(...)):
    """
    Takes an image of a physical product label, runs PaddleOCR, and uses an LLM
    to structure it.
    IMPORTANT: As per architectural constraints, this returns the *un-analyzed* 
    data to the frontend for User Confirmation before safety analysis.
    """
    contents = await file.read()
    
    # 1. Raw OCR
    raw_text = ocr_service.extract_text_from_image(contents)
    
    # 2. LLM Structuring
    structured_data = llm_extractor.structure_label_text(raw_text)
    
    # 3. Return structured data to Client for User Confirmation
    return ProductInput(
        url="physical-scan",
        title=structured_data.get("title", "Scanned Product"),
        ingredients_text=structured_data.get("ingredients_text", ""),
        nutrition_text=structured_data.get("nutrition_text", ""),
        category=structured_data.get("category", "")
    )

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_product(request: AnalysisRequest):
    # 1. Run strict deterministic safety analysis
    state, summary, flags = analyzer_service.analyze(request.product, request.user_profile)
    
    recommendations = []
    
    # 2. If product is unsafe, find semantically similar but safe alternatives
    if state in [SafetyState.CAUTION, SafetyState.HIGH_RISK]:
        recommendations = recommender_service.get_recommendations(
            target_product=request.product,
            profile=request.user_profile, 
            category=request.product.category
        )
    
    return AnalysisResponse(
        safety_state=state,
        analysis_summary=summary,
        flags=flags,
        recommendations=recommendations
    )
