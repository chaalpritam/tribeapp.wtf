import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useFollow } from "@/hooks/use-follow";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock useAuth hook
vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/use-auth";

const mockAuth = {
  profile: { id: "my-profile", username: "testuser" },
  isAuthenticated: true,
  status: "authenticated" as const,
  error: null,
  fid: null,
  signerUuid: null,
  updateProfile: vi.fn(),
  loginWithNeynar: vi.fn(),
  logout: vi.fn(),
};

function mockOkResponse(data: unknown = {}) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function mockErrorResponse() {
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve("Error"),
  });
}

describe("useFollow", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(mockAuth as ReturnType<typeof useAuth>);
    mockFetch.mockReset();
    // Default: follow state check returns false
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/followers/state")) {
        return mockOkResponse({ isFollowing: false });
      }
      return mockOkResponse({});
    });
  });

  describe("Initial state", () => {
    it("should start not following", () => {
      const { result } = renderHook(() => useFollow("other-user"));

      expect(result.current.isFollowing).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Check follow status on mount", () => {
    it("should check follow status when authenticated with valid targetProfileId", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("/api/followers/state")) {
          return mockOkResponse({ isFollowing: true });
        }
        return mockOkResponse({});
      });

      const { result } = renderHook(() => useFollow("other-user"));

      await waitFor(() => {
        expect(result.current.isFollowing).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/followers/state?startId=my-profile&endId=other-user")
      );
    });

    it("should not check when not authenticated", () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuth,
        isAuthenticated: false,
        profile: null,
      } as ReturnType<typeof useAuth>);

      renderHook(() => useFollow("other-user"));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should not check when targetProfileId is null", () => {
      renderHook(() => useFollow(null));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should not check follow status for self (same profile ID)", () => {
      renderHook(() => useFollow("my-profile"));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should silently ignore check errors", async () => {
      mockFetch.mockRejectedValue(new Error("fail"));

      const { result } = renderHook(() => useFollow("other-user"));

      await waitFor(() => {
        expect(result.current.isFollowing).toBe(false);
      });
    });
  });

  describe("toggleFollow - following", () => {
    it("should optimistically follow and call API", async () => {
      const { result } = renderHook(() => useFollow("other-user"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.toggleFollow();
      });

      expect(result.current.isFollowing).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/followers/add",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            startId: "my-profile",
            endId: "other-user",
          }),
        })
      );
    });

    it("should optimistically unfollow and call API", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("/api/followers/state")) {
          return mockOkResponse({ isFollowing: true });
        }
        return mockOkResponse({});
      });

      const { result } = renderHook(() => useFollow("other-user"));

      await waitFor(() => {
        expect(result.current.isFollowing).toBe(true);
      });

      await act(async () => {
        await result.current.toggleFollow();
      });

      expect(result.current.isFollowing).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/followers/remove",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            startId: "my-profile",
            endId: "other-user",
          }),
        })
      );
    });
  });

  describe("toggleFollow - rollback on error", () => {
    it("should rollback follow on API failure", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("/api/followers/state")) {
          return mockOkResponse({ isFollowing: false });
        }
        return mockErrorResponse();
      });

      const { result } = renderHook(() => useFollow("other-user"));

      await act(async () => {
        await result.current.toggleFollow();
      });

      expect(result.current.isFollowing).toBe(false);
    });

    it("should rollback unfollow on API failure", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("/api/followers/state")) {
          return mockOkResponse({ isFollowing: true });
        }
        return mockErrorResponse();
      });

      const { result } = renderHook(() => useFollow("other-user"));

      await waitFor(() => {
        expect(result.current.isFollowing).toBe(true);
      });

      await act(async () => {
        await result.current.toggleFollow();
      });

      expect(result.current.isFollowing).toBe(true);
    });
  });

  describe("toggleFollow - guards", () => {
    it("should do nothing when not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuth,
        isAuthenticated: false,
        profile: null,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useFollow("other-user"));

      await act(async () => {
        await result.current.toggleFollow();
      });

      // No follow/unfollow API calls should have been made
      expect(mockFetch).not.toHaveBeenCalledWith(
        "/api/followers/add",
        expect.anything()
      );
      expect(mockFetch).not.toHaveBeenCalledWith(
        "/api/followers/remove",
        expect.anything()
      );
    });

    it("should do nothing when targetProfileId is null", async () => {
      const { result } = renderHook(() => useFollow(null));

      await act(async () => {
        await result.current.toggleFollow();
      });

      expect(mockFetch).not.toHaveBeenCalledWith(
        "/api/followers/add",
        expect.anything()
      );
    });
  });
});
