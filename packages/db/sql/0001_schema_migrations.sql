CREATE TABLE IF NOT EXISTS app.schema_migration (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE app.schema_migration FROM PUBLIC;
GRANT SELECT, INSERT ON TABLE app.schema_migration TO dce_migrator;
