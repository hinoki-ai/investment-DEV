-- =============================================================================
-- NEXUS - Database Schema
-- =============================================================================
-- Three-layer architecture tables:
--   - Coordination: file_registry, processing_jobs, analysis_results
--   - Domain: investments, documents, assets
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- INVESTMENT CATEGORIES
-- -----------------------------------------------------------------------------
CREATE TYPE investment_category AS ENUM (
    'land',
    'stocks', 
    'gold',
    'crypto',
    'real_estate',
    'bonds',
    'other'
);

-- -----------------------------------------------------------------------------
-- FILE REGISTRY (Layer 2: Coordination)
-- Tracks all uploaded files across the system
-- -----------------------------------------------------------------------------
CREATE TABLE file_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- File identification
    original_filename VARCHAR(500) NOT NULL,
    storage_key VARCHAR(1000) NOT NULL,        -- Path in S3/R2
    storage_bucket VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    file_hash VARCHAR(64),                      -- SHA-256 for deduplication
    
    -- Upload metadata
    uploaded_by VARCHAR(255),                   -- User identifier
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_device VARCHAR(50),                  -- phone, laptop, etc.
    
    -- Processing state machine
    status VARCHAR(50) DEFAULT 'pending'        -- pending, processing, completed, failed
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'archived')),
    
    -- Relationships
    investment_id UUID,                         -- Optional: linked investment
    document_id UUID,                           -- Optional: linked document
    
    -- Metadata
    tags TEXT[],                                -- Array of tags
    metadata JSONB DEFAULT '{}',                -- Flexible metadata
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT unique_storage_key UNIQUE (storage_bucket, storage_key)
);

CREATE INDEX idx_file_registry_status ON file_registry(status);
CREATE INDEX idx_file_registry_investment ON file_registry(investment_id);
CREATE INDEX idx_file_registry_uploaded_at ON file_registry(uploaded_at DESC);
CREATE INDEX idx_file_registry_tags ON file_registry USING GIN(tags);

-- -----------------------------------------------------------------------------
-- PROCESSING JOBS (Layer 2: Coordination)
-- Tracks analysis jobs for the Intelligence Worker
-- -----------------------------------------------------------------------------
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Job identification
    job_type VARCHAR(50) NOT NULL               -- document_analysis, valuation, etc.
        CHECK (job_type IN ('document_analysis', 'valuation', 'ocr', 'summarization', 'custom')),
    
    -- State machine
    status VARCHAR(50) DEFAULT 'queued'
        CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5,                 -- 1 = highest, 10 = lowest
    
    -- Relationships
    file_id UUID REFERENCES file_registry(id) ON DELETE CASCADE,
    investment_id UUID,
    
    -- Worker tracking
    worker_id VARCHAR(100),                     -- Which worker picked this up
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Job configuration
    parameters JSONB DEFAULT '{}',              -- Job-specific parameters
    
    -- Results
    result_id UUID,                             -- Links to analysis_results
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_at TIMESTAMP WITH TIME ZONE       -- For delayed processing
);

CREATE INDEX idx_processing_jobs_status ON processing_jobs(status, priority DESC, created_at);
CREATE INDEX idx_processing_jobs_file ON processing_jobs(file_id);
CREATE INDEX idx_processing_jobs_investment ON processing_jobs(investment_id);
CREATE INDEX idx_processing_jobs_worker ON processing_jobs(worker_id) WHERE status = 'running';

-- -----------------------------------------------------------------------------
-- ANALYSIS RESULTS (Layer 3: Intelligence Output)
-- Stores AI-generated analysis from Kimi K2.5
-- -----------------------------------------------------------------------------
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    job_id UUID REFERENCES processing_jobs(id) ON DELETE SET NULL,
    file_id UUID REFERENCES file_registry(id) ON DELETE CASCADE,
    investment_id UUID,
    
    -- Analysis metadata
    analysis_type VARCHAR(50) NOT NULL,
    model_version VARCHAR(100),                 -- AI model used
    provider VARCHAR(50),                       -- AI provider (openai, anthropic, google, kimi)
    
    -- Content
    raw_text TEXT,                              -- Full AI response
    structured_data JSONB DEFAULT '{}',         -- Extracted structured data
    summary TEXT,                               -- Executive summary
    
    -- Key extractions (common fields indexed for search)
    extracted_entities JSONB DEFAULT '{}',      -- People, companies, locations
    extracted_dates JSONB DEFAULT '{}',         -- Dates found in document
    extracted_amounts JSONB DEFAULT '{}',       -- Financial amounts
    
    -- Confidence & quality
    confidence_score DECIMAL(3,2),              -- 0.00 to 1.00
    quality_flags TEXT[],                       -- Issues detected
    
    -- Processing metrics
    processing_time_ms INTEGER,                 -- How long analysis took
    tokens_used INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

CREATE INDEX idx_analysis_results_file ON analysis_results(file_id);
CREATE INDEX idx_analysis_results_investment ON analysis_results(investment_id);
CREATE INDEX idx_analysis_results_type ON analysis_results(analysis_type);
CREATE INDEX idx_analysis_results_structured ON analysis_results USING GIN(structured_data);

