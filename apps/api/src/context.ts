import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { TRPCError } from "@trpc/server";
import type { User } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "./lib/supabase";

export const AUTH_ROLES = ["admin", "merchant", "viewer"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export type AuthUser = {
  email?: string;
  id: string;
  orgId?: string;
  role?: AuthRole;
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getUserRole(user: User): AuthRole | undefined {
  const role = getStringMetadataValue(user.app_metadata, "role");

  return AUTH_ROLES.find((authRole) => authRole === role);
}

function getUserOrgId(user: User): string | undefined {
  const orgId = getStringMetadataValue(user.app_metadata, "org_id");

  return orgId && UUID_REGEX.test(orgId) ? orgId : undefined;
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
    orgId: getUserOrgId(user),
    role: getUserRole(user)
  };
}

function assertUserHasRole(user: AuthUser, allowedRoles: readonly AuthRole[]) {
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${allowedRoles.join(" or ")} role required.`
    });
  }

  if (user.role !== "admin" && !user.orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization membership required."
    });
  }
}

async function requireUserWithRole(
  authorization: string | undefined,
  allowedRoles: readonly AuthRole[]
): Promise<AuthUser> {
  const user = await getUserFromAuthorization(authorization);

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required."
    });
  }

  assertUserHasRole(user, allowedRoles);

  return user;
}

export async function requireMerchantUser(authorization: string | undefined): Promise<AuthUser> {
  return requireUserWithRole(authorization, ["admin", "merchant"]);
}

export async function requireAdminUser(authorization: string | undefined): Promise<AuthUser> {
  return requireUserWithRole(authorization, ["admin"]);
}

export function getTenantOrgId(user: AuthUser): string | undefined {
  if (user.role === "admin") {
    return undefined;
  }

  if (!user.orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization membership required."
    });
  }

  return user.orgId;
}

export async function createContext({
  req
}: CreateFastifyContextOptions): Promise<Context> {
  const user = await getUserFromAuthorization(req.headers.authorization);

  return {
    user
  };
}
