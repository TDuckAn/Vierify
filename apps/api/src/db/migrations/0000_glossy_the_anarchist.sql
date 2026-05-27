CREATE TYPE "public"."kyb_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" varchar(128) NOT NULL,
	"resource_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_genealogy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_batch_id" uuid NOT NULL,
	"child_batch_id" uuid NOT NULL,
	"mapping_date" timestamp with time zone DEFAULT now() NOT NULL,
	"verifier_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_genealogy_parent_child_check" CHECK ("batch_genealogy"."parent_batch_id" <> "batch_genealogy"."child_batch_id")
);
--> statement-breakpoint
CREATE TABLE "supply_chain_node" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_individual" boolean DEFAULT false NOT NULL,
	"tax_code" varchar(64),
	"node_type" varchar(64) NOT NULL,
	"kyb_status" "kyb_status" DEFAULT 'pending' NOT NULL,
	"node_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trace_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gs1_trace_id" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric(18, 6) NOT NULL,
	"uom" varchar(32) NOT NULL,
	"gps_lat" numeric(9, 6),
	"gps_lng" numeric(9, 6),
	"pin_hash" text,
	"scan_count" integer DEFAULT 0 NOT NULL,
	"node_id" uuid NOT NULL,
	"doc_hash" text,
	"bc_status" smallint DEFAULT 0 NOT NULL,
	"tx_hash" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trace_batch_bc_status_check" CHECK ("trace_batch"."bc_status" in (0, 1)),
	CONSTRAINT "trace_batch_gs1_trace_id_check" CHECK ("trace_batch"."gs1_trace_id" ~ '^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$'),
	CONSTRAINT "trace_batch_quantity_check" CHECK ("trace_batch"."quantity" > 0),
	CONSTRAINT "trace_batch_scan_count_check" CHECK ("trace_batch"."scan_count" >= 0),
	CONSTRAINT "trace_batch_version_check" CHECK ("trace_batch"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "batch_genealogy" ADD CONSTRAINT "batch_genealogy_parent_batch_id_trace_batch_id_fk" FOREIGN KEY ("parent_batch_id") REFERENCES "public"."trace_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_genealogy" ADD CONSTRAINT "batch_genealogy_child_batch_id_trace_batch_id_fk" FOREIGN KEY ("child_batch_id") REFERENCES "public"."trace_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trace_batch" ADD CONSTRAINT "trace_batch_node_id_supply_chain_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."supply_chain_node"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_resource_id_idx" ON "audit_log" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "batch_genealogy_child_batch_id_idx" ON "batch_genealogy" USING btree ("child_batch_id");--> statement-breakpoint
CREATE INDEX "batch_genealogy_parent_batch_id_idx" ON "batch_genealogy" USING btree ("parent_batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "batch_genealogy_parent_child_unique_idx" ON "batch_genealogy" USING btree ("parent_batch_id","child_batch_id");--> statement-breakpoint
CREATE INDEX "supply_chain_node_kyb_status_idx" ON "supply_chain_node" USING btree ("kyb_status");--> statement-breakpoint
CREATE UNIQUE INDEX "supply_chain_node_tax_code_unique_idx" ON "supply_chain_node" USING btree ("tax_code") WHERE "supply_chain_node"."tax_code" is not null;--> statement-breakpoint
CREATE INDEX "trace_batch_bc_status_idx" ON "trace_batch" USING btree ("bc_status");--> statement-breakpoint
CREATE UNIQUE INDEX "trace_batch_gs1_trace_id_unique_idx" ON "trace_batch" USING btree ("gs1_trace_id");--> statement-breakpoint
CREATE INDEX "trace_batch_node_id_idx" ON "trace_batch" USING btree ("node_id");