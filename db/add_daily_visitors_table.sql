CREATE TABLE IF NOT EXISTS daily_visitors (
  id BIGSERIAL PRIMARY KEY,
  visit_date DATE NOT NULL,
  visitor_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(6) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uk_daily_visitors_date_hash UNIQUE (visit_date, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_daily_visitors_visit_date
  ON daily_visitors (visit_date);
