import "dotenv/config";

import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import Fastify from "fastify";

import { createContext } from "./context";
import { startBlockchainWorker } from "./queues/blockchain.worker";
import { appRouter } from "./router";

const server = Fastify({
  logger: true
});

await server.register(cors, {
  origin: true
});

server.get("/health", async () => ({
  ok: true,
  service: "vierify-api"
}));

await server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    createContext,
    router: appRouter
  }
});

if (process.env.ENABLE_BLOCKCHAIN_WORKER === "true") {
  startBlockchainWorker();
}

const port = Number.parseInt(process.env.PORT ?? "3001", 10);

await server.listen({
  host: "0.0.0.0",
  port
});
