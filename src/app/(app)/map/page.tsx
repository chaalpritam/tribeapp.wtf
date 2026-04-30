"use client";

import Link from "next/link";
import { Hash, Loader2, MapPin } from "lucide-react";
import { useMemo } from "react";
import { useHubChannels } from "@/hooks/use-hub-channels";
import { AppHeader } from "@/components/layout/app-header";

/**
 * Map surface — currently a list view of geo-anchored city channels.
 *
 * The previous implementation was a stylized SVG with hardcoded x/y
 * pins; that demo art is gone. This page now renders what the
 * protocol carries: channels with kind = 2 and a (latitude, longitude)
 * pair. A real MapKit / Leaflet / Mapbox renderer can drop in here
 * when we pick a tile provider — the underlying data set is already
 * the one a renderer would need.
 */
export default function MapPage() {
  const { channels, loading } = useHubChannels({});

  const cityChannels = useMemo(
    () =>
      channels.filter(
        (c) => c.kind === 2 && c.latitude != null && c.longitude != null
      ),
    [channels]
  );

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Map" />
      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="rounded-[24px] sm:rounded-[28px] bg-indigo-50 border border-indigo-100 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-indigo-700">
            <MapPin className="h-4 w-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">
              Geo-anchored on chain
            </span>
          </div>
          <p className="mt-2 text-[13px] font-medium text-indigo-900/80 leading-relaxed">
            City channels with a (lat, lng) pair on chain. A tile-based
            renderer is on the roadmap; until then this is the
            authoritative list a renderer would draw from.
          </p>
        </div>

        {loading && cityChannels.length === 0 && (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {cityChannels.length > 0 && (
          <div className="flex flex-col gap-3">
            {cityChannels.map((c) => (
              <Link
                key={c.id}
                href={`/tribes/${c.id}`}
                className="flex items-center gap-4 p-4 sm:p-5 rounded-[24px] bg-white border border-[#f0f0f0] transition-all hover:shadow-xl hover:shadow-black/[0.04]"
              >
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Hash className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black tracking-tight">
                    {c.name?.trim() || `#${c.id}`}
                  </p>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {c.latitude!.toFixed(3)}, {c.longitude!.toFixed(3)}
                    {" · "}
                    {c.member_count} members
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && cityChannels.length === 0 && (
          <div className="rounded-[28px] bg-white border border-[#f0f0f0] p-10 text-center">
            <p className="text-xl font-bold tracking-tight">
              Nothing pinned yet
            </p>
            <p className="text-sm font-medium text-muted-foreground mt-2 max-w-sm mx-auto">
              Create a city channel from the Create tab and attach
              coordinates — it&apos;ll show up here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
