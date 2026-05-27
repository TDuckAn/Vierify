import { eq } from "drizzle-orm";
import { Queue, Worker, type Job } from "bullmq";

import { getDb } from "../db/client";
import { traceBatch } from "../db/schema";
import { getTraceabilityRegistryContract } from "../lib/blockchain";
import {
  BLOCKCHAIN_DEAD_LETTER_QUEUE_NAME,
  BLOCKCHAIN_QUEUE_NAME,
  HASH_BATCH_JOB,
  type HashBatchJob,
  getRedisConnection
} from "./blockchain.queue";
import { hashBatch } from "./hash-batch";

type HashBatchDeadLetterJob = HashBatchJob & {
  failedAt: string;
  failedReason: string;
  originalJobId?: string;
};

let worker: Worker<HashBatchJob> | undefined;
let deadLetterQueue: Queue<HashBatchDeadLetterJob> | undefined;

async function processHashBatchJob(job: Job<HashBatchJob>): Promise<void> {
  const db = getDb();
  const [batch] = await db
    .select()
    .from(traceBatch)
    .where(eq(traceBatch.id, job.data.batchId));

  if (!batch) {
    throw new Error(`Trace batch ${job.data.batchId} was not found.`);
  }

  const batchHash = hashBatch(batch);
  const contract = getTraceabilityRegistryContract();
  const tx = await contract.writeHash(batch.id, batchHash);
  const receipt = await tx.wait();
  const txHash = typeof receipt?.hash === "string" ? receipt.hash : tx.hash;

  await db
    .update(traceBatch)
    .set({
      bcStatus: 1,
      txHash,
      updatedAt: new Date()
    })
    .where(eq(traceBatch.id, batch.id));
}

async function moveToDeadLetter(job: Job<HashBatchJob>, error: Error): Promise<void> {
  deadLetterQueue ??= new Queue<HashBatchDeadLetterJob>(BLOCKCHAIN_DEAD_LETTER_QUEUE_NAME, {
    connection: getRedisConnection()
  });

  await deadLetterQueue.add(`${HASH_BATCH_JOB}-failed`, {
    ...job.data,
    failedAt: new Date().toISOString(),
    failedReason: error.message,
    originalJobId: job.id
  }, {
    attempts: 1,
    removeOnComplete: false,
    removeOnFail: false,
    stackTraceLimit: 20
  });

  job.log(`Moved to dead-letter queue: ${error.message}`);
}

export function startBlockchainWorker(): Worker<HashBatchJob> {
  worker ??= new Worker<HashBatchJob>(
    BLOCKCHAIN_QUEUE_NAME,
    async (job) => {
      if (job.name !== HASH_BATCH_JOB) {
        throw new Error(`Unsupported blockchain job: ${job.name}`);
      }

      await processHashBatchJob(job);
    },
    {
      connection: getRedisConnection(),
      concurrency: 2
    }
  );

  worker.on("failed", (job, error) => {
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) {
      return;
    }

    void moveToDeadLetter(job, error);
  });

  return worker;
}
