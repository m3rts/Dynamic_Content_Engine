CREATE TABLE audit.audit_event (
  id uuid PRIMARY KEY,
  agency_id uuid,
  client_id uuid,
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX audit_event_scope_created_idx
  ON audit.audit_event (agency_id, client_id, created_at DESC);

REVOKE ALL ON TABLE audit.audit_event FROM PUBLIC;
