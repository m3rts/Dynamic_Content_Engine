import type { Capability } from "@dce/policy";
import { capabilitiesForRole, evaluateMembershipCapability } from "@dce/policy";
import type pg from "pg";

import type { AuthSession } from "./auth";
import { getWebPool } from "./db";

export type AuthorizedScope = {
  actorId: string;
  agencyId: string;
  clientId: string;
  membershipRole: "owner" | "operator" | "reviewer";
  capabilities: readonly Capability[];
};

export class AuthorizationError extends Error {
  readonly status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

type MembershipRow = {
  agency_id: string;
  client_id: string;
  user_id: string;
  role: "owner" | "operator" | "reviewer";
  status: "active" | "disabled";
};

export async function resolveActorId(authUserId: string): Promise<string> {
  const pool = getWebPool();
  const result = await pool.query<{ user_id: string }>(
    `
    SELECT user_id
    FROM app.linked_identity
    WHERE issuer = 'better-auth'
      AND external_subject_id = $1
  `,
    [authUserId],
  );

  const actorId = result.rows[0]?.user_id;
  if (!actorId) {
    throw new AuthorizationError("Actor is not linked to an application user", 401);
  }

  return actorId;
}

export async function loadMembership(
  client: pg.PoolClient,
  actorId: string,
  clientId: string,
): Promise<MembershipRow | undefined> {
  const result = await client.query<MembershipRow>(
    `
    SELECT agency_id, client_id, user_id, role, status
    FROM app.client_membership
    WHERE user_id = $1
      AND client_id = $2
  `,
    [actorId, clientId],
  );

  return result.rows[0];
}

export async function authorizeAndScope(
  session: AuthSession | null,
  clientId: string,
  capability: Capability,
): Promise<AuthorizedScope> {
  if (!session?.user?.id) {
    throw new AuthorizationError("Authentication required", 401);
  }

  const actorId = await resolveActorId(session.user.id);
  const pool = getWebPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT app.set_actor_id($1)", [actorId]);
    const membership = await loadMembership(client, actorId, clientId);

    if (!membership) {
      throw new AuthorizationError("Client membership required", 403);
    }

    const decision = evaluateMembershipCapability(membership.role, capability, {
      membershipStatus: membership.status,
    });

    if (!decision.allowed) {
      throw new AuthorizationError(`Missing capability: ${capability}`, 403);
    }

    await client.query("COMMIT");

    return {
      actorId,
      agencyId: membership.agency_id,
      clientId: membership.client_id,
      membershipRole: membership.role,
      capabilities: capabilitiesForRole(membership.role),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function withAuthorizedTransaction<T>(
  scope: AuthorizedScope,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const pool = getWebPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT app.set_request_scope($1, $2, $3)", [
      scope.agencyId,
      scope.clientId,
      scope.actorId,
    ]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
