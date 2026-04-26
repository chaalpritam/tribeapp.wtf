"use client";

import { create } from "zustand";

type TabId = "home" | "explore" | "map" | "tribes" | "profile";

interface UIStore {
  activeTab: TabId;
  showCreateModal: boolean;
  showCitySwitcher: boolean;
  showNotifications: boolean;
  theme: "light" | "dark" | "system";
  toastMessage: string | null;

  setActiveTab: (tab: TabId) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowCitySwitcher: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  showToast: (message: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: "home",
  showCreateModal: false,
  showCitySwitcher: false,
  showNotifications: false,
  theme: "system",
  toastMessage: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowCreateModal: (show) => set({ showCreateModal: show }),
  setShowCitySwitcher: (show) => set({ showCitySwitcher: show }),
  setShowNotifications: (show) => set({ showNotifications: show }),
  setTheme: (theme) => set({ theme }),
  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => set({ toastMessage: null }), 3000);
  },
}));
