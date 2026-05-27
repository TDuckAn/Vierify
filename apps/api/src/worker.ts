import "dotenv/config";

import { startBlockchainWorker } from "./queues/blockchain.worker";

const worker = startBlockchainWorker();

worker.on("ready", () => {
  console.log("Blockchain worker ready.");
});

worker.on("error", (error) => {
  console.error("Blockchain worker error.", error);
});
