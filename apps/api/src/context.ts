import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { TRPCError } from "@trpc/server";
import type { User } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "./lib/supabase";

export type AuthUser = {
  email?: string;
  id: string;
  role?: string;
};

export type Context = {
  user?: AuthUser;
};

export function getBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authorization header must use Bearer token format."
    });
  }

  return token;
}

function getStringMetadataValue(
  metadata: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  const value = metadata?.[key];

  return typeof value === "string" ? value : undefined;
}

function getUserRole(user: User): string | undefined {
  return getStringMetadataValue(user.app_metadata, "role");
}

export async function getUserFromAuthorization(
  authorization: string | undefined
): Promise<AuthUser | undefined> {
  const token = getBearerToken(authorization);

  if (!token) {
    return undefined;
  }

  const {
    data: { user },
    error
  } = await getSupabaseAdmin().auth.getUser(token);

  if (error || !user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid Supabase access token."
    });
  }

  return {
    email: user.email,
    id: user.id,
    role: getUserRole(user)
  };
}

export async function requireAdminUser(authorization: string | undefined): Promise<AuthUser> {
  const user = await getUserFromAuthorization(authorization);

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required."
    });
  }

  if (user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin role required."
    });
  }

  return user;
}

export async function createContext({
  req
}: CreateFastifyContextOptions): Promise<Context> {
  const user = await getUserFromAuthorization(req.headers.authorization);

  return {
    user
  };
}
