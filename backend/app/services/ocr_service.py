import logging

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        self.ocr = None
        try:
            from paddleocr import PaddleOCR
            import cv2
            import numpy as np
            logger.info("Initializing PaddleOCR...")
            self.ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            logger.info("PaddleOCR initialized.")
        except ImportError:
            logger.warning("PaddleOCR or OpenCV is not installed. OCR endpoint will return empty text.")


    def extract_text_from_image(self, image_bytes: bytes) -> str:
        if not self.ocr:
            return "OCR Engine not available. Please install paddleocr."
        
        try:
            import cv2
            import numpy as np
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            result = self.ocr.ocr(img, cls=True)

            
            # Extract just the text blocks and join them
            extracted_text = []
            if result and result[0]:
                for line in result[0]:
                    text = line[1][0] # PaddleOCR output format: [[[box], (text, confidence)], ...]
                    extracted_text.append(text)
                    
            return " ".join(extracted_text)
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            return ""
