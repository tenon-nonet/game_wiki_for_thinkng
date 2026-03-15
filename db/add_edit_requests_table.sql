CREATE TABLE IF NOT EXISTS edit_requests (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL,
  entity_id BIGINT NULL,
  action_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  requested_by VARCHAR(100) NOT NULL,
  reviewed_by VARCHAR(100),
  entity_name VARCHAR(100),
  game_id BIGINT,
  game_name VARCHAR(100),
  payload TEXT,
  pending_image_path VARCHAR(255),
  review_comment TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_edit_requests_status_created_at
  ON edit_requests (status, created_at);
