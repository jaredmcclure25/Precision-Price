-- Precision Prices - PostgreSQL Schema for Feedback System
-- Copyright © 2025 Jared McClure / PrecisionPrices.Com
-- All Rights Reserved.
--
-- This schema is for eventual sync from Firebase to PostgreSQL (Railway)
-- For production-scale analytics and long-term data storage

-- ============================================================================
-- LISTINGS TABLE
-- ============================================================================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT UNIQUE NOT NULL,
  session_id TEXT NOT NULL,
  category TEXT,
  item_name TEXT,
  brand TEXT,
  condition TEXT,
  location_zip TEXT,
  suggested_price NUMERIC(10, 2),
  confidence_score NUMERIC(5, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listings_session ON listings(session_id);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_created ON listings(created_at);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  sold BOOLEAN DEFAULT FALSE,
  final_price NUMERIC(10, 2),
  days_on_market INT,
  ghosted BOOLEAN DEFAULT FALSE,
  negotiation_rounds INT,
  reported_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_listing ON transactions(listing_id);
CREATE INDEX idx_transactions_sold ON transactions(sold);
CREATE INDEX idx_transactions_reported ON transactions(reported_at);

-- ============================================================================
-- FEEDBACK TABLE
-- ============================================================================
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  feedback_id TEXT UNIQUE,
  listing_id TEXT REFERENCES listings(listing_id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  user_id TEXT,
  segment TEXT,
  purpose TEXT NOT NULL,
  stage TEXT,
  effort TEXT NOT NULL,
  value JSONB, -- Flexible storage for boolean, number, string, or object
  weight NUMERIC(3, 2),
  variant TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_listing ON feedback(listing_id);
CREATE INDEX idx_feedback_session ON feedback(session_id);
CREATE INDEX idx_feedback_purpose ON feedback(purpose);
CREATE INDEX idx_feedback_stage ON feedback(stage);
CREATE INDEX idx_feedback_created ON feedback(created_at);
CREATE INDEX idx_feedback_user ON feedback(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- INCENTIVE LEDGER TABLE
-- ============================================================================
CREATE TABLE incentive_ledger (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  feedback_count INT DEFAULT 0,
  reward_points INT DEFAULT 0,
  reward_eligible BOOLEAN DEFAULT FALSE,
  issued BOOLEAN DEFAULT FALSE,
  issued_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incentive_session ON incentive_ledger(session_id);
CREATE INDEX idx_incentive_user ON incentive_ledger(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_incentive_eligible ON incentive_ledger(reward_eligible);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT,
  user_email TEXT,
  device_type TEXT,
  region TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  upgraded_at TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_sessions_created ON sessions(created_at);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- View: Feedback summary by purpose
CREATE VIEW feedback_summary_by_purpose AS
SELECT
  purpose,
  COUNT(*) as total_count,
  AVG(weight) as avg_weight,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT listing_id) as unique_listings
FROM feedback
GROUP BY purpose;

-- View: Transaction success metrics
CREATE VIEW transaction_metrics AS
SELECT
  COUNT(*) as total_transactions,
  SUM(CASE WHEN sold THEN 1 ELSE 0 END) as sold_count,
  ROUND(AVG(CASE WHEN sold THEN days_on_market END), 1) as avg_days_to_sell,
  ROUND(AVG(CASE WHEN sold THEN final_price END), 2) as avg_sale_price,
  SUM(CASE WHEN ghosted THEN 1 ELSE 0 END) as ghosting_incidents
FROM transactions;

-- View: Price accuracy analysis
CREATE VIEW price_accuracy_analysis AS
SELECT
  l.category,
  COUNT(*) as feedback_count,
  SUM(CASE WHEN f.value::text = 'true' THEN 1 ELSE 0 END) as accurate_count,
  ROUND(
    100.0 * SUM(CASE WHEN f.value::text = 'true' THEN 1 ELSE 0 END) / COUNT(*),
    1
  ) as accuracy_percentage
FROM feedback f
JOIN listings l ON f.listing_id = l.listing_id
WHERE f.purpose = 'price_accuracy'
GROUP BY l.category;

-- View: User engagement metrics
CREATE VIEW user_engagement AS
SELECT
  s.user_id,
  s.user_email,
  COUNT(DISTINCT f.id) as total_feedback,
  COUNT(DISTINCT f.listing_id) as items_priced,
  AVG(f.weight) as avg_feedback_quality,
  s.created_at as first_session,
  s.last_active_at
FROM sessions s
LEFT JOIN feedback f ON s.session_id = f.session_id
WHERE s.user_id IS NOT NULL
GROUP BY s.user_id, s.user_email, s.created_at, s.last_active_at;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Calculate weighted average price by category and location
CREATE OR REPLACE FUNCTION get_weighted_avg_price(
  p_category TEXT,
  p_location_zip TEXT,
  p_days_back INT DEFAULT 90
)
RETURNS NUMERIC AS $$
DECLARE
  weighted_avg NUMERIC;
BEGIN
  SELECT
    ROUND(
      SUM(t.final_price * f.weight) / SUM(f.weight),
      2
    )
  INTO weighted_avg
  FROM transactions t
  JOIN listings l ON t.listing_id = l.listing_id
  JOIN feedback f ON t.listing_id = f.listing_id
  WHERE
    t.sold = TRUE
    AND l.category = p_category
    AND (p_location_zip IS NULL OR l.location_zip = p_location_zip)
    AND t.reported_at >= NOW() - (p_days_back || ' days')::INTERVAL;

  RETURN COALESCE(weighted_avg, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update listings.updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get top performing categories by accuracy
-- SELECT * FROM price_accuracy_analysis ORDER BY accuracy_percentage DESC LIMIT 10;

-- Get high-value feedback contributors
-- SELECT * FROM user_engagement ORDER BY avg_feedback_quality DESC LIMIT 20;

-- Get pricing data for specific category and location
-- SELECT get_weighted_avg_price('electronics', '90210', 30);

-- Analyze ghosting patterns
-- SELECT
--   l.category,
--   COUNT(*) as total_sales,
--   SUM(CASE WHEN t.ghosted THEN 1 ELSE 0 END) as ghosting_count,
--   ROUND(100.0 * SUM(CASE WHEN t.ghosted THEN 1 ELSE 0 END) / COUNT(*), 1) as ghosting_rate
-- FROM transactions t
-- JOIN listings l ON t.listing_id = l.listing_id
-- WHERE t.sold = TRUE
-- GROUP BY l.category
-- ORDER BY ghosting_rate DESC;
