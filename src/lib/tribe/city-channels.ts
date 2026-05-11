import { cities as curatedCities } from "@/lib/cities";
import type { City } from "@/types";
import { listChannels, type ChannelInfo } from "./channels";

const CHANNEL_KIND_CITY = 2;
const DEFAULT_ACCENT = "#6366F1";
const DEFAULT_COUNTRY = "Protocol";
const DEFAULT_COUNTRY_CODE = "UN";
const DEFAULT_CITY_IMAGE =
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=800&fit=crop";

function titleFromId(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toCity(channel: ChannelInfo, curated?: City): City {
  const lat = channel.latitude ?? curated?.coordinates.latitude ?? 0;
  const lon = channel.longitude ?? curated?.coordinates.longitude ?? 0;
  return {
    id: channel.id,
    name: channel.name?.trim() || curated?.name || titleFromId(channel.id),
    country: curated?.country || DEFAULT_COUNTRY,
    countryCode: curated?.countryCode || DEFAULT_COUNTRY_CODE,
    imageUrl: curated?.imageUrl || DEFAULT_CITY_IMAGE,
    coordinates: { latitude: lat, longitude: lon },
    accentColor: curated?.accentColor || DEFAULT_ACCENT,
    emoji: curated?.emoji,
  };
}

export async function listProtocolCities(limit = 200): Promise<City[]> {
  const channels = await listChannels(limit, 0);
  const curatedById = new Map(curatedCities.map((city) => [city.id, city]));
  // Some hubs serialize kind as a string ("2") instead of number (2).
  const cityChannels = channels.filter(
    (channel) => Number(channel.kind) === CHANNEL_KIND_CITY
  );
  console.debug(
    `[listProtocolCities] total=${channels.length} city=${cityChannels.length}`
  );
  return cityChannels
    .map((channel) => toCity(channel, curatedById.get(channel.id)))
    .sort((a, b) => a.name.localeCompare(b.name));
}
