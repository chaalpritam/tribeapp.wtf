import type { User, Achievement } from "@/types";

// Shared achievements
export const achievements: Achievement[] = [
  {
    id: "ach-1",
    name: "First Post",
    description: "Published your first cast",
    icon: "pencil",
    earnedAt: "2024-01-15",
    isEarned: true,
  },
  {
    id: "ach-2",
    name: "Helpful Hand",
    description: "Helped 10 neighbors with tasks",
    icon: "handshake",
    earnedAt: "2024-02-20",
    isEarned: true,
  },
  {
    id: "ach-3",
    name: "Event Organizer",
    description: "Organized 5 community events",
    icon: "calendar",
    earnedAt: "2024-03-10",
    isEarned: true,
  },
  {
    id: "ach-4",
    name: "Community Builder",
    description: "Invited 20 people to the platform",
    icon: "users",
    earnedAt: "2024-04-05",
    isEarned: true,
  },
  {
    id: "ach-5",
    name: "Top Contributor",
    description: "Reached top 10 in your city",
    icon: "trophy",
    earnedAt: null,
    isEarned: false,
  },
  {
    id: "ach-6",
    name: "Tribe Leader",
    description: "Founded a tribe with 100+ members",
    icon: "crown",
    earnedAt: null,
    isEarned: false,
  },
];

export const currentUser: User = {
  id: "u1",
  username: "chaalpritam",
  displayName: "Pritam Chaal",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
  location: "Koramangala, Bangalore",
  cityId: "bangalore",
  isVerified: true,
  bio: "Building communities, one neighborhood at a time",
  joinedDate: "2024-01-01",
  karma: {
    totalKarma: 1250,
    level: "local",
    breakdown: {
      postsKarma: 450,
      helpfulKarma: 320,
      eventsKarma: 280,
      communityKarma: 200,
    },
    cityKarma: { bangalore: 1250 },
    achievements: achievements.slice(0, 4),
  },
  wallet: {
    balance: 2450.5,
    currency: "INR",
    currencySymbol: "₹",
    transactions: [
      {
        id: "tx-1",
        type: "tipReceived",
        amount: 50,
        currency: "INR",
        fromUserId: "u2",
        description: "Tip from John Doe",
        timestamp: "2024-06-15T10:30:00Z",
      },
      {
        id: "tx-2",
        type: "tipSent",
        amount: 25,
        currency: "INR",
        toUserId: "u3",
        description: "Tip to Sarah Kumar",
        timestamp: "2024-06-14T14:20:00Z",
      },
      {
        id: "tx-3",
        type: "deposit",
        amount: 1000,
        currency: "INR",
        description: "Wallet top-up",
        timestamp: "2024-06-10T09:00:00Z",
      },
    ],
  },
};

export const user1: User = {
  id: "u2",
  username: "johndoe",
  displayName: "John Doe",
  avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=150&h=150&fit=crop",
  location: "Indiranagar, Bangalore",
  cityId: "bangalore",
  isVerified: true,
  bio: "Coffee enthusiast and weekend cyclist",
  joinedDate: "2024-02-15",
  karma: {
    totalKarma: 890,
    level: "neighbor",
    breakdown: {
      postsKarma: 320,
      helpfulKarma: 230,
      eventsKarma: 190,
      communityKarma: 150,
    },
    cityKarma: { bangalore: 890 },
    achievements: achievements.slice(0, 2),
  },
};

export const user2: User = {
  id: "u3",
  username: "sarahkumar",
  displayName: "Sarah Kumar",
  avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
  location: "HSR Layout, Bangalore",
  cityId: "bangalore",
  isVerified: false,
  bio: "Urban gardener and food lover",
  joinedDate: "2024-01-20",
  karma: {
    totalKarma: 2100,
    level: "trusted",
    breakdown: {
      postsKarma: 750,
      helpfulKarma: 540,
      eventsKarma: 470,
      communityKarma: 340,
    },
    cityKarma: { bangalore: 2100 },
    achievements: achievements.slice(0, 3),
  },
};

