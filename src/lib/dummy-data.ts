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
