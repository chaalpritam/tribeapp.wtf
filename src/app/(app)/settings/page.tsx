"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Bell,
  Shield,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  ChevronDown,
  Heart,
  MessageCircle,
  Coins,
  Calendar,
  Users,
  Eye,
  Mail,
  MapPin,
  Key,
  Loader2,
} from "lucide-react";
import { useTribeRotateAppKey } from "@/hooks/use-tribe-rotate-key";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

type ExpandedSection = null | "notifications" | "privacy" | "help" | "about";

export default function SettingsPage() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);

  // Visual-only toggle states (not persisted — demo)
  const [notifPrefs, setNotifPrefs] = useState({
    likes: true,
    comments: true,
    tips: true,
    events: true,
    tribeActivity: true,
  });
  const [privacyPrefs, setPrivacyPrefs] = useState({
    showOnline: true,
    allowDMs: true,
    showLocation: false,
  });

  const toggle = (section: ExpandedSection) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  return (
    <div className="bg-background min-h-screen">
      <div className="sticky top-0 z-40 border-b bg-background/95 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-black lowercase tracking-tighter">Settings</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Account */}
        <div className="rounded-2xl border bg-background overflow-hidden shadow-sm">
          <h2 className="px-4 pt-4 pb-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            Account
          </h2>

          {/* Edit Profile → navigates to /profile */}
          <button
            onClick={() => router.push("/profile")}
            className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30 border-b"
          >
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-left text-[14px] font-bold tracking-tight">Edit Profile</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Notifications */}
          <button
            onClick={() => toggle("notifications")}
            className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30 border-b"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-left text-[14px] font-bold tracking-tight">Notifications</span>
            {expandedSection === "notifications" ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedSection === "notifications" && (
            <div className="border-b bg-muted/5 px-4 py-3 space-y-3">
              {[
                { key: "likes" as const, label: "Likes", icon: Heart },
                { key: "comments" as const, label: "Comments", icon: MessageCircle },
                { key: "tips" as const, label: "Tips", icon: Coins },
                { key: "events" as const, label: "Events", icon: Calendar },
                { key: "tribeActivity" as const, label: "Tribe Activity", icon: Users },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <button
                    onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      notifPrefs[key] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        notifPrefs[key] ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          )}

          {/* Privacy */}
          <button
            onClick={() => toggle("privacy")}
            className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30"
          >
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-left text-[14px] font-bold tracking-tight">Privacy & Security</span>
            {expandedSection === "privacy" ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedSection === "privacy" && (
            <div className="border-t bg-muted/5 px-4 py-3 space-y-3">
              {[
                { key: "showOnline" as const, label: "Show online status", icon: Eye },
                { key: "allowDMs" as const, label: "Allow direct messages", icon: Mail },
                { key: "showLocation" as const, label: "Show location on profile", icon: MapPin },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <button
                    onClick={() => setPrivacyPrefs((p) => ({ ...p, [key]: !p[key] }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      privacyPrefs[key] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        privacyPrefs[key] ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="rounded-2xl border bg-background overflow-hidden shadow-sm">
          <h2 className="px-4 pt-4 pb-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            Preferences
          </h2>
          <div className="flex w-full items-center gap-3 px-4 py-4 transition-colors">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-left text-[14px] font-bold tracking-tight">Language</span>
            <span className="text-[13px] font-medium text-muted-foreground">English</span>
          </div>
        </div>

        {/* About */}
        <div className="rounded-2xl border bg-background overflow-hidden shadow-sm">
          <h2 className="px-4 pt-4 pb-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            About
          </h2>

          <button
            onClick={() => toggle("help")}
            className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30 border-b"
          >
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-left text-[14px] font-bold tracking-tight">Help & Support</span>
            {expandedSection === "help" ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedSection === "help" && (
            <div className="border-b bg-muted/5 px-4 py-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Need help? Reach out to us:
              </p>
              <p className="text-sm font-medium">support@tribe.community</p>
              <p className="text-xs text-muted-foreground">
                We typically respond within 24 hours.
              </p>
            </div>
          )}

          <button
            onClick={() => toggle("about")}
            className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30"
          >
            <Info className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-left text-[14px] font-bold tracking-tight">About Tribe</span>
            <span className="text-[13px] font-medium text-muted-foreground">v1.0.0</span>
            {expandedSection === "about" ? (
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedSection === "about" && (
            <div className="border-t bg-muted/5 px-4 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black lowercase tracking-tight">tribe</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hyperlocal social networking. Connect with your
                neighborhood, join tribes, and build real community.
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Version 1.0.0</p>
                <p>Built with Next.js and Zustand</p>
              </div>
            </div>
          )}
        </div>

        <RotateDeviceKey />

        {/* Sign Out */}
        <button
          onClick={() => router.push("/")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/30 py-4 text-red-500 transition-all hover:bg-red-50 active:scale-95"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[14px] font-bold">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function RotateDeviceKey() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const { rotate, pending, ready } = useTribeRotateAppKey();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!identity) return null;

  return (
    <div className="rounded-2xl border border-[#f0f0f0] bg-white p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
          <Key className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold">Rotate device key</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Generates a fresh ed25519 signing key on this device, registers
            it on Solana against your TID, and re-publishes your DM key.
            Old keys stay valid until you explicitly revoke them.
          </p>
        </div>
      </div>
      <button
        onClick={async () => {
          setError(null);
          try {
            await rotate();
            setDone(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        }}
        disabled={pending || !ready}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-black text-white py-3 text-[13px] font-bold disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Rotating…" : done ? "Key rotated" : "Rotate key"}
      </button>
      {!ready && (
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Connect your Solana wallet to rotate.
        </p>
      )}
      {error && (
        <p className="text-[11px] text-red-500 font-bold mt-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
