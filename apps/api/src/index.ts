import "dotenv/config";
import "./sentry";

import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { TRPCError } from "@trpc/server";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { z } from "zod";

import {
  createContext,
  getTenantOrgId,
  requireAdminUser,
  requireMerchantUser
} from "./context";
import {
  MAX_DOCUMENT_UPLOAD_BYTES,
  uploadBatchDocument
} from "./modules/documents/documents.service";
import { linkGenealogySchema } from "./modules/genealogy/genealogy.schema";
import { linkGenealogy } from "./modules/genealogy/genealogy.service";
import { verifyKybTaxCode } from "./modules/kyb/kyb.service";
import { startBlockchainWorker } from "./queues/blockchain.worker";
import { appRouter } from "./router";
import { updateKybStatusSchema } from "./modules/nodes/nodes.schema";
import { updateKybStatus } from "./modules/nodes/nodes.service";
import { getBatchQrCode } from "./modules/qr/qr.service";
import { captureException, Sentry } from "./sentry";

const server = Fastify({
  logger: true
});

await server.register(cors, {
  origin: true
});

await server.register(multipart, {
  limits: {
    fileSize: MAX_DOCUMENT_UPLOAD_BYTES,
    files: 1
  },
  throwFileSizeLimit: true
});

server.get("/health", async () => ({
  ok: true,
  service: "vierify-api"
}));

if (process.env.ENABLE_SENTRY_DEBUG_ROUTE === "true") {
  server.get("/debug-sentry", async () => {
    Sentry.logger.info("User triggered test error", {
      action: "test_error_endpoint"
    });
    Sentry.metrics.count("test_counter", 1);
    throw new Error("My first Sentry error!");
  });
}

const linkParentsParamsSchema = z.object({
  child_id: z.string().uuid()
});

const uploadDocumentParamsSchema = z.object({
  id: z.string().uuid()
});

const batchQrParamsSchema = z.object({
  id: z.string().uuid()
});

const updateKybParamsSchema = z.object({
  id: z.string().uuid()
});

const verifyKybParamsSchema = z.object({
  id: z.string().uuid()
});

const linkParentsBodySchema = linkGenealogySchema.omit({
  childBatchId: true
});

const updateKybBodySchema = updateKybStatusSchema.omit({
  id: true
});

function getHttpStatusFromTrpcError(error: TRPCError): number {
  switch (error.code) {
    case "BAD_REQUEST":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "PAYLOAD_TOO_LARGE":
      return 413;
    default:
      return 500;
  }
}

server.post("/batches/:child_id/parents", async (request, reply) => {
  const params = linkParentsParamsSchema.safeParse(request.params);

  if (!params.success) {
    return reply.code(400).send({
      error: "Invalid child batch id."
    });
  }

  const body = linkParentsBodySchema.safeParse(request.body);

  if (!body.success) {
    return reply.code(400).send({
      error: "Invalid genealogy link payload.",
      issues: body.error.issues
    });
  }

  try {
    const user = await requireMerchantUser(request.headers.authorization);

    const links = await linkGenealogy(
      {
        childBatchId: params.data.child_id,
        parentBatchIds: body.data.parentBatchIds,
        wasteTolerance: body.data.wasteTolerance
      },
      user.id,
      getTenantOrgId(user)
    );

    return reply.code(201).send({ links });
  } catch (error) {
    if (error instanceof TRPCError) {
      return reply.code(getHttpStatusFromTrpcError(error)).send({
        error: error.message
      });
    }

    request.log.error(error);
    captureException(error);

    return reply.code(500).send({
      error: "Internal server error."
    });
  }
});

