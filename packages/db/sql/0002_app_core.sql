CREATE TABLE app.agency (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.client (
  id uuid PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES app.agency (id) ON DELETE RESTRICT,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, id)
);

CREATE TABLE app.app_user (
  id uuid PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES app.agency (id) ON DELETE RESTRICT,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.client_membership (
  agency_id uuid NOT NULL,
  client_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES app.app_user (id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('owner', 'operator', 'reviewer')),
  status text NOT NULL CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agency_id, client_id, user_id),
  FOREIGN KEY (agency_id, client_id) REFERENCES app.client (agency_id, id) ON DELETE RESTRICT
);

CREATE TABLE app.workflow_run (
  id uuid PRIMARY KEY,
  agency_id uuid NOT NULL,
  client_id uuid NOT NULL,
  state text NOT NULL CHECK (
    state IN (
      'queued',
      'running',
      'awaiting_review',
      'needs_attention',
      'succeeded',
      'failed',
      'cancelled'
    )
  ),
  input_hash text NOT NULL,
  created_by uuid NOT NULL REFERENCES app.app_user (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (agency_id, client_id) REFERENCES app.client (agency_id, id) ON DELETE RESTRICT
);

CREATE INDEX workflow_run_client_created_idx ON app.workflow_run (agency_id, client_id, created_at DESC);

CREATE OR REPLACE FUNCTION app.set_request_scope(
  p_agency_id uuid,
  p_client_id uuid,
  p_actor_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('dce.agency_id', p_agency_id::text, true);
  PERFORM set_config('dce.client_id', p_client_id::text, true);
  PERFORM set_config('dce.actor_id', p_actor_id::text, true);
END;
$$;

REVOKE ALL ON FUNCTION app.set_request_scope(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.set_request_scope(uuid, uuid, uuid) TO dce_web, dce_worker_app;
