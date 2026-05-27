import { Queue } from "bullmq";
import type { RedisOptions } from "ioredis";

export const BLOCKCHAIN_QUEUE_NAME = "blockchain";
export const BLOCKCHAIN_DEAD_LETTER_QUEUE_NAME = "blockchain-dead-letter";
export const HASH_BATCH_JOB = "hash-batch" as const;

export type HashBatchJob = {
  batchId: string;
};

let blockchainQueue: Queue<HashBatchJob> | undefined;

export function getRedisConnection(): RedisOptions {
  const redisUrl = process.env.UPSTASH_REDIS_URL;

  if (!redisUrl) {
    throw new Error("UPSTASH_REDIS_URL must be configured with a rediss:// Redis URL.");
  }

  const url = new URL(redisUrl);

  if (url.protocol !== "redis:" && url.protocol !== "rediss:") {
    throw new Error("UPSTASH_REDIS_URL must use redis:// or rediss://.");
  }

  return {
    host: url.hostname,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    port: Number.parseInt(url.port || "6379", 10),
    tls: url.protocol === "rediss:" ? {} : undefined,
    username: url.username ? decodeURIComponent(url.username) : undefined
  };
}

export function getBlockchainQueue(): Queue<HashBatchJob> {
  blockchainQueue ??= new Queue<HashBatchJob>(BLOCKCHAIN_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        delay: 2000,
        type: "exponential"
      },
      removeOnComplete: true
    }
  });

  return blockchainQueue;
}

export async function enqueueHashBatchJob(job: HashBatchJob): Promise<void> {
  await getBlockchainQueue().add(HASH_BATCH_JOB, job);
}
