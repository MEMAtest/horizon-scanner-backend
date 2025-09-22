-- FCA Fines Database Schema
-- Enhanced Horizon Scanner - Enforcement Data Module

-- Main FCA fines table
CREATE TABLE IF NOT EXISTS fca_fines (
    id SERIAL PRIMARY KEY,
    fine_reference VARCHAR(100) UNIQUE, -- Unique identifier for each fine
    date_issued DATE NOT NULL,
    firm_individual VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2), -- Fine amount in GBP
    amount_text VARCHAR(200), -- Original text representation of amount
    currency VARCHAR(10) DEFAULT 'GBP',
    summary TEXT,
    ai_summary TEXT,
    ai_analysis JSONB, -- Structured AI analysis results
    breach_type VARCHAR(200),
    breach_categories JSONB, -- Array of breach categories
    firm_category VARCHAR(100),
    affected_sectors JSONB, -- Array of affected business sectors
    final_notice_url VARCHAR(1000),
    press_release_url VARCHAR(1000),
    fca_reference VARCHAR(100), -- Official FCA reference number
    year_issued INTEGER NOT NULL,
    month_issued INTEGER NOT NULL,
    quarter_issued INTEGER,
    keywords JSONB, -- Array of extracted keywords
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    systemic_risk BOOLEAN DEFAULT FALSE,
    precedent_setting BOOLEAN DEFAULT FALSE,
    repeat_offender BOOLEAN DEFAULT FALSE,
    customer_impact_level VARCHAR(20) CHECK (customer_impact_level IN ('High', 'Medium', 'Low', 'Unknown')),
    regulatory_theme VARCHAR(200),
    scraped_content TEXT, -- Raw scraped content for reference
    source_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by_ai BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(50) DEFAULT 'pending'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fca_fines_date_issued ON fca_fines(date_issued DESC);
CREATE INDEX IF NOT EXISTS idx_fca_fines_year_month ON fca_fines(year_issued, month_issued);
CREATE INDEX IF NOT EXISTS idx_fca_fines_amount ON fca_fines(amount DESC);
CREATE INDEX IF NOT EXISTS idx_fca_fines_breach_type ON fca_fines(breach_type);
CREATE INDEX IF NOT EXISTS idx_fca_fines_firm_category ON fca_fines(firm_category);
CREATE INDEX IF NOT EXISTS idx_fca_fines_risk_score ON fca_fines(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_fca_fines_created_at ON fca_fines(created_at);

-- GIN index for JSONB columns for fast searching
CREATE INDEX IF NOT EXISTS idx_fca_fines_ai_analysis ON fca_fines USING GIN(ai_analysis);
CREATE INDEX IF NOT EXISTS idx_fca_fines_breach_categories ON fca_fines USING GIN(breach_categories);
CREATE INDEX IF NOT EXISTS idx_fca_fines_keywords ON fca_fines USING GIN(keywords);

-- Aggregated trends table for dashboard performance
CREATE TABLE IF NOT EXISTS fca_fine_trends (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL, -- 'year', 'quarter', 'month'
    period_value INTEGER NOT NULL, -- Year, quarter number, or month number
    year INTEGER NOT NULL,
    total_fines DECIMAL(15,2) DEFAULT 0,
    average_fine DECIMAL(15,2) DEFAULT 0,
    median_fine DECIMAL(15,2) DEFAULT 0,
    fine_count INTEGER DEFAULT 0,
    top_breach_type VARCHAR(200),
    top_firm_category VARCHAR(100),
    high_risk_count INTEGER DEFAULT 0,
    systemic_risk_count INTEGER DEFAULT 0,
    repeat_offender_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_type, period_value, year)
);

CREATE INDEX IF NOT EXISTS idx_fine_trends_period ON fca_fine_trends(period_type, year, period_value);

