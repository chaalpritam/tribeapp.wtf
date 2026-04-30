"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Hash, Users, Lock } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { formatNumber } from "@/lib/utils";

export default function ChannelsPage() {
  const { tribes } = useTribeStore();
  const [search, setSearch] = useState("");

  const channels = tribes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="sticky top-0 z-40 border-b bg-background/80 px-4 py-3 backdrop-blur-lg">
        <h1 className="mb-3 text-lg font-bold">Channels</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-muted/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="space-y-2 p-4">
        {channels.map((channel) => (
          <Link
            key={channel.id}
            href={`/channels/${channel.id}`}
            className="flex items-center gap-3 rounded-2xl border p-4 transition-shadow hover:shadow-tribe-subtle"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: `#${channel.color}` }}
            >
              <Hash className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold truncate">{channel.name}</span>
                {channel.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(channel.members)} members
              </p>
            </div>
          </Link>
        ))}

        {channels.length === 0 && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            No channels found
          </div>
        )}
      </div>
    </div>
  );
}
