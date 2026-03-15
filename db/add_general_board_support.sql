ALTER TABLE board_threads
  ALTER COLUMN game_id DROP NOT NULL;

ALTER TABLE board_threads
  ADD COLUMN IF NOT EXISTS board_type VARCHAR(20) NOT NULL DEFAULT 'GAME';

CREATE INDEX IF NOT EXISTS idx_board_threads_board_type
  ON board_threads (board_type);
