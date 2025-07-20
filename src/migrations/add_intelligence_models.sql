-- src/migrations/add_intelligence_models.sql
-- Phase 1: Intelligence Data Models Database Schema
-- Creates tables for firm profiles, AI insights, regulatory alerts, and compliance events

-- ==============================================================================
-- FIRM PROFILES TABLE
-- Stores firm intelligence data for AI-powered relevance scoring and personalization
-- ==============================================================================

CREATE TABLE IF NOT EXISTS firm_profiles (
    id SERIAL PRIMARY KEY,
    firm_name VARCHAR(255) NOT NULL,
    firm_type VARCHAR(50) NOT NULL DEFAULT 'other',
    size VARCHAR(20) NOT NULL DEFAULT 'unknown',
    sectors JSON NOT NULL DEFAULT '[]',
    jurisdictions JSON NOT NULL DEFAULT '["UK"]',
    risk_appetite VARCHAR(20) NOT NULL DEFAULT 'medium',
    compliance_maturity INTEGER NOT NULL DEFAULT 50 CHECK (compliance_maturity >= 0 AND compliance_maturity <= 100),
    business_model JSON NOT NULL DEFAULT '{}',
    regulatory_focus JSON NOT NULL DEFAULT '[]',
    ai_preferences JSON NOT NULL DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for firm_profiles
CREATE INDEX IF NOT EXISTS idx_firm_profiles_name ON firm_profiles(firm_name);
CREATE INDEX IF NOT EXISTS idx_firm_profiles_type ON firm_profiles(firm_type);
CREATE INDEX IF NOT EXISTS idx_firm_profiles_active ON firm_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_firm_profiles_sectors ON firm_profiles USING GIN(sectors);

-- Add constraints for firm_profiles
ALTER TABLE firm_profiles ADD CONSTRAINT IF NOT EXISTS chk_firm_type 
    CHECK (firm_type IN ('bank', 'building_society', 'credit_union', 'insurer', 'reinsurer', 
                        'investment_firm', 'asset_manager', 'pension_provider', 'payment_service',
                        'e_money_institution', 'crypto_exchange', 'fintech', 'other'));

ALTER TABLE firm_profiles ADD CONSTRAINT IF NOT EXISTS chk_size 
    CHECK (size IN ('micro', 'small', 'medium', 'large', 'systemic', 'unknown'));

ALTER TABLE firm_profiles ADD CONSTRAINT IF NOT EXISTS chk_risk_appetite 
    CHECK (risk_appetite IN ('very_low', 'low', 'medium', 'high', 'very_high'));

-- ==============================================================================
-- AI INSIGHTS TABLE
-- Stores AI predictions, confidence scores, and pattern recognition results
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    update_id INTEGER REFERENCES regulatory_updates(id) ON DELETE CASCADE,
    firm_profile_id INTEGER REFERENCES firm_profiles(id) ON DELETE SET NULL,
    insight_type VARCHAR(50) NOT NULL DEFAULT 'general',
    category VARCHAR(50) NOT NULL DEFAULT 'regulatory',
    title VARCHAR(500) NOT NULL,
    description TEXT,
    prediction JSON,
    confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    business_impact JSON NOT NULL DEFAULT '{}',
    patterns JSON NOT NULL DEFAULT '[]',
    recommendations JSON NOT NULL DEFAULT '[]',
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'medium',
    relevance_score DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    ai_model VARCHAR(100) NOT NULL DEFAULT 'groq-llama',
    processing_time INTEGER NOT NULL DEFAULT 0,
    data_source JSON NOT NULL DEFAULT '{}',
    valid_until TIMESTAMP WITH TIME ZONE,
    tags JSON NOT NULL DEFAULT '[]',
    metadata JSON NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for ai_insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_update_id ON ai_insights(update_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_firm_profile_id ON ai_insights(firm_profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_urgency ON ai_insights(urgency_level);
CREATE INDEX IF NOT EXISTS idx_ai_insights_confidence ON ai_insights(confidence_score);
CREATE INDEX IF NOT EXISTS idx_ai_insights_relevance ON ai_insights(relevance_score);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created ON ai_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_valid_until ON ai_insights(valid_until);
CREATE INDEX IF NOT EXISTS idx_ai_insights_active ON ai_insights(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_insights_tags ON ai_insights USING GIN(tags);

-- Add constraints for ai_insights
ALTER TABLE ai_insights ADD CONSTRAINT IF NOT EXISTS chk_insight_type 
    CHECK (insight_type IN ('prediction', 'pattern', 'impact', 'summary', 'alert', 'trend', 'recommendation'));

ALTER TABLE ai_insights ADD CONSTRAINT IF NOT EXISTS chk_category 
    CHECK (category IN ('regulatory', 'market', 'compliance', 'risk', 'operational', 'strategic'));

ALTER TABLE ai_insights ADD CONSTRAINT IF NOT EXISTS chk_urgency_level 
    CHECK (urgency_level IN ('low', 'medium', 'high', 'critical'));

-- ==============================================================================
-- REGULATORY ALERTS TABLE
-- Stores proactive alerts with business context and firm targeting
-- ==============================================================================

CREATE TABLE IF NOT EXISTS regulatory_alerts (
    id SERIAL PRIMARY KEY,
    update_id INTEGER REFERENCES regulatory_updates(id) ON DELETE CASCADE,
    firm_profile_id INTEGER REFERENCES firm_profiles(id) ON DELETE SET NULL,
    ai_insight_id INTEGER REFERENCES ai_insights(id) ON DELETE SET NULL,
    alert_type VARCHAR(50) NOT NULL DEFAULT 'general',
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    business_context JSON NOT NULL DEFAULT '{}',
    action_required BOOLEAN NOT NULL DEFAULT false,
    suggested_actions JSON NOT NULL DEFAULT '[]',
    deadline TIMESTAMP WITH TIME ZONE,
    urgency_score INTEGER NOT NULL DEFAULT 50 CHECK (urgency_score >= 0 AND urgency_score <= 100),
    targeting_criteria JSON NOT NULL DEFAULT '{}',
    delivery_channels JSON NOT NULL DEFAULT '["dashboard"]',
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    escalated_at TIMESTAMP WITH TIME ZONE,
    metadata JSON NOT NULL DEFAULT '{}',
    tags JSON NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for regulatory_alerts
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_update_id ON regulatory_alerts(update_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_firm_profile_id ON regulatory_alerts(firm_profile_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_ai_insight_id ON regulatory_alerts(ai_insight_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_type ON regulatory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_severity ON regulatory_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_urgency ON regulatory_alerts(urgency_score);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_read_at ON regulatory_alerts(read_at);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_created ON regulatory_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_deadline ON regulatory_alerts(deadline);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_active ON regulatory_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_unread ON regulatory_alerts(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_tags ON regulatory_alerts USING GIN(tags);

-- Add constraints for regulatory_alerts
ALTER TABLE regulatory_alerts ADD CONSTRAINT IF NOT EXISTS chk_alert_type 
    CHECK (alert_type IN ('deadline', 'impact', 'pattern', 'urgent', 'consultation', 'compliance', 'risk'));

ALTER TABLE regulatory_alerts ADD CONSTRAINT IF NOT EXISTS chk_severity 
    CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- ==============================================================================
-- COMPLIANCE EVENTS TABLE
-- Stores compliance deadlines, implementation phases, and milestone tracking
-- ==============================================================================

CREATE TABLE IF NOT EXISTS compliance_events (
    id SERIAL PRIMARY KEY,
    update_id INTEGER REFERENCES regulatory_updates(id) ON DELETE CASCADE,
    firm_profile_id INTEGER REFERENCES firm_profiles(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL DEFAULT 'deadline',
    title VARCHAR(500) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notification_dates JSON NOT NULL DEFAULT '[]',
    implementation_phases JSON NOT NULL DEFAULT '[]',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    compliance_requirements JSON NOT NULL DEFAULT '[]',
    business_impact JSON NOT NULL DEFAULT '{}',
    estimated_effort JSON NOT NULL DEFAULT '{}',
    dependencies JSON NOT NULL DEFAULT '[]',
    assignees JSON NOT NULL DEFAULT '[]',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    milestones JSON NOT NULL DEFAULT '[]',
    risk_factors JSON NOT NULL DEFAULT '[]',
    documents JSON NOT NULL DEFAULT '[]',
    tags JSON NOT NULL DEFAULT '[]',
    metadata JSON NOT NULL DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for compliance_events
CREATE INDEX IF NOT EXISTS idx_compliance_events_update_id ON compliance_events(update_id);
CREATE INDEX IF NOT EXISTS idx_compliance_events_firm_profile_id ON compliance_events(firm_profile_id);
CREATE INDEX IF NOT EXISTS idx_compliance_events_type ON compliance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_events_event_date ON compliance_events(event_date);
CREATE INDEX IF NOT EXISTS idx_compliance_events_priority ON compliance_events(priority);
CREATE INDEX IF NOT EXISTS idx_compliance_events_status ON compliance_events(status);
CREATE INDEX IF NOT EXISTS idx_compliance_events_progress ON compliance_events(progress);
CREATE INDEX IF NOT EXISTS idx_compliance_events_created ON compliance_events(created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_events_active ON compliance_events(is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_events_upcoming ON compliance_events(event_date) WHERE event_date > NOW();
CREATE INDEX IF NOT EXISTS idx_compliance_events_overdue ON compliance_events(event_date) WHERE event_date < NOW() AND status != 'completed';
CREATE INDEX IF NOT EXISTS idx_compliance_events_tags ON compliance_events USING GIN(tags);

-- Add constraints for compliance_events
ALTER TABLE compliance_events ADD CONSTRAINT IF NOT EXISTS chk_event_type 
    CHECK (event_type IN ('deadline', 'consultation', 'implementation', 'review', 'assessment', 'filing'));

ALTER TABLE compliance_events ADD CONSTRAINT IF NOT EXISTS chk_priority 
    CHECK (priority IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE compliance_events ADD CONSTRAINT IF NOT EXISTS chk_status 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled'));

-- ==============================================================================
-- INTELLIGENCE CONFIGURATION TABLE
-- Stores AI thresholds and scoring algorithms configuration
-- ==============================================================================

CREATE TABLE IF NOT EXISTS intelligence_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSON NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for intelligence_config
CREATE INDEX IF NOT EXISTS idx_intelligence_config_key ON intelligence_config(config_key);
CREATE INDEX IF NOT EXISTS idx_intelligence_config_category ON intelligence_config(category);
CREATE INDEX IF NOT EXISTS idx_intelligence_config_active ON intelligence_config(is_active);

-- ==============================================================================
-- INSERT DEFAULT CONFIGURATION VALUES
-- ==============================================================================

INSERT INTO intelligence_config (config_key, config_value, description, category) VALUES
    ('ai_confidence_thresholds', 
     '{"minimum": 0.3, "medium": 0.6, "high": 0.8, "critical": 0.9}',
     'AI confidence score thresholds for different action levels',
     'ai_analysis'),
    
    ('relevance_scoring_weights',
     '{"sector": 0.4, "firmType": 0.3, "jurisdiction": 0.2, "size": 0.1}',
     'Weights for calculating firm relevance scores',
     'relevance'),
    
    ('urgency_calculation_weights',
     '{"deadline": 0.4, "businessImpact": 0.3, "confidence": 0.2, "firmRelevance": 0.1}',
     'Weights for calculating urgency scores',
     'urgency'),
    
    ('notification_settings',
     '{"deadlineAlertDays": [90, 60, 30, 14, 7, 3, 1], "escalationThreshold": 80, "maxUnreadHours": 24}',
     'Default notification and escalation settings',
     'notifications'),
    
    ('business_impact_thresholds',
     '{"low": 3, "medium": 5, "high": 7, "critical": 9}',
     'Business impact score thresholds (0-10 scale)',
     'impact'),
    
    ('ai_processing_limits',
     '{"maxProcessingTime": 30000, "maxRetries": 3, "batchSize": 10}',
     'AI processing performance limits and constraints',
     'performance'),
    
    ('pattern_recognition_config',
     '{"minConfidence": 0.7, "minSampleSize": 5, "lookbackDays": 180}',
     'Configuration for AI pattern recognition algorithms',
     'patterns'),
    
    ('firm_profile_defaults',
     '{"riskAppetite": "medium", "complianceMaturity": 50, "relevanceThreshold": 0.3}',
     'Default values for new firm profiles',
     'firm_profiles')
ON CONFLICT (config_key) DO NOTHING;

-- ==============================================================================
-- CREATE DEFAULT FIRM PROFILE
-- ==============================================================================

INSERT INTO firm_profiles (
    firm_name, 
    firm_type, 
    size, 
    sectors, 
    jurisdictions, 
    risk_appetite, 
    compliance_maturity,
    ai_preferences
) VALUES (
    'Default User Profile',
    'other',
    'medium',
    '["general"]',
    '["UK"]',
    'medium',
    50,
    '{
        "relevanceThreshold": 0.3,
        "urgencyWeighting": 1.2,
        "sectorWeighting": 1.5,
        "deadlineAlertDays": [30, 14, 7, 3, 1],
        "analysisDepth": "standard",
        "summaryFrequency": "weekly",
        "notificationTypes": ["deadline", "high_impact", "sector_specific"],
        "confidenceThreshold": 0.6
    }'
) ON CONFLICT DO NOTHING;

-- ==============================================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ==============================================================================

-- View for active insights with firm context
CREATE OR REPLACE VIEW v_active_insights AS
SELECT 
    ai.*,
    fp.firm_name,
    fp.firm_type,
    fp.sectors as firm_sectors,
    ru.title as update_title,
    ru.authority,
    ru.published_date
FROM ai_insights ai
LEFT JOIN firm_profiles fp ON ai.firm_profile_id = fp.id
LEFT JOIN regulatory_updates ru ON ai.update_id = ru.id
WHERE ai.is_active = true 
AND (ai.valid_until IS NULL OR ai.valid_until > NOW());

-- View for pending alerts
CREATE OR REPLACE VIEW v_pending_alerts AS
SELECT 
    ra.*,
    fp.firm_name,
    ru.title as update_title,
    ru.authority
FROM regulatory_alerts ra
LEFT JOIN firm_profiles fp ON ra.firm_profile_id = fp.id
LEFT JOIN regulatory_updates ru ON ra.update_id = ru.id
WHERE ra.is_active = true 
AND ra.read_at IS NULL 
AND (ra.expires_at IS NULL OR ra.expires_at > NOW());

-- View for upcoming compliance events
CREATE OR REPLACE VIEW v_upcoming_events AS
SELECT 
    ce.*,
    fp.firm_name,
    ru.title as update_title,
    ru.authority,
    EXTRACT(DAYS FROM (ce.event_date - NOW())) as days_until_event
FROM compliance_events ce
LEFT JOIN firm_profiles fp ON ce.firm_profile_id = fp.id
LEFT JOIN regulatory_updates ru ON ce.update_id = ru.id
WHERE ce.is_active = true 
AND ce.status != 'completed'
AND ce.event_date > NOW();

-- ==============================================================================
-- CREATE TRIGGER FOR UPDATED_AT TIMESTAMPS
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_firm_profiles_updated_at 
    BEFORE UPDATE ON firm_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at 
    BEFORE UPDATE ON ai_insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_events_updated_at 
    BEFORE UPDATE ON compliance_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_config_updated_at 
    BEFORE UPDATE ON intelligence_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- GRANT PERMISSIONS (if using role-based access)
-- ==============================================================================

-- Grant permissions to application user (uncomment if needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ==============================================================================
-- ANALYTICS AND REPORTING FUNCTIONS
-- ==============================================================================

-- Function to get intelligence dashboard statistics
CREATE OR REPLACE FUNCTION get_intelligence_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'firm_profiles', (SELECT COUNT(*) FROM firm_profiles WHERE is_active = true),
        'active_insights', (SELECT COUNT(*) FROM ai_insights WHERE is_active = true),
        'unread_alerts', (SELECT COUNT(*) FROM regulatory_alerts WHERE read_at IS NULL AND is_active = true),
        'upcoming_events', (SELECT COUNT(*) FROM compliance_events WHERE event_date > NOW() AND status != 'completed' AND is_active = true),
        'overdue_events', (SELECT COUNT(*) FROM compliance_events WHERE event_date < NOW() AND status != 'completed' AND is_active = true),
        'critical_alerts', (SELECT COUNT(*) FROM regulatory_alerts WHERE severity = 'critical' AND is_active = true),
        'avg_confidence', (SELECT ROUND(AVG(confidence_score), 2) FROM ai_insights WHERE is_active = true),
        'avg_relevance', (SELECT ROUND(AVG(relevance_score), 2) FROM ai_insights WHERE is_active = true)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- MIGRATION COMPLETION LOG
-- ==============================================================================

-- Log migration completion
INSERT INTO intelligence_config (config_key, config_value, description, category) VALUES
    ('migration_phase_1_completed', 
     json_build_object('completed_at', NOW(), 'version', '1.0', 'tables_created', 4),
     'Phase 1 Intelligence Models migration completion record',
     'migration')
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================