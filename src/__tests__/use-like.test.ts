import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useLike } from "@/hooks/use-like";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock useAuth hook
vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/use-auth";

const mockAuth = {
  profile: { id: "user-1", username: "testuser" },
  isAuthenticated: true,
  status: "authenticated",
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

describe("useLike", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(mockAuth as ReturnType<typeof useAuth>);
    mockFetch.mockReset();
    mockFetch.mockReturnValue(mockOkResponse({}));
  });

  describe("Initial state", () => {
    it("should initialize with provided values", () => {
      const { result } = renderHook(() => useLike("content-1", true, 5));

      expect(result.current.isLiked).toBe(true);
      expect(result.current.likeCount).toBe(5);
      expect(result.current.isLoading).toBe(false);
    });

    it("should sync with prop changes", async () => {
      const { result, rerender } = renderHook(
        ({ liked, count }) => useLike("content-1", liked, count),
        { initialProps: { liked: false, count: 0 } }
      );

      expect(result.current.isLiked).toBe(false);
      expect(result.current.likeCount).toBe(0);

      rerender({ liked: true, count: 3 });

      await waitFor(() => {
        expect(result.current.isLiked).toBe(true);
        expect(result.current.likeCount).toBe(3);
      });
    });
  });

  describe("toggleLike - liking", () => {
    it("should optimistically update isLiked and likeCount when liking", async () => {
      const { result } = renderHook(() => useLike("content-1", false, 5));

      await act(async () => {
        await result.current.toggleLike();
      });

      expect(result.current.isLiked).toBe(true);
      expect(result.current.likeCount).toBe(6);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/likes",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            nodeId: "content-1",
            startId: "user-1",
          }),
        })
      );
    });

    it("should optimistically update when unliking", async () => {
      const { result } = renderHook(() => useLike("content-1", true, 5));

      await act(async () => {
        await result.current.toggleLike();
      });

      expect(result.current.isLiked).toBe(false);
      expect(result.current.likeCount).toBe(4);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/likes",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({
            nodeId: "content-1",
            startId: "user-1",
          }),
        })
      );
    });
  });

  describe("toggleLike - rollback on error", () => {
    it("should rollback like on API failure", async () => {
      mockFetch.mockReturnValue(mockErrorResponse());

      const { result } = renderHook(() => useLike("content-1", false, 5));

      await act(async () => {
        await result.current.toggleLike();
      });

      // Should rollback
      expect(result.current.isLiked).toBe(false);
      expect(result.current.likeCount).toBe(5);
    });

    it("should rollback unlike on API failure", async () => {
      mockFetch.mockReturnValue(mockErrorResponse());

      const { result } = renderHook(() => useLike("content-1", true, 5));

      await act(async () => {
        await result.current.toggleLike();
      });

      // Should rollback
      expect(result.current.isLiked).toBe(true);
      expect(result.current.likeCount).toBe(5);
    });
  });

  describe("toggleLike - guards", () => {
    it("should do nothing when contentId is null", async () => {
      const { result } = renderHook(() => useLike(null, false, 0));

      await act(async () => {
        await result.current.toggleLike();
      });

      expect(mockFetch).not.toHaveBeenCalledWith(
        "/api/likes",
        expect.anything()
      );
    });

    it("should still do optimistic update when not authenticated (local-only toggle)", async () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuth,
        isAuthenticated: false,
        profile: null,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useLike("content-1", false, 5));

      await act(async () => {
        await result.current.toggleLike();
      });

      // Optimistic update still happens, just no API call
      expect(result.current.isLiked).toBe(true);
      expect(result.current.likeCount).toBe(6);
      expect(mockFetch).not.toHaveBeenCalledWith(
        "/api/likes",
        expect.anything()
      );
    });
  });

  describe("isLoading state", () => {
    it("should set isLoading during toggle", async () => {
      let resolvePromise: (value: unknown) => void;
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { result } = renderHook(() => useLike("content-1", false, 5));

      // Start the toggle but don't await
      let togglePromise: Promise<void>;
      act(() => {
        togglePromise = result.current.toggleLike();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
        await togglePromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
