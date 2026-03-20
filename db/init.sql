-- FROMDEX DB 初期化スクリプト
-- 現在のスキーマをすべて反映した完全版
-- 実行: psql -U postgres -d gamewiki -f db/init.sql

-- ユーザー
CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL,
    enlightenment INT        NOT NULL DEFAULT 0,
    created_at  TIMESTAMP
);

-- ゲーム
CREATE TABLE IF NOT EXISTS games (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    description   TEXT,
    image_path    VARCHAR(255),
    platforms     TEXT,
    release_dates TEXT,
    awards        TEXT,
    staff         TEXT,
    categories    TEXT,
    sort_order    INTEGER      NOT NULL DEFAULT 0,
    is_visible    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP,
    updated_at    TIMESTAMP
);

-- タグ
CREATE TABLE IF NOT EXISTS tags (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    type       VARCHAR(10) NOT NULL DEFAULT 'ITEM',
    attribute  VARCHAR(50),
    sort_order INT         DEFAULT 0,
    game_id    BIGINT      REFERENCES games(id),
    UNIQUE (name, game_id, type)
);

-- タグ属性
CREATE TABLE IF NOT EXISTS tag_attributes (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    game_id    BIGINT      NOT NULL REFERENCES games(id),
    sort_order INT         DEFAULT 0,
    UNIQUE (name, game_id)
);

