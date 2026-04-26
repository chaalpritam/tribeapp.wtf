export type TribeCategory =
  | "cycling"
  | "pets"
  | "film"
  | "crypto"
  | "fitness"
  | "food"
  | "gaming"
  | "tech"
  | "arts"
  | "music"
  | "books"
  | "parenting"
  | "photography"
  | "travel"
  | "sports"
  | "general";

export interface Subchannel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  members: number;
}

export interface Tribe {
  id: string;
  cityId: string;
  name: string;
  description: string;
  category: TribeCategory;
  icon: string;
  color: string;
  imageUrl?: string;
  members: number;
  isPrivate: boolean;
  moderators: string[];
  rules: string[];
  subchannels: Subchannel[];
  isJoined: boolean;
}
