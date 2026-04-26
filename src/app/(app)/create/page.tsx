"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  PenSquare,
  Calendar,
  BarChart3,
  CheckCircle,
  Banknote,
  Hash,
  ArrowLeft,
  ImagePlus,
  Send,
  Loader2,
  X,
  LayoutGrid
} from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useAuth } from "@/hooks/use-auth";
import { useTribePublish } from "@/hooks/use-tribe-publish";
import { useTribeEvent } from "@/hooks/use-tribe-event";
import { uploadMedia, listChannels, type ChannelInfo } from "@/lib/tribe";
import type { Tweet, ExploreItem } from "@/types";
import { AppHeader } from "@/components/layout/app-header";
import { cn } from "@/lib/utils";

const GENERAL_CHANNEL_ID = "general";
const CHANNEL_KIND_GENERAL = 1;
const CHANNEL_KIND_CITY = 2;

const createOptions = [
  {
    id: "tweet",
    label: "Tweet",
    description: "Update the neighborhood Pulse",
    icon: PenSquare,
    color: "#6366F1",
    accent: "bg-indigo-50 text-indigo-500",
  },
  {
    id: "event",
    label: "Event",
    description: "Gather everyone together",
    icon: Calendar,
    color: "#14B8A6",
    accent: "bg-emerald-50 text-emerald-500",
  },
  {
    id: "poll",
    label: "Poll",
    description: "Ask for community feedback",
    icon: BarChart3,
    color: "#FB7185",
    accent: "bg-rose-50 text-rose-500",
  },
  {
    id: "task",
    label: "Task",
    description: "Call for a helping hand",
    icon: CheckCircle,
    color: "#FB923C",
    accent: "bg-amber-50 text-amber-500",
  },
  {
    id: "crowdfund",
    label: "Fund",
    description: "Raise impact capital",
    icon: Banknote,
    color: "#A78BFA",
    accent: "bg-violet-50 text-violet-500",
  },
  {
    id: "channel",
    label: "Tribe",
    description: "Build a new mini-community",
    icon: Hash,
    color: "#38BDF8",
    accent: "bg-sky-50 text-sky-500",
  },
];

type Mode = "menu" | "tweet" | "event" | "poll" | "task" | "crowdfund" | "channel";

const FormLayout = ({ title, children, onSubmit, canSubmit, isSubmitting, currentCity, setMode }: {
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  currentCity: { id: string; name: string } | null;
  setMode: (mode: Mode) => void;
}) => (
  <div className="bg-[#fcfcfc] min-h-screen">
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#f0f0f0]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMode("menu")}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#f5f5f5] hover:bg-[#eeeeee] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight leading-none">{title}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{currentCity?.name}</span>
            <button
              onClick={() => {/* Trigger city switcher */ }}
              className="text-[11px] font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
            >
              (Change City)
            </button>
          </div>
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className="flex items-center gap-2 h-11 px-6 rounded-full bg-black text-white text-[13px] font-bold disabled:opacity-30 transition-all active:scale-95 shadow-xl shadow-black/10"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Share
      </button>
    </div>
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="bg-white rounded-[40px] border border-[#f0f0f0] p-8 shadow-sm">
        {children}
      </div>
    </div>
  </div>
);

/** Random short slug for the off-chain envelope's string id. The
 *  on-chain Event has its own monotonic u64 id; the two are
 *  bridged via the envelope's BLAKE3 hash stored as metadata_hash. */
