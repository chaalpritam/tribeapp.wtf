"use client";

import { useEffect } from "react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { fetchUser, tribeIdentityToUser } from "@/lib/tribe";
import type { User } from "@/types";

// tribeapp.wtf defaults to seed/dummy data so the demo runs without
// any backend or API keys. Opt out by setting NEXT_PUBLIC_SEED_DATA=false.
const SEED_ENABLED =
  typeof process === "undefined" ||
  process.env.NEXT_PUBLIC_SEED_DATA !== "false";

const GUEST_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";

export function StoreInitializer() {
  const { currentCity, setInitialData, updateCurrentUser } = useTribeStore();
  const identity = useTribeIdentityStore((s) => s.identity);

  // Initial bootstrap. Runs once on mount: pick a city, optionally
  // load seed content, and seat a placeholder user. The follow-up
  // effect below promotes that placeholder to the real signed-in
  // user once the identity store rehydrates from localStorage.
  useEffect(() => {
    if (currentCity) return;

    if (SEED_ENABLED) {
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
      // Production: empty data, real user will land via the
      // identity-promotion effect below.
      import("@/seed/cities").then(({ cities }) => {
        const savedCityId = localStorage.getItem("tribe-selected-city");
        const city =
          cities.find((c) => c.id === savedCityId) || cities[0];

        const guestUser: User = {
          id: "guest",
          username: "guest",
          displayName: "Guest",
          avatarUrl: GUEST_AVATAR,
          cityId: city.id,
          isVerified: false,
        };

        setInitialData({
          city,
          user: guestUser,
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

  // Promote the placeholder user to the signed-in identity. Only
  // active in production mode — in seed mode we deliberately keep
  // the seed `currentUser` so the demo experience stays demo even
  // when a wallet is connected. Best-effort hub fetch fills in
  // displayName / bio / avatar; silent fall-through keeps the
  // user usable while offline.
  useEffect(() => {
    if (SEED_ENABLED) return;
    if (!currentCity) return;
    if (!identity) return;

    let cancelled = false;
    (async () => {
      const profile = await fetchUser(String(identity.tid)).catch(() => null);
      if (cancelled) return;
      const user = tribeIdentityToUser({
        identity,
        city: currentCity,
        profile,
      });
      updateCurrentUser(user);
    })();
    return () => {
      cancelled = true;
    };
  }, [identity, currentCity, updateCurrentUser]);

  return null;
}
