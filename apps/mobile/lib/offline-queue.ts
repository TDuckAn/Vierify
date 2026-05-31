import * as SQLite from "expo-sqlite";

import { trpc } from "./trpc";

const DATABASE_NAME = "vierify-offline.db";
const FLUSH_LIMIT = 25;

let dbPromise: Promise<SQLite.SQLiteDatabase> | undefined;
let isFlushing = false;

export type OfflineBatchCreateInput = {
  docHash?: string;
  expiresAt?: Date;
  gpsLat?: number;
  gpsLng?: number;
  gs1TraceId: string;
  name: string;
  nodeId: string;
  pinHash?: string;
  quantity: number;
  uom: string;
};

export type QueuedBatchCreate = {
  attempts: number;
  createdAt: string;
  id: string;
  lastError?: string;
  payload: OfflineBatchCreateInput;
};

type QueuedBatchCreateRow = {
  attempts: number;
  created_at: string;
  id: string;
  last_error: string | null;
  payload_json: string;
};

type FlushResult = {
  failed: number;
  remaining: number;
  synced: number;
};

function createLocalId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `batch-${Date.now()}-${random}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown sync error.";
}

function isLikelyNetworkError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();

  return [
    "failed to fetch",
    "fetch failed",
    "network request failed",
    "networkerror",
    "timed out",
    "timeout",
    "unable to resolve host"
  ].some((fragment) => message.includes(fragment));
}

function isLikelyDuplicateGs1Error(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();

  return (
    message.includes("duplicate") ||
    message.includes("unique") ||
    message.includes("trace_batch_gs1_trace_id")
  );
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS offline_batch_creates (
        id TEXT PRIMARY KEY NOT NULL,
        payload_json TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS offline_batch_creates_created_at_idx
        ON offline_batch_creates(created_at);
    `);

    return db;
  });

  return dbPromise;
}

function mapQueuedRow(row: QueuedBatchCreateRow): QueuedBatchCreate {
  return {
    attempts: row.attempts,
    createdAt: row.created_at,
    id: row.id,
    lastError: row.last_error ?? undefined,
    payload: JSON.parse(row.payload_json) as OfflineBatchCreateInput
  };
}

export async function enqueueBatchCreate(
  payload: OfflineBatchCreateInput
): Promise<QueuedBatchCreate> {
  const db = await getDb();
  const id = createLocalId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO offline_batch_creates
      (id, payload_json, attempts, created_at, updated_at)
     VALUES (?, ?, 0, ?, ?)`,
    id,
    JSON.stringify(payload),
    now,
    now
  );

  return {
    attempts: 0,
    createdAt: now,
    id,
    payload
  };
}

export async function listQueuedBatchCreates(): Promise<QueuedBatchCreate[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<QueuedBatchCreateRow>(
    `SELECT id, payload_json, attempts, last_error, created_at
     FROM offline_batch_creates
     ORDER BY created_at ASC`
  );

  return rows.map(mapQueuedRow);
}

export async function countQueuedBatchCreates(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM offline_batch_creates`
  );

  return row?.count ?? 0;
}

async function markQueued(row: QueuedBatchCreateRow, error: unknown): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    `UPDATE offline_batch_creates
     SET attempts = attempts + 1,
         last_error = ?,
         updated_at = ?
     WHERE id = ?`,
    errorMessage(error),
    new Date().toISOString(),
    row.id
  );
}

async function removeQueuedBatch(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM offline_batch_creates WHERE id = ?", id);
}

async function canTreatDuplicateAsSynced(payload: OfflineBatchCreateInput): Promise<boolean> {
  try {
    await trpc.batches.getByTraceId.query({ gs1TraceId: payload.gs1TraceId });
    return true;
  } catch {
    return false;
  }
}

export async function flushBatchCreateQueue(): Promise<FlushResult> {
  if (isFlushing) {
    return {
      failed: 0,
      remaining: await countQueuedBatchCreates(),
      synced: 0
    };
  }

  isFlushing = true;

  try {
    const db = await getDb();
    const rows = await db.getAllAsync<QueuedBatchCreateRow>(
      `SELECT id, payload_json, attempts, last_error, created_at
       FROM offline_batch_creates
       ORDER BY created_at ASC
       LIMIT ?`,
      FLUSH_LIMIT
    );

    let failed = 0;
    let synced = 0;

    for (const row of rows) {
      const payload = JSON.parse(row.payload_json) as OfflineBatchCreateInput;

      try {
        await trpc.batches.create.mutate(payload);
        await removeQueuedBatch(row.id);
        synced += 1;
      } catch (error) {
        if (
          isLikelyDuplicateGs1Error(error) &&
          (await canTreatDuplicateAsSynced(payload))
        ) {
          await removeQueuedBatch(row.id);
          synced += 1;
          continue;
        }

        await markQueued(row, error);
        failed += 1;

        if (isLikelyNetworkError(error)) {
          break;
        }
      }
    }

    return {
      failed,
      remaining: await countQueuedBatchCreates(),
      synced
    };
  } finally {
    isFlushing = false;
  }
}

export function shouldQueueBatchCreate(error: unknown): boolean {
  return isLikelyNetworkError(error);
}
