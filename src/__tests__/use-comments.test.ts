import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useComments } from "@/hooks/use-comments";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/use-tribe-publish", () => ({
  useTribePublish: vi.fn(),
}));

vi.mock("@/lib/tribe/api", () => ({
  fetchReplies: vi.fn(),
  resolveMediaUrl: (v: string | null | undefined) => v ?? null,
}));

import { useAuth } from "@/hooks/use-auth";
import { useTribePublish } from "@/hooks/use-tribe-publish";
import { fetchReplies } from "@/lib/tribe/api";

const mockAuth = {
  profile: { id: "user-1", username: "testuser", tid: 1 },
  isAuthenticated: true,
  status: "authenticated" as const,
  error: null,
  tid: 1,
  logout: vi.fn(),
};

const publishMock = vi.fn(async (_text: string, opts?: { parentHash?: string }) => ({
  hash: `published-${opts?.parentHash ?? "root"}-${Date.now()}`,
}));

describe("useComments", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(mockAuth as ReturnType<typeof useAuth>);
    vi.mocked(useTribePublish).mockReturnValue({
      publish: publishMock,
      publishing: false,
      error: null,
      ready: true,
    } as ReturnType<typeof useTribePublish>);
    vi.mocked(fetchReplies).mockResolvedValue({ replies: [], count: 0 });
    publishMock.mockClear();
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
      expect(fetchReplies).not.toHaveBeenCalled();
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
      expect(fetchReplies).toHaveBeenCalledWith("content-1");
    });

    it("should populate comments from hub replies", async () => {
      vi.mocked(fetchReplies).mockResolvedValueOnce({
        replies: [
          {
            hash: "h1",
            tid: "42",
            text: "first reply",
            timestamp: 1700000000,
            parent_hash: "content-1",
            username: "alice",
          },
        ],
        count: 1,
      });

      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.fetchComments();
      });

      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0].id).toBe("h1");
      expect(result.current.comments[0].text).toBe("first reply");
      expect(result.current.comments[0].profile?.username).toBe("alice");
      expect(result.current.total).toBe(1);
    });

    it("should surface fetch errors", async () => {
      vi.mocked(fetchReplies).mockRejectedValueOnce(new Error("hub down"));

      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.fetchComments();
      });

      expect(result.current.error).toBe("hub down");
    });
  });

  describe("addComment", () => {
    it("should publish a TWEET_ADD with parentHash and append optimistically", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.addComment("New comment!");
      });

      expect(publishMock).toHaveBeenCalledWith("New comment!", {
        parentHash: "content-1",
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

      expect(publishMock).toHaveBeenCalledWith("spaced text", {
        parentHash: "content-1",
      });
      expect(result.current.comments[0].text).toBe("spaced text");
    });

    it("should do nothing when contentId is null", async () => {
      const { result } = renderHook(() => useComments(null));

      await act(async () => {
        await result.current.addComment("test");
      });

      expect(publishMock).not.toHaveBeenCalled();
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

      expect(publishMock).not.toHaveBeenCalled();
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
      expect(publishMock).not.toHaveBeenCalled();
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

      await act(async () => {
        await result.current.addComment("First");
      });
      expect(result.current.comments).toHaveLength(1);
      expect(result.current.total).toBe(1);

      const firstId = result.current.comments[0].id;

      await act(async () => {
        await result.current.deleteComment(firstId);
      });

      expect(result.current.comments).toHaveLength(0);
      expect(result.current.total).toBe(0);
    });

    it("should not go below 0 for total count", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.deleteComment("nonexistent");
      });

      expect(result.current.total).toBe(0);
    });
  });

  describe("addReply", () => {
    it("should publish a TWEET_ADD with the comment as parentHash and nest the reply", async () => {
      const { result } = renderHook(() => useComments("content-1"));

      await act(async () => {
        await result.current.addComment("Parent");
      });

      const parentId = result.current.comments[0].id;
      publishMock.mockClear();

      await act(async () => {
        await result.current.addReply(parentId, "Reply text");
      });

      expect(publishMock).toHaveBeenCalledWith("Reply text", {
        parentHash: parentId,
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

      expect(publishMock).not.toHaveBeenCalled();
      expect(result.current.comments).toEqual([]);
    });
  });
});
