"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Users,
  Lock,
  ArrowRight,
  MapPin,
  Navigation,
  Loader2,
} from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribeChannels } from "@/hooks/use-tribe-channels";
import { useHubChannels } from "@/hooks/use-hub-channels";
import { useAuth } from "@/hooks/use-auth";
import { formatNumber } from "@/lib/utils";
import type { Tribe } from "@/types";
import type { City } from "@/types";
import type { ChannelInfo } from "@/lib/tribe";
import { AppHeader } from "@/components/layout/app-header";
import { cities as curatedCities } from "@/lib/cities";
import { loadCityData } from "@/lib/city-data";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { channelInfoToTribe } from "@/lib/tribe";

const CHANNEL_KIND_CITY = 2;

const DEFAULT_CITY_IMAGE =
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=800&fit=crop";

/** Match by ID or by normalised name so "Bengaluru", "Chennai" etc.
 *  work even if the protocol channel slug differs from the curated id. */
function findCurated(channel: ChannelInfo) {
  const byId = curatedCities.find((c) => c.id === channel.id);
  if (byId) return byId;
  const nameLower = (channel.name ?? "").toLowerCase().trim();
  // Exact name match
  const byName = curatedCities.find((c) => c.name.toLowerCase() === nameLower);
  if (byName) return byName;
  // Partial / slug match (e.g. "Bengaluru" includes "bengal")
  return curatedCities.find(
    (c) =>
      nameLower.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(nameLower) ||
      c.id.replace(/-/g, "") === nameLower.replace(/\s+/g, "")
  );
}

function channelToCity(channel: ChannelInfo): City {
  const curated = findCurated(channel);
  return {
    id: channel.id,
    name: channel.name?.trim() || curated?.name || channel.id,
    country: curated?.country || "Protocol",
    countryCode: curated?.countryCode || "UN",
    imageUrl: curated?.imageUrl || DEFAULT_CITY_IMAGE,
    coordinates: {
      latitude: channel.latitude ?? curated?.coordinates.latitude ?? 0,
      longitude: channel.longitude ?? curated?.coordinates.longitude ?? 0,
    },
    accentColor: curated?.accentColor || "#6366F1",
    emoji: curated?.emoji,
  };
}

