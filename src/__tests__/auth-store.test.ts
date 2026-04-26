import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/store/use-auth-store";
import type { UserProfile } from "@/store/use-auth-store";

const mockProfile: UserProfile = {
  id: "profile-1",
  username: "testuser",
  bio: "Test bio",
  namespace: "tribe",
  created_at: "2025-01-01T00:00:00Z",
  socialCounts: { followers: 10, following: 5, posts: 3 },
};

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.getState().reset();
  });

  describe("Initial State", () => {
    it("should start with disconnected status", () => {
      const state = useAuthStore.getState();
      expect(state.status).toBe("disconnected");
    });

    it("should start with null profile", () => {
      const state = useAuthStore.getState();
      expect(state.profile).toBeNull();
    });

    it("should start with null error", () => {
      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe("setStatus", () => {
    it("should update status", () => {
      useAuthStore.getState().setStatus("authenticated");
      expect(useAuthStore.getState().status).toBe("authenticated");
    });

    it("should clear error when setting status", () => {
      useAuthStore.getState().setError("some error");
      expect(useAuthStore.getState().error).toBe("some error");

      useAuthStore.getState().setStatus("disconnected");
      expect(useAuthStore.getState().error).toBeNull();
    });

    it("should support all status values", () => {
      const statuses = ["disconnected", "authenticated"] as const;

      for (const s of statuses) {
        useAuthStore.getState().setStatus(s);
        expect(useAuthStore.getState().status).toBe(s);
      }
    });
  });

  describe("setProfile", () => {
    it("should set profile and auto-update status to authenticated", () => {
      useAuthStore.getState().setProfile(mockProfile);

      const state = useAuthStore.getState();
      expect(state.profile).toEqual(mockProfile);
      expect(state.status).toBe("authenticated");
    });

    it("should set status to disconnected when profile is null", () => {
      useAuthStore.getState().setProfile(mockProfile);
      expect(useAuthStore.getState().status).toBe("authenticated");

      useAuthStore.getState().setProfile(null);
      expect(useAuthStore.getState().status).toBe("disconnected");
    });

    it("should store full profile data", () => {
      useAuthStore.getState().setProfile(mockProfile);
      const profile = useAuthStore.getState().profile;

      expect(profile?.id).toBe("profile-1");
      expect(profile?.username).toBe("testuser");
      expect(profile?.bio).toBe("Test bio");
      expect(profile?.socialCounts?.followers).toBe(10);
    });
  });

  describe("setFarcasterAuth", () => {
    it("should set profile from Farcaster data and authenticate", () => {
      useAuthStore.getState().setFarcasterAuth({
        fid: 12345,
        signerUuid: "signer-uuid",
        username: "farcaster_user",
        displayName: "Farcaster User",
        pfpUrl: "https://example.com/pfp.png",
        bio: "Hello from Farcaster",
      });

      const state = useAuthStore.getState();
      expect(state.status).toBe("authenticated");
      expect(state.error).toBeNull();
      expect(state.profile?.fid).toBe(12345);
      expect(state.profile?.signerUuid).toBe("signer-uuid");
      expect(state.profile?.username).toBe("farcaster_user");
      expect(state.profile?.displayName).toBe("Farcaster User");
      expect(state.profile?.pfpUrl).toBe("https://example.com/pfp.png");
      expect(state.profile?.bio).toBe("Hello from Farcaster");
    });
  });

  describe("setError", () => {
    it("should set error message", () => {
      useAuthStore.getState().setError("Network error");
      expect(useAuthStore.getState().error).toBe("Network error");
    });

    it("should allow clearing error with null", () => {
      useAuthStore.getState().setError("Error");
      useAuthStore.getState().setError(null);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("reset", () => {
    it("should reset all state to initial values", () => {
      useAuthStore.getState().setProfile(mockProfile);
      useAuthStore.getState().setError("some error");

      useAuthStore.getState().reset();

      const state = useAuthStore.getState();
      expect(state.status).toBe("disconnected");
      expect(state.profile).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe("Persistence partialize", () => {
    it("should partialize to include profile and derived status", () => {
      useAuthStore.getState().setProfile(mockProfile);

      const persistApi = (useAuthStore as unknown as { persist: { getOptions: () => { partialize: (state: ReturnType<typeof useAuthStore.getState>) => unknown } } }).persist;
      const options = persistApi.getOptions();
      const partialized = options.partialize(useAuthStore.getState()) as {
        profile: UserProfile | null;
        status: string;
      };

      expect(partialized.profile).toEqual(mockProfile);
      expect(partialized.status).toBe("authenticated");
    });

    it("should set status to disconnected in partialize when no profile", () => {
      const persistApi = (useAuthStore as unknown as { persist: { getOptions: () => { partialize: (state: ReturnType<typeof useAuthStore.getState>) => unknown } } }).persist;
      const options = persistApi.getOptions();
      const partialized = options.partialize(useAuthStore.getState()) as {
        status: string;
      };

      expect(partialized.status).toBe("disconnected");
    });
  });

  describe("State Transitions", () => {
    it("should handle auth flow: disconnected → authenticated via setFarcasterAuth", () => {
      expect(useAuthStore.getState().status).toBe("disconnected");

      useAuthStore.getState().setFarcasterAuth({
        fid: 123,
        signerUuid: "uuid",
        username: "user",
        displayName: "User",
      });
      expect(useAuthStore.getState().status).toBe("authenticated");
    });

    it("should handle logout: authenticated → disconnected", () => {
      useAuthStore.getState().setProfile(mockProfile);
      expect(useAuthStore.getState().status).toBe("authenticated");

      useAuthStore.getState().reset();
      expect(useAuthStore.getState().status).toBe("disconnected");
      expect(useAuthStore.getState().profile).toBeNull();
    });
  });
});
