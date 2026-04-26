"use client";

import { useState } from "react";
import { useTribeStore } from "@/store/use-tribe-store";
import { useAuth } from "@/hooks/use-auth";
import { WalletButton } from "@/components/tribe/wallet-button";
import { ChevronLeft, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "@/store/use-notification-store";
import { CitySwitcher } from "./city-switcher";

interface AppHeaderProps {
    title?: string;
    showBackButton?: boolean;
}

export function AppHeader({ title, showBackButton }: AppHeaderProps) {
    const { currentCity } = useTribeStore();
    const { profile } = useAuth();
    const router = useRouter();
    const unreadCount = useNotificationStore((s) => s.unreadCount);
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

    return (
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-[#f0f0f0]">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {showBackButton ? (
                    <button
                        onClick={() => router.back()}
                        className="h-9 w-9 sm:h-10 sm:w-10 flex-none flex items-center justify-center rounded-xl bg-[#f5f5f5] hover:bg-[#eeeeee] transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                ) : (
                    <div className="h-9 w-9 sm:h-10 sm:w-10 flex-none flex items-center justify-center rounded-xl bg-black text-white text-base sm:text-lg font-black tracking-tighter shadow-xl shadow-black/10">
                        {title ? title.charAt(0) : (currentCity?.name.charAt(0) || "T")}
                    </div>
                )}
                <div className="flex flex-col min-w-0">
                    <h1 className="text-base sm:text-xl font-bold tracking-tight leading-none truncate">
                        {title || currentCity?.name || "Tribe"}
                    </h1>
                    <div className="flex items-center gap-1 sm:gap-1.5 mt-1 sm:mt-1.5 text-left">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                            {currentCity?.name || "Local"}
                        </span>
                        <button
                            onClick={() => setIsSwitcherOpen(true)}
                            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity whitespace-nowrap"
                        >
                            (Change)
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-none">
                <Link
                    href="/notifications"
                    className="relative h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl bg-[#f5f5f5] hover:bg-[#eeeeee] transition-colors"
                >
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-[9px] sm:text-[10px] font-bold text-white ring-2 ring-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Link>
                <div className="flex flex-col items-end gap-1">
                    <WalletButton className="h-9 sm:h-10 rounded-xl px-3 sm:px-4 text-[10px] sm:text-xs font-bold" />
                    {profile && (
                        <span className="hidden sm:block text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                            @{profile.username}
                        </span>
                    )}
                </div>
            </div>

            <CitySwitcher
                isOpen={isSwitcherOpen}
                onOpenChange={setIsSwitcherOpen}
            />
        </div>
    );
}
