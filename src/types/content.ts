import type { User } from "./user";

export interface Comment {
  id: string;
  user: User;
  text: string;
}

export interface Cast {
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
}
