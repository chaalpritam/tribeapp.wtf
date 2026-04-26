"use client";

import { useState, useRef } from "react";
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
import type { Cast } from "@/types";
import { AppHeader } from "@/components/layout/app-header";
import { cn } from "@/lib/utils";

const createOptions = [
  {
    id: "cast",
    label: "Cast",
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

type Mode = "menu" | "cast" | "event" | "poll" | "task" | "crowdfund" | "channel";

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

export default function CreatePage() {
  const router = useRouter();
  const { currentCity } = useTribeStore();
  const { isAuthenticated } = useAuth();
  const { publish, publishing, error: publishError } = useTribePublish();
  const [mode, setMode] = useState<Mode>("menu");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Cast state
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [channelId, setChannelId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (mode === "cast") {
    const handleCastSubmit = async () => {
      if (!caption.trim() || !currentCity) return;
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        if (isAuthenticated) {
          await publish(caption.trim(), {
            channelId: channelId.trim() || undefined,
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
        onSubmit={handleCastSubmit}
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
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#999] px-2">
                Channel (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. tribe, base, degen"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full h-12 rounded-2xl border border-[#f0f0f0] bg-[#fcfcfc] px-6 text-[14px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5 placeholder:text-[#ccc]"
              />
              {(submitError || publishError?.message) && (
                <p className="text-[12px] text-red-500 font-bold px-2">
                  {submitError ?? publishError?.message}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-[13px] font-bold text-amber-800">
                Sign in with Tribe to publish casts
              </p>
              <a href="/onboarding/connect" className="text-[12px] font-bold text-amber-600 underline mt-1 inline-block">
                Sign in now
              </a>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setSelectedImage(URL.createObjectURL(f));
          }} className="hidden" />

          {selectedImage ? (
            <div className="relative rounded-[32px] overflow-hidden">
              <div className="relative aspect-video">
                <Image src={selectedImage} alt="Selected" fill className="object-cover" />
              </div>
              <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md">
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

  // Fallback modes use same pattern
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
