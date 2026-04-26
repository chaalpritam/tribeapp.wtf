/**
 * Seed Script — Loads dummy data back into the app for development/demo purposes.
 *
 * This script re-enables mock data by copying src/seed/ barrel exports into
 * the store initializer's dynamic imports. To use it:
 *
 * 1. Run: npx tsx scripts/seed.ts
 *    This writes a flag file that the store-initializer checks at runtime.
 *
 * 2. Or import seed data directly in your components/tests:
 *    import { cities } from "@/seed/cities";
 *    import { currentUser, users } from "@/seed/users";
 *    import { casts } from "@/seed/casts";
 *    import { polls } from "@/seed/polls";
 *    import { tasks } from "@/seed/tasks";
 *    import { crowdfunds } from "@/seed/crowdfunds";
 *    import { tribes } from "@/seed/tribes";
 *    import { exploreItems } from "@/seed/explore";
 *
 * The seed data files live in src/seed/ and are NOT loaded at runtime by default.
 * They are preserved for:
 *  - Development demos
 *  - Automated tests
 *  - Seeding a local database in the future
 *
 * Available datasets:
 *  - cities: 6 cities (Bangalore, Mumbai, Delhi, San Francisco, London, New York)
 *  - users: 16 user profiles with karma, wallets, achievements
 *  - casts: ~36 social posts across all cities
 *  - polls: City-specific polls with voting options
 *  - tasks: Community help requests by city
 *  - crowdfunds: Fundraising campaigns by city
 *  - tribes: Community groups with subchannels and rules
 *  - exploreItems: Events and activities by city
 *  - chatMessages: Chat messages by tribe
 *  - nearbyUsers, mapEvents: Location-based data
 *  - conferences: DevConnect conference data
 */

import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";

const SEED_FLAG = join(process.cwd(), ".seed-enabled");

const command = process.argv[2];

if (command === "enable") {
  writeFileSync(SEED_FLAG, new Date().toISOString());
  console.log("Seed data enabled. Restart the dev server to load mock data.");
  console.log("Run `npx tsx scripts/seed.ts disable` to turn it off.");
} else if (command === "disable") {
  try {
    unlinkSync(SEED_FLAG);
    console.log("Seed data disabled. Restart the dev server.");
  } catch {
    console.log("Seed data was already disabled.");
  }
} else {
  console.log("Usage:");
  console.log("  npx tsx scripts/seed.ts enable   — Load mock data on next dev server start");
  console.log("  npx tsx scripts/seed.ts disable  — Remove mock data (use real Farcaster data)");
  console.log("");
  console.log("Or import seed data directly in your code:");
  console.log('  import { casts } from "@/seed/casts";');
  console.log('  import { currentUser } from "@/seed/users";');
}
