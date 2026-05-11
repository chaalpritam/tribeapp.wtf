/**
 * Dummy content for events, polls, tasks and crowdfunds.
 * Shown when the hub returns no real data so the app looks populated.
 *
 * To remove all dummy data:
 *   1. Delete  src/lib/dummy-data.json
 *   2. Delete  src/lib/dummy-data.ts  (this file)
 *   3. Remove  useDummyFallback() calls from explore and home-feed
 */

import raw from "./dummy-data.json";
import type { ExploreItem, Poll, Task, Crowdfund } from "@/types";

export interface MapPlace {
  id: string; name: string; category: string; emoji: string;
  address: string; rating: number; reviewCount: number; openNow: boolean;
  cityId: string; lat: number; lng: number; tags: string[];
}
export interface MapPerson {
  id: string; displayName: string; username: string; bio: string;
  avatarColor: string; cityId: string; karma: number; mutual: number;
}
export interface MapReview {
  id: string; placeId: string; placeName: string;
  author: string; authorColor: string; rating: number;
  text: string; timeAgo: string; cityId: string;
}

const DUMMY_USER = {
  id: "dummy-user",
  username: "tribe",
  displayName: "Tribe",
  avatarUrl: "",
  cityId: "",
  isVerified: false,
};

export const dummyEvents: ExploreItem[] = raw.events.map((e) => ({
  ...e,
  type: "event" as const,
}));

export const dummyPolls: Poll[] = raw.polls.map((p) => ({
  ...p,
  user: DUMMY_USER,
  options: p.options,
  votes: p.votes as Record<string, number>,
}));

export const dummyTasks: Task[] = raw.tasks.map((t) => ({
  ...t,
  user: DUMMY_USER,
  description: t.description ?? "",
}));

export const dummyCrowdfunds: Crowdfund[] = raw.crowdfunds.map((f) => ({
  ...f,
  user: DUMMY_USER,
}));

export const dummyPlaces:  MapPlace[]  = raw.places  as MapPlace[];
export const dummyPeople:  MapPerson[] = raw.people  as MapPerson[];
export const dummyReviews: MapReview[] = raw.reviews as MapReview[];
