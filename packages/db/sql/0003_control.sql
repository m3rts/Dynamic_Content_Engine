CREATE TABLE control.dispatch_record (
  dispatch_id uuid PRIMARY KEY,
  run_id uuid NOT NULL,
  attempt_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  client_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  input_hash text NOT NULL,
  trace_id text NOT NULL,
  job_kind text NOT NULL,
  state text NOT NULL CHECK (state IN ('pending', 'claimed', 'delivered', 'cancelled')) DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  delivered_at timestamptz
);

CREATE INDEX dispatch_record_pending_idx
  ON control.dispatch_record (created_at)
  WHERE state = 'pending';

REVOKE ALL ON TABLE control.dispatch_record FROM PUBLIC;
GRANT USAGE ON SCHEMA app, control TO dce_definer;
GRANT CREATE ON SCHEMA control TO dce_definer;
GRANT SELECT, INSERT, UPDATE ON TABLE control.dispatch_record TO dce_definer;
GRANT SELECT ON TABLE app.workflow_run, app.client_membership TO dce_definer;

CREATE OR REPLACE FUNCTION control.insert_dispatch_record(
  p_dispatch_id uuid,
  p_run_id uuid,
  p_attempt_id uuid,
  p_agency_id uuid,
  p_client_id uuid,
  p_actor_id uuid,
  p_input_hash text,
  p_trace_id text,
  p_job_kind text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = control, app, pg_temp
AS $$
DECLARE
  v_scope_agency text := current_setting('dce.agency_id', true);
  v_scope_client text := current_setting('dce.client_id', true);
  v_scope_actor text := current_setting('dce.actor_id', true);
BEGIN
  IF v_scope_agency IS NULL OR v_scope_client IS NULL OR v_scope_actor IS NULL THEN
    RAISE EXCEPTION 'missing request scope';
  END IF;

  IF p_agency_id::text <> v_scope_agency
     OR p_client_id::text <> v_scope_client
     OR p_actor_id::text <> v_scope_actor THEN
    RAISE EXCEPTION 'scope mismatch';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM app.client_membership m
    WHERE m.agency_id = p_agency_id
      AND m.client_id = p_client_id
      AND m.user_id = p_actor_id
      AND m.status = 'active'
      AND m.role IN ('owner', 'operator')
  ) THEN
    RAISE EXCEPTION 'actor not authorized to dispatch';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM app.workflow_run
    WHERE id = p_run_id
      AND agency_id = p_agency_id
      AND client_id = p_client_id
      AND input_hash = p_input_hash
  ) THEN
    RAISE EXCEPTION 'run not found in scope';
  END IF;

  INSERT INTO control.dispatch_record (
    dispatch_id,
    run_id,
    attempt_id,
    agency_id,
    client_id,
    actor_id,
    input_hash,
    trace_id,
    job_kind
  )
  VALUES (
    p_dispatch_id,
    p_run_id,
    p_attempt_id,
    p_agency_id,
    p_client_id,
    p_actor_id,
    p_input_hash,
    p_trace_id,
    p_job_kind
  );

  RETURN p_dispatch_id;
END;
$$;

ALTER FUNCTION control.insert_dispatch_record(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, text
) OWNER TO dce_definer;

REVOKE ALL ON FUNCTION control.insert_dispatch_record(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION control.insert_dispatch_record(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, text
) TO dce_web;

CREATE OR REPLACE FUNCTION control.claim_pending_dispatch_records(p_limit integer)
RETURNS TABLE (
  dispatch_id uuid,
  run_id uuid,
  attempt_id uuid,
  agency_id uuid,
  client_id uuid,
  actor_id uuid,
  input_hash text,
  trace_id text,
  job_kind text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = control, pg_temp
AS $$
BEGIN
  IF p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'claim limit out of bounds';
  END IF;

  RETURN QUERY
  WITH claimed AS (
    SELECT d.dispatch_id
    FROM control.dispatch_record d
    WHERE d.state = 'pending'
    ORDER BY d.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  ),
  updated AS (
    UPDATE control.dispatch_record d
    SET state = 'claimed', claimed_at = now()
    FROM claimed c
    WHERE d.dispatch_id = c.dispatch_id
    RETURNING d.dispatch_id, d.run_id, d.attempt_id, d.agency_id, d.client_id, d.actor_id, d.input_hash, d.trace_id, d.job_kind
  )
  SELECT
    u.dispatch_id,
    u.run_id,
    u.attempt_id,
    u.agency_id,
    u.client_id,
    u.actor_id,
    u.input_hash,
    u.trace_id,
    u.job_kind
  FROM updated u;
END;
$$;

ALTER FUNCTION control.claim_pending_dispatch_records(integer) OWNER TO dce_definer;
REVOKE ALL ON FUNCTION control.claim_pending_dispatch_records(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION control.claim_pending_dispatch_records(integer) TO dce_queue;

CREATE OR REPLACE FUNCTION control.get_dispatch_metadata(p_dispatch_id uuid)
RETURNS TABLE (
  dispatch_id uuid,
  run_id uuid,
  attempt_id uuid,
  agency_id uuid,
  client_id uuid,
  actor_id uuid,
  input_hash text,
  trace_id text,
  job_kind text,
  state text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = control, pg_temp
AS $$
  SELECT
    d.dispatch_id,
    d.run_id,
    d.attempt_id,
    d.agency_id,
    d.client_id,
    d.actor_id,
    d.input_hash,
    d.trace_id,
    d.job_kind,
    d.state
  FROM control.dispatch_record d
  WHERE d.dispatch_id = p_dispatch_id;
$$;

ALTER FUNCTION control.get_dispatch_metadata(uuid) OWNER TO dce_definer;
REVOKE ALL ON FUNCTION control.get_dispatch_metadata(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION control.get_dispatch_metadata(uuid) TO dce_queue, dce_worker_app;
