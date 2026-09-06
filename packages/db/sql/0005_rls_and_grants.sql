ALTER TABLE app.agency ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.client ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.client_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.workflow_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.audit_event ENABLE ROW LEVEL SECURITY;

ALTER TABLE app.client FORCE ROW LEVEL SECURITY;
ALTER TABLE app.client_membership FORCE ROW LEVEL SECURITY;
ALTER TABLE app.workflow_run FORCE ROW LEVEL SECURITY;
ALTER TABLE audit.audit_event FORCE ROW LEVEL SECURITY;

CREATE POLICY client_scope ON app.client
  FOR ALL
  USING (
    agency_id = current_setting('dce.agency_id', true)::uuid
    AND id = current_setting('dce.client_id', true)::uuid
  )
  WITH CHECK (
    agency_id = current_setting('dce.agency_id', true)::uuid
    AND id = current_setting('dce.client_id', true)::uuid
  );

CREATE POLICY workflow_run_scope ON app.workflow_run
  FOR ALL
  USING (
    agency_id = current_setting('dce.agency_id', true)::uuid
    AND client_id = current_setting('dce.client_id', true)::uuid
  )
  WITH CHECK (
    agency_id = current_setting('dce.agency_id', true)::uuid
    AND client_id = current_setting('dce.client_id', true)::uuid
  );

CREATE POLICY audit_event_scope ON audit.audit_event
  FOR SELECT
  USING (
    agency_id = current_setting('dce.agency_id', true)::uuid
    AND client_id = current_setting('dce.client_id', true)::uuid
  );

CREATE POLICY audit_event_insert ON audit.audit_event
  FOR INSERT
  WITH CHECK (
    agency_id = current_setting('dce.agency_id', true)::uuid
    AND client_id = current_setting('dce.client_id', true)::uuid
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO dce_web, dce_worker_app;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO dce_web, dce_worker_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO dce_web, dce_worker_app;

REVOKE ALL ON TABLE app.schema_migration FROM dce_web, dce_worker_app;
GRANT SELECT, INSERT ON TABLE app.schema_migration TO dce_migrator;

REVOKE ALL ON TABLE control.dispatch_record FROM dce_queue;
REVOKE ALL ON ALL TABLES IN SCHEMA app FROM dce_queue;

GRANT USAGE ON SCHEMA app TO dce_web, dce_worker_app;
GRANT USAGE ON SCHEMA control TO dce_web, dce_worker_app, dce_queue;
GRANT USAGE ON SCHEMA audit TO dce_web, dce_worker_app;

ALTER DEFAULT PRIVILEGES FOR ROLE dce_migrator IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dce_web, dce_worker_app;
ALTER DEFAULT PRIVILEGES FOR ROLE dce_migrator IN SCHEMA audit
  GRANT SELECT, INSERT ON TABLES TO dce_web, dce_worker_app;
