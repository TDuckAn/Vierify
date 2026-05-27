import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { TRPCError } from "@trpc/server";

import { getSupabaseAdmin } from "./lib/supabase";

export type AuthUser = {
  email?: string;
  id: string;
};

export type Context = {
  user?: AuthUser;
};

function getBearerToken(authorization: string | undefined): string | undefined {
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

export async function createContext({
  req
}: CreateFastifyContextOptions): Promise<Context> {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return {};
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
    user: {
      email: user.email,
      id: user.id
    }
  };
}
