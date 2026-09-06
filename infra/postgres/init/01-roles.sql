-- Superuser bootstrap only. Creates login roles and schema shells; no client data.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dce_migrator') THEN
    CREATE ROLE dce_migrator LOGIN PASSWORD 'dce_migrator' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dce_boss_migrator') THEN
    CREATE ROLE dce_boss_migrator LOGIN PASSWORD 'dce_boss_migrator' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dce_auth') THEN
    CREATE ROLE dce_auth LOGIN PASSWORD 'dce_auth' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dce_web') THEN
    CREATE ROLE dce_web LOGIN PASSWORD 'dce_web' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dce_worker_app') THEN
    CREATE ROLE dce_worker_app LOGIN PASSWORD 'dce_worker_app' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dce_queue') THEN
    CREATE ROLE dce_queue LOGIN PASSWORD 'dce_queue' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dce_definer') THEN
    CREATE ROLE dce_definer NOLOGIN;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION dce_migrator;
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION dce_migrator;
CREATE SCHEMA IF NOT EXISTS control AUTHORIZATION dce_migrator;
CREATE SCHEMA IF NOT EXISTS audit AUTHORIZATION dce_migrator;
CREATE SCHEMA IF NOT EXISTS boss AUTHORIZATION dce_boss_migrator;

REVOKE ALL ON SCHEMA auth FROM PUBLIC;
REVOKE ALL ON SCHEMA app FROM PUBLIC;
REVOKE ALL ON SCHEMA control FROM PUBLIC;
REVOKE ALL ON SCHEMA audit FROM PUBLIC;
REVOKE ALL ON SCHEMA boss FROM PUBLIC;

GRANT USAGE ON SCHEMA auth TO dce_auth;
GRANT USAGE ON SCHEMA app TO dce_web, dce_worker_app;
GRANT USAGE ON SCHEMA control TO dce_web, dce_worker_app, dce_queue;
GRANT USAGE ON SCHEMA audit TO dce_web, dce_worker_app;
GRANT USAGE ON SCHEMA boss TO dce_boss_migrator, dce_queue;

GRANT dce_definer TO dce_migrator;

GRANT ALL ON SCHEMA auth, app, control, audit TO dce_migrator;
GRANT ALL ON SCHEMA boss TO dce_boss_migrator;
GRANT CREATE ON DATABASE dce TO dce_migrator, dce_boss_migrator;