export const user3: User = {
  id: "u4",
  username: "mikejohnson",
  displayName: "Mike Johnson",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
  location: "Whitefield, Bangalore",
  cityId: "bangalore",
  isVerified: false,
  bio: "Tech nerd and board game fanatic",
  joinedDate: "2024-03-10",
  karma: {
    totalKarma: 450,
    level: "neighbor",
    breakdown: {
      postsKarma: 160,
      helpfulKarma: 120,
      eventsKarma: 100,
      communityKarma: 70,
    },
    cityKarma: { bangalore: 450 },
    achievements: achievements.slice(0, 1),
  },
};

export const user4: User = {
  id: "u5",
  username: "priyamehta",
  displayName: "Priya Mehta",
  avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
  location: "Bandra, Mumbai",
  cityId: "mumbai",
  isVerified: true,
  bio: "Bollywood buff and street food connoisseur",
  joinedDate: "2024-01-05",
  karma: {
    totalKarma: 3200,
    level: "trusted",
    breakdown: {
      postsKarma: 1150,
      helpfulKarma: 820,
      eventsKarma: 710,
      communityKarma: 520,
    },
    cityKarma: { mumbai: 3200 },
    achievements: achievements.slice(0, 4),
  },
};

export const user5: User = {
  id: "u6",
  username: "arjunpatel",
  displayName: "Arjun Patel",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
  location: "Andheri, Mumbai",
  cityId: "mumbai",
  isVerified: false,
  bio: "Cricket lover and amateur photographer",
  joinedDate: "2024-04-01",
  karma: {
    totalKarma: 650,
    level: "local",
    breakdown: {
      postsKarma: 230,
      helpfulKarma: 170,
      eventsKarma: 140,
      communityKarma: 110,
    },
    cityKarma: { mumbai: 650 },
    achievements: achievements.slice(0, 2),
  },
};

export const user6: User = {
  id: "u7",
  username: "nehasharma",
  displayName: "Neha Sharma",
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
  location: "Connaught Place, Delhi",
  cityId: "delhi",
  isVerified: true,
  bio: "Heritage walks and history enthusiast",
  joinedDate: "2023-12-01",
  karma: {
    totalKarma: 5200,
    level: "pillar",
    breakdown: {
      postsKarma: 1870,
      helpfulKarma: 1340,
      eventsKarma: 1150,
      communityKarma: 840,
    },
    cityKarma: { delhi: 5200 },
    achievements: achievements.slice(0, 5),
  },
};

export const user7: User = {
  id: "u8",
  username: "rahulverma",
  displayName: "Rahul Verma",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
  location: "Saket, Delhi",
  cityId: "delhi",
  isVerified: false,
  bio: "Foodie and weekend explorer",
  joinedDate: "2024-05-10",
  karma: {
    totalKarma: 280,
    level: "neighbor",
    breakdown: {
      postsKarma: 100,
      helpfulKarma: 75,
      eventsKarma: 60,
      communityKarma: 45,
    },
    cityKarma: { delhi: 280 },
    achievements: achievements.slice(0, 1),
  },
};

export const user8: User = {
  id: "u9",
  username: "emilychen",
  displayName: "Emily Chen",
  avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop",
  location: "Mission District, San Francisco",
  cityId: "san-francisco",
  isVerified: true,
  bio: "Startup founder and trail runner",
  joinedDate: "2023-10-15",
  karma: {
    totalKarma: 8900,
    level: "pillar",
    breakdown: {
      postsKarma: 3200,
      helpfulKarma: 2290,
      eventsKarma: 1970,
      communityKarma: 1440,
    },
    cityKarma: { "san-francisco": 8900 },
    achievements: achievements.slice(0, 5),
  },
};

export const user9: User = {
  id: "u10",
  username: "alexrodriguez",
  displayName: "Alex Rodriguez",
  avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
  location: "SoMa, San Francisco",
  cityId: "san-francisco",
  isVerified: false,
  bio: "Designer and coffee snob",
  joinedDate: "2024-02-01",
  karma: {
    totalKarma: 1650,
    level: "trusted",
    breakdown: {
      postsKarma: 590,
      helpfulKarma: 425,
      eventsKarma: 370,
      communityKarma: 265,
    },
    cityKarma: { "san-francisco": 1650 },
    achievements: achievements.slice(0, 3),
  },
};

