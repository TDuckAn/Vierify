import { createServerSupabaseClient } from "../../../lib/supabase";

type TraceNode = {
  is_individual?: boolean;
  name?: string | null;
  node_address?: string | null;
  [key: string]: unknown;
};

type TraceBatchPayload = {
  supply_chain_node?: TraceNode | TraceNode[] | null;
  [key: string]: unknown;
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

export async function getTraceTimeline(id: string) {
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
