"""
===============================================================================
KIMI K2.5 CLIENT - Intelligence Layer
===============================================================================
Handles all interactions with Kimi K2.5 API for document analysis.
===============================================================================
"""
import base64
import json
import os
from typing import List, Optional, Dict, Any
from pathlib import Path

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential


class KimiClient:
    """
    Client for Kimi K2.5 API.
    Handles document analysis, OCR, and structured data extraction.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        api_url: Optional[str] = None,
        model: str = "kimi-k2-5"
    ):
        self.api_key = api_key or os.getenv("KIMI_API_KEY")
        self.api_url = api_url or os.getenv("KIMI_API_URL", "https://api.moonshot.cn/v1")
        self.model = model or os.getenv("KIMI_MODEL", "kimi-k2-5")
        
        if not self.api_key:
            raise ValueError("KIMI_API_KEY is required")
        
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.api_url
        )
    
    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64 for API."""
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    
    def _get_mime_type(self, file_path: str) -> str:
        """Get MIME type from file extension."""
        ext = Path(file_path).suffix.lower()
        mime_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
        }
        return mime_types.get(ext, 'application/octet-stream')
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def analyze_document(
        self,
        file_path: str,
        analysis_type: str = "document_analysis",
        prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze a document using Kimi K2.5.
        
        Args:
            file_path: Path to the file
            analysis_type: Type of analysis to perform
            prompt: Custom prompt (optional)
        
        Returns:
            Dict with analysis results
        """
        mime_type = self._get_mime_type(file_path)
        
        # Default prompts for different analysis types
        prompts = {
            "document_analysis": """Analyze this investment document thoroughly. Extract:
1. Document type and purpose
2. Key dates (signing, expiration, etc.)
3. Financial amounts mentioned (purchase price, fees, taxes)
4. Parties involved (buyers, sellers, witnesses)
5. Property/Investment details (location, size, description)
6. Important clauses or conditions
7. Risk factors or red flags

Provide your analysis in a structured format.""",

            "land_analysis": """Analyze this land-related document. Extract:
1. Exact location (address, city, state, coordinates if available)
2. Land area (in m², hectares, or other units)
3. Zoning information (residential, commercial, agricultural, etc.)
4. Purchase/sale price and currency
5. Ownership details
6. Any restrictions, liens, or encumbrances
7. Soil quality or agricultural potential (if applicable)
8. Access to infrastructure (roads, water, electricity)

Provide specific measurements and values with confidence scores.""",

            "contract_extraction": """Extract all contract terms from this document:
1. Contract parties and their details
2. Object of the contract
3. Financial terms (price, payment schedule, penalties)
4. Timeline and deadlines
5. Obligations of each party
6. Termination conditions
7. Dispute resolution clauses

Output as structured data with exact quotes where relevant.""",

            "receipt_extraction": """Extract receipt information:
1. Vendor/merchant name
2. Date and time of transaction
3. Items/services purchased
4. Total amount and currency
5. Payment method
6. Tax/VAT information
7. Receipt number or reference

Format as structured financial data.""",

            "ocr": """Perform OCR on this image/document and extract all visible text.
Maintain the original structure and formatting as much as possible.
Identify sections, headers, and key-value pairs."""
        }
        
        system_prompt = prompt or prompts.get(analysis_type, prompts["document_analysis"])
        
        # Prepare message content
        if mime_type.startswith('image/'):
            # Image file - encode as base64
            base64_image = self._encode_image(file_path)
            content = [
                {"type": "text", "text": system_prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{base64_image}"
                    }
                }
            ]
        elif mime_type == 'application/pdf':
            # PDF - Kimi supports PDF files directly
            # We need to upload the file first
            with open(file_path, "rb") as f:
                file_object = self.client.files.create(file=f, purpose="file-extract")
            
            # Get file content
            file_content = self.client.files.content(file_id=file_object.id).text
            
            content = [
                {"type": "text", "text": system_prompt + "\n\nDocument content:\n" + file_content}
            ]
        else:
            # Other files - read as text if possible
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text_content = f.read()
                content = [
                    {"type": "text", "text": system_prompt + "\n\nDocument content:\n" + text_content}
                ]
            except:
                raise ValueError(f"Unsupported file type: {mime_type}")
        
        # Call Kimi API
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert investment document analyst. Extract structured information accurately."},
                {"role": "user", "content": content}
            ],
            temperature=0.1,  # Low temperature for consistent extraction
            max_tokens=4096
        )
        
        # Extract response
        raw_text = response.choices[0].message.content
        usage = response.usage
        
        # Parse structured data from response
        structured_data = self._parse_structured_response(raw_text)
        
        return {
            "raw_text": raw_text,
            "structured_data": structured_data,
            "tokens_used": usage.total_tokens if usage else None,
            "model": self.model,
            "analysis_type": analysis_type
        }
    
    def _parse_structured_response(self, text: str) -> Dict[str, Any]:
        """
        Try to extract structured data from Kimi's response.
        Looks for JSON blocks, key-value pairs, etc.
        """
        import re
        
        structured = {
            "extracted_text": text
        }
        
        # Try to find JSON block
        json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL)
        if json_match:
            try:
                json_data = json.loads(json_match.group(1))
                structured["json_data"] = json_data
            except:
                pass
        
        # Extract key-value pairs (e.g., "Price: $100,000")
        kv_pattern = r'(?:^|\n)([A-Za-z\s]+):\s*(.+?)(?:\n|$)'
        kv_matches = re.findall(kv_pattern, text)
        if kv_matches:
            structured["key_values"] = {
                k.strip(): v.strip() 
                for k, v in kv_matches 
                if len(k.strip()) < 50  # Filter out false positives
            }
        
        # Extract monetary amounts
        amount_pattern = r'(?:R\$|\$|€|£)\s*([\d.,]+(?:\s*[KkMmBb])?)'
        amounts = re.findall(amount_pattern, text)
        if amounts:
            structured["amounts_found"] = amounts
        
        # Extract dates
        date_patterns = [
            r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',
            r'\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b',
        ]
        dates = []
        for pattern in date_patterns:
            dates.extend(re.findall(pattern, text))
        if dates:
            structured["dates_found"] = list(set(dates))
        
        return structured
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def summarize_document(self, text: str, max_length: int = 500) -> str:
        """Generate a summary of document content."""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": f"Summarize this investment document in {max_length} characters or less. Focus on key financial terms, parties, and important details."},
                {"role": "user", "content": text}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        return response.choices[0].message.content


# Singleton instance
_kimi_instance: Optional[KimiClient] = None


def get_kimi_client() -> KimiClient:
    """Get or create the global Kimi client instance."""
    global _kimi_instance
    if _kimi_instance is None:
        _kimi_instance = KimiClient()
    return _kimi_instance
