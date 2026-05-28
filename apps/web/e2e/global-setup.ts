import { createClient } from "@supabase/supabase-js";
import ws from "ws";

// Fixed GS1 trace ID used by qr-timeline.spec.ts confirmed-state tests.
// globalSetup upserts this batch; globalTeardown deletes it.
// Must match the DB check: ^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$
export const TEST_GS1_TRACE_ID = "011234567890123410E2ETEST01";
export const TEST_TX_HASH =
  "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
// Matches the sentinel used by Vitest tests so any helper that filters by org
// still includes the Playwright fixture node/batch.
const TEST_ORG_ID = "00000000-0000-0000-0000-000000000001";

export default async function globalSetup(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    console.log(
      "\n⚠️  Playwright: SUPABASE_SERVICE_KEY not set — skipping test data seed.\n" +
        "   Trace 'confirmed' tests will be skipped in this run.\n"
    );
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
    realtime: { transport: ws as unknown as typeof WebSocket }
  });

  // Clean up any leftover fixture from a previous interrupted run.
  await supabase
    .from("trace_batch")
    .delete()
    .eq("gs1_trace_id", TEST_GS1_TRACE_ID);

  // Find or create the test supply-chain node. We avoid upsert({onConflict:"name"})
  // because supply_chain_node.name has no unique constraint (42P10).
  const { data: existingNode } = await supabase
    .from("supply_chain_node")
    .select("id")
    .eq("name", "Playwright Test Farm")
    .maybeSingle();

  let nodeId: string;
  if (existingNode) {
    nodeId = existingNode.id;
  } else {
    const { data: newNode, error: nodeErr } = await supabase
      .from("supply_chain_node")
      .insert({
        name: "Playwright Test Farm",
        is_individual: false,
        node_type: "farm",
        kyb_status: "approved",
        org_id: TEST_ORG_ID
      })
      .select("id")
      .single();

    if (nodeErr) {
      console.error("Playwright global-setup: failed to insert test node", nodeErr);
      return;
    }
    nodeId = newNode.id;
  }

  // Insert the confirmed test batch.
  const { error: batchErr } = await supabase.from("trace_batch").insert({
    gs1_trace_id: TEST_GS1_TRACE_ID,
    name: "Cà phê Arabica — Playwright Batch",
    quantity: "250",
    uom: "kg",
    bc_status: 1,
    tx_hash: TEST_TX_HASH,
    node_id: nodeId,
    scan_count: 3
  });

  if (batchErr) {
    console.error("Playwright global-setup: failed to insert test batch", batchErr);
    return;
  }

  console.log(`✓ Playwright: seeded test batch gs1_trace_id=${TEST_GS1_TRACE_ID}`);
}
