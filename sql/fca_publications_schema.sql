-- FCA Publications Database Schema
-- Comprehensive enforcement database for ~18k FCA publications
-- Completely separate from existing fca_fines tables

-- ============================================================
-- TABLE 1: Publications Index (Stage 1 - Search Results)
-- ============================================================

CREATE TABLE IF NOT EXISTS fca_publications_index (
    id SERIAL PRIMARY KEY,
    publication_id VARCHAR(100) UNIQUE NOT NULL,

    -- Basic metadata from search results
    title TEXT NOT NULL,
    document_type VARCHAR(50) NOT NULL,  -- final_notice, decision_notice, warning, supervisory_notice, prohibition_order
    publication_date DATE,
    url VARCHAR(1000) NOT NULL,
    pdf_url VARCHAR(1000),
    description TEXT,

    -- Filtering metadata
    year_published INTEGER,
    month_published INTEGER,

    -- Processing status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'downloading',
        'downloaded',
        'download_failed',
        'parsing',
        'parsed',
        'parse_failed',
        'processing',
        'processed',
        'process_failed',
        'skipped'
    )),

    -- Stage timestamps
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pdf_downloaded_at TIMESTAMP,
    parsed_at TIMESTAMP,
    processed_at TIMESTAMP,

    -- File storage
    pdf_local_path VARCHAR(500),
    pdf_size_bytes INTEGER,

    -- Parsing results
    raw_text_length INTEGER,
    page_count INTEGER,
    parse_method VARCHAR(50),  -- pdf-parse, tesseract, html

    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for publications_index
