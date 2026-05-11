"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Search, Globe, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { useMounted } from "@/hooks/use-mounted";
import type { City } from "@/types";
import { listProtocolCities } from "@/lib/tribe/city-channels";
import { cities as fallbackCities } from "@/lib/cities";
import { cn } from "@/lib/utils";

export default function CitySelectionPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const tribeIdentity = useTribeIdentityStore((s) => s.identity);
  const mounted = useMounted();
  const signedIn = isAuthenticated || tribeIdentity !== null;
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (mounted && !signedIn) {
      router.replace("/onboarding/connect");
    }
  }, [mounted, signedIn, router]);

  const loadCities = useCallback(async () => {
    setLoadingCities(true);
    setFetchError(null);
    setUsingFallback(false);
    try {
      const cities = await listProtocolCities();
      if (cities.length > 0) {
        setAvailableCities(cities);
        const saved = localStorage.getItem("tribe-selected-city");
        if (saved && cities.some((c) => c.id === saved)) {
          setSelectedCityId(saved);
        } else {
          setSelectedCityId(cities[0]?.id ?? null);
        }
      } else {
        // Hub returned no city channels — use curated fallback
        setUsingFallback(true);
        setAvailableCities(fallbackCities);
        const saved = localStorage.getItem("tribe-selected-city");
        const match = saved && fallbackCities.some((c) => c.id === saved) ? saved : fallbackCities[0]?.id ?? null;
        setSelectedCityId(match);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[CitySelectionPage] failed to load protocol cities:", msg);
      setFetchError(msg);
      // Fall back to static list so onboarding isn't blocked
      setUsingFallback(true);
      setAvailableCities(fallbackCities);
      const saved = localStorage.getItem("tribe-selected-city");
      const match = saved && fallbackCities.some((c) => c.id === saved) ? saved : fallbackCities[0]?.id ?? null;
      setSelectedCityId(match);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !signedIn) return;
    loadCities();
  }, [mounted, signedIn, loadCities]);

  if (!mounted || !signedIn) return null;

  const filteredCities = availableCities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedCityId) {
      localStorage.setItem("tribe-selected-city", selectedCityId);
      router.push("/home");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
            <MapPin className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">
            Choose your City
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Explore tribes and pulses in your neighborhood
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for a city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#f0f0f0] bg-white py-4 pl-12 pr-4 text-[15px] font-bold outline-none transition-all focus:ring-4 focus:ring-primary/5 placeholder:text-[#ccc]"
          />
        </div>

        {/* Status banner */}
        {!loadingCities && fetchError && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800">Hub unreachable — showing default cities</p>
              <p className="mt-0.5 text-amber-700 break-all text-xs">{fetchError}</p>
            </div>
            <button
              onClick={loadCities}
              className="shrink-0 flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold text-xs"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}
        {!loadingCities && usingFallback && !fetchError && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>No city channels found on hub — showing default cities.</span>
            <button onClick={loadCities} className="ml-auto shrink-0 flex items-center gap-1 font-semibold hover:text-foreground text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 max-h-[45vh] overflow-y-auto no-scrollbar pr-1 mb-8">
          {loadingCities && (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Loading available city channels...
              </p>
            </div>
          )}

          {!loadingCities &&
            filteredCities.map((city) => {
            const isSelected = selectedCityId === city.id;
            return (
              <button
                key={city.id}
                onClick={() => setSelectedCityId(city.id)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-3xl transition-all active:scale-[0.98] text-left group border-2",
                  isSelected
                    ? "bg-primary/5 border-primary shadow-xl shadow-primary/5"
                    : "bg-white border-[#f0f0f0] hover:bg-[#f9f9f9] hover:border-[#e0e0e0]"
                )}
              >
                <div className="relative h-14 w-14 rounded-2xl overflow-hidden shrink-0 shadow-md">
                  <Image
                    src={city.imageUrl}
                    alt={city.name}
                    fill
                    className="object-cover"
                  />
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all",
                    isSelected ? "bg-primary/20 opacity-100" : "bg-black/20 opacity-0 group-hover:opacity-100"
                  )}>
                    <Globe className={cn("h-6 w-6 text-white", isSelected && "animate-pulse")} />
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-[17px] font-black tracking-tight">
                    {city.name}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-widest mt-1 text-muted-foreground">
                    {city.country}
                  </p>
                </div>

                {isSelected && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          disabled={!selectedCityId || loadingCities}
          onClick={handleContinue}
          className={cn(
            "w-full rounded-[32px] py-5 text-lg font-black text-white transition-all shadow-2xl",
            selectedCityId
              ? "bg-black shadow-black/20 opacity-100"
              : "bg-[#e0e0e0] cursor-not-allowed opacity-50"
          )}
        >
          Continue
        </motion.button>
      </motion.div>
    </div>
  );
}
