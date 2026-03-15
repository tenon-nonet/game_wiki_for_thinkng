CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  target_type VARCHAR(30) NOT NULL,
  target_id BIGINT NOT NULL,
  reason VARCHAR(200) NOT NULL,
  reported_by VARCHAR(100) NOT NULL,
  reporter_key VARCHAR(255) NOT NULL,
  target_author VARCHAR(100),
  target_author_key VARCHAR(255),
  target_summary TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMP(6) WITHOUT TIME ZONE,
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP(6) WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_reports_status
  ON reports (status);

CREATE INDEX IF NOT EXISTS idx_reports_target
  ON reports (target_type, target_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_reporter_target
  ON reports (target_type, target_id, reporter_key);
