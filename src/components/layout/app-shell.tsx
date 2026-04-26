"use client";

import { useTribeStore } from "@/store/use-tribe-store";
import { useUIStore } from "@/store/use-ui-store";
import { BottomNav } from "./bottom-nav";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isSwitchingCity = useTribeStore((s) => s.isSwitchingCity);
  const toastMessage = useUIStore((s) => s.toastMessage);

  return (
    <div className="flex min-h-screen bg-white relative">
      {/* City Switch Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500 pointer-events-none",
          isSwitchingCity ? "opacity-100 pointer-events-auto" : "opacity-0"
        )}
      >
        <div className="relative">
          <div className="h-32 w-32 rounded-full border-4 border-black/5 animate-[pulse_2s_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-black animate-spin" />
          </div>
        </div>
        <div className="mt-8 text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tighter text-black">Traveling...</h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing local pulse</p>
        </div>
      </div>

      <div className="flex flex-1 justify-center">
        <main className="w-full max-w-[800px] flex px-0 sm:px-4">
          <div className={cn(
            "flex-1 w-full min-h-screen pb-28 sm:pb-32 pt-0 bg-white transition-all duration-700",
            isSwitchingCity ? "scale-95 blur-sm opacity-50" : "scale-100 blur-0 opacity-100"
          )}>
            {children}
          </div>
        </main>
      </div>
      <BottomNav />

      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
