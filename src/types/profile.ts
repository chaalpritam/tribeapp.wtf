import type { City } from "./city";
import type { UserKarma } from "./user";

export interface UserStats {
  tweets: number;
  events: number;
  tasks: number;
  polls: number;
  tipsReceived: number;
  tipsGiven: number;
}

export interface UserProfile {
  name: string;
  username: string;
  bio: string;
  avatar: string;
  coverImage: string;
  location: string;
  city: City;
  joinedDate: string;
  stats: UserStats;
  badges: string[];
  karma: UserKarma;
  isVerified: boolean;
}

export type ActivityType = "tweet" | "event" | "task";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  time: string;
  likes?: number;
  comments?: number;
  attendees?: number;
  status?: string;
  tips?: number;
}

export type NotificationType = "like" | "comment" | "follow" | "event" | "channel";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  user: { id: string; displayName: string; avatarUrl: string };
  message: string;
  time: string;
  isRead: boolean;
}
