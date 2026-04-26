"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, UserPlus, Calendar, Hash, Coins, Users, CheckCircle, Bell } from "lucide-react";
import { useNotificationStore } from "@/store/use-notification-store";
import { AppHeader } from "@/components/layout/app-header";

const iconMap: Record<string, React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  event: Calendar,
  channel: Hash,
  tip: Coins,
  join: Users,
};

const colorMap: Record<string, string> = {
  like: "text-rose-500 bg-rose-50",
  comment: "text-blue-500 bg-blue-50",
  follow: "text-indigo-500 bg-indigo-50",
  event: "text-green-500 bg-green-50",
  channel: "text-cyan-500 bg-cyan-50",
  tip: "text-amber-500 bg-amber-50",
  join: "text-violet-500 bg-violet-50",
};

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, markAllRead, markRead } = useNotificationStore();

  const handleNotifClick = (id: string, href?: string) => {
    markRead(id);
    if (href) {
      router.push(href);
    }
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Activity" />

      <div className="sticky top-[57px] sm:top-[73px] z-30 bg-white/80 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-[#f0f0f0]">
        <h2 className="text-xl font-bold tracking-tight">Recent</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/5 text-primary text-[11px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-all active:scale-95"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => {
            const Icon = iconMap[notif.type] || Heart;
            const colorClass = colorMap[notif.type] || colorMap.like;

            return (
              <button
                key={notif.id}
                onClick={() => handleNotifClick(notif.id, notif.href)}
                className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-[20px] sm:rounded-[28px] text-left transition-all hover:shadow-xl hover:shadow-black/[0.03] active:scale-[0.98] border ${!notif.isRead ? "bg-white border-primary/20 shadow-md shadow-primary/5" : "bg-white border-[#f0f0f0]"
                  }`}
              >
                <div className="relative shrink-0">
                  <div className="relative h-11 w-11 sm:h-14 sm:w-14 overflow-hidden rounded-[16px] sm:rounded-[20px] border border-[#f0f0f0]">
                    <Image src={notif.avatar} alt="" fill className="object-cover" sizes="56px" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] leading-tight">
                    <span className="font-bold">@{notif.user}</span>{" "}
                    <span className="text-[#666] font-medium">{notif.message}</span>
                  </p>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{notif.time}</p>
                </div>
                {!notif.isRead && (
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {notifications.length === 0 && (
          <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-[40px] bg-muted/30 p-10">
              <Bell className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-black">All caught up!</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">Interactions will show up here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
