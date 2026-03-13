-- Run after deploying the application code that no longer depends on catalog_entries.
-- This script removes the no-longer-used catalog_entries table only.

BEGIN;

DROP TABLE IF EXISTS catalog_entries;

COMMIT;
