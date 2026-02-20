"""
===============================================================================
UNIT TESTS - AI Client
===============================================================================
"""
import pytest
from unittest.mock import MagicMock, patch, mock_open


class TestAIClient:
    """Test cases for AI Client."""
    
    @pytest.mark.asyncio
    async def test_ai_client_initialization(self):
        """Test AI client can be initialized."""
        from ai_client import AIClient
        
        client = AIClient(api_key="test-key", provider="openai")
        
        assert client.provider == "openai"
        assert client.api_key == "test-key"
    
    @pytest.mark.asyncio
    async def test_openai_provider(self, mock_openai_client):
        """Test OpenAI provider analysis."""
        from ai_client import AIClient
        
        client = AIClient(api_key="test-key", provider="openai")
        
        # Mock file content
        with patch("builtins.open", mock_open(read_data=b"test content")):
            result = await client.analyze_document(
                file_path="/tmp/test.pdf",
                analysis_type="document_analysis",
            )
        
        assert result is not None
        assert "summary" in result or "raw_text" in result
    
    @pytest.mark.asyncio
    async def test_anthropic_provider(self, mock_anthropic_client):
        """Test Anthropic provider analysis."""
        from ai_client import AIClient
        
        client = AIClient(api_key="test-key", provider="anthropic")
        
        with patch("builtins.open", mock_open(read_data=b"test content")):
            result = await client.analyze_document(
                file_path="/tmp/test.pdf",
                analysis_type="document_analysis",
            )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_provider_fallback(self):
        """Test provider fallback mechanism."""
        from ai_client import AIClient
        
        # Create client with multiple providers
        client = AIClient(
            api_key="test-key",
            provider="openai",
            fallback_providers=["anthropic", "google"],
        )
        
        assert client.provider == "openai"
        assert client.fallback_providers == ["anthropic", "google"]
    
    def test_extract_entities(self):
        """Test entity extraction from text."""
        from ai_client import AIClient
        
        client = AIClient(api_key="test-key")
        
        text = "John Doe purchased a property in São Paulo for R$ 500,000 on January 15, 2024."
        
        entities = client._extract_entities(text)
        
        assert isinstance(entities, dict)
        # Should extract person, location, amount, date
    
    def test_calculate_confidence(self):
        """Test confidence score calculation."""
        from ai_client import AIClient
        
        client = AIClient(api_key="test-key")
        
        # Test with complete data
        structured_data = {
            "entities": [{"type": "PERSON", "text": "John"}],
            "dates": [{"type": "purchase_date", "value": "2024-01-01"}],
            "amounts": [{"type": "price", "value": 100000}],
        }
        
        confidence = client._calculate_confidence(structured_data)
        
        assert 0 <= confidence <= 1
    
    def test_format_value_brl(self):
        """Test BRL value formatting."""
        from ai_client import AIClient
        
        client = AIClient(api_key="test-key")
        
        result = client._format_value(100000, "BRL")
        
        assert result["value"] == 100000
        assert result["currency"] == "BRL"


class TestKimiClient:
    """Test cases for Kimi-specific client."""
    
    @pytest.mark.asyncio
    async def test_kimi_client_initialization(self):
        """Test Kimi client initialization."""
        from kimi_client import KimiClient
        
        client = KimiClient(api_key="test-key")
        
        assert client.api_key == "test-key"
        assert client.base_url == "https://api.moonshot.cn/v1"
    
    @pytest.mark.asyncio
    async def test_kimi_document_analysis(self):
        """Test Kimi document analysis."""
        from kimi_client import KimiClient
        
        with patch("kimi_client.openai.OpenAI") as mock_openai:
            mock_instance = MagicMock()
            mock_response = MagicMock()
            mock_response.choices = [
                MagicMock(message=MagicMock(content='{"summary": "Test"}'))
            ]
            mock_response.usage = MagicMock(total_tokens=300)
            mock_response.model = "kimi-k2.5"
            
            mock_instance.chat.completions.create.return_value = mock_response
            mock_openai.return_value = mock_instance
            
            client = KimiClient(api_key="test-key")
            
            with patch("builtins.open", mock_open(read_data=b"test")):
                result = await client.analyze_document("/tmp/test.pdf")
            
            assert result is not None


class TestAIClientErrorHandling:
    """Test AI client error handling."""
    
    @pytest.mark.asyncio
    async def test_file_not_found_error(self):
        """Test handling of missing file."""
        from ai_client import AIClient
        
        client = AIClient(api_key="test-key")
        
        with pytest.raises(FileNotFoundError):
            await client.analyze_document("/nonexistent/file.pdf")
    
    @pytest.mark.asyncio
    async def test_api_error_handling(self, mock_openai_client):
        """Test API error handling."""
        from ai_client import AIClient
        
        mock_openai_client.chat.completions.create.side_effect = Exception("API Error")
        
        client = AIClient(api_key="test-key", provider="openai")
        
        with patch("builtins.open", mock_open(read_data=b"test")):
            with pytest.raises(Exception):
                await client.analyze_document("/tmp/test.pdf")
    
    @pytest.mark.asyncio
    async def test_invalid_response_handling(self, mock_openai_client):
        """Test handling of invalid API response."""
        from ai_client import AIClient
        
        # Return invalid JSON
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(message=MagicMock(content="not valid json"))
        ]
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        client = AIClient(api_key="test-key", provider="openai")
        
        with patch("builtins.open", mock_open(read_data=b"test")):
            result = await client.analyze_document("/tmp/test.pdf")
            # Should handle gracefully
            assert result is not None
