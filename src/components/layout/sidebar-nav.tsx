"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Map,
  Users,
  User,
  MessageCircle,
  Wallet,
  Bell,
  Settings,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletButton } from "@/components/tribe/wallet-button";
import { useNotificationStore } from "@/store/use-notification-store";

const mainLinks = [
  { id: "home", label: "Home", icon: Home, href: "/home" },
  { id: "explore", label: "Explore", icon: Compass, href: "/explore" },
  { id: "map", label: "Map", icon: Map, href: "/map" },
  { id: "tribes", label: "Tribes", icon: Users, href: "/tribes" },
  { id: "chat", label: "Chat", icon: MessageCircle, href: "/chat" },
];

const secondaryLinks = [
  { id: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/notifications" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <aside className="hidden h-screen flex-col bg-white sticky top-0 md:flex md:w-24 lg:w-[600px]">
      <div className="flex px-6 py-12 lg:px-10">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-[28px] font-black tracking-[-1.5px] lg:block hidden group-hover:opacity-70 transition-opacity">tribe</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white font-black text-lg lg:hidden">
            t
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 px-4 lg:px-6">
        {mainLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.id}
              href={link.href}
              className={cn(
                "group flex items-center gap-5 rounded-[20px] px-4 py-4 transition-all active:scale-95",
                isActive
                  ? "bg-muted font-bold text-black"
                  : "text-[#666] hover:bg-muted/50 hover:text-black"
              )}
            >
              <Icon
                className={cn(
                  "h-[26px] w-[26px] transition-transform group-hover:scale-110",
                  isActive ? "text-primary stroke-[2.5px]" : "stroke-[2px]"
                )}
              />
              <span className="text-[17px] font-medium lg:block hidden tracking-tight">{link.label}</span>
            </Link>
          );
        })}

        <Link
          href="/create"
          className="group flex items-center gap-5 rounded-[20px] px-4 py-4 text-[#666] transition-all hover:bg-muted/50 hover:text-black active:scale-95"
        >
          <PlusCircle className="h-[26px] w-[26px] transition-transform group-hover:scale-110 stroke-[2px]" />
          <span className="text-[17px] font-medium lg:block hidden tracking-tight">Create</span>
        </Link>

        {/* Separator */}
        <div className="mx-4 my-6 h-[1px] bg-[#f0f0f0]" />

        <div className="space-y-2">
          {secondaryLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            const showBadge = link.id === "notifications" && unreadCount > 0;
            return (
              <Link
                key={link.id}
                href={link.href}
                className={cn(
                  "group flex items-center gap-5 rounded-[20px] px-4 py-4 transition-all active:scale-95",
                  isActive
                    ? "bg-muted font-bold text-black"
                    : "text-[#666] hover:bg-muted/50 hover:text-black"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-[26px] w-[26px] transition-transform group-hover:scale-110",
                      isActive ? "text-primary stroke-[2.5px]" : "stroke-[2px]"
                    )}
                  />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[17px] font-medium lg:block hidden tracking-tight">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Wallet connection indicator */}
      <div className="p-6 lg:p-10 w-full">
        <WalletButton className="w-full justify-center lg:justify-start rounded-[20px] h-14 font-bold" compact={false} />
      </div>
    </aside>
  );
}
