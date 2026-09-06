-- Applied after pg-boss schema creation under dce_boss_migrator.
-- Grants are table-wide; pg-boss 12.30.0 on PostgreSQL 16 requires DML only.

GRANT USAGE ON SCHEMA boss TO dce_queue;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA boss TO dce_queue;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA boss TO dce_queue;

ALTER DEFAULT PRIVILEGES FOR ROLE dce_boss_migrator IN SCHEMA boss
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dce_queue;
ALTER DEFAULT PRIVILEGES FOR ROLE dce_boss_migrator IN SCHEMA boss
  GRANT USAGE, SELECT ON SEQUENCES TO dce_queue;

REVOKE CREATE ON SCHEMA boss FROM dce_queue;
