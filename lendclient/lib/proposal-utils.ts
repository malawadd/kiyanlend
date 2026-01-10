import { createPublicClient, http, decodeEventLog } from 'viem';
import { sepolia } from 'viem/chains';
import { CONTRACT_ADDRESS } from './blockchain-utils';
import contractABI from './abi.json';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

export interface ProposalData {
  id: bigint;
  entrepreneur: string;
  capitalAmount: bigint;
  nillionDataId: string;
}

export interface ProposalState {
  id: bigint;
  entrepreneur: string;
  investor: string;
  capitalAmount: bigint;
  state: number;
  nillionDataId: string;
}

// Define the expected event args structure
interface ProposalCreatedArgs {
  id: bigint;
  entrepreneur: string;
  capitalAmount: bigint;
  nillionDataId: string;
}

export async function getProposalFromTx(txHash: string): Promise<ProposalData | null> {
  try {
    // Get transaction receipt to find the logs
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
    
    // Find ProposalCreated event in logs
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: contractABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === 'ProposalCreated') {
          const args = decoded.args as unknown as ProposalCreatedArgs;
          return {
            id: args.id,
            entrepreneur: args.entrepreneur,
            capitalAmount: args.capitalAmount,
            nillionDataId: args.nillionDataId,
          };
        }
      } catch {
        // Skip logs that don't match our event
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching proposal from transaction:', error);
    return null;
  }
}

export async function getProposalById(proposalId: bigint): Promise<ProposalState | null> {
  try {
    const proposal = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'proposals',
      args: [proposalId],
    }) as [bigint, string, string, bigint, number, string];

    return {
      id: proposal[0],
      entrepreneur: proposal[1],
      investor: proposal[2],
      capitalAmount: proposal[3],
      state: proposal[4],
      nillionDataId: proposal[5],
    };
  } catch (error) {
    console.error('Error fetching proposal by ID:', error);
    return null;
  }
}