CREATE TABLE IF NOT EXISTS edit_histories (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  entity_type VARCHAR(20) NOT NULL,
  entity_id BIGINT NOT NULL,
  entity_name VARCHAR(100) NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  game_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_edit_histories_username_created_at
  ON edit_histories (username, created_at DESC);
