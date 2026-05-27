ALTER TABLE "public"."trace_batch" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."supply_chain_node" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO "anon";--> statement-breakpoint
GRANT SELECT ON TABLE "public"."trace_batch" TO "anon";--> statement-breakpoint
GRANT SELECT ON TABLE "public"."supply_chain_node" TO "anon";--> statement-breakpoint
DROP POLICY IF EXISTS "anon_select_trace_batch" ON "public"."trace_batch";--> statement-breakpoint
CREATE POLICY "anon_select_trace_batch"
ON "public"."trace_batch"
FOR SELECT
TO "anon"
USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "anon_select_supply_chain_node" ON "public"."supply_chain_node";--> statement-breakpoint
CREATE POLICY "anon_select_supply_chain_node"
ON "public"."supply_chain_node"
FOR SELECT
TO "anon"
USING (true);
