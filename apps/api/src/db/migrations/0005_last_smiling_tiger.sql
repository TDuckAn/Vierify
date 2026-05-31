CREATE TABLE "loss_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"product_type" text NOT NULL,
	"process_step" text NOT NULL,
	"min_loss_pct" numeric(5, 2) NOT NULL,
	"max_loss_pct" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loss_profile" ADD CONSTRAINT "loss_profile_org_id_supply_chain_node_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."supply_chain_node"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "loss_profile_org_product_step_unique_idx" ON "loss_profile" USING btree ("org_id","product_type","process_step");