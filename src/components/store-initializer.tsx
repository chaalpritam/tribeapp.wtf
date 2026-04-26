"use client";

import { useEffect } from "react";
import { useTribeStore } from "@/store/use-tribe-store";

// tribeapp.wtf defaults to seed/dummy data so the demo runs without
// any backend or API keys. Opt out by setting NEXT_PUBLIC_SEED_DATA=false.
const SEED_ENABLED =
  typeof process === "undefined" ||
  process.env.NEXT_PUBLIC_SEED_DATA !== "false";

export function StoreInitializer() {
  const { currentCity, setInitialData } = useTribeStore();

  useEffect(() => {
    if (currentCity) return; // Already initialized

    if (SEED_ENABLED) {
      // Load seed data for development/demo
      Promise.all([
        import("@/seed/cities"),
        import("@/seed/users"),
        import("@/seed/tweets"),
        import("@/seed/explore"),
        import("@/seed/polls"),
        import("@/seed/tasks"),
        import("@/seed/crowdfunds"),
        import("@/seed/tribes"),
      ]).then(
        ([
          { cities },
          { currentUser },
          { tweets },
          { exploreItems },
          { polls },
          { tasks },
          { crowdfunds },
          { tribes },
        ]) => {
          const savedCityId = localStorage.getItem("tribe-selected-city");
          const city =
            cities.find((c) => c.id === savedCityId) || cities[0];

          setInitialData({
            city,
            user: currentUser,
            tweets: tweets.filter(
              (c: { cityId?: string }) => c.cityId === city.id
            ),
            events: exploreItems.filter(
              (e: { cityId?: string }) => e.cityId === city.id
            ),
            polls: polls.filter((p: { id: string }) =>
              p.id.includes(city.id.slice(0, 3))
            ),
            tasks: tasks[city.id] || [],
            crowdfunds: crowdfunds[city.id] || [],
            tribes: tribes.filter(
              (t: { cityId?: string }) => t.cityId === city.id
            ),
          });
        }
      ).catch(() => {});
    } else {
      // Production: start with empty data, rely on Farcaster APIs
      import("@/seed/cities").then(({ cities }) => {
        const savedCityId = localStorage.getItem("tribe-selected-city");
        const city =
          cities.find((c) => c.id === savedCityId) || cities[0];

        setInitialData({
          city,
          user: {
            id: "guest",
            username: "guest",
            displayName: "Guest",
            avatarUrl:
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
            cityId: city.id,
            isVerified: false,
          },
          tweets: [],
          events: [],
          polls: [],
          tasks: [],
          crowdfunds: [],
          tribes: [],
        });
      }).catch(() => {});
    }
  }, [currentCity, setInitialData]);

  return null;
}
