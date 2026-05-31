import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const kybStatusEnum = pgEnum("kyb_status", [
  "pending",
  "approved",
  "rejected",
  "suspended"
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "basic",
  "advanced",
  "professional",
  "enterprise"
]);

export const invoiceMethodEnum = pgEnum("invoice_method", ["payos", "momo"]);

export const invoiceStatusEnum = pgEnum("invoice_status", ["paid", "pending", "failed"]);

export const supplyChainNode = pgTable(
  "supply_chain_node",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").notNull(),
    name: text("name").notNull(),
    isIndividual: boolean("is_individual").default(false).notNull(),
    taxCode: varchar("tax_code", { length: 64 }),
    nodeType: varchar("node_type", { length: 64 }).notNull(),
    kybStatus: kybStatusEnum("kyb_status").default("pending").notNull(),
    nodeAddress: text("node_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    kybStatusIdx: index("supply_chain_node_kyb_status_idx").on(table.kybStatus),
    orgIdIdx: index("supply_chain_node_org_id_idx").on(table.orgId),
    taxCodeUniqueIdx: uniqueIndex("supply_chain_node_tax_code_unique_idx")
      .on(table.taxCode)
      .where(sql`${table.taxCode} is not null`)
  })
);

export const traceBatch = pgTable(
  "trace_batch",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gs1TraceId: varchar("gs1_trace_id", { length: 128 }).notNull(),
    name: text("name").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull(),
    uom: varchar("uom", { length: 32 }).notNull(),
    gpsLat: numeric("gps_lat", { precision: 9, scale: 6 }),
    gpsLng: numeric("gps_lng", { precision: 9, scale: 6 }),
    pinHash: text("pin_hash"),
    scanCount: integer("scan_count").default(0).notNull(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => supplyChainNode.id),
    docHash: text("doc_hash"),
    bcStatus: smallint("bc_status").default(0).notNull(),
    txHash: text("tx_hash"),
    version: integer("version").default(1).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    bcStatusCheck: check("trace_batch_bc_status_check", sql`${table.bcStatus} in (0, 1)`),
    bcStatusIdx: index("trace_batch_bc_status_idx").on(table.bcStatus),
    gs1TraceIdCheck: check(
      "trace_batch_gs1_trace_id_check",
      sql`${table.gs1TraceId} ~ '^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$'`
    ),
    gs1TraceIdUniqueIdx: uniqueIndex("trace_batch_gs1_trace_id_unique_idx").on(
      table.gs1TraceId
    ),
    nodeIdIdx: index("trace_batch_node_id_idx").on(table.nodeId),
    quantityCheck: check("trace_batch_quantity_check", sql`${table.quantity} > 0`),
    scanCountCheck: check("trace_batch_scan_count_check", sql`${table.scanCount} >= 0`),
    versionCheck: check("trace_batch_version_check", sql`${table.version} > 0`)
  })
);

export const batchGenealogy = pgTable(
  "batch_genealogy",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentBatchId: uuid("parent_batch_id")
      .notNull()
      .references(() => traceBatch.id),
    childBatchId: uuid("child_batch_id")
      .notNull()
      .references(() => traceBatch.id),
    mappingDate: timestamp("mapping_date", { withTimezone: true }).defaultNow().notNull(),
    verifierId: uuid("verifier_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    childBatchIdIdx: index("batch_genealogy_child_batch_id_idx").on(table.childBatchId),
    parentBatchIdIdx: index("batch_genealogy_parent_batch_id_idx").on(table.parentBatchId),
    parentChildCheck: check(
      "batch_genealogy_parent_child_check",
      sql`${table.parentBatchId} <> ${table.childBatchId}`
    ),
    parentChildUniqueIdx: uniqueIndex("batch_genealogy_parent_child_unique_idx").on(
      table.parentBatchId,
      table.childBatchId
    )
  })
);

export const subscription = pgTable(
  "subscription",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").notNull(),
    tier: subscriptionTierEnum("tier").default("free").notNull(),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    orgIdUniqueIdx: uniqueIndex("subscription_org_id_unique_idx").on(table.orgId),
    tierIdx: index("subscription_tier_idx").on(table.tier)
  })
);

export const invoice = pgTable(
  "invoice",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").notNull(),
    period: varchar("period", { length: 16 }).notNull(),
    amountVnd: integer("amount_vnd").notNull(),
    method: invoiceMethodEnum("method").notNull(),
    status: invoiceStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    amountVndCheck: check("invoice_amount_vnd_check", sql`${table.amountVnd} >= 0`),
    orgIdIdx: index("invoice_org_id_idx").on(table.orgId),
    orgIdPeriodIdx: index("invoice_org_id_period_idx").on(table.orgId, table.period),
    periodCheck: check("invoice_period_check", sql`${table.period} ~ '^[0-9]{4}-[0-9]{2}$'`)
  })
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").notNull(),
    action: varchar("action", { length: 128 }).notNull(),
    resourceId: uuid("resource_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    actorIdIdx: index("audit_log_actor_id_idx").on(table.actorId),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
    resourceIdIdx: index("audit_log_resource_id_idx").on(table.resourceId)
  })
);

export const supplyChainNodeRelations = relations(supplyChainNode, ({ many }) => ({
  batches: many(traceBatch)
}));

export const traceBatchRelations = relations(traceBatch, ({ many, one }) => ({
  childLinks: many(batchGenealogy, {
    relationName: "childBatch"
  }),
  node: one(supplyChainNode, {
    fields: [traceBatch.nodeId],
    references: [supplyChainNode.id]
  }),
  parentLinks: many(batchGenealogy, {
    relationName: "parentBatch"
  })
}));

export const batchGenealogyRelations = relations(batchGenealogy, ({ one }) => ({
  childBatch: one(traceBatch, {
    fields: [batchGenealogy.childBatchId],
    references: [traceBatch.id],
    relationName: "childBatch"
  }),
  parentBatch: one(traceBatch, {
    fields: [batchGenealogy.parentBatchId],
    references: [traceBatch.id],
    relationName: "parentBatch"
  })
}));

export const schema = {
  auditLog,
  batchGenealogy,
  batchGenealogyRelations,
  invoice,
  invoiceMethodEnum,
  invoiceStatusEnum,
  kybStatusEnum,
  subscription,
  subscriptionTierEnum,
  supplyChainNode,
  supplyChainNodeRelations,
  traceBatch,
  traceBatchRelations
};