server.post("/batches/:id/document", async (request, reply) => {
  const params = uploadDocumentParamsSchema.safeParse(request.params);

  if (!params.success) {
    return reply.code(400).send({
      error: "Invalid batch id."
    });
  }

  if (!request.isMultipart()) {
    return reply.code(400).send({
      error: "Document upload must use multipart/form-data."
    });
  }

  try {
    const user = await requireMerchantUser(request.headers.authorization);

    const file = await request.file({
      limits: {
        fileSize: MAX_DOCUMENT_UPLOAD_BYTES,
        files: 1
      }
    });

    if (!file) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Document file is required."
      });
    }

    const result = await uploadBatchDocument(
      {
        batchId: params.data.id,
        fileBuffer: await file.toBuffer(),
        fileName: file.filename,
        mimeType: file.mimetype
      },
      user.id,
      getTenantOrgId(user)
    );

    return reply.code(201).send(result);
  } catch (error) {
    if (error instanceof server.multipartErrors.RequestFileTooLargeError) {
      return reply.code(413).send({
        error: "Document upload exceeds the 10 MB limit."
      });
    }

    if (error instanceof TRPCError) {
      return reply.code(getHttpStatusFromTrpcError(error)).send({
        error: error.message
      });
    }

    request.log.error(error);
    captureException(error);

    return reply.code(500).send({
      error: "Internal server error."
    });
  }
});

server.get("/batches/:id/qr", async (request, reply) => {
  const params = batchQrParamsSchema.safeParse(request.params);

  if (!params.success) {
    return reply.code(400).send({
      error: "Invalid batch id."
    });
  }

  try {
    const result = await getBatchQrCode(params.data.id);

    return reply.send(result);
  } catch (error) {
    if (error instanceof TRPCError) {
      return reply.code(getHttpStatusFromTrpcError(error)).send({
        error: error.message
      });
    }

    request.log.error(error);
    captureException(error);

    return reply.code(500).send({
      error: "Internal server error."
    });
  }
});

server.patch("/admin/nodes/:id/kyb", async (request, reply) => {
  try {
    const user = await requireAdminUser(request.headers.authorization);
    const params = updateKybParamsSchema.safeParse(request.params);

    if (!params.success) {
      return reply.code(400).send({
        error: "Invalid node id."
      });
    }

    const body = updateKybBodySchema.safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({
        error: "Invalid KYB status payload.",
        issues: body.error.issues
      });
    }

    const node = await updateKybStatus(
      {
        id: params.data.id,
        kybStatus: body.data.kybStatus
      },
      user.id
    );

    if (!node) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Supply chain node not found."
      });
    }

    return reply.send({ node });
  } catch (error) {
    if (error instanceof TRPCError) {
      return reply.code(getHttpStatusFromTrpcError(error)).send({
        error: error.message
      });
    }

    request.log.error(error);
    captureException(error);

    return reply.code(500).send({
      error: "Internal server error."
    });
  }
});

server.post("/admin/nodes/:id/kyb/verify", async (request, reply) => {
  try {
    const user = await requireAdminUser(request.headers.authorization);
    const params = verifyKybParamsSchema.safeParse(request.params);

    if (!params.success) {
      return reply.code(400).send({
        error: "Invalid node id."
      });
    }

    const result = await verifyKybTaxCode(
      {
        nodeId: params.data.id
      },
      user.id
    );

    return reply.send(result);
  } catch (error) {
    if (error instanceof TRPCError) {
      return reply.code(getHttpStatusFromTrpcError(error)).send({
        error: error.message
      });
    }

    request.log.error(error);
    captureException(error);

    return reply.code(500).send({
      error: "Internal server error."
    });
  }
});

await server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    createContext,
    onError({ error }: { error: TRPCError }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        captureException(error);
      }
    },
    router: appRouter
  }
});

Sentry.setupFastifyErrorHandler(server, {
  shouldHandleError: (_error, _request, reply) => reply.statusCode >= 500
});

if (process.env.ENABLE_BLOCKCHAIN_WORKER === "true") {
  startBlockchainWorker();
}

const port = Number.parseInt(process.env.PORT ?? "3001", 10);

await server.listen({
  host: "0.0.0.0",
  port
});
