-- relation_graphs テーブルにユーザー個人グラフ対応を追加
-- username IS NULL = 管理者公式グラフ（1ゲーム1件）
-- username IS NOT NULL = ログインユーザーの個人グラフ

-- 既存の game_id ユニーク制約を削除
ALTER TABLE relation_graphs DROP CONSTRAINT relation_graphs_game_id_key;

-- username カラム追加（null = 公式グラフ）
ALTER TABLE relation_graphs ADD COLUMN username VARCHAR(100);

-- 公式グラフ用ユニークインデックス（1ゲームにつき1件）
CREATE UNIQUE INDEX relation_graphs_game_id_official_idx
    ON relation_graphs (game_id)
    WHERE username IS NULL;

-- ユーザーグラフ用ユニークインデックス（1ユーザー×1ゲームにつき1件）
CREATE UNIQUE INDEX relation_graphs_game_id_username_idx
    ON relation_graphs (game_id, username)
    WHERE username IS NOT NULL;
