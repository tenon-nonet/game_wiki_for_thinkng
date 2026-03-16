CREATE TABLE relation_graphs (
    id          BIGSERIAL PRIMARY KEY,
    game_id     BIGINT NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
    graph_data  TEXT,
    updated_by  VARCHAR(100),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
