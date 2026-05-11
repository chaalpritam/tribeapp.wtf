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
  cityId: (p as unknown as { cityId?: string }).cityId,
}));

export const dummyTasks: Task[] = raw.tasks.map((t) => ({
  ...t,
  user: DUMMY_USER,
  description: t.description ?? "",
  cityId: (t as unknown as { cityId?: string }).cityId,
}));

export const dummyCrowdfunds: Crowdfund[] = raw.crowdfunds.map((f) => ({
  ...f,
  user: DUMMY_USER,
  cityId: (f as unknown as { cityId?: string }).cityId,
}));

export const dummyPlaces:  MapPlace[]  = raw.places  as MapPlace[];
export const dummyPeople:  MapPerson[] = raw.people  as MapPerson[];
export const dummyReviews: MapReview[] = raw.reviews as MapReview[];

/**
 * Match a dummy record's cityId against the current city.
 * Protocol channels may use a numeric ID or a different slug from the
 * static "chennai" / "mumbai" keys we use in the JSON. We therefore
 * check both the channel id AND the channel name (case-insensitive)
 * so data always surfaces regardless of how the channel was registered.
 */
export function matchesCity(
  dummyCityId: string | undefined,
  currentCityId: string,
  currentCityName?: string,
): boolean {
  if (!dummyCityId) return false;
  if (!currentCityId && !currentCityName) return false;
  const slug = dummyCityId.toLowerCase();
  const id   = currentCityId.toLowerCase();
  const name = (currentCityName ?? "").toLowerCase().replace(/\s+/g, "-");
  // Exact ID match
  if (slug === id) return true;
  // Name-based match: "chennai" in slug or id contains "chennai"
  if (name && (slug.includes(name) || name.includes(slug))) return true;
  // Also try the raw name words (e.g. "new york" → "new-york")
  const nameWords = (currentCityName ?? "").toLowerCase();
  if (nameWords && (slug.includes(nameWords.replace(/\s+/g, "-")) || slug.includes(nameWords))) return true;
  return false;
}
