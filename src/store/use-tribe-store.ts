"use client";

import { create } from "zustand";
import type { City, Tweet, Poll, Task, Crowdfund, Tribe, ExploreItem, User } from "@/types";
import { useNotificationStore } from "./use-notification-store";

interface TribeStore {
  // State
  currentCity: City | null;
  tweets: Tweet[];
  events: ExploreItem[];
  polls: Poll[];
  tasks: Task[];
  crowdfunds: Crowdfund[];
  tribes: Tribe[];
  currentUser: User | null;
  isSwitchingCity: boolean;

  // City actions
  setInitialData: (data: {
    city: City;
    user: User;
    tweets: Tweet[];
    events: ExploreItem[];
    polls: Poll[];
    tasks: Task[];
    crowdfunds: Crowdfund[];
    tribes: Tribe[];
  }) => void;
  switchCity: (
    city: City,
    data: {
      tweets: Tweet[];
      events: ExploreItem[];
      polls: Poll[];
      tasks: Task[];
      crowdfunds: Crowdfund[];
      tribes: Tribe[];
    }
  ) => void;

  // Tweet actions
  likeTweet: (tweetId: string) => void;
  bookmarkTweet: (tweetId: string) => void;
  tipTweet: (tweetId: string, amount: number) => void;
  addTweet: (tweet: Tweet) => void;

  // Poll actions
  votePoll: (pollId: string, optionId: string) => void;
  addPoll: (poll: Poll) => void;

  // Task actions
  addTask: (task: Task) => void;

  // Crowdfund actions
  addCrowdfund: (crowdfund: Crowdfund) => void;

  // Tribe actions
  joinTribe: (tribeId: string) => void;
  leaveTribe: (tribeId: string) => void;
  addTribe: (tribe: Tribe) => void;

  // Event actions
  addEvent: (event: ExploreItem) => void;

  // User actions
  updateCurrentUser: (updates: Partial<User>) => void;
}

export const useTribeStore = create<TribeStore>((set, get) => ({
  currentCity: null,
  tweets: [],
  events: [],
  polls: [],
  tasks: [],
  crowdfunds: [],
  tribes: [],
  currentUser: null,
  isSwitchingCity: false,

  setInitialData: (data) =>
    set({
      currentCity: data.city,
      currentUser: data.user,
      tweets: data.tweets,
      events: data.events,
      polls: data.polls,
      tasks: data.tasks,
      crowdfunds: data.crowdfunds,
      tribes: data.tribes,
    }),

  switchCity: (city, data) => {
    set({ isSwitchingCity: true });
    setTimeout(() => {
      set({
        currentCity: city,
        tweets: data.tweets,
        events: data.events,
        polls: data.polls,
        tasks: data.tasks,
        crowdfunds: data.crowdfunds,
        tribes: data.tribes,
      });
      setTimeout(() => {
        set({ isSwitchingCity: false });
      }, 800);
    }, 400);
  },

  likeTweet: (tweetId) => {
    const tweet = get().tweets.find((c) => c.id === tweetId);
    const wasLiked = tweet?.isLiked;
    set((state) => ({
      tweets: state.tweets.map((c) =>
        c.id === tweetId
          ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      ),
    }));

    if (tweet && !wasLiked) {
      const currentUser = get().currentUser;
      if (currentUser && tweet.user.id !== currentUser.id) {
        useNotificationStore.getState().addNotification({
          type: "like",
          user: tweet.user.displayName,
          avatar: tweet.user.avatarUrl,
          message: `Your post "${tweet.caption.slice(0, 40)}..." got a new like`,
          href: "/home",
        });
      }
    }
  },

  bookmarkTweet: (tweetId) =>
    set((state) => ({
      tweets: state.tweets.map((c) =>
        c.id === tweetId ? { ...c, isSaved: !c.isSaved } : c
      ),
    })),

  tipTweet: (tweetId, amount) => {
    const tweet = get().tweets.find((c) => c.id === tweetId);
    set((state) => ({
      tweets: state.tweets.map((c) =>
        c.id === tweetId
          ? { ...c, tipCount: c.tipCount + 1, totalTips: c.totalTips + amount }
          : c
      ),
    }));
    if (tweet) {
      useNotificationStore.getState().addNotification({
        type: "tip",
        user: tweet.user.displayName,
        avatar: tweet.user.avatarUrl,
        message: `received a tip on "${tweet.caption.slice(0, 30)}..."`,
        href: "/wallet",
      });
    }
  },

  addTweet: (tweet) => {
    set((state) => ({ tweets: [tweet, ...state.tweets] }));
  },

  votePoll: (pollId, optionId) =>
    set((state) => ({
      polls: state.polls.map((p) =>
        p.id === pollId
          ? {
              ...p,
              userVote: optionId,
              votes: { ...p.votes, [optionId]: (p.votes[optionId] || 0) + 1 },
            }
          : p
      ),
    })),

  addPoll: (poll) => {
    set((state) => ({ polls: [poll, ...state.polls] }));
  },

  addTask: (task) => {
    set((state) => ({ tasks: [task, ...state.tasks] }));
  },

  addCrowdfund: (crowdfund) => {
    set((state) => ({ crowdfunds: [crowdfund, ...state.crowdfunds] }));
  },

  joinTribe: (tribeId) => {
    const tribe = get().tribes.find((t) => t.id === tribeId);
    set((state) => ({
      tribes: state.tribes.map((t) =>
        t.id === tribeId ? { ...t, isJoined: true } : t
      ),
    }));
    if (tribe) {
      useNotificationStore.getState().addNotification({
        type: "join",
        user: tribe.name,
        avatar: tribe.imageUrl || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=100&h=100&fit=crop",
        message: `You joined ${tribe.name}`,
        href: `/tribes/${tribeId}`,
      });
    }
  },

  leaveTribe: (tribeId) =>
    set((state) => ({
      tribes: state.tribes.map((t) =>
        t.id === tribeId ? { ...t, isJoined: false } : t
      ),
    })),

  addTribe: (tribe) =>
    set((state) => ({ tribes: [tribe, ...state.tribes] })),

  addEvent: (event) => {
    set((state) => ({ events: [event, ...state.events] }));
  },

  updateCurrentUser: (updates) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
    })),
}));
