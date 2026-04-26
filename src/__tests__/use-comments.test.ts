import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useComments } from "@/hooks/use-comments";

// Mock useAuth hook
vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/use-auth";

const mockAuth = {
  profile: { id: "user-1", username: "testuser", tid: 1 },
  isAuthenticated: true,
  status: "authenticated" as const,
  error: null,
  tid: 1,
  logout: vi.fn(),
};

describe("useComments", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(mockAuth as ReturnType<typeof useAuth>);
  });

  describe("Initial state", () => {
    it("should start with empty comments, zero total, not loading, no error", () => {
      const { result } = renderHook(() => useComments("content-1"));

      expect(result.current.comments).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("fetchComments", () => {
    it("should do nothing when contentId is null", async () => {
      const { result } = renderHook(() => useComments(null));

      await act(async () => {
        await result.current.fetchComments();
      });

      expect(result.current.comments).toEqual([]);
    });

    it("should resolve without error when contentId is provided", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.fetchComments();
      });

      expect(result.current.comments).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("addComment", () => {
    it("should add a comment locally and increment total", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.addComment("New comment!");
      });

      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0].text).toBe("New comment!");
      expect(result.current.comments[0].profileId).toBe("user-1");
      expect(result.current.total).toBe(1);
    });

    it("should trim whitespace from comment text", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.addComment("  spaced text  ");
      });

      expect(result.current.comments[0].text).toBe("spaced text");
    });

    it("should do nothing when contentId is null", async () => {
      const { result } = renderHook(() => useComments(null));

      await act(async () => {
        await result.current.addComment("test");
      });

      expect(result.current.comments).toEqual([]);
    });

    it("should do nothing when not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuth,
        isAuthenticated: false,
        profile: null,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.addComment("test");
      });

      expect(result.current.comments).toEqual([]);
    });

    it("should do nothing when text is empty/whitespace", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.addComment("");
      });
      expect(result.current.comments).toEqual([]);

      await act(async () => {
        await result.current.addComment("   ");
      });
      expect(result.current.comments).toEqual([]);
    });

    it("should include profile info in added comment", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.addComment("hello");
      });

      expect(result.current.comments[0].profile?.username).toBe("testuser");
      expect(result.current.comments[0].profile?.id).toBe("user-1");
    });
  });

  describe("deleteComment", () => {
    it("should remove comment from list and decrement total", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      // Add a comment
      await act(async () => {
        await result.current.addComment("First");
      });
      expect(result.current.comments).toHaveLength(1);
      expect(result.current.total).toBe(1);

      const firstId = result.current.comments[0].id;

      // Delete it
      await act(async () => {
        await result.current.deleteComment(firstId);
      });

      expect(result.current.comments).toHaveLength(0);
      expect(result.current.total).toBe(0);
    });

    it("should not go below 0 for total count", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      // total starts at 0
      await act(async () => {
        await result.current.deleteComment("nonexistent");
      });

      expect(result.current.total).toBe(0);
    });
  });

  describe("addReply", () => {
    it("should add a reply to a comment", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      // Add parent comment
      await act(async () => {
        await result.current.addComment("Parent");
      });

      const parentId = result.current.comments[0].id;

      // Add reply
      await act(async () => {
        await result.current.addReply(parentId, "Reply text");
      });

      const parent = result.current.comments[0];
      expect(parent.replies).toHaveLength(1);
      expect(parent.replies![0].text).toBe("Reply text");
      expect(parent.replyCount).toBe(1);
    });

    it("should do nothing when not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuth,
        isAuthenticated: false,
        profile: null,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.addReply("some-id", "reply");
      });

      expect(result.current.comments).toEqual([]);
    });
  });
});
