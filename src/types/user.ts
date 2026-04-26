export type KarmaLevel = "newcomer" | "neighbor" | "local" | "trusted" | "pillar" | "legend";

export interface KarmaBreakdown {
  postsKarma: number;
  helpfulKarma: number;
  eventsKarma: number;
  communityKarma: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  isEarned: boolean;
}

export interface UserKarma {
  totalKarma: number;
  level: KarmaLevel;
  breakdown: KarmaBreakdown;
  cityKarma: Record<string, number>;
  achievements: Achievement[];
}

export type TransactionType = "tipReceived" | "tipSent" | "deposit" | "withdrawal";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  fromUserId?: string;
  toUserId?: string;
  description: string;
  timestamp: string;
}

export interface Wallet {
  balance: number;
  currency: string;
  currencySymbol: string;
  transactions: Transaction[];
  connectedWalletAddress?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  location?: string;
  cityId: string;
  isVerified: boolean;
  karma?: UserKarma;
  wallet?: Wallet;
  bio?: string;
  joinedDate?: string;
  farcasterFid?: number;
}
