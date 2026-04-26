import type { City } from "@/types";

export async function loadCityData(_city: City) {
  return {
    casts: [],
    events: [],
    polls: [],
    tasks: [],
    crowdfunds: [],
    tribes: [],
  };
}
