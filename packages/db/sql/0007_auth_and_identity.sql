-- Better Auth 1.7.3 core tables (reviewed; matches auth config in apps/web).
SET search_path TO auth;

CREATE TABLE auth."user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX auth_user_email_uidx ON auth."user" (email);

CREATE TABLE auth.session (
  id text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  token text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES auth."user" (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX auth_session_token_uidx ON auth.session (token);
CREATE INDEX auth_session_user_id_idx ON auth.session ("userId");

CREATE TABLE auth.account (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES auth."user" (id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX auth_account_provider_account_uidx ON auth.account ("providerId", "accountId");
CREATE INDEX auth_account_user_id_idx ON auth.account ("userId");

CREATE TABLE auth.verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX auth_verification_identifier_idx ON auth.verification (identifier);

REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO dce_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO dce_migrator;

CREATE TABLE app.linked_identity (
  issuer text NOT NULL,
  external_subject_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES app.app_user (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (issuer, external_subject_id)
);

CREATE INDEX linked_identity_user_idx ON app.linked_identity (user_id);

CREATE TABLE app.system_bootstrap (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  owner_user_id uuid NOT NULL REFERENCES app.app_user (id) ON DELETE RESTRICT,
  completed_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE app.linked_identity FROM PUBLIC, dce_web, dce_worker_app;
REVOKE ALL ON TABLE app.system_bootstrap FROM PUBLIC, dce_web, dce_worker_app;
GRANT SELECT ON TABLE app.linked_identity TO dce_web, dce_worker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE app.linked_identity TO dce_migrator;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE app.system_bootstrap TO dce_migrator;

CREATE TABLE app.membership_capability_grant (
  agency_id uuid NOT NULL,
  client_id uuid NOT NULL,
  user_id uuid NOT NULL,
  capability text NOT NULL CHECK (capability IN ('review.claims', 'review.production')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agency_id, client_id, user_id, capability),
  FOREIGN KEY (agency_id, client_id, user_id)
    REFERENCES app.client_membership (agency_id, client_id, user_id) ON DELETE CASCADE
);

CREATE INDEX membership_capability_grant_user_idx
  ON app.membership_capability_grant (user_id, client_id);

REVOKE ALL ON TABLE app.membership_capability_grant FROM PUBLIC, dce_web, dce_worker_app;
GRANT SELECT ON TABLE app.membership_capability_grant TO dce_web, dce_worker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE app.membership_capability_grant TO dce_migrator;

ALTER TABLE app.membership_capability_grant ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.membership_capability_grant FORCE ROW LEVEL SECURITY;

CREATE POLICY membership_capability_grant_actor_read ON app.membership_capability_grant
  FOR SELECT
  TO dce_web, dce_worker_app
  USING (user_id = current_setting('dce.actor_id', true)::uuid);

CREATE OR REPLACE FUNCTION app.set_actor_id(p_actor_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('dce.actor_id', p_actor_id::text, true);
END;
$$;

REVOKE ALL ON FUNCTION app.set_actor_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.set_actor_id(uuid) TO dce_web, dce_worker_app;

CREATE POLICY client_membership_actor_read ON app.client_membership
  FOR SELECT
  TO dce_web, dce_worker_app
  USING (user_id = current_setting('dce.actor_id', true)::uuid);

ALTER DEFAULT PRIVILEGES FOR ROLE dce_migrator IN SCHEMA auth
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dce_auth;
