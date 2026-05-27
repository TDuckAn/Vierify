import { Contract, JsonRpcProvider, Wallet } from "ethers";

const TRACEABILITY_REGISTRY_ABI = [
  "function writeHash(string batchId, bytes32 batchHash) external"
] as const;

type BlockchainEnv = {
  contractAddress: string;
  polygonAmoyRpc: string;
  walletPrivateKey: string;
};

export function getBlockchainEnv(): BlockchainEnv {
  const polygonAmoyRpc = process.env.POLYGON_AMOY_RPC;
  const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!polygonAmoyRpc || !walletPrivateKey || !contractAddress) {
    throw new Error("Blockchain environment variables are not configured.");
  }

  return {
    contractAddress,
    polygonAmoyRpc,
    walletPrivateKey
  };
}

export function getTraceabilityRegistryContract(): Contract {
  const { contractAddress, polygonAmoyRpc, walletPrivateKey } = getBlockchainEnv();
  const provider = new JsonRpcProvider(polygonAmoyRpc);
  const wallet = new Wallet(walletPrivateKey, provider);

  return new Contract(contractAddress, TRACEABILITY_REGISTRY_ABI, wallet);
}
