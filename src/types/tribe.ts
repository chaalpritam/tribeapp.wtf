/**
 * Local Tribe shape — a thin wrapper over the protocol's
 * ChannelInfo so existing UI components can keep their props
 * stable while every field maps to a hub-tracked value.
 *
 * The hub doesn't track moderators / rules / subchannels, so
 * those are intentionally omitted. Add them back when the
 * protocol grows the corresponding primitives.
 */
export interface Tribe {
  /** Channel slug (e.g. "general", "bangalore", "mission-bay-runners"). */
  id: string;
  /** Active city the user is browsing — purely a UI grouping hint;
   *  the channel itself isn't necessarily city-scoped. */
  cityId: string;
  name: string;
  description: string;
  /** Lucide icon key — defaulted by `channelInfoToTribe` based on
   *  the channel kind (city / interest). */
  icon: string;
  /** Hex (no `#`) so the existing card markup can `${...}15`. */
  color: string;
  imageUrl?: string;
  members: number;
  isPrivate: boolean;
  isJoined: boolean;
}
