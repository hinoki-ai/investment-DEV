-- Migration: Add provider column to analysis_results
-- For existing databases that need to support multi-provider AI

-- Add the provider column
ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50);

-- Update existing records to default to 'kimi' (original provider)
UPDATE analysis_results 
SET provider = 'kimi' 
WHERE provider IS NULL;

-- Add comment
COMMENT ON COLUMN analysis_results.provider IS 'AI provider used for analysis: openai, anthropic, google, kimi, etc.';
