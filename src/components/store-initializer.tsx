"use client";

import { useEffect } from "react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { fetchUser, tribeIdentityToUser } from "@/lib/tribe";
import { listProtocolCities } from "@/lib/tribe/city-channels";

/**
 * Bootstraps the in-memory store on first paint:
 *
 *   1. Loads the city catalog (a curated list of supported cities;
 *      not user data, just app config) and seats the active city.
 *   2. Seeds `currentUser` from the signed-in TribeIdentity so views
 *      that depend on it can render immediately.
 *   3. Hydrates displayName / bio / avatar from the user's hub profile
 *      once fetched, and re-runs whenever identity changes.
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
    if (!identity) return;
    listProtocolCities()
      .then((cities) => {
        const savedCityId = localStorage.getItem("tribe-selected-city");
        const city =
          cities.find((c) => c.id === savedCityId) || cities[0];
        if (!city) return;
      const initialUser = tribeIdentityToUser({
        identity,
        city,
        profile: null,
      });

      setInitialData({
        city,
        user: initialUser,
        tweets: [],
        events: [],
        polls: [],
        tasks: [],
        crowdfunds: [],
        tribes: [],
      });
      })
      .catch(() => {});
  }, [currentCity, identity, setInitialData]);

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
