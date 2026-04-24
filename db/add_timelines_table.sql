CREATE TABLE IF NOT EXISTS timelines (
    id         BIGSERIAL PRIMARY KEY,
    game_id    BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    username   VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_timelines_game_official ON timelines (game_id) WHERE username IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_timelines_game_user ON timelines (game_id, username) WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS timeline_events (
    id            BIGSERIAL PRIMARY KEY,
    timeline_id   BIGINT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    image_path    VARCHAR(255),
    era_label     VARCHAR(100),
    order_index   INT NOT NULL DEFAULT 0,
    organizations TEXT
);

CREATE INDEX IF NOT EXISTS idx_timeline_events_timeline_id ON timeline_events(timeline_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_order ON timeline_events(timeline_id, order_index);

CREATE TABLE IF NOT EXISTS timeline_event_bosses (
    event_id BIGINT NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
    boss_id  BIGINT NOT NULL REFERENCES bosses(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, boss_id)
);

CREATE TABLE IF NOT EXISTS timeline_event_npcs (
    event_id BIGINT NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
    npc_id   BIGINT NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, npc_id)
);

CREATE TABLE IF NOT EXISTS timeline_event_items (
    event_id BIGINT NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
    item_id  BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, item_id)
);
