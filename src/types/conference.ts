import type { Coordinates } from "./city";

export type SponsorTier = "platinum" | "gold" | "silver" | "bronze" | "community";

export interface ConferenceTrack {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  eventCount: number;
}

export interface ConferenceHost {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
}

export interface ConferenceSponsor {
  id: string;
  name: string;
  tier: SponsorTier;
  logoUrl: string;
  websiteUrl: string;
}

export interface ConferenceVenue {
  id: string;
  name: string;
  address: string;
  description: string;
  imageUrl: string;
  mapUrl?: string;
  capacity?: number;
  amenities: string[];
  coordinates?: Coordinates;
}

export interface ConferenceSpeaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  avatarUrl: string;
  twitterHandle?: string;
  linkedInUrl?: string;
  farcasterHandle?: string;
  talks: string[];
  isFollowing: boolean;
}

export interface ConferenceEvent {
  id: string;
  conferenceId: string;
  title: string;
  description: string;
  track?: ConferenceTrack;
  venue: ConferenceVenue;
  startTime: string;
  endTime: string;
  speakers: ConferenceSpeaker[];
  capacity?: number;
  registeredCount: number;
  requiresRegistration: boolean;
  isKeynote: boolean;
  tags: string[];
  isBookmarked: boolean;
  isRegistered: boolean;
}

export interface Conference {
  id: string;
  name: string;
  tagline: string;
  description: string;
  city: string;
  country: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  venue: string;
  venueAddress: string;
  imageUrl: string;
  logoUrl: string;
  websiteUrl: string;
  color: string;
  attendeeCount: number;
  speakerCount: number;
  eventCount: number;
  tracks: ConferenceTrack[];
  coHosts: ConferenceHost[];
  sponsors: ConferenceSponsor[];
  isActive: boolean;
}