-- アイテム
CREATE TABLE IF NOT EXISTS items (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    image_path  VARCHAR(255),
    category    VARCHAR(50),
    game_id     BIGINT       NOT NULL REFERENCES games(id),
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    updated_by  VARCHAR(100),
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

-- アイテム×タグ
CREATE TABLE IF NOT EXISTS item_tags (
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    tag_id  BIGINT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

-- コメント（アイテム考察）
CREATE TABLE IF NOT EXISTS comments (
    id         BIGSERIAL PRIMARY KEY,
    content    TEXT        NOT NULL,
    username   VARCHAR(50) NOT NULL,
    item_id    BIGINT      NOT NULL REFERENCES items(id),
    parent_id  BIGINT,
    created_at TIMESTAMP
);

-- コメントいいね
CREATE TABLE IF NOT EXISTS comment_likes (
    id         BIGSERIAL PRIMARY KEY,
    comment_id BIGINT      NOT NULL,
    username   VARCHAR(50) NOT NULL,
    UNIQUE (comment_id, username)
);

-- ボス
CREATE TABLE IF NOT EXISTS bosses (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    image_path  VARCHAR(255),
    game_id     BIGINT       NOT NULL REFERENCES games(id),
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    updated_by  VARCHAR(100),
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

-- ボス×タグ
CREATE TABLE IF NOT EXISTS boss_tags (
    boss_id BIGINT NOT NULL REFERENCES bosses(id) ON DELETE CASCADE,
    tag_id  BIGINT NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
    PRIMARY KEY (boss_id, tag_id)
);

-- ボスセリフ
CREATE TABLE IF NOT EXISTS boss_dialogues (
    id          BIGSERIAL PRIMARY KEY,
    boss_id     BIGINT  NOT NULL REFERENCES bosses(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL,
    order_index INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_boss_dialogues_boss_id ON boss_dialogues(boss_id);

-- ボスドロップアイテム
CREATE TABLE IF NOT EXISTS boss_drop_items (
    boss_id BIGINT NOT NULL REFERENCES bosses(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id)  ON DELETE CASCADE,
    PRIMARY KEY (boss_id, item_id)
);

-- NPC
CREATE TABLE IF NOT EXISTS npcs (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    image_path  VARCHAR(255),
    game_id     BIGINT       NOT NULL REFERENCES games(id),
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    updated_by  VARCHAR(100),
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

-- NPC×タグ
CREATE TABLE IF NOT EXISTS npc_tags (
    npc_id BIGINT NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (npc_id, tag_id)
);

-- NPCセリフ
CREATE TABLE IF NOT EXISTS npc_dialogues (
    id          BIGSERIAL PRIMARY KEY,
    npc_id      BIGINT  NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL,
    order_index INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_npc_dialogues_npc_id ON npc_dialogues(npc_id);

-- NPCドロップアイテム
CREATE TABLE IF NOT EXISTS npc_drop_items (
    npc_id  BIGINT NOT NULL REFERENCES npcs(id)   ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id)  ON DELETE CASCADE,
    PRIMARY KEY (npc_id, item_id)
);

-- 編集承認リクエスト
CREATE TABLE IF NOT EXISTS edit_requests (
    id                  BIGSERIAL PRIMARY KEY,
    entity_type         VARCHAR(20)  NOT NULL,
    entity_id           BIGINT,
    action_type         VARCHAR(20)  NOT NULL,
    status              VARCHAR(20)  NOT NULL,
    requested_by        VARCHAR(100) NOT NULL,
    reviewed_by         VARCHAR(100),
    entity_name         VARCHAR(100),
    game_id             BIGINT,
    game_name           VARCHAR(100),
    payload             TEXT,
    pending_image_path  VARCHAR(255),
    review_comment      TEXT,
    reviewed_at         TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_edit_requests_status_created_at ON edit_requests(status, created_at);

-- 編集履歴
CREATE TABLE IF NOT EXISTS edit_histories (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL,
    entity_type VARCHAR(20)  NOT NULL,
    entity_id   BIGINT       NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(20)  NOT NULL,
    game_name   VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_edit_histories_username_created_at ON edit_histories(username, created_at);

-- 掲示板スレッド
CREATE TABLE IF NOT EXISTS board_threads (
    id             BIGSERIAL PRIMARY KEY,
    game_id        BIGINT       REFERENCES games(id),
    board_type     VARCHAR(20)  NOT NULL DEFAULT 'GAME',
    title          VARCHAR(200) NOT NULL,
    content        TEXT         NOT NULL,
    username       VARCHAR(100) NOT NULL,
    author_key     VARCHAR(255) NOT NULL DEFAULT '',
    pinned         BOOLEAN      NOT NULL DEFAULT FALSE,
    locked         BOOLEAN      NOT NULL DEFAULT FALSE,
    reply_count    INTEGER      NOT NULL DEFAULT 0,
    last_posted_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    created_at     TIMESTAMP,
    updated_at     TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_board_threads_game_id   ON board_threads(game_id);
CREATE INDEX IF NOT EXISTS idx_board_threads_board_type ON board_threads(board_type);

-- 掲示板投稿
CREATE TABLE IF NOT EXISTS board_posts (
    id         BIGSERIAL PRIMARY KEY,
    thread_id  BIGINT       NOT NULL REFERENCES board_threads(id) ON DELETE CASCADE,
    content    TEXT         NOT NULL,
    username   VARCHAR(100) NOT NULL,
    author_key VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_board_posts_thread_id ON board_posts(thread_id);

-- 通報
CREATE TABLE IF NOT EXISTS reports (
    id               BIGSERIAL PRIMARY KEY,
    target_type      VARCHAR(30)  NOT NULL,
    target_id        BIGINT       NOT NULL,
    reason           VARCHAR(200) NOT NULL,
    reported_by      VARCHAR(100) NOT NULL,
    reporter_key     VARCHAR(255) NOT NULL,
    target_author    VARCHAR(100),
    target_author_key VARCHAR(255),
    target_summary   TEXT,
    status           VARCHAR(20)  NOT NULL DEFAULT 'NEW',
    created_at       TIMESTAMP,
    reviewed_by      VARCHAR(100),
    reviewed_at      TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_reporter_target ON reports(target_type, target_id, reporter_key);

-- BAN
CREATE TABLE IF NOT EXISTS bans (
    id         BIGSERIAL PRIMARY KEY,
    author_key VARCHAR(255) NOT NULL UNIQUE,
    reason     VARCHAR(255) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP
);

-- 日次訪問者
CREATE TABLE IF NOT EXISTS daily_visitors (
    id           BIGSERIAL PRIMARY KEY,
    visit_date   DATE        NOT NULL,
    visitor_hash VARCHAR(64) NOT NULL,
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_daily_visitors_date_hash UNIQUE (visit_date, visitor_hash)
);
CREATE INDEX IF NOT EXISTS idx_daily_visitors_visit_date ON daily_visitors(visit_date);

-- 相関図
CREATE TABLE IF NOT EXISTS relation_graphs (
    id         BIGSERIAL PRIMARY KEY,
    game_id    BIGINT       NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    username   VARCHAR(100),
    graph_data TEXT,
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- 公式グラフ（username IS NULL）はゲームごとに1件
CREATE UNIQUE INDEX IF NOT EXISTS relation_graphs_game_id_official_idx
    ON relation_graphs(game_id) WHERE username IS NULL;
-- ユーザーグラフはゲーム×ユーザーで1件
CREATE UNIQUE INDEX IF NOT EXISTS relation_graphs_game_id_username_idx
    ON relation_graphs(game_id, username) WHERE username IS NOT NULL;
