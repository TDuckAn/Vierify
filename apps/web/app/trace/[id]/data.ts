import { createServerSupabaseClient } from "../../../lib/supabase";

export type TraceNode = {
  is_individual?: boolean;
  name?: string | null;
  node_address?: string | null;
  [key: string]: unknown;
};

export type TraceBatchPayload = {
  bc_status?: number | null;
  created_at?: string | null;
  gs1_trace_id?: string | null;
  id?: string | null;
  name?: string | null;
  quantity?: number | string | null;
  supply_chain_node?: TraceNode | TraceNode[] | null;
  tx_hash?: string | null;
  uom?: string | null;
  [key: string]: unknown;
};

export type TraceTimelineResult =
  | {
      data: TraceBatchPayload;
      id: string;
      ok: true;
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

  return {
    ...node,
    name: "***",
    node_address: "***"
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
      .single();

    if (error) {
      return {
        error: error.message,
        id,
        ok: false
      };
    }

    return {
      data: anonymiseTracePayload(data as TraceBatchPayload),
      id,
      ok: true
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown trace fetch error.";

    return {
      error: message,
      id,
      ok: false
    };
  }
}
