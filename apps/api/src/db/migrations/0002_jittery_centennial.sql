ALTER TABLE "supply_chain_node" ADD COLUMN "org_id" uuid;--> statement-breakpoint
UPDATE "supply_chain_node" SET "org_id" = '00000000-0000-0000-0000-000000000001' WHERE "org_id" IS NULL;--> statement-breakpoint
ALTER TABLE "supply_chain_node" ALTER COLUMN "org_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "supply_chain_node_org_id_idx" ON "supply_chain_node" USING btree ("org_id");