export default function TribesPage() {
  const { currentCity } = useTribeStore();
  const { tid } = useAuth();
  const [search, setSearch] = useState("");

  const { channels: hubChannels, loading: channelsLoading } = useHubChannels({});
  const { channels: joinedHubChannels } = useHubChannels({
    memberOf: tid ?? null,
    enabled: tid != null,
  });

  // Split channels into city channels and interest channels.
  const cityChannels = useMemo(
    () => hubChannels.filter((c) => Number(c.kind) === CHANNEL_KIND_CITY),
    [hubChannels]
  );
  const interestChannels = useMemo(
    () => hubChannels.filter((c) => Number(c.kind) !== CHANNEL_KIND_CITY),
    [hubChannels]
  );

  const joinedIds = useMemo(
    () => new Set(joinedHubChannels.map((c) => c.id)),
    [joinedHubChannels]
  );

  const allInterestTribes = useMemo<Tribe[]>(
    () =>
      interestChannels.map((c) =>
        channelInfoToTribe(c, {
          cityId: currentCity?.id ?? "",
          isJoined: joinedIds.has(c.id),
        })
      ),
    [interestChannels, joinedIds, currentCity?.id]
  );

  // Search filters both city channels and interest tribes.
  const q = search.toLowerCase();
  const filteredCityChannels = cityChannels.filter(
    (c) =>
      !search ||
      (c.name ?? c.id).toLowerCase().includes(q)
  );
  const filteredInterestTribes = allInterestTribes.filter(
    (t) => !search || t.name.toLowerCase().includes(q)
  );

  const joinedTribes = filteredInterestTribes.filter((t) => t.isJoined);
  const discoverTribes = filteredInterestTribes.filter((t) => !t.isJoined);

  const nothingFound =
    !channelsLoading &&
    filteredCityChannels.length === 0 &&
    filteredInterestTribes.length === 0;

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Tribes" />

      {/* Search Bar */}
      <div className="sticky top-[73px] z-30 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-[#f0f0f0]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Find your tribe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#f0f0f0] bg-[#f9f9f9] py-3.5 pl-12 pr-4 text-[15px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
          />
        </div>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto space-y-10">
        {/* City Channels — from the protocol */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold tracking-tight">City Channels</h2>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {channelsLoading
                  ? "Loading…"
                  : `${filteredCityChannels.length} on protocol`}
              </p>
            </div>
          </div>

          {channelsLoading && cityChannels.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCityChannels.length === 0 ? (
            <div className="rounded-[32px] bg-white border border-[#f0f0f0] p-8 text-center text-sm font-medium text-muted-foreground">
              {search ? "No city channels match your search." : "No city channels on this hub yet."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filteredCityChannels.map((channel) => (
                <CityChannelCard
                  key={channel.id}
                  channel={channel}
                  isCurrentCity={channel.id === currentCity?.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Your Tribes */}
        {joinedTribes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight">Your Tribes</h2>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {joinedTribes.length} Joined
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {joinedTribes.map((tribe) => (
                <TribeCard key={tribe.id} tribe={tribe} />
              ))}
            </div>
          </section>
        )}

        {/* Discover */}
        {discoverTribes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight">Discover</h2>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Local Communities
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {discoverTribes.map((tribe) => (
                <TribeCard key={tribe.id} tribe={tribe} />
              ))}
            </div>
          </section>
        )}

        {nothingFound && (
          <div className="flex h-[40vh] flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-[32px] bg-muted/30 p-8">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold tracking-tight text-black">No tribes found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CityChannelCard({
  channel,
  isCurrentCity,
}: {
  channel: ChannelInfo;
  isCurrentCity: boolean;
}) {
  const { switchCity } = useTribeStore();
  const router = useRouter();

  const handleJump = async () => {
    try {
      const city = channelToCity(channel);
      localStorage.setItem("tribe-selected-city", city.id);
      const data = await loadCityData(city);
      switchCity(city, data);
      router.push("/home");
    } catch (err) {
      console.error("Failed to jump to city:", err);
    }
  };

  const city = channelToCity(channel);
  const curated = findCurated(channel);

  return (
    <button
      onClick={handleJump}
      className="group relative aspect-[3/4] rounded-[28px] overflow-hidden w-full shadow-sm hover:shadow-xl transition-all duration-300 active:scale-[0.97] text-left"
    >
      {/* Full-bleed city photo */}
      <Image
        src={city.imageUrl}
        alt={city.name}
        fill
        sizes="(max-width: 640px) 50vw, 300px"
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Current badge */}
      {isCurrentCity && (
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
          <Navigation className="h-2.5 w-2.5" />
          Current
        </div>
      )}

      {/* Member count badge */}
      {(channel.member_count ?? 0) > 0 && (
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[9px] font-black px-2 py-1 rounded-full">
          {formatNumber(channel.member_count ?? 0)} members
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white text-[16px] font-black leading-tight tracking-tight">
          {city.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5" />
            {curated?.country ?? "Protocol"}
          </p>
          {!isCurrentCity && (
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full group-hover:bg-white group-hover:text-black transition-all">
              Jump <ArrowRight className="h-2.5 w-2.5" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function TribeCard({ tribe }: { tribe: Tribe }) {
  const { joinTribe, leaveTribe } = useTribeStore();
  const { join: joinChannel, leave: leaveChannel, ready } = useTribeChannels();

  return (
    <Link
      href={`/tribes/${tribe.id}`}
      className="group flex items-center gap-5 rounded-[32px] bg-white border border-[#f0f0f0] p-5 transition-all hover:shadow-xl hover:shadow-black/[0.03] active:scale-[0.98]"
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-[20px] text-white shrink-0 shadow-lg shadow-black/5"
        style={{
          backgroundColor: tribe.imageUrl ? "transparent" : `#${tribe.color}`,
        }}
      >
        {tribe.imageUrl ? (
          <div className="relative h-full w-full rounded-[20px] overflow-hidden">
            <Image src={tribe.imageUrl} alt={tribe.name} fill className="object-cover" />
          </div>
        ) : (
          <Users className="h-7 w-7" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[17px] font-bold tracking-tight truncate">{tribe.name}</span>
          {tribe.isPrivate && <Lock className="h-3.5 w-3.5 text-[#999]" />}
        </div>
        <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
          {formatNumber(tribe.members)} Members
        </div>
      </div>

      <button
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (tribe.isJoined) {
            leaveTribe(tribe.id);
            if (ready) {
              try {
                await leaveChannel(tribe.id);
              } catch {}
            }
          } else {
            joinTribe(tribe.id);
            if (ready) {
              try {
                await joinChannel(tribe.id);
              } catch {}
            }
          }
        }}
        className={cn(
          "h-11 px-6 rounded-full text-[13px] font-bold transition-all shrink-0 active:scale-90",
          tribe.isJoined
            ? "bg-[#f5f5f5] text-[#666] hover:bg-red-50 hover:text-red-500"
            : "bg-black text-white hover:bg-black/90"
        )}
      >
        {tribe.isJoined ? "Member" : "Join"}
      </button>

      <div className="hidden group-hover:block transition-all ml-1">
        <ArrowRight className="h-5 w-5 text-black/20" />
      </div>
    </Link>
  );
}
