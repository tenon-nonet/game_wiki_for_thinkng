-- Bossの説明文とセリフを分離するためのテーブル追加
CREATE TABLE IF NOT EXISTS boss_dialogues (
  id BIGSERIAL PRIMARY KEY,
  boss_id BIGINT NOT NULL,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  CONSTRAINT fk_boss_dialogues_boss
    FOREIGN KEY (boss_id) REFERENCES bosses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_boss_dialogues_boss_id
  ON boss_dialogues (boss_id);