CREATE INDEX IF NOT EXISTS idx_pub_status ON fca_publications_index(status);
CREATE INDEX IF NOT EXISTS idx_pub_document_type ON fca_publications_index(document_type);
CREATE INDEX IF NOT EXISTS idx_pub_date ON fca_publications_index(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_pub_year ON fca_publications_index(year_published);
CREATE INDEX IF NOT EXISTS idx_pub_scraped ON fca_publications_index(scraped_at DESC);

-- ============================================================
-- TABLE 2: Enforcement Notices (Final Processed Data)
-- ============================================================

CREATE TABLE IF NOT EXISTS fca_enforcement_notices (
    id SERIAL PRIMARY KEY,
    publication_id VARCHAR(100) UNIQUE REFERENCES fca_publications_index(publication_id),

    -- Entity identification
    entity_name VARCHAR(500) NOT NULL,
    entity_type VARCHAR(20) CHECK (entity_type IN ('firm', 'individual')),
    frn VARCHAR(20),  -- Firm Reference Number (6 digits)
    trading_names JSONB DEFAULT '[]'::jsonb,

    -- Outcome details
    outcome_type VARCHAR(50) NOT NULL CHECK (outcome_type IN (
        'fine',
        'prohibition',
        'cancellation',
        'restriction',
        'censure',
        'public_statement',
        'warning',
        'supervisory_notice',
        'voluntary_requirement',
        'other'
    )),

    -- Financial penalty details
    fine_amount DECIMAL(15,2),
    fine_currency VARCHAR(3) DEFAULT 'GBP',
    fine_discounted BOOLEAN DEFAULT FALSE,
    discount_percentage INTEGER,
    original_fine_amount DECIMAL(15,2),
    early_settlement BOOLEAN DEFAULT FALSE,

    -- Breach classification
    primary_breach_type VARCHAR(100),
    specific_breaches JSONB DEFAULT '[]'::jsonb,  -- Array of specific breach descriptions
    handbook_references JSONB DEFAULT '[]'::jsonb,  -- ["PRIN 2.1", "SYSC 3.1", "SUP 17"]
    breach_categories JSONB DEFAULT '[]'::jsonb,  -- ["AML", "Systems_Controls", "Conduct"]
    regulations_cited JSONB DEFAULT '[]'::jsonb,  -- Non-handbook regulations (MLR, FSMA, etc.)

    -- Timeline
    relevant_period_start DATE,
    relevant_period_end DATE,
    relevant_period_description TEXT,
    notice_date DATE,
    effective_date DATE,

    -- Remediation
    remediation_actions JSONB DEFAULT '[]'::jsonb,
    remediation_deadline DATE,
    s166_required BOOLEAN DEFAULT FALSE,  -- Skilled person report
    voluntary_requirements JSONB DEFAULT '[]'::jsonb,
    past_business_review BOOLEAN DEFAULT FALSE,
    redress_scheme BOOLEAN DEFAULT FALSE,

    -- Key findings and factors
    key_findings JSONB DEFAULT '[]'::jsonb,
    aggravating_factors JSONB DEFAULT '[]'::jsonb,
    mitigating_factors JSONB DEFAULT '[]'::jsonb,

    -- Consumer impact
    consumer_impact_level VARCHAR(20) CHECK (consumer_impact_level IN ('High', 'Medium', 'Low', 'Unknown')),
    consumer_impact_description TEXT,
    redress_required BOOLEAN DEFAULT FALSE,
    estimated_consumer_harm DECIMAL(15,2),
    customers_affected INTEGER,

    -- Risk classification
    systemic_risk BOOLEAN DEFAULT FALSE,
    systemic_risk_reasoning TEXT,
    market_impact BOOLEAN DEFAULT FALSE,
    precedent_setting BOOLEAN DEFAULT FALSE,
    precedent_notes TEXT,

    -- AI analysis
    ai_summary TEXT,
    ai_analysis JSONB,  -- Full structured AI response
    ai_confidence_score DECIMAL(3,2),  -- 0.00 to 1.00
    ai_model_used VARCHAR(100),
    ai_processed_at TIMESTAMP,

    -- Risk scoring (computed)
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),

    -- Source documents
    pdf_url VARCHAR(1000),
    pdf_local_path VARCHAR(500),
    raw_text_excerpt TEXT,  -- First 5000 chars for quick reference
    full_text_stored BOOLEAN DEFAULT FALSE,

    -- Processing metadata
    processing_notes TEXT,
    manual_review_required BOOLEAN DEFAULT FALSE,
    manual_review_notes TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for enforcement_notices
CREATE INDEX IF NOT EXISTS idx_enf_entity ON fca_enforcement_notices(entity_name);
CREATE INDEX IF NOT EXISTS idx_enf_frn ON fca_enforcement_notices(frn);
CREATE INDEX IF NOT EXISTS idx_enf_outcome ON fca_enforcement_notices(outcome_type);
CREATE INDEX IF NOT EXISTS idx_enf_breach ON fca_enforcement_notices(primary_breach_type);
CREATE INDEX IF NOT EXISTS idx_enf_date ON fca_enforcement_notices(notice_date DESC);
CREATE INDEX IF NOT EXISTS idx_enf_amount ON fca_enforcement_notices(fine_amount DESC);
CREATE INDEX IF NOT EXISTS idx_enf_risk ON fca_enforcement_notices(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_enf_consumer_impact ON fca_enforcement_notices(consumer_impact_level);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_enf_handbook ON fca_enforcement_notices USING GIN(handbook_references);
CREATE INDEX IF NOT EXISTS idx_enf_categories ON fca_enforcement_notices USING GIN(breach_categories);
CREATE INDEX IF NOT EXISTS idx_enf_findings ON fca_enforcement_notices USING GIN(key_findings);
CREATE INDEX IF NOT EXISTS idx_enf_specific_breaches ON fca_enforcement_notices USING GIN(specific_breaches);

-- ============================================================
-- TABLE 3: Scraping Progress (Checkpoint/Resume)
-- ============================================================

CREATE TABLE IF NOT EXISTS fca_scraping_progress (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) UNIQUE NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN (
        'index_scrape',
        'pdf_download',
        'pdf_parse',
        'ai_process',
        'full_backfill',
        'incremental_update'
    )),

    -- Progress tracking
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    skipped_items INTEGER DEFAULT 0,

    -- Checkpoint info for resumption
    last_processed_id VARCHAR(100),
    last_page_scraped INTEGER,
    last_start_param INTEGER,  -- For pagination (start=1, 11, 21...)

    -- Status
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN (
        'running',
        'paused',
        'completed',
        'failed',
        'cancelled'
    )),

    -- Error tracking
    error_log JSONB DEFAULT '[]'::jsonb,
    last_error TEXT,
    last_error_at TIMESTAMP,

    -- Performance metrics
    items_per_minute DECIMAL(10,2),
    estimated_completion TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_progress_job_type ON fca_scraping_progress(job_type);
