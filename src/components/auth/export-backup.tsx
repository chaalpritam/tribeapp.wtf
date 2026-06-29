"use client";

import { useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import {
  createBackupPayload,
  downloadBackupFile,
  downloadEncryptedBackup,
  encryptBackup,
  markBackupComplete,
} from "@/lib/backup";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

/**
 * Dialog that builds a `.tribe` (plain JSON) or `.tribe.enc` (AES-GCM,
 * PBKDF2-derived) backup of the current identity + DM key, then
 * triggers a download. Same wire format tribe-twitter-app and
 * tribe-twitter produce, so the file round-trips.
 */
export function ExportBackup() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [open, setOpen] = useState(false);
  const [encrypt, setEncrypt] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordsMatch =
    password.length > 0 && password === confirm;
  const canExport =
    Boolean(identity) && (!encrypt || passwordsMatch) && !busy;

  const reset = () => {
    setEncrypt(true);
    setPassword("");
    setConfirm("");
    setBusy(false);
    setError(null);
    setDone(false);
  };

  const handleExport = async () => {
    if (!identity) return;
    setBusy(true);
    setError(null);
    try {
      const payload = createBackupPayload();
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `tribe-${identity.tid}-${stamp}`;
      if (encrypt) {
        const enc = await encryptBackup(payload, password);
        downloadEncryptedBackup(enc, filename);
      } else {
        downloadBackupFile(payload, filename);
      }
      markBackupComplete();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={!identity}
          className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <Download className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left text-[14px] font-bold tracking-tight">
            Export account backup
          </span>
          <span className="text-[11px] text-muted-foreground">.tribe</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export account</DialogTitle>
          <DialogDescription>
            Saves your TID, app key, and DM key into one file.
            tribe-twitter-app and tribe-twitter can open the same file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Encrypt with password</p>
              <p className="text-xs text-muted-foreground">
                AES-256-GCM + PBKDF2(SHA-256, 100k iters). Required if you
                share the file or store it in cloud storage.
              </p>
            </div>
            <Switch checked={encrypt} onCheckedChange={setEncrypt} />
          </label>

          {encrypt && (
            <div className="flex flex-col gap-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              {password.length > 0 &&
                confirm.length > 0 &&
                password !== confirm && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Passwords don&apos;t match.
                  </p>
                )}
              <p className="text-xs text-muted-foreground">
                There&apos;s no recovery if you lose this password — the file
                becomes unopenable.
              </p>
            </div>
          )}

          {!encrypt && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 flex-none mt-0.5" />
              <span>
                Plain backup: your app-key and identity data are in cleartext.
                Keep it offline.
              </span>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}

          {done && (
            <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
              File downloaded.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              {done ? "Close" : "Cancel"}
            </Button>
            <Button
              className="flex-1"
              disabled={!canExport}
              onClick={handleExport}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Preparing…" : done ? "Download again" : "Download backup"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