export const user10: User = {
  id: "u11",
  username: "jameswilson",
  displayName: "James Wilson",
  avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop",
  location: "Shoreditch, London",
  cityId: "london",
  isVerified: true,
  bio: "Community organizer and pub quiz champion",
  joinedDate: "2023-08-01",
  karma: {
    totalKarma: 16500,
    level: "legend",
    breakdown: {
      postsKarma: 5940,
      helpfulKarma: 4250,
      eventsKarma: 3660,
      communityKarma: 2650,
    },
    cityKarma: { london: 16500 },
    achievements: achievements,
  },
};

export const user11: User = {
  id: "u12",
  username: "sophietaylor",
  displayName: "Sophie Taylor",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
  location: "Camden, London",
  cityId: "london",
  isVerified: false,
  bio: "Artist and vintage market lover",
  joinedDate: "2024-03-20",
  karma: {
    totalKarma: 920,
    level: "local",
    breakdown: {
      postsKarma: 330,
      helpfulKarma: 240,
      eventsKarma: 200,
      communityKarma: 150,
    },
    cityKarma: { london: 920 },
    achievements: achievements.slice(0, 2),
  },
};

export const user12: User = {
  id: "u13",
  username: "davidkim",
  displayName: "David Kim",
  avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop",
  location: "Williamsburg, Brooklyn",
  cityId: "new-york",
  isVerified: true,
  bio: "Chef and neighborhood garden advocate",
  joinedDate: "2023-11-01",
  karma: {
    totalKarma: 6800,
    level: "pillar",
    breakdown: {
      postsKarma: 2450,
      helpfulKarma: 1750,
      eventsKarma: 1500,
      communityKarma: 1100,
    },
    cityKarma: { "new-york": 6800 },
    achievements: achievements.slice(0, 5),
  },
};

export const user13: User = {
  id: "u14",
  username: "mariagarcia",
  displayName: "Maria Garcia",
  avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop",
  location: "East Village, Manhattan",
  cityId: "new-york",
  isVerified: true,
  bio: "Dance instructor and community mentor",
  joinedDate: "2024-01-10",
  karma: {
    totalKarma: 4200,
    level: "pillar",
    breakdown: {
      postsKarma: 1510,
      helpfulKarma: 1080,
      eventsKarma: 930,
      communityKarma: 680,
    },
    cityKarma: { "new-york": 4200 },
    achievements: achievements.slice(0, 4),
  },
};

export const user14: User = {
  id: "u15",
  username: "ryanoconnor",
  displayName: "Ryan O'Connor",
  avatarUrl: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop",
  location: "Upper West Side, Manhattan",
  cityId: "new-york",
  isVerified: false,
  bio: "Runner and aspiring brewer",
  joinedDate: "2024-06-01",
  karma: {
    totalKarma: 180,
    level: "neighbor",
    breakdown: {
      postsKarma: 65,
      helpfulKarma: 45,
      eventsKarma: 40,
      communityKarma: 30,
    },
    cityKarma: { "new-york": 180 },
    achievements: [],
  },
};

export const user15: User = {
  id: "u16",
  username: "lisabrown",
  displayName: "Lisa Brown",
  avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop",
  location: "MG Road, Bangalore",
  cityId: "bangalore",
  isVerified: true,
  bio: "Yoga teacher and sustainable living advocate",
  joinedDate: "2024-01-25",
  karma: {
    totalKarma: 2800,
    level: "trusted",
    breakdown: {
      postsKarma: 1010,
      helpfulKarma: 720,
      eventsKarma: 620,
      communityKarma: 450,
    },
    cityKarma: { bangalore: 2800 },
    achievements: achievements.slice(0, 4),
  },
};

export const users: User[] = [
  currentUser,
  user1,
  user2,
  user3,
  user4,
  user5,
  user6,
  user7,
  user8,
  user9,
  user10,
  user11,
  user12,
  user13,
  user14,
  user15,
];
