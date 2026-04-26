import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

// Use public node for ENS resolution
export const mainnetClient = createPublicClient({
    chain: mainnet,
    transport: http(),
});
