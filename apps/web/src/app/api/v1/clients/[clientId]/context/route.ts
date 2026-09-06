import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authorizeAndScope,
  AuthorizationError,
  withAuthorizedTransaction,
} from "@/lib/authorize-and-scope";
import { auth } from "@/lib/auth";
import { privateResponseHeaders } from "@/lib/cache-headers";

const paramsSchema = z.object({
  clientId: z.string().uuid(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ clientId: string }> },
): Promise<Response> {
  const params = paramsSchema.parse(await context.params);
  const session = await auth.api.getSession({ headers: await headers() });

  try {
    const scope = await authorizeAndScope(session, params.clientId, "client.read");
    const summary = await withAuthorizedTransaction(scope, async (client) => {
      const result = await client.query<{ id: string; name: string }>(
        "SELECT id, name FROM app.client",
      );
      return result.rows[0] ?? null;
    });

    return NextResponse.json(
      {
        agencyId: scope.agencyId,
        clientId: scope.clientId,
        actorId: scope.actorId,
        membershipRole: scope.membershipRole,
        client: summary,
      },
      { headers: privateResponseHeaders },
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: privateResponseHeaders },
      );
    }

    throw error;
  }
}
