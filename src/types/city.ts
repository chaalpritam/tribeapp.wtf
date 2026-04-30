export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Curated catalog metadata for a city the app can scope to. Does not
 * carry user / community statistics — those flow from the hub when
 * present, never from a static dataset.
 */
export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  coordinates: Coordinates;
  accentColor: string;
  emoji?: string;
}
