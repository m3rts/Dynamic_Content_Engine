import "../../../../scripts/load-root-env.mjs";

import { betterAuth } from "better-auth";
import { Pool } from "pg";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

let authPool: Pool | undefined;

function getAuthPool(): Pool {
  if (!authPool) {
    authPool = new Pool({
      connectionString: requiredEnv("AUTH_DATABASE_URL"),
      options: "-c search_path=auth",
      max: 5,
    });
  }

  return authPool;
}

function createAuth() {
  return betterAuth({
    secret: requiredEnv("BETTER_AUTH_SECRET"),
    baseURL: requiredEnv("BETTER_AUTH_URL"),
    trustedOrigins: [requiredEnv("BETTER_AUTH_URL")],
    database: getAuthPool(),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 12,
    },
    advanced: {
      cookiePrefix: "dce",
      useSecureCookies: process.env.NODE_ENV === "production",
    },
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  authInstance ??= createAuth();
  return authInstance;
}

export const auth: AuthInstance = new Proxy({} as AuthInstance, {
  get(_target, prop, receiver) {
    const instance = getAuth();
    const value = Reflect.get(instance, prop, receiver) as unknown;
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
  has(_target, prop) {
    if (prop === "handler") {
      return true;
    }
    return prop in getAuth();
  },
});

export async function closeAuthPool(): Promise<void> {
  if (authPool) {
    await authPool.end();
    authPool = undefined;
  }

  authInstance = undefined;
}

export type AuthSession = AuthInstance["$Infer"]["Session"];
