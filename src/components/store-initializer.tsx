"use client";

import { useEffect } from "react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { fetchUser, tribeIdentityToUser } from "@/lib/tribe";
import type { User } from "@/types";

const GUEST_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";

/**
 * Bootstraps the in-memory store on first paint:
 *
 *   1. Loads the city catalog (a curated list of supported cities;
 *      not user data, just app config) and seats the active city.
 *   2. Seats a placeholder guest user so views that depend on
 *      `currentUser` render before the identity store rehydrates.
 *   3. Promotes the placeholder to the signed-in TribeIdentity once
 *      one is available, hydrating displayName / bio / avatar from
 *      the user's hub profile. Re-runs whenever the identity changes
 *      (sign-in, sign-out, fresh tab rehydrating from localStorage).
 *
 * All content (tweets, polls, events, tasks, crowdfunds, tribes,
 * notifications, DMs) flows from the protocol via per-feature hooks
 * — the store no longer ships demo data.
 */
export function StoreInitializer() {
  const { currentCity, setInitialData, updateCurrentUser } = useTribeStore();
  const identity = useTribeIdentityStore((s) => s.identity);

  useEffect(() => {
    if (currentCity) return;
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
  }, [currentCity, setInitialData]);

  useEffect(() => {
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
