import type { Coordinates } from "./city";

export type ExploreItemType = "event" | "poll" | "task" | "crowdfund" | "channel" | "news";

export interface ExploreItem {
  id: string;
  type: ExploreItemType;
  title: string;
  description: string;
  icon: string;
  color: string;
  participants: number;
  location: string;
  timeAgo: string;
  imageUrl?: string;
  isTrending: boolean;
  cityId: string;
  coordinates?: Coordinates;
}
