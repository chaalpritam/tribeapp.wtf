import type { User } from "./user";

export interface Comment {
  id: string;
  user: User;
  text: string;
}

export interface Tweet {
  id: string;
  user: User;
  imageUrl?: string;
  likes: number;
  caption: string;
  comments: Comment[];
  timestamp: string;
  isLiked: boolean;
  isSaved: boolean;
  tipCount: number;
  totalTips: number;
  cityId: string;
  tribeId?: string;
  embeds?: { url: string }[];
  imageWidth?: number;
  imageHeight?: number;
  channel?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  user: User;
  question: string;
  options: PollOption[];
  duration: number;
  timestamp: string;
  imageUrl?: string;
  votes: Record<string, number>;
  userVote?: string;
  /**
   * On-chain Poll PDA (base58) when this poll is anchored in
   * poll-registry. When set, vote actions settle on chain via
   * voteOnchain; absent → off-chain envelope vote.
   */
  onchainPollPda?: string;
}

export interface Task {
  id: string;
  user: User;
  title: string;
  description: string;
  icon: string;
  imageUrl?: string;
  location: string;
  helpers: number;
  timeAgo: string;
  reward?: string;
  isUrgent: boolean;
  /**
   * On-chain Task PDA (base58) when this task is anchored in
   * task-registry. When set, claim actions lock the on-chain task
   * to the signer (and release any escrowed reward on completion);
   * absent → off-chain envelope claim (social signal only).
   */
  onchainTaskPda?: string;
  /** Reward amount in lamports — populated when onchainTaskPda is set. */
  onchainRewardLamports?: string;
}

export interface Crowdfund {
  id: string;
  user: User;
  title: string;
  description: string;
  icon: string;
  imageUrl?: string;
  location: string;
  goal: number;
  raised: number;
  contributors: number;
  timeAgo: string;
  /**
   * On-chain Crowdfund PDA (base58) when this campaign is anchored
   * in crowdfund-registry. When set, pledge actions transfer real
   * SOL into the on-chain vault; absent → off-chain envelope pledge
   * (social signal only).
   */
  onchainCrowdfundPda?: string;
  /**
   * Default pledge amount in SOL when the on-chain path is taken.
   * Off-chain envelope path uses the original USD-denominated default.
   */
  onchainPledgeAmountSol?: number;
}
