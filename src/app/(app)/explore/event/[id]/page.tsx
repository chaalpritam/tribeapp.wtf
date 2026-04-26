"use client";

import { use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Users, Calendar, Share2 } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useShare } from "@/hooks/use-share";
import { formatNumber } from "@/lib/utils";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { events } = useTribeStore();
  const { share, showToast } = useShare();
  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur-lg">
        <button onClick={() => router.back()} className="rounded-full p-1 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-lg font-bold">Event Details</h1>
        <button
          onClick={() => share(
            event.title,
            event.description,
            `${typeof window !== "undefined" ? window.location.origin : ""}/explore/event/${id}`
          )}
          className="rounded-full p-2 hover:bg-muted"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Hero */}
      {event.imageUrl && (
        <div className="relative aspect-video">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {event.isTrending && (
          <span className="mb-3 inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            Trending
          </span>
        )}
        <h2 className="mb-2 text-2xl font-bold">{event.title}</h2>
        <p className="mb-4 text-muted-foreground">{event.description}</p>

        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span>{event.timeAgo}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span>{formatNumber(event.participants)} attending</span>
          </div>
        </div>

        <button
          className="w-full rounded-xl py-3 text-center font-semibold text-white"
          style={{ backgroundColor: "var(--tribe-primary)" }}
        >
          RSVP - I&apos;m Going
        </button>
      </div>

      {showToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg animate-in fade-in slide-in-from-bottom-4">
          Link copied!
        </div>
      )}
    </div>
  );
}
