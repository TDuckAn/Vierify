import { createServerSupabaseClient } from "../../../lib/supabase";

export type TraceNode = {
  is_individual?: boolean;
  name?: string | null;
  node_address?: string | null;
  node_type?: string | null;
  [key: string]: unknown;
};

export type TraceBatchPayload = {
  bc_status?: number | null;
  created_at?: string | null;
  gs1_trace_id?: string | null;
  id?: string | null;
  name?: string | null;
  quantity?: number | string | null;
  scan_count?: number | null;
  supply_chain_node?: TraceNode | TraceNode[] | null;
  tx_hash?: string | null;
  uom?: string | null;
  [key: string]: unknown;
};

export type ParentBatchEntry = {
  bc_status?: number | null;
  created_at?: string | null;
  gs1_trace_id?: string | null;
  id: string;
  name?: string | null;
  supply_chain_node?: TraceNode | TraceNode[] | null;
  tx_hash?: string | null;
};

export type TraceTimelineResult =
  | {
      data: TraceBatchPayload;
      id: string;
      ok: true;
      parents: ParentBatchEntry[];
    }
  | {
      error: string;
      id: string;
      ok: false;
    };

function anonymiseNode(node: TraceNode): TraceNode {
  if (!node.is_individual) {
    return node;
  }

  // Mask all personal identifiers for individual suppliers (Decree 13/2023/NĐ-CP)
  return {
    ...node,
    name: "***",
    node_address: "***",
    tax_code: null
  };
}

function anonymiseTracePayload(payload: TraceBatchPayload): TraceBatchPayload {
  const node = payload.supply_chain_node;

  if (Array.isArray(node)) {
    return {
      ...payload,
      supply_chain_node: node.map(anonymiseNode)
    };
  }

  if (node) {
    return {
      ...payload,
      supply_chain_node: anonymiseNode(node)
    };
  }

  return payload;
}

export async function getTraceTimeline(id: string): Promise<TraceTimelineResult> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("trace_batch")
      .select("*, supply_chain_node(*)")
      .eq("gs1_trace_id", id)
      .maybeSingle();

    if (error) {
      return { error: error.message, id, ok: false };
    }

    if (!data) {
      return { error: "Không tìm thấy lô hàng với mã GS1 này.", id, ok: false };
    }

    const batch = data as TraceBatchPayload & { id: string };

    // Fetch parent batch IDs from genealogy table
    const { data: genealogyRows } = await supabase
      .from("batch_genealogy")
      .select("parent_batch_id")
      .eq("child_batch_id", batch.id);

    let parents: ParentBatchEntry[] = [];

    if (genealogyRows && genealogyRows.length > 0) {
      const parentIds = genealogyRows.map((r) => r.parent_batch_id as string);
      const { data: parentRows } = await supabase
        .from("trace_batch")
        .select("id, name, gs1_trace_id, bc_status, tx_hash, created_at, supply_chain_node(*)")
        .in("id", parentIds)
        .order("created_at", { ascending: true });

      if (parentRows) {
        parents = (parentRows as ParentBatchEntry[]).map((p) => {
          const node = p.supply_chain_node;
          if (Array.isArray(node)) {
            return { ...p, supply_chain_node: node.map(anonymiseNode) };
          }
          if (node) {
            return { ...p, supply_chain_node: anonymiseNode(node as TraceNode) };
          }
          return p;
        });
      }
    }

    return {
      data: anonymiseTracePayload(batch),
      id,
      ok: true,
      parents
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown trace fetch error.";
    return { error: message, id, ok: false };
  }
}
