"use client";

import { useCallback, useState } from "react";
import { signAndPublishUserData } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

type Field = "bio" | "displayName" | "pfpUrl" | "url" | "location";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function useTribeUserData() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setField = useCallback(
    async (field: Field, value: string) => {
      if (!identity) throw new Error("No tribe identity");
      setPublishing(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishUserData(identity.tid, field, value, secret);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setPublishing(false);
      }
    },
    [identity]
  );

  const setFields = useCallback(
    async (fields: Partial<Record<Field, string>>) => {
      if (!identity) throw new Error("No tribe identity");
      setPublishing(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        const hashes: string[] = [];
        for (const [field, value] of Object.entries(fields)) {
          if (value === undefined || value === null || value === "") continue;
          const r = await signAndPublishUserData(
            identity.tid,
            field as Field,
            value,
            secret
          );
          hashes.push(r.hash);
        }
        return hashes;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setPublishing(false);
      }
    },
    [identity]
  );

  return { setField, setFields, publishing, error };
}
