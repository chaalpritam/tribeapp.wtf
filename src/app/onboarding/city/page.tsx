"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Search, Globe } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cities } from "@/seed/cities";
import { cn } from "@/lib/utils";

export default function CitySelectionPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasHydrated(true), 0);

    if (hasHydrated && !isAuthenticated) {
      router.push("/onboarding/connect");
    }

    const saved = localStorage.getItem("tribe-selected-city");
    if (saved && !selectedCityId) {
      setTimeout(() => setSelectedCityId(saved), 0);
    }
    return () => clearTimeout(timer);
  }, [isAuthenticated, router, selectedCityId, hasHydrated]);

  if (!hasHydrated) return null;

  const filteredCities = cities.filter(
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

  if (!isAuthenticated) return null;

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

        <div className="grid grid-cols-1 gap-2 max-h-[45vh] overflow-y-auto no-scrollbar pr-1 mb-8">
          {filteredCities.map((city) => {
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

          {filteredCities.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <p className="text-xl font-bold tracking-tight">
                City not found
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                We&apos;re expanding to new tribes soon!
              </p>
            </div>
          )}
        </div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          disabled={!selectedCityId}
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