-- -----------------------------------------------------------------------------
-- INVESTMENTS (Domain Layer)
-- Core investment tracking - starting with LAND
-- -----------------------------------------------------------------------------
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name VARCHAR(500) NOT NULL,
    category investment_category NOT NULL,
    description TEXT,
    
    -- Location (primarily for land/real estate)
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(100) DEFAULT 'Brazil',
    coordinates POINT,                          -- PostGIS if needed later
    
    -- Financials
    purchase_price DECIMAL(18,2),
    purchase_currency VARCHAR(3) DEFAULT 'BRL',
    purchase_date DATE,
    current_value DECIMAL(18,2),
    last_valuation_date DATE,
    
    -- For land specifically
    land_area_m2 DECIMAL(12,2),
    land_area_hectares DECIMAL(10,4),
    zoning_type VARCHAR(100),                   -- residential, commercial, agricultural
    
    -- Ownership
    ownership_percentage DECIMAL(5,2) DEFAULT 100.00,
    co_owners TEXT[],
    
    -- Status
    status VARCHAR(50) DEFAULT 'active'
        CHECK (status IN ('active', 'sold', 'pending', 'under_contract')),
    
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    
    -- Constraints
    CONSTRAINT valid_ownership CHECK (ownership_percentage > 0 AND ownership_percentage <= 100)
);

CREATE INDEX idx_investments_category ON investments(category);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_location ON investments(state, city);
CREATE INDEX idx_investments_tags ON investments USING GIN(tags);

-- -----------------------------------------------------------------------------
-- DOCUMENTS (Domain Layer)
-- Links files to investments with context
-- -----------------------------------------------------------------------------
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
    file_id UUID REFERENCES file_registry(id) ON DELETE CASCADE,
    
    -- Document classification
    document_type VARCHAR(100) NOT NULL         -- deed, contract, photo, video, receipt, etc.
        CHECK (document_type IN (
            'deed', 'contract', 'receipt', 'photo', 'video', 'audio',
            'survey', 'appraisal', 'tax_document', 'permit', 'correspondence',
            'financial_statement', 'legal', 'other'
        )),
    
    -- Context
    title VARCHAR(500),
    description TEXT,
    document_date DATE,                         -- When the document was created/signed
    
    -- Significance
    is_key_document BOOLEAN DEFAULT false,      -- Is this a critical document?
    
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_file_document UNIQUE (file_id)
);

CREATE INDEX idx_documents_investment ON documents(investment_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_key ON documents(is_key_document) WHERE is_key_document = true;

-- -----------------------------------------------------------------------------
-- VALUATION HISTORY
-- Tracks value changes over time
-- -----------------------------------------------------------------------------
CREATE TABLE valuation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    
    valuation_date DATE NOT NULL,
    value DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    
    valuation_method VARCHAR(100),              -- appraisal, market_comparison, ai_estimate
    valuer_name VARCHAR(255),                   -- Who did the valuation
    source_document_id UUID REFERENCES documents(id),
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX idx_valuation_investment ON valuation_history(investment_id, valuation_date DESC);

-- -----------------------------------------------------------------------------
-- ACTIVITY LOG
-- Audit trail for all system actions
-- -----------------------------------------------------------------------------
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    entity_type VARCHAR(50) NOT NULL,           -- investment, file, document, etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,                -- created, updated, deleted, analyzed
    
    performed_by VARCHAR(255),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_time ON activity_log(performed_at DESC);

-- -----------------------------------------------------------------------------
-- UPDATE TIMESTAMP TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_file_registry_updated_at BEFORE UPDATE ON file_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_jobs_updated_at BEFORE UPDATE ON processing_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- VIEWS
-- -----------------------------------------------------------------------------

-- Investment summary view with latest values
CREATE VIEW investment_summary AS
SELECT 
    i.*,
    latest_val.value as latest_value,
    latest_val.valuation_date as latest_valuation_date,
    CASE 
        WHEN i.purchase_price > 0 THEN 
            ROUND(((COALESCE(latest_val.value, i.current_value, i.purchase_price) - i.purchase_price) / i.purchase_price * 100)::numeric, 2)
        ELSE 0
    END as return_percentage,
    COALESCE(doc_counts.doc_count, 0) as document_count,
    COALESCE(file_counts.file_count, 0) as file_count
FROM investments i
LEFT JOIN LATERAL (
    SELECT value, valuation_date 
    FROM valuation_history 
    WHERE investment_id = i.id 
    ORDER BY valuation_date DESC 
    LIMIT 1
) latest_val ON true
LEFT JOIN (
    SELECT investment_id, COUNT(*) as doc_count 
    FROM documents 
    GROUP BY investment_id
) doc_counts ON doc_counts.investment_id = i.id
LEFT JOIN (
    SELECT investment_id, COUNT(*) as file_count 
    FROM file_registry 
    WHERE investment_id IS NOT NULL
    GROUP BY investment_id
) file_counts ON file_counts.investment_id = i.id;

-- Pending analysis queue view
CREATE VIEW pending_analysis_queue AS
SELECT 
    pj.*,
    fr.original_filename,
    fr.mime_type,
    fr.uploaded_at,
    fr.investment_id,
    i.name as investment_name
FROM processing_jobs pj
JOIN file_registry fr ON pj.file_id = fr.id
LEFT JOIN investments i ON pj.investment_id = i.id
WHERE pj.status IN ('queued', 'running')
ORDER BY pj.priority ASC, pj.created_at ASC;

-- -----------------------------------------------------------------------------
-- INITIAL DATA
-- -----------------------------------------------------------------------------

-- Sample land investment (example)
INSERT INTO investments (
    name, 
    category, 
    description,
    city,
    state,
    purchase_price,
    purchase_date,
    land_area_hectares,
    zoning_type,
    tags
) VALUES (
    'Fazenda São João - Exemplo',
    'land',
    'Exemplo de terreno rural para demonstração do sistema',
    'Ribeirão Preto',
    'São Paulo',
    1500000.00,
    '2024-01-15',
    45.5,
    'agricultural',
    ARRAY['exemplo', 'fazenda', 'agricultura']
);
