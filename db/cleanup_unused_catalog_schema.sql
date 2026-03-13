-- Run after confirming the app build/compile succeeds without sort_order fields.
-- This script removes the no-longer-used catalog_entries table and sort_order columns.

BEGIN;

DROP TABLE IF EXISTS catalog_entries;

ALTER TABLE games DROP COLUMN IF EXISTS sort_order;
ALTER TABLE items DROP COLUMN IF EXISTS sort_order;
ALTER TABLE bosses DROP COLUMN IF EXISTS sort_order;
ALTER TABLE npcs DROP COLUMN IF EXISTS sort_order;
ALTER TABLE tags DROP COLUMN IF EXISTS sort_order;
ALTER TABLE tag_attributes DROP COLUMN IF EXISTS sort_order;

COMMIT;
