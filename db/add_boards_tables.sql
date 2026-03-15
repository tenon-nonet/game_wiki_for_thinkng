CREATE TABLE IF NOT EXISTS board_threads (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT,
  board_type VARCHAR(20) NOT NULL DEFAULT 'GAME',
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  username VARCHAR(100) NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  reply_count INTEGER NOT NULL DEFAULT 0,
  last_posted_at TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(6) WITHOUT TIME ZONE,
  updated_at TIMESTAMP(6) WITHOUT TIME ZONE,
  CONSTRAINT fk_board_threads_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_board_threads_game_id
  ON board_threads (game_id);

CREATE INDEX IF NOT EXISTS idx_board_threads_board_type
  ON board_threads (board_type);

CREATE TABLE IF NOT EXISTS board_posts (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  username VARCHAR(100) NOT NULL,
  created_at TIMESTAMP(6) WITHOUT TIME ZONE,
  updated_at TIMESTAMP(6) WITHOUT TIME ZONE,
  CONSTRAINT fk_board_posts_thread FOREIGN KEY (thread_id) REFERENCES board_threads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_board_posts_thread_id
  ON board_posts (thread_id);