function newEventId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `event-${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Date input default = "now + 1 day, rounded to the next hour". */
function defaultStartsAt(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  // datetime-local format: "YYYY-MM-DDTHH:MM"
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreatePage() {
  const router = useRouter();
  const { currentCity, addEvent } = useTribeStore();
  const { isAuthenticated } = useAuth();
  const { publish, publishing, error: publishError } = useTribePublish();
  const {
    create: createEvent,
    pending: eventPending,
    walletReady: eventWalletReady,
  } = useTribeEvent();
  const [mode, setMode] = useState<Mode>("menu");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Tweet state
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [channelId, setChannelId] = useState<string>(GENERAL_CHANNEL_ID);
  const [channelOptions, setChannelOptions] = useState<ChannelInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Event state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartsAt, setEventStartsAt] = useState<string>(defaultStartsAt());
  const [eventLocation, setEventLocation] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const channels = await listChannels(50, 0);
        if (cancelled) return;
        // Surface "general" first, then cities, then interest channels.
        const sorted = [...channels].sort((a, b) => {
          if (a.id === GENERAL_CHANNEL_ID) return -1;
          if (b.id === GENERAL_CHANNEL_ID) return 1;
          const ak = a.kind ?? 3;
          const bk = b.kind ?? 3;
          if (ak !== bk) return ak - bk;
          return (a.name ?? a.id).localeCompare(b.name ?? b.id);
        });
        if (!sorted.some((c) => c.id === GENERAL_CHANNEL_ID)) {
          sorted.unshift({
            id: GENERAL_CHANNEL_ID,
            name: "General",
            description: null,
            kind: CHANNEL_KIND_GENERAL,
            latitude: null,
            longitude: null,
            created_by: null,
            created_at: null,
            member_count: 0,
            tweet_count: 0,
            last_tweet_at: null,
          });
        }
        setChannelOptions(sorted);
      } catch {
        if (!cancelled) {
          setChannelOptions([
            {
              id: GENERAL_CHANNEL_ID,
              name: "General",
              description: null,
              kind: CHANNEL_KIND_GENERAL,
              latitude: null,
              longitude: null,
              created_by: null,
              created_at: null,
              member_count: 0,
              tweet_count: 0,
              last_tweet_at: null,
            },
          ]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (mode === "tweet") {
    const handleTweetSubmit = async () => {
      if (!caption.trim() || !currentCity) return;
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const embeds: string[] = [];
        if (selectedFile && isAuthenticated) {
          const upload = await uploadMedia(selectedFile);
          embeds.push(upload.absoluteUrl);
        }
        if (isAuthenticated) {
          await publish(caption.trim(), {
            // Always send a channel — the SDK / hub fall back to
            // "general" but this keeps the wire payload explicit.
            channelId: channelId.trim() || GENERAL_CHANNEL_ID,
            embeds: embeds.length > 0 ? embeds : undefined,
          });
        }
        router.push("/home");
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <FormLayout
        title="Broadcast"
        onSubmit={handleTweetSubmit}
        canSubmit={!!caption.trim()}
        isSubmitting={isSubmitting || publishing}
        currentCity={currentCity}
        setMode={setMode}
      >
        <div className="space-y-6">
          <textarea
            placeholder="What's happening in your neighborhood?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            autoFocus
            className="w-full resize-none bg-transparent text-xl font-bold outline-none placeholder:text-[#ccc] border-none p-0"
          />

          {isAuthenticated ? (
            <div className="space-y-2">
              <label
                htmlFor="composer-channel"
                className="text-[11px] font-bold uppercase tracking-widest text-[#999] px-2"
              >
                Posting to
              </label>
              <select
                id="composer-channel"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full h-12 rounded-2xl border border-[#f0f0f0] bg-[#fcfcfc] px-6 text-[14px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
              >
                {channelOptions.map((ch) => {
                  const prefix =
                    ch.kind === CHANNEL_KIND_GENERAL
                      ? ""
                      : ch.kind === CHANNEL_KIND_CITY
                      ? "📍 "
                      : "#";
                  return (
                    <option key={ch.id} value={ch.id}>
                      {prefix}
                      {ch.name?.trim() || ch.id}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-[#999] px-2">
                Tweets without a city or interest group land in the General channel.
              </p>
              {(submitError || publishError?.message) && (
                <p className="text-[12px] text-red-500 font-bold px-2">
                  {submitError ?? publishError?.message}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-[13px] font-bold text-amber-800">
                Sign in with Tribe to publish tweets
              </p>
              <a href="/onboarding/connect" className="text-[12px] font-bold text-amber-600 underline mt-1 inline-block">
                Sign in now
              </a>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setSelectedFile(f);
              setSelectedImage(URL.createObjectURL(f));
            }
          }} className="hidden" />

          {selectedImage ? (
            <div className="relative rounded-[32px] overflow-hidden">
              <div className="relative aspect-video">
                <Image src={selectedImage} alt="Selected" fill className="object-cover" />
              </div>
              <button onClick={() => { setSelectedImage(null); setSelectedFile(null); }} className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md">
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-4 py-16 rounded-[32px] border-2 border-dashed border-[#f0f0f0] bg-[#fcfcfc] text-[#999] hover:bg-[#f9f9f9] transition-all">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-white shadow-sm">
                <ImagePlus className="h-7 w-7" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest">Attach Visuals</span>
            </button>
          )}
        </div>
      </FormLayout>
    );
  }

  if (mode === "event") {
    const handleEventSubmit = async () => {
      if (!eventTitle.trim() || !eventStartsAt || !currentCity) return;
      if (!isAuthenticated) {
        setSubmitError("Sign in with Tribe to create events");
        return;
      }
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        // Off-chain envelope wants a short string id; on-chain Event
        // has its own u64 id derived from the per-creator counter.
        const offchainId = newEventId();
        const startsAtUnix = Math.floor(new Date(eventStartsAt).getTime() / 1000);
        const result = await createEvent(
          offchainId,
          eventTitle.trim(),
          startsAtUnix,
          {
            description: eventDescription.trim() || undefined,
            locationText: eventLocation.trim() || undefined,
          }
        );

        // Push the new event into the local feed so it shows up
        // immediately with the on-chain badge when the chain hop
        // succeeded. Subsequent RSVPs from this card route via
        // rsvpOnchain when wallet is connected.
        const newItem: ExploreItem = {
          id: offchainId,
          type: "event",
          title: eventTitle.trim(),
          description: eventDescription.trim() || "",
          icon: "calendar",
          color: "#6366F1",
          participants: 0,
          location: eventLocation.trim() || currentCity.name,
          timeAgo: "just now",
          isTrending: false,
          cityId: currentCity.id,
          onchainEventPda: result.eventPda,
        };
        addEvent(newItem);
        router.push("/home");
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <FormLayout
        title="Create Event"
        onSubmit={handleEventSubmit}
        canSubmit={!!eventTitle.trim() && !!eventStartsAt}
        isSubmitting={isSubmitting || eventPending}
        currentCity={currentCity}
        setMode={setMode}
      >
        <div className="space-y-6">
          <input
            type="text"
            placeholder="What's the event called?"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-2xl font-black tracking-tight outline-none placeholder:text-[#ccc] border-none p-0"
          />

          <textarea
            placeholder="Describe what's happening (optional)"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            rows={3}
            className="w-full resize-none bg-transparent text-[15px] font-medium outline-none placeholder:text-[#ccc] border-none p-0"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="event-starts-at"
                className="text-[11px] font-bold uppercase tracking-widest text-[#999] px-2"
              >
                Starts
              </label>
              <input
                id="event-starts-at"
                type="datetime-local"
                value={eventStartsAt}
                onChange={(e) => setEventStartsAt(e.target.value)}
                className="w-full h-12 rounded-2xl border border-[#f0f0f0] bg-[#fcfcfc] px-4 text-[14px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="event-location"
                className="text-[11px] font-bold uppercase tracking-widest text-[#999] px-2"
              >
                Where
              </label>
              <input
                id="event-location"
                type="text"
                placeholder={`e.g. ${currentCity?.name ?? "your city"}`}
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="w-full h-12 rounded-2xl border border-[#f0f0f0] bg-[#fcfcfc] px-4 text-[14px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5 placeholder:text-[#ccc]"
              />
            </div>
          </div>

          {isAuthenticated ? (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-[13px] font-bold text-amber-800">
                {eventWalletReady
                  ? "On submit, this event will be anchored on Solana via event-registry. RSVPs will settle on chain."
                  : "Connect a Solana wallet to anchor this event on chain. Without one, only the off-chain envelope is published."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-[13px] font-bold text-amber-800">
                Sign in with Tribe to create events
              </p>
              <a
                href="/onboarding/connect"
                className="text-[12px] font-bold text-amber-600 underline mt-1 inline-block"
              >
                Sign in now
              </a>
            </div>
          )}

          {submitError && (
            <p className="text-[12px] text-red-500 font-bold px-2">
              {submitError}
            </p>
          )}
        </div>
      </FormLayout>
    );
  }

  // Fallback for poll / task / crowdfund / channel — same composer
  // pattern is on the way; events shipped first as the smallest
  // visible vertical to validate the chain → store → feed loop.
  if (mode !== "menu") {
    return (
      <FormLayout
        title={`Create ${mode}`}
        onSubmit={() => setMode("menu")}
        canSubmit={true}
        isSubmitting={isSubmitting}
        currentCity={currentCity}
        setMode={setMode}
      >
        <div className="py-20 text-center space-y-4">
          <div className="h-20 w-20 bg-[#f5f5f5] rounded-full mx-auto flex items-center justify-center text-[#ccc]">
            <LayoutGrid className="h-10 w-10" />
          </div>
          <p className="text-xl font-bold tracking-tight">Form Coming Soon</p>
          <p className="text-sm font-medium text-muted-foreground">The {mode} creation experience is being refined.</p>
        </div>
      </FormLayout>
    )
  }

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Create" />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-black tracking-tighter text-black">What&apos;s the Pulse?</h2>
          <p className="text-sm font-medium text-muted-foreground mt-2">Share something new with your local community</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {createOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id as Mode)}
                className="group flex flex-col items-start gap-6 rounded-[40px] bg-white border border-[#f0f0f0] p-8 text-left transition-all hover:shadow-2xl hover:shadow-black/[0.05] hover:-translate-y-1 active:scale-95"
              >
                <div className={cn("flex h-16 w-16 items-center justify-center rounded-[24px] shadow-lg shadow-black/5 transition-transform group-hover:scale-110", opt.accent)}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xl font-black tracking-tighter text-black leading-none">{opt.label}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-3 leading-snug">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
