import type { KarmaLevel, TribeCategory } from "@/types";

export const colors = {
  primary: "#6366F1",
  primaryLight: "#A5B4FC",
  primaryDark: "#4338CA",
  primarySoft: "#EEF2FF",
  accent: "#14B8A6",
  accentSoft: "#CCFBF1",
  coral: "#FB7185",
  coralSoft: "#FFE4E6",
  mint: "#34D399",
  mintSoft: "#D1FAE5",
  lavender: "#A78BFA",
  lavenderSoft: "#EDE9FE",
  peach: "#FB923C",
  peachSoft: "#FFEDD5",
  sky: "#38BDF8",
  skySoft: "#E0F2FE",
  sage: "#A3E635",
  sageSoft: "#ECFCCB",
  gold: "#FBBF24",
  goldSoft: "#FEF3C7",
  error: "#EF4444",
  errorSoft: "#FEE2E2",
  success: "#22C55E",
  successSoft: "#DCFCE7",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  info: "#3B82F6",
  infoSoft: "#DBEAFE",
  like: "#F472B6",
  likeSoft: "#FCE7F3",
  comment: "#60A5FA",
  share: "#34D399",
  bookmark: "#FBBF24",
} as const;

export const spacing = {
  xxxs: 2,
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  mega: 48,
  giga: 64,
} as const;

export const cornerRadius = {
  xs: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 20,
  xxl: 24,
  xxxl: 32,
  pill: 999,
} as const;

export const avatarSizes = {
  xxs: 20,
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
  xxl: 96,
  hero: 120,
} as const;

export const shadows = {
  subtle: "0 2px 4px rgba(0,0,0,0.04)",
  small: "0 4px 8px rgba(0,0,0,0.06)",
  medium: "0 8px 16px rgba(0,0,0,0.08)",
  large: "0 12px 24px rgba(0,0,0,0.1)",
  floating: "0 16px 32px rgba(0,0,0,0.12)",
} as const;

export const karmaLevelConfig: Record<
  KarmaLevel,
  { label: string; icon: string; color: string; minKarma: number }
> = {
  newcomer: { label: "Newcomer", icon: "Leaf", color: "#8BC34A", minKarma: 0 },
  neighbor: { label: "Neighbor", icon: "HandMetal", color: "#03A9F4", minKarma: 100 },
  local: { label: "Local", icon: "Home", color: "#9C27B0", minKarma: 500 },
  trusted: { label: "Trusted", icon: "ShieldCheck", color: "#FF9800", minKarma: 1500 },
  pillar: { label: "Pillar", icon: "Landmark", color: "#F44336", minKarma: 5000 },
  legend: { label: "Legend", icon: "Crown", color: "#FFD700", minKarma: 15000 },
};

export const tribeCategoryConfig: Record<
  TribeCategory,
  { label: string; icon: string; color: string }
> = {
  cycling: { label: "Cycling", icon: "Bike", color: "#4CAF50" },
  pets: { label: "Pets", icon: "PawPrint", color: "#FF9800" },
  film: { label: "Film & Entertainment", icon: "Film", color: "#9C27B0" },
  crypto: { label: "Crypto & Web3", icon: "Bitcoin", color: "#FFC107" },
  fitness: { label: "Fitness", icon: "Dumbbell", color: "#F44336" },
  food: { label: "Food & Dining", icon: "UtensilsCrossed", color: "#E91E63" },
  gaming: { label: "Gaming", icon: "Gamepad2", color: "#673AB7" },
  tech: { label: "Technology", icon: "Laptop", color: "#2196F3" },
  arts: { label: "Arts & Culture", icon: "Palette", color: "#FF5722" },
  music: { label: "Music", icon: "Music", color: "#00BCD4" },
  books: { label: "Books", icon: "BookOpen", color: "#795548" },
  parenting: { label: "Parenting", icon: "Baby", color: "#8BC34A" },
  photography: { label: "Photography", icon: "Camera", color: "#607D8B" },
  travel: { label: "Travel", icon: "Plane", color: "#03A9F4" },
  sports: { label: "Sports", icon: "Trophy", color: "#4CAF50" },
  general: { label: "General", icon: "MessageCircle", color: "#9E9E9E" },
};

export function getNextKarmaLevel(level: KarmaLevel): KarmaLevel | null {
  const levels: KarmaLevel[] = ["newcomer", "neighbor", "local", "trusted", "pillar", "legend"];
  const idx = levels.indexOf(level);
  return idx < levels.length - 1 ? levels[idx + 1] : null;
}

export function getKarmaProgress(totalKarma: number, level: KarmaLevel): number {
  const nextLevel = getNextKarmaLevel(level);
  if (!nextLevel) return 100;
  const current = karmaLevelConfig[level].minKarma;
  const next = karmaLevelConfig[nextLevel].minKarma;
  return Math.min(((totalKarma - current) / (next - current)) * 100, 100);
}
