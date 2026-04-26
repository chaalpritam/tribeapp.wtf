"use client";

import { create } from "zustand";

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "event" | "channel" | "tip" | "join";
  user: string;
  avatar: string;
  message: string;
  time: string;
  isRead: boolean;
  href?: string;
}

const seedNotifications: Notification[] = [];

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notif: Omit<Notification, "id" | "isRead" | "time"> & { href?: string }) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: seedNotifications,
  unreadCount: seedNotifications.filter((n) => !n.isRead).length,

  addNotification: (notif) => {
    const newNotif: Notification = {
      ...notif,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isRead: false,
      time: "Just now",
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  markRead: (id) =>
    set((state) => {
      const notif = state.notifications.find((n) => n.id === id);
      if (!notif || notif.isRead) return state;
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: state.unreadCount - 1,
      };
    }),
}));