CREATE INDEX IF NOT EXISTS idx_progress_status ON fca_scraping_progress(status);
CREATE INDEX IF NOT EXISTS idx_progress_started ON fca_scraping_progress(started_at DESC);

-- ============================================================
-- TABLE 4: Full Text Storage (Optional - for search)
-- ============================================================

CREATE TABLE IF NOT EXISTS fca_publication_full_text (
    id SERIAL PRIMARY KEY,
    publication_id VARCHAR(100) UNIQUE REFERENCES fca_publications_index(publication_id),
    full_text TEXT NOT NULL,
    text_length INTEGER,
    word_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_fulltext_search ON fca_publication_full_text USING GIN(to_tsvector('english', full_text));

-- ============================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================

CREATE OR REPLACE FUNCTION update_publications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pub_index_timestamp ON fca_publications_index;
CREATE TRIGGER trg_pub_index_timestamp
    BEFORE UPDATE ON fca_publications_index
    FOR EACH ROW EXECUTE FUNCTION update_publications_timestamp();

DROP TRIGGER IF EXISTS trg_enf_notices_timestamp ON fca_enforcement_notices;
CREATE TRIGGER trg_enf_notices_timestamp
    BEFORE UPDATE ON fca_enforcement_notices
    FOR EACH ROW EXECUTE FUNCTION update_publications_timestamp();

DROP TRIGGER IF EXISTS trg_progress_timestamp ON fca_scraping_progress;
CREATE TRIGGER trg_progress_timestamp
    BEFORE UPDATE ON fca_scraping_progress
    FOR EACH ROW EXECUTE FUNCTION update_publications_timestamp();

-- ============================================================
-- VIEWS: Common queries
-- ============================================================

-- Dashboard view with key metrics
CREATE OR REPLACE VIEW fca_enforcement_dashboard AS
SELECT
    en.*,
    pi.document_type,
    pi.pdf_url as source_pdf_url,
    CASE
        WHEN en.fine_amount >= 10000000 THEN 'Major (>10M)'
        WHEN en.fine_amount >= 1000000 THEN 'Significant (1-10M)'
        WHEN en.fine_amount >= 100000 THEN 'Moderate (100K-1M)'
        WHEN en.fine_amount > 0 THEN 'Minor (<100K)'
        ELSE 'Non-monetary'
    END as fine_category,
    EXTRACT(YEAR FROM en.notice_date) as notice_year,
    EXTRACT(QUARTER FROM en.notice_date) as notice_quarter
FROM fca_enforcement_notices en
JOIN fca_publications_index pi ON en.publication_id = pi.publication_id;

-- Breach type summary view
CREATE OR REPLACE VIEW fca_breach_summary AS
SELECT
    primary_breach_type,
    outcome_type,
    COUNT(*) as case_count,
    SUM(COALESCE(fine_amount, 0)) as total_fines,
    AVG(COALESCE(fine_amount, 0)) as avg_fine,
    MAX(fine_amount) as max_fine,
    MIN(notice_date) as earliest_case,
    MAX(notice_date) as latest_case
FROM fca_enforcement_notices
WHERE primary_breach_type IS NOT NULL
GROUP BY primary_breach_type, outcome_type
ORDER BY total_fines DESC;

-- Processing status view
CREATE OR REPLACE VIEW fca_processing_status AS
SELECT
    status,
    document_type,
    COUNT(*) as count,
    MIN(scraped_at) as oldest,
    MAX(scraped_at) as newest
FROM fca_publications_index
GROUP BY status, document_type
ORDER BY status, count DESC;

-- ============================================================
-- REFERENCE DATA: Breach type taxonomy
-- ============================================================

CREATE TABLE IF NOT EXISTS fca_breach_taxonomy (
    id SERIAL PRIMARY KEY,
    breach_code VARCHAR(50) UNIQUE NOT NULL,
    breach_name VARCHAR(200) NOT NULL,
    breach_category VARCHAR(100) NOT NULL,
    description TEXT,
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
    handbook_sections JSONB DEFAULT '[]'::jsonb,
    keywords JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard breach types
INSERT INTO fca_breach_taxonomy (breach_code, breach_name, breach_category, severity_level, handbook_sections, keywords) VALUES
('AML', 'Anti-Money Laundering', 'Financial Crime', 4, '["SYSC 3.2", "SYSC 6.1", "SYSC 6.3"]', '["money laundering", "aml", "suspicious activity", "sanctions", "terrorist financing", "KYC", "customer due diligence"]'),
('MARKET_ABUSE', 'Market Abuse', 'Market Conduct', 5, '["MAR", "COCON"]', '["insider dealing", "market manipulation", "front running", "layering", "spoofing"]'),
('SYSTEMS_CONTROLS', 'Systems and Controls', 'Operational Risk', 3, '["SYSC 3.1", "SYSC 4", "SYSC 5", "SYSC 6"]', '["systems failure", "control weakness", "operational risk", "IT failure", "governance"]'),
('CLIENT_MONEY', 'Client Money and Assets', 'Client Protection', 4, '["CASS"]', '["client money", "client assets", "segregation", "safeguarding"]'),
('CONDUCT', 'Conduct of Business', 'Consumer Protection', 3, '["COBS", "ICOBS", "MCOB"]', '["treating customers fairly", "tcf", "consumer duty", "fair treatment"]'),
('MIS_SELLING', 'Mis-selling', 'Consumer Protection', 4, '["COBS 9", "COBS 10"]', '["mis-sell", "unsuitable", "suitability", "inappropriate advice"]'),
('PRUDENTIAL', 'Prudential Requirements', 'Capital & Liquidity', 3, '["GENPRU", "BIPRU", "IFPRU"]', '["capital", "liquidity", "solvency", "financial resources"]'),
('REPORTING', 'Reporting and Disclosure', 'Transparency', 2, '["SUP 15", "SUP 16", "SUP 17"]', '["reporting", "disclosure", "transaction reporting", "regulatory returns"]'),
('GOVERNANCE', 'Governance and Management', 'Corporate Governance', 3, '["SYSC 4", "SM&CR", "COCON"]', '["governance", "board", "senior management", "oversight", "accountability"]'),
('FINANCIAL_CRIME', 'Financial Crime', 'Financial Crime', 4, '["SYSC 3.2", "SYSC 6"]', '["fraud", "bribery", "corruption", "sanctions evasion"]'),
('PRINCIPLES', 'Principles for Businesses', 'Regulatory Standards', 3, '["PRIN"]', '["principle", "integrity", "skill care diligence", "customers interests"]'),
('COMPLAINTS', 'Complaints Handling', 'Consumer Protection', 2, '["DISP"]', '["complaints", "redress", "compensation", "FOS"]'),
('FINANCIAL_PROMOTIONS', 'Financial Promotions', 'Communications', 3, '["COBS 4", "ICOBS 2"]', '["financial promotion", "marketing", "advertising", "misleading"]'),
('APPROVED_PERSONS', 'Approved Persons', 'Individual Accountability', 4, '["APER", "COCON", "FIT"]', '["approved person", "controlled function", "fit and proper"]')
ON CONFLICT (breach_code) DO NOTHING;

-- ============================================================
-- GRANTS (adjust based on your setup)
-- ============================================================

-- Example: GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- Example: GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
