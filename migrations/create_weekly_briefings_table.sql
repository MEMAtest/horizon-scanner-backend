-- Migration: Create weekly_briefings table
-- Description: Persistent storage for weekly briefing snapshots
-- Date: 2025-01-25

CREATE TABLE IF NOT EXISTS weekly_briefings (
  id UUID PRIMARY KEY,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  date_range_start DATE,
  date_range_end DATE,
  briefing_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for fast retrieval by generated_at
CREATE INDEX IF NOT EXISTS idx_weekly_briefings_generated_at ON weekly_briefings(generated_at DESC);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_weekly_briefings_date_range ON weekly_briefings(date_range_start, date_range_end);

-- Comments
COMMENT ON TABLE weekly_briefings IS 'Stores weekly regulatory briefings with full snapshot data';
COMMENT ON COLUMN weekly_briefings.id IS 'Unique identifier for the briefing';
COMMENT ON COLUMN weekly_briefings.generated_at IS 'When the briefing was generated';
COMMENT ON COLUMN weekly_briefings.date_range_start IS 'Start date of regulatory updates covered';
COMMENT ON COLUMN weekly_briefings.date_range_end IS 'End date of regulatory updates covered';
COMMENT ON COLUMN weekly_briefings.briefing_data IS 'Full briefing JSON including artifacts and dataset';
COMMENT ON COLUMN weekly_briefings.metadata IS 'Additional metadata (cache info, metrics, etc)';
