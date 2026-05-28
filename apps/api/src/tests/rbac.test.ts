import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../modules/batches/batches.service", () => ({
  createBatch: vi.fn().mockResolvedValue({ id: "batch-id" }),
  getBatch: vi.fn().mockResolvedValue({ id: "batch-id" }),
  getBatchByTraceId: vi.fn().mockResolvedValue({ batch: { id: "batch-id" } }),
  listBatches: vi.fn().mockResolvedValue([{ id: "batch-id" }])
}));

vi.mock("../modules/genealogy/genealogy.service", () => ({
  getGenealogy: vi.fn().mockResolvedValue({ children: [], parents: [] }),
  linkGenealogy: vi.fn().mockResolvedValue([{ id: "link-id" }])
}));

vi.mock("../modules/nodes/nodes.service", () => ({
  createNode: vi.fn().mockResolvedValue({ id: "node-id" }),
  getNode: vi.fn().mockResolvedValue({ id: "node-id" }),
  listNodes: vi.fn().mockResolvedValue([{ id: "node-id" }]),
  updateKybStatus: vi.fn().mockResolvedValue({ id: "node-id", kybStatus: "approved" })
}));

import type { Context } from "../context";
import { createBatch } from "../modules/batches/batches.service";
import { linkGenealogy } from "../modules/genealogy/genealogy.service";
import { updateKybStatus } from "../modules/nodes/nodes.service";
import { appRouter } from "../router";

const ADMIN_ID = "00000000-0000-0000-0000-000000000001";
const MERCHANT_ID = "00000000-0000-0000-0000-000000000002";
const VIEWER_ID = "00000000-0000-0000-0000-000000000003";
const NODE_ID = "00000000-0000-0000-0000-000000000010";
const BATCH_ID = "00000000-0000-0000-0000-000000000020";
const PARENT_BATCH_ID = "00000000-0000-0000-0000-000000000021";

const createBatchInput = {
  gs1TraceId: "010123456789012310LOT-001",
  name: "Batch A",
  nodeId: NODE_ID,
  quantity: 10,
  uom: "kg"
};

function caller(ctx: Context) {
  return appRouter.createCaller(ctx);
}

describe("tRPC RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows viewer role to call read-only tRPC procedures", async () => {
    const viewer = caller({
      user: {
        id: VIEWER_ID,
        role: "viewer"
      }
    });

    await expect(viewer.batches.get({ id: BATCH_ID })).resolves.toMatchObject({
      id: "batch-id"
    });
    await expect(viewer.batches.list({ limit: 50 })).resolves.toHaveLength(1);
    await expect(viewer.genealogy.get({ batchId: BATCH_ID })).resolves.toEqual({
      children: [],
      parents: []
    });
    await expect(viewer.nodes.list({ limit: 50 })).resolves.toHaveLength(1);
  });

  it("blocks viewer role from tRPC mutations", async () => {
    const viewer = caller({
      user: {
        id: VIEWER_ID,
        role: "viewer"
      }
    });

    await expect(viewer.batches.create(createBatchInput)).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
    await expect(
      viewer.genealogy.link({
        childBatchId: BATCH_ID,
        parentBatchIds: [PARENT_BATCH_ID]
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
    await expect(
      viewer.nodes.updateKybStatus({
        id: NODE_ID,
        kybStatus: "approved"
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });

  it("allows merchant role to create and link batches but not perform admin actions", async () => {
    const merchant = caller({
      user: {
        id: MERCHANT_ID,
        role: "merchant"
      }
    });

    await expect(merchant.batches.create(createBatchInput)).resolves.toMatchObject({
      id: "batch-id"
    });
    await expect(
      merchant.genealogy.link({
        childBatchId: BATCH_ID,
        parentBatchIds: [PARENT_BATCH_ID]
      })
    ).resolves.toHaveLength(1);
    await expect(
      merchant.nodes.updateKybStatus({
        id: NODE_ID,
        kybStatus: "approved"
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN"
    });

    expect(createBatch).toHaveBeenCalledWith(createBatchInput, MERCHANT_ID);
    expect(linkGenealogy).toHaveBeenCalledWith(
      {
        childBatchId: BATCH_ID,
        parentBatchIds: [PARENT_BATCH_ID],
        wasteTolerance: 0.05
      },
      MERCHANT_ID
    );
  });

  it("allows admin role to perform admin and merchant actions", async () => {
    const admin = caller({
      user: {
        id: ADMIN_ID,
        role: "admin"
      }
    });

    await expect(admin.batches.create(createBatchInput)).resolves.toMatchObject({
      id: "batch-id"
    });
    await expect(
      admin.nodes.updateKybStatus({
        id: NODE_ID,
        kybStatus: "approved"
      })
    ).resolves.toMatchObject({
      kybStatus: "approved"
    });

    expect(updateKybStatus).toHaveBeenCalledWith(
      {
        id: NODE_ID,
        kybStatus: "approved"
      },
      ADMIN_ID
    );
  });

  it("rejects authenticated users without app_metadata.role on role-gated procedures", async () => {
    const unassigned = caller({
      user: {
        id: "00000000-0000-0000-0000-000000000004"
      }
    });

    await expect(unassigned.batches.list({ limit: 50 })).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });
});
