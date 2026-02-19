"""
===============================================================================
AI CLIENT - Multi-Provider Intelligence Layer
===============================================================================
Unified interface for multiple AI providers:
  - Kimi K2.5 (Moonshot AI)
  - OpenAI GPT-4o
  - Anthropic Claude
  - Google Gemini
  - Ollama (local models)
===============================================================================
"""
import base64
import json
import os
import time
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Union
from pathlib import Path
from dataclasses import dataclass


# =============================================================================
# DATA MODELS
# =============================================================================

@dataclass
class AnalysisResult:
    """Standardized analysis result across all providers."""
    raw_text: str
    structured_data: Dict[str, Any]
    tokens_used: Optional[int]
    model: str
    analysis_type: str
    provider: str
    processing_time_ms: Optional[int] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw_text": self.raw_text,
            "structured_data": self.structured_data,
            "tokens_used": self.tokens_used,
            "model": self.model,
            "analysis_type": self.analysis_type,
            "provider": self.provider,
            "processing_time_ms": self.processing_time_ms,
        }


# =============================================================================
# PROMPTS LIBRARY
# =============================================================================

ANALYSIS_PROMPTS = {
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
Identify sections, headers, and key-value pairs.""",
}


# =============================================================================
# BASE CLIENT
# =============================================================================

class BaseAIClient(ABC):
    """Abstract base class for all AI providers."""
    
    provider_name: str = "base"
    
    def __init__(self, model: Optional[str] = None, **kwargs):
        self.model = model or self._default_model()
        self._parse_structured = kwargs.get('parse_structured', True)
    
    @abstractmethod
    def _default_model(self) -> str:
        """Return the default model for this provider."""
        pass
    
    @abstractmethod
    def analyze_document(
        self,
        file_path: str,
        analysis_type: str = "document_analysis",
        prompt: Optional[str] = None
    ) -> AnalysisResult:
        """Analyze a document and return structured results."""
        pass
    
    @abstractmethod
    def summarize_document(self, text: str, max_length: int = 500) -> str:
        """Generate a summary of document content."""
        pass
    
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
    
    def _get_prompt(self, analysis_type: str, custom_prompt: Optional[str] = None) -> str:
        """Get the appropriate prompt for analysis type."""
        if custom_prompt:
            return custom_prompt
        return ANALYSIS_PROMPTS.get(analysis_type, ANALYSIS_PROMPTS["document_analysis"])
    
    def _parse_structured_response(self, text: str) -> Dict[str, Any]:
        """
        Extract structured data from AI response.
        Looks for JSON blocks, key-value pairs, dates, amounts, etc.
        """
        import re
        
        structured = {"extracted_text": text}
        
        # Try to find JSON block
        json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL)
        if json_match:
            try:
                json_data = json.loads(json_match.group(1))
                structured["json_data"] = json_data
            except:
                pass
        
        # Also try without language specifier
        json_match2 = re.search(r'```\n(.*?)\n```', text, re.DOTALL)
        if json_match2 and "json_data" not in structured:
            try:
                json_data = json.loads(json_match2.group(1))
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
        amount_pattern = r'(?:R\$|\$|€|£|USD|EUR|BRL)\s*([\d.,]+(?:\s*[KkMmBb])?)'
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


# =============================================================================
# OPENAI-COMPATIBLE CLIENT (Kimi, OpenAI, Local models)
# =============================================================================

class OpenAICompatibleClient(BaseAIClient):
    """
    Client for OpenAI-compatible APIs.
    Works with: Kimi, OpenAI, Ollama, vLLM, etc.
    """
    
    provider_name = "openai"
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        api_url: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs
    ):
        self.api_key = api_key or os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.api_url = api_url or os.getenv("AI_API_URL") or os.getenv("OPENAI_API_URL", "https://api.openai.com/v1")
        
        # Try legacy env vars for backward compatibility
        if not self.api_key:
            self.api_key = os.getenv("KIMI_API_KEY")
        if not self.api_url or self.api_url == "https://api.openai.com/v1":
            kimi_url = os.getenv("KIMI_API_URL")
            if kimi_url:
                self.api_url = kimi_url
        
        super().__init__(model, **kwargs)
        
        if not self.api_key:
            raise ValueError(
                f"API key required. Set AI_API_KEY, OPENAI_API_KEY, or KIMI_API_KEY environment variable."
            )
        
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.api_key, base_url=self.api_url)
        except ImportError:
            raise ImportError("openai package required. Install: pip install openai")
    
    def _default_model(self) -> str:
        return os.getenv("AI_MODEL") or os.getenv("OPENAI_MODEL") or os.getenv("KIMI_MODEL", "gpt-4o")
    
    def analyze_document(
        self,
        file_path: str,
        analysis_type: str = "document_analysis",
        prompt: Optional[str] = None
    ) -> AnalysisResult:
        """Analyze a document using OpenAI-compatible API."""
        import time as time_module
        start_time = time_module.time()
        
        mime_type = self._get_mime_type(file_path)
        system_prompt = self._get_prompt(analysis_type, prompt)
        
        # Prepare message content
        if mime_type.startswith('image/'):
            # Image file - encode as base64
            base64_image = self._encode_image(file_path)
            content = [
                {"type": "text", "text": system_prompt},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}
                }
            ]
        elif mime_type == 'application/pdf':
            # PDF - Try to use file upload if supported (Kimi), else read text
            try:
                with open(file_path, "rb") as f:
                    file_object = self.client.files.create(file=f, purpose="file-extract")
                file_content = self.client.files.content(file_id=file_object.id).text
                content = [{"type": "text", "text": system_prompt + "\n\nDocument content:\n" + file_content}]
            except Exception:
                # Fallback: try PyPDF2 or just skip PDF content
                try:
                    import PyPDF2
                    with open(file_path, "rb") as f:
                        reader = PyPDF2.PdfReader(f)
                        text = "\n".join(page.extract_text() or "" for page in reader.pages)
                    content = [{"type": "text", "text": system_prompt + "\n\nDocument content:\n" + text}]
                except ImportError:
                    content = [{"type": "text", "text": system_prompt + "\n\n[PDF content extraction not available]"}]
        else:
            # Other files - read as text if possible
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text_content = f.read()
                content = [{"type": "text", "text": system_prompt + "\n\nDocument content:\n" + text_content}]
            except:
                raise ValueError(f"Unsupported file type: {mime_type}")
        
        # Call API
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert investment document analyst. Extract structured information accurately."},
                {"role": "user", "content": content}
            ],
            temperature=0.1,
            max_tokens=4096
        )
        
        raw_text = response.choices[0].message.content
        usage = response.usage
        processing_time = int((time_module.time() - start_time) * 1000)
        
        structured_data = self._parse_structured_response(raw_text) if self._parse_structured else {"extracted_text": raw_text}
        
        return AnalysisResult(
            raw_text=raw_text,
            structured_data=structured_data,
            tokens_used=usage.total_tokens if usage else None,
            model=self.model,
            analysis_type=analysis_type,
            provider=self.provider_name,
            processing_time_ms=processing_time
        )
    
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


# =============================================================================
# ANTHROPIC CLIENT (Claude)
# =============================================================================

class AnthropicClient(BaseAIClient):
    """Client for Anthropic Claude API."""
    
    provider_name = "anthropic"
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs
    ):
        self.api_key = api_key or os.getenv("AI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        super().__init__(model, **kwargs)
        
        if not self.api_key:
            raise ValueError("API key required. Set AI_API_KEY or ANTHROPIC_API_KEY environment variable.")
        
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=self.api_key)
        except ImportError:
            raise ImportError("anthropic package required. Install: pip install anthropic")
    
    def _default_model(self) -> str:
        return os.getenv("AI_MODEL") or os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    
    def analyze_document(
        self,
        file_path: str,
        analysis_type: str = "document_analysis",
        prompt: Optional[str] = None
    ) -> AnalysisResult:
        """Analyze a document using Claude API."""
        import time as time_module
        start_time = time_module.time()
        
        mime_type = self._get_mime_type(file_path)
        system_prompt = self._get_prompt(analysis_type, prompt)
        
        # Build message content
        if mime_type.startswith('image/'):
            base64_image = self._encode_image(file_path)
            content = [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": base64_image
                    }
                },
                {"type": "text", "text": system_prompt}
            ]
        elif mime_type == 'application/pdf':
            # Claude supports PDF via base64
            base64_pdf = self._encode_image(file_path)  # Same encoding works for PDFs
            content = [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": base64_pdf
                    }
                },
                {"type": "text", "text": system_prompt}
            ]
        else:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text_content = f.read()
                content = [{"type": "text", "text": system_prompt + "\n\nDocument content:\n" + text_content}]
            except:
                raise ValueError(f"Unsupported file type: {mime_type}")
        
        # Call Claude API
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system="You are an expert investment document analyst. Extract structured information accurately.",
            messages=[{"role": "user", "content": content}]
        )
        
        raw_text = response.content[0].text if response.content else ""
        processing_time = int((time_module.time() - start_time) * 1000)
        
        structured_data = self._parse_structured_response(raw_text) if self._parse_structured else {"extracted_text": raw_text}
        
        return AnalysisResult(
            raw_text=raw_text,
            structured_data=structured_data,
            tokens_used=response.usage.input_tokens + response.usage.output_tokens if response.usage else None,
            model=self.model,
            analysis_type=analysis_type,
            provider=self.provider_name,
            processing_time_ms=processing_time
        )
    
    def summarize_document(self, text: str, max_length: int = 500) -> str:
        """Generate a summary of document content."""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=500,
            system=f"Summarize this investment document in {max_length} characters or less. Focus on key financial terms, parties, and important details.",
            messages=[{"role": "user", "content": text}]
        )
        return response.content[0].text if response.content else ""


# =============================================================================
# GOOGLE CLIENT (Gemini)
# =============================================================================

class GoogleClient(BaseAIClient):
    """Client for Google Gemini API."""
    
    provider_name = "google"
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs
    ):
        self.api_key = api_key or os.getenv("AI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        super().__init__(model, **kwargs)
        
        if not self.api_key:
            raise ValueError("API key required. Set AI_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY environment variable.")
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.client = genai
            self._model_instance = genai.GenerativeModel(self.model)
        except ImportError:
            raise ImportError("google-generativeai package required. Install: pip install google-generativeai")
    
    def _default_model(self) -> str:
        return os.getenv("AI_MODEL") or os.getenv("GOOGLE_MODEL") or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    def analyze_document(
        self,
        file_path: str,
        analysis_type: str = "document_analysis",
        prompt: Optional[str] = None
    ) -> AnalysisResult:
        """Analyze a document using Gemini API."""
        import time as time_module
        start_time = time_module.time()
        
        mime_type = self._get_mime_type(file_path)
        system_prompt = self._get_prompt(analysis_type, prompt)
        
        # Build content based on file type
        if mime_type.startswith('image/'):
            # Upload image file
            file_obj = self.client.upload_file(file_path, mime_type=mime_type)
            response = self._model_instance.generate_content([system_prompt, file_obj])
        elif mime_type == 'application/pdf':
            # Gemini supports PDF upload
            file_obj = self.client.upload_file(file_path, mime_type="application/pdf")
            response = self._model_instance.generate_content([system_prompt, file_obj])
        else:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text_content = f.read()
                response = self._model_instance.generate_content(system_prompt + "\n\nDocument content:\n" + text_content)
            except:
                raise ValueError(f"Unsupported file type: {mime_type}")
        
        raw_text = response.text if hasattr(response, 'text') else str(response)
        processing_time = int((time_module.time() - start_time) * 1000)
        
        # Estimate tokens (Gemini doesn't return exact token counts)
        tokens_used = len(raw_text.split()) + len(system_prompt.split())
        
        structured_data = self._parse_structured_response(raw_text) if self._parse_structured else {"extracted_text": raw_text}
        
        return AnalysisResult(
            raw_text=raw_text,
            structured_data=structured_data,
            tokens_used=tokens_used,
            model=self.model,
            analysis_type=analysis_type,
            provider=self.provider_name,
            processing_time_ms=processing_time
        )
    
    def summarize_document(self, text: str, max_length: int = 500) -> str:
        """Generate a summary of document content."""
        response = self._model_instance.generate_content(
            f"Summarize this investment document in {max_length} characters or less. Focus on key financial terms, parties, and important details.\n\n{text}"
        )
        return response.text if hasattr(response, 'text') else ""


# =============================================================================
# FACTORY FUNCTION
# =============================================================================

PROVIDER_REGISTRY = {
    "openai": OpenAICompatibleClient,
    "kimi": OpenAICompatibleClient,  # Alias
    "moonshot": OpenAICompatibleClient,  # Alias
    "anthropic": AnthropicClient,
    "claude": AnthropicClient,  # Alias
    "google": GoogleClient,
    "gemini": GoogleClient,  # Alias
}


def create_ai_client(
    provider: Optional[str] = None,
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    api_url: Optional[str] = None,
    **kwargs
) -> BaseAIClient:
    """
    Factory function to create the appropriate AI client.
    
    Args:
        provider: Provider name (openai, anthropic, google, kimi, etc.)
                  Falls back to AI_PROVIDER env var, then auto-detects from API keys
        model: Model name (optional, uses provider default)
        api_key: API key (optional, uses env vars)
        api_url: API URL for OpenAI-compatible providers (optional)
    
    Returns:
        Configured AI client instance
    
    Raises:
        ValueError: If provider not supported or API key missing
    """
    # Determine provider
    provider = (provider or os.getenv("AI_PROVIDER", "")).lower()
    
    # Auto-detect from environment if not specified
    if not provider:
        if os.getenv("KIMI_API_KEY"):
            provider = "kimi"
        elif os.getenv("ANTHROPIC_API_KEY"):
            provider = "anthropic"
        elif os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"):
            provider = "google"
        elif os.getenv("OPENAI_API_KEY") or os.getenv("AI_API_KEY"):
            provider = "openai"
        else:
            raise ValueError(
                "AI_PROVIDER not set and no API keys found. "
                "Set AI_PROVIDER to: openai, anthropic, google, or kimi"
            )
    
    # Get client class
    client_class = PROVIDER_REGISTRY.get(provider)
    if not client_class:
        supported = ", ".join(PROVIDER_REGISTRY.keys())
        raise ValueError(f"Unknown provider: {provider}. Supported: {supported}")
    
    # Instantiate with appropriate args
    if client_class == OpenAICompatibleClient:
        return client_class(api_key=api_key, api_url=api_url, model=model, **kwargs)
    else:
        return client_class(api_key=api_key, model=model, **kwargs)


# Singleton instance for global access
_ai_instance: Optional[BaseAIClient] = None


def get_ai_client() -> BaseAIClient:
    """Get or create the global AI client instance."""
    global _ai_instance
    if _ai_instance is None:
        _ai_instance = create_ai_client()
    return _ai_instance


def reset_ai_client():
    """Reset the global AI client instance (useful for testing)."""
    global _ai_instance
    _ai_instance = None


# =============================================================================
# BACKWARD COMPATIBILITY
# =============================================================================

# Keep old function name working
get_kimi_client = get_ai_client
