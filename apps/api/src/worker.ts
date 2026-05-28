import "dotenv/config";
import "./sentry";

import { startBlockchainWorker } from "./queues/blockchain.worker";
import { captureException } from "./sentry";

const worker = startBlockchainWorker();

worker.on("ready", () => {
  console.log("Blockchain worker ready.");
});

worker.on("error", (error) => {
  console.error("Blockchain worker error.", error);
  captureException(error);
});
