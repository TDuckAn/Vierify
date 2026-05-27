import { createClient } from "@supabase/supabase-js";
import ws from "ws";

import { TEST_GS1_TRACE_ID } from "./global-setup";

export default async function globalTeardown(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) return;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
    realtime: { transport: ws as unknown as typeof WebSocket }
  });

  await supabase
    .from("trace_batch")
    .delete()
    .eq("gs1_trace_id", TEST_GS1_TRACE_ID);

  console.log(`✓ Playwright: removed test batch gs1_trace_id=${TEST_GS1_TRACE_ID}`);
}
