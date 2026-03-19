-- 啓蒙ポイントシステム
ALTER TABLE users ADD COLUMN IF NOT EXISTS enlightenment INT NOT NULL DEFAULT 0;

-- タグ属性機能
CREATE TABLE IF NOT EXISTS tag_attributes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    game_id BIGINT NOT NULL REFERENCES games(id),
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE (name, game_id)
);

-- タグに属性カラム追加
ALTER TABLE tags ADD COLUMN IF NOT EXISTS attribute VARCHAR(50);

-- タグ・タグ属性の並び替え
ALTER TABLE tags ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE tag_attributes ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
