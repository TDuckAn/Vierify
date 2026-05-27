export const POLYGON_AMOY_CHAIN_ID = 80002 as const;
export const TRACEABILITY_REGISTRY_CONTRACT_NAME = "TraceabilityRegistry";

export const TRACEABILITY_REGISTRY_ABI = [
  "event BatchHashWritten(string indexed batchId, bytes32 indexed batchHash, address indexed writer)",
  "function batchHashes(string batchId) view returns (bytes32)",
  "function owner() view returns (address)",
  "function writeHash(string batchId, bytes32 batchHash) external"
] as const;

export type BlockchainStatus = 0 | 1;

export function isConfirmedStatus(status: BlockchainStatus): boolean {
  return status === 1;
}
