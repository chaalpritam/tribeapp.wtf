import type { City } from "@/types";

export async function loadCityData(_city: City) {
  return {
    tweets: [],
    events: [],
    polls: [],
    tasks: [],
    crowdfunds: [],
    tribes: [],
  };
}
