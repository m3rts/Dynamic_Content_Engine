CREATE OR REPLACE FUNCTION control.mark_dispatch_delivered(p_dispatch_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = control, pg_temp
AS $$
BEGIN
  UPDATE control.dispatch_record d
  SET state = 'delivered', delivered_at = now()
  WHERE d.dispatch_id = p_dispatch_id
    AND d.state = 'claimed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'dispatch not in claimed state';
  END IF;
END;
$$;

ALTER FUNCTION control.mark_dispatch_delivered(uuid) OWNER TO dce_definer;
REVOKE ALL ON FUNCTION control.mark_dispatch_delivered(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION control.mark_dispatch_delivered(uuid) TO dce_queue;
