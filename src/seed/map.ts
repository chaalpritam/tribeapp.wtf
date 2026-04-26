import type { NearbyUser, MapEvent } from "@/types";
import { user1, user2, user15 } from "./users";
import { tribes } from "./tribes";

const bangaloreCyclingTribe = tribes.find((t) => t.id === "tribe-blr-cycling");
const bangaloreFoodTribe = tribes.find((t) => t.id === "tribe-blr-food");
const bangaloreFitnessTribe = tribes.find((t) => t.id === "tribe-blr-fitness");

export const nearbyUsers: NearbyUser[] = [
  {
    id: "nearby-1",
    user: user1,
    distance: 0.3,
    sharedTribes: ["Bangalore Cycling Club", "Bangalore Foodies"],
    isOnline: true,
  },
  {
    id: "nearby-2",
    user: user2,
    distance: 0.8,
    sharedTribes: ["Bangalore Foodies"],
    isOnline: true,
  },
  {
    id: "nearby-3",
    user: user15,
    distance: 1.2,
    sharedTribes: ["Bangalore Fitness Tribe", "Bangalore Foodies"],
    isOnline: false,
  },
];

export const mapEvents: MapEvent[] = [
  {
    id: "map-evt-1",
    title: "Saturday Morning Ride",
    description: "Weekly cycling meetup starting from Cubbon Park. All levels welcome!",
    location: "Cubbon Park Entrance, Bangalore",
    coordinates: { latitude: 12.9763, longitude: 77.5929 },
    startTime: "2024-07-20T06:30:00Z",
    attendees: 24,
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=400&fit=crop",
    tribe: bangaloreCyclingTribe,
  },
  {
    id: "map-evt-2",
    title: "Street Food Walk",
    description: "Exploring the best street food stalls in VV Puram Food Street.",
    location: "VV Puram Food Street, Bangalore",
    coordinates: { latitude: 12.9492, longitude: 77.5713 },
    startTime: "2024-07-21T18:00:00Z",
    attendees: 15,
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop",
    tribe: bangaloreFoodTribe,
  },
  {
    id: "map-evt-3",
    title: "Sunrise Yoga at Lalbagh",
    description: "Free community yoga session in the botanical garden. Bring your own mat.",
    location: "Lalbagh Botanical Garden, Bangalore",
    coordinates: { latitude: 12.9507, longitude: 77.5848 },
    startTime: "2024-07-22T06:00:00Z",
    attendees: 40,
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop",
    tribe: bangaloreFitnessTribe,
  },
];