-- Firm tracking table for repeat offender analysis
CREATE TABLE IF NOT EXISTS fca_firm_history (
    id SERIAL PRIMARY KEY,
    firm_name VARCHAR(500) NOT NULL,
    normalized_name VARCHAR(500), -- Cleaned/standardized firm name
    total_fines DECIMAL(15,2) DEFAULT 0,
    fine_count INTEGER DEFAULT 0,
    first_fine_date DATE,
    latest_fine_date DATE,
    is_repeat_offender BOOLEAN DEFAULT FALSE,
    average_time_between_fines INTERVAL,
    primary_breach_types JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_firm_history_name ON fca_firm_history(normalized_name);
CREATE INDEX IF NOT EXISTS idx_firm_history_total_fines ON fca_firm_history(total_fines DESC);
CREATE INDEX IF NOT EXISTS idx_firm_history_repeat ON fca_firm_history(is_repeat_offender);

-- Breach type standardization table
CREATE TABLE IF NOT EXISTS fca_breach_types (
    id SERIAL PRIMARY KEY,
    breach_code VARCHAR(50) UNIQUE NOT NULL,
    breach_name VARCHAR(200) NOT NULL,
    breach_category VARCHAR(100) NOT NULL,
    description TEXT,
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard breach types
INSERT INTO fca_breach_types (breach_code, breach_name, breach_category, severity_level) VALUES
('MARKET_ABUSE', 'Market Abuse', 'Market Conduct', 5),
('AML_FAILURES', 'Anti-Money Laundering Failures', 'Financial Crime', 4),
('SYSTEMS_CONTROLS', 'Systems and Controls Failures', 'Operational Risk', 3),
('CLIENT_MONEY', 'Client Money Breaches', 'Client Protection', 4),
('CONDUCT_RISK', 'Conduct Risk Failures', 'Consumer Protection', 3),
('PRUDENTIAL', 'Prudential Requirements', 'Capital & Liquidity', 3),
('REPORTING', 'Reporting and Disclosure', 'Transparency', 2),
('GOVERNANCE', 'Governance and Management', 'Corporate Governance', 3),
('TREATING_CUSTOMERS', 'Treating Customers Fairly', 'Consumer Protection', 3),
('MARKET_MAKING', 'Market Making Obligations', 'Market Conduct', 3),
('INSIDER_DEALING', 'Insider Dealing', 'Market Conduct', 5),
('MISLEADING_STATEMENTS', 'Misleading Statements', 'Market Conduct', 4)
ON CONFLICT (breach_code) DO NOTHING;

-- Scraping log table to track scraping activities
CREATE TABLE IF NOT EXISTS fca_scraping_log (
    id SERIAL PRIMARY KEY,
    scrape_date DATE NOT NULL,
    year_scraped INTEGER,
    urls_attempted INTEGER DEFAULT 0,
    urls_successful INTEGER DEFAULT 0,
    fines_found INTEGER DEFAULT 0,
    fines_new INTEGER DEFAULT 0,
    fines_updated INTEGER DEFAULT 0,
    processing_time_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'in_progress',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scraping_log_date ON fca_scraping_log(scrape_date DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_log_status ON fca_scraping_log(status);

-- Function to update trends table automatically
CREATE OR REPLACE FUNCTION update_fca_fine_trends()
RETURNS TRIGGER AS $$
BEGIN
    -- Update monthly trends
    INSERT INTO fca_fine_trends (period_type, period_value, year, total_fines, fine_count)
    SELECT
        'month',
        EXTRACT(MONTH FROM NEW.date_issued),
        EXTRACT(YEAR FROM NEW.date_issued),
        COALESCE(SUM(amount), 0),
        COUNT(*)
    FROM fca_fines
    WHERE EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM NEW.date_issued)
    AND EXTRACT(MONTH FROM date_issued) = EXTRACT(MONTH FROM NEW.date_issued)
    ON CONFLICT (period_type, period_value, year)
    DO UPDATE SET
        total_fines = EXCLUDED.total_fines,
        fine_count = EXCLUDED.fine_count,
        updated_at = CURRENT_TIMESTAMP;

    -- Update quarterly trends
    INSERT INTO fca_fine_trends (period_type, period_value, year, total_fines, fine_count)
    SELECT
        'quarter',
        EXTRACT(QUARTER FROM NEW.date_issued),
        EXTRACT(YEAR FROM NEW.date_issued),
        COALESCE(SUM(amount), 0),
        COUNT(*)
    FROM fca_fines
    WHERE EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM NEW.date_issued)
    AND EXTRACT(QUARTER FROM date_issued) = EXTRACT(QUARTER FROM NEW.date_issued)
    ON CONFLICT (period_type, period_value, year)
    DO UPDATE SET
        total_fines = EXCLUDED.total_fines,
        fine_count = EXCLUDED.fine_count,
        updated_at = CURRENT_TIMESTAMP;

    -- Update yearly trends
    INSERT INTO fca_fine_trends (period_type, period_value, year, total_fines, fine_count)
    SELECT
        'year',
        EXTRACT(YEAR FROM NEW.date_issued),
        EXTRACT(YEAR FROM NEW.date_issued),
        COALESCE(SUM(amount), 0),
        COUNT(*)
    FROM fca_fines
    WHERE EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM NEW.date_issued)
    ON CONFLICT (period_type, period_value, year)
    DO UPDATE SET
        total_fines = EXCLUDED.total_fines,
        fine_count = EXCLUDED.fine_count,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update trends
DROP TRIGGER IF EXISTS update_trends_on_fine_insert ON fca_fines;
CREATE TRIGGER update_trends_on_fine_insert
    AFTER INSERT OR UPDATE ON fca_fines
    FOR EACH ROW
    EXECUTE FUNCTION update_fca_fine_trends();

-- Function to normalize firm names for repeat offender detection
CREATE OR REPLACE FUNCTION normalize_firm_name(firm_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN TRIM(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                UPPER(firm_name),
                '\s+(LIMITED|LTD|PLC|PUBLIC LIMITED COMPANY|LLP|PARTNERSHIP|COMPANY|CORP|CORPORATION|INC|INCORPORATED)(\s|$)',
                '', 'gi'
            ),
            '\s+', ' ', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all relevant tables
CREATE TRIGGER update_fca_fines_updated_at BEFORE UPDATE ON fca_fines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fine_trends_updated_at BEFORE UPDATE ON fca_fine_trends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_firm_history_updated_at BEFORE UPDATE ON fca_firm_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for dashboard queries
CREATE OR REPLACE VIEW fca_fines_dashboard AS
SELECT
    f.*,
    bt.breach_category,
    bt.severity_level,
    CASE
        WHEN f.amount >= 10000000 THEN 'Major'
        WHEN f.amount >= 1000000 THEN 'Significant'
        WHEN f.amount >= 100000 THEN 'Moderate'
        ELSE 'Minor'
    END as fine_category,
    EXTRACT(DOW FROM f.date_issued) as day_of_week,
    AGE(CURRENT_DATE, f.date_issued) as days_since_issued
FROM fca_fines f
LEFT JOIN fca_breach_types bt ON f.breach_type = bt.breach_name
WHERE f.processing_status = 'completed';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO horizon_scanner_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO horizon_scanner_user;