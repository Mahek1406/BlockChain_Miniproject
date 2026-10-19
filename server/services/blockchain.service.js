import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const artifactPath = path.resolve(currentDir, "../../blockchain/artifacts/contracts/InsuranceClaim.sol/InsuranceClaim.json");

function getContract() {
  const { BLOCKCHAIN_RPC_URL: rpcUrl, BLOCKCHAIN_PRIVATE_KEY: privateKey, CONTRACT_ADDRESS: address } = process.env;
  if (!rpcUrl || !privateKey || !address || privateKey.startsWith("YOUR_") || privateKey.startsWith("replace-with") || address.startsWith("YOUR_")) {
    const error = new Error("Blockchain is not configured. Start Hardhat, deploy the contract, and set BLOCKCHAIN_PRIVATE_KEY and CONTRACT_ADDRESS in server/.env.");
    error.statusCode = 503;
    throw error;
  }
  if (!fs.existsSync(artifactPath)) throw new Error("Contract artifact not found; compile the blockchain workspace first");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  return new ethers.Contract(address, artifact.abi, new ethers.Wallet(privateKey, new ethers.JsonRpcProvider(rpcUrl)));
}

export function hashClaimData(data) {
  return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data)));
}

export async function recordClaimOnChain(claim) {
  try {
    const transaction = await getContract().createClaim(claim.claimId, claim.policyId, claim.claimDataHash, claim.userId.toString(), BigInt(Math.round(claim.amount)));
    const receipt = await transaction.wait();
    return { transactionHash: transaction.hash, blockNumber: receipt.blockNumber };
  } catch (error) {
    if (error.statusCode) throw error;
    const unavailable = new Error("Blockchain is unavailable. Start the local Hardhat node and ensure the deployed contract address and private key are correct.");
    unavailable.statusCode = 503;
    unavailable.cause = error;
    throw unavailable;
  }
}

export async function updateClaimOnChain(claimId, status, action) {
  const statusValue = { UNDER_REVIEW: 1, APPROVED: 2, REJECTED: 3 }[status];
  if (statusValue === undefined) throw new Error("Unsupported blockchain claim status");
  const contract = getContract();
  try {
    await contract.getClaim(claimId);
  } catch (error) {
    const missing = new Error(
      `Claim ${claimId} is not present in the currently deployed contract. Restarting Hardhat clears on-chain claims; redeploy the contract and submit this claim again.`
    );
    missing.statusCode = 409;
    missing.cause = error;
    throw missing;
  }
  const transaction = await contract.updateClaimStatus(claimId, statusValue, action);
  const receipt = await transaction.wait();
  return { transactionHash: transaction.hash, blockNumber: receipt.blockNumber };
}

export async function verifyClaimOnChain(claimId, claimDataHash) {
  const contract = getContract();
  const [verified, claim] = await Promise.all([
    contract.verifyClaimHash(claimId, claimDataHash),
    contract.getClaim(claimId)
  ]);
  return {
    verified,
    blockchainHash: claim.claimDataHash,
    blockchainStatus: Number(claim.status),
    blockchainUpdatedAt: Number(claim.updatedAt)
  };
}

export async function getTransactionDetails(transactionHash) {
  if (!process.env.BLOCKCHAIN_RPC_URL) {
    const error = new Error("Blockchain RPC URL is not configured");
    error.statusCode = 503;
    throw error;
  }
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const transaction = await provider.getTransaction(transactionHash);
  const receipt = await provider.getTransactionReceipt(transactionHash);
  if (!transaction || !receipt) throw new Error("Blockchain transaction not found");
  const block = await provider.getBlock(receipt.blockNumber);
  return { transactionHash, blockNumber: receipt.blockNumber, timestamp: block ? new Date(Number(block.timestamp) * 1000) : null, status: receipt.status === 1 ? "SUCCESS" : "FAILED" };
}
