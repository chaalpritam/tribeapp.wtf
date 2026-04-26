import type { Coordinates } from "./city";
import type { User } from "./user";
import type { Tribe } from "./tribe";

export interface NearbyUser {
  id: string;
  user: User;
  distance: number;
  sharedTribes: string[];
  isOnline: boolean;
}

export interface MapEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  coordinates: Coordinates;
  startTime: string;
  attendees: number;
  imageUrl?: string;
  tribe?: Tribe;
}
