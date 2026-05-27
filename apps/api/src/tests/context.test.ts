import { describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();

vi.mock("../lib/supabase", () => ({
  getSupabaseAdmin: () => ({
    auth: {
      getUser: getUserMock
    }
  })
}));

import { requireAdminUser } from "../context";

describe("requireAdminUser", () => {
  it("allows Supabase users with app_metadata.role = admin", async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          app_metadata: { role: "admin" },
          email: "admin@example.com",
          id: "00000000-0000-0000-0000-000000000001",
          user_metadata: {}
        }
      },
      error: null
    });

    await expect(requireAdminUser("Bearer token")).resolves.toMatchObject({
      email: "admin@example.com",
      id: "00000000-0000-0000-0000-000000000001",
      role: "admin"
    });
  });

  it("rejects authenticated non-admin users with FORBIDDEN", async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          app_metadata: { role: "merchant" },
          email: "merchant@example.com",
          id: "00000000-0000-0000-0000-000000000002",
          user_metadata: {}
        }
      },
      error: null
    });

    await expect(requireAdminUser("Bearer token")).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });

  it("ignores user_metadata.role because user metadata is client-controlled", async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          app_metadata: {},
          email: "spoofed@example.com",
          id: "00000000-0000-0000-0000-000000000003",
          user_metadata: { role: "admin" }
        }
      },
      error: null
    });

    await expect(requireAdminUser("Bearer token")).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });
});
