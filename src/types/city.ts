export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  memberCount: number;
  activeTribes: number;
  coordinates: Coordinates;
  accentColor: string;
  emoji?: string;
  memberCountDisplay?: string;
  farcasterChannelId?: string;
}
