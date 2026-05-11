"use client";

import { useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { AlertTriangle, FileUp, Loader2 } from "lucide-react";
import {
  decryptBackup,
  applyBackup,
  isEncryptedBackup,
  type BackupData,
} from "@/lib/backup";
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

interface ImportBackupProps {
  /** Render a fully styled CTA button. Pass false to use a plain
   *  text trigger that matches sidebar / settings link styles. */
  triggerVariant?: "button" | "link";
  onSuccess?: () => void;
}

/**
 * Dialog that consumes a `.tribe` / `.tribe.enc` file, decrypts if
 * needed, and applies the identity to the Zustand store +
 * localStorage. The active wallet is disconnected first so
 * wallet-adapter-react's autoconnect doesn't clobber the restored
 * identity on the next render.
 */
export function ImportBackup({
  triggerVariant = "link",
  onSuccess,
}: ImportBackupProps) {
  const { disconnect } = useWallet();

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>("");
  const [encrypted, setEncrypted] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setFileText("");
    setEncrypted(false);
    setPassword("");
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError(null);
    setSuccess(false);
    setFile(selected);
    try {
      const text = await selected.text();
      setFileText(text);
      setEncrypted(isEncryptedBackup(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file");
      setFileText("");
    }
  };

  const handleImport = async () => {
    if (!file || !fileText) return;
    setLoading(true);
    setError(null);
    try {
      let backup: BackupData;
      if (encrypted) {
        if (!password) {
          setError("Password is required for encrypted backups.");
          setLoading(false);
          return;
        }
        backup = await decryptBackup(fileText, password);
      } else {
        try {
          backup = JSON.parse(fileText);
        } catch {
          throw new Error("Backup file is not valid JSON or encrypted data.");
        }
      }
      try {
        await disconnect();
      } catch {
        // best effort — adapter may already be disconnected
      }
      applyBackup(backup);
      setSuccess(true);
      // Short delay so the user sees confirmation before reload.
      setTimeout(() => {
        onSuccess?.();
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import backup");
      setLoading(false);
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
        {triggerVariant === "button" ? (
          <Button variant="outline" className="w-full">
            <FileUp className="h-4 w-4" />
            Restore from backup
          </Button>
        ) : (
          <button
            type="button"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Import account from backup
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Restore account</DialogTitle>
          <DialogDescription>
            Open a <code className="text-xs">.tribe</code> or{" "}
            <code className="text-xs">.tribe.enc</code> file exported from
            tribe-app, tribe-ios, or this app.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-muted-foreground/30 py-8 hover:border-foreground hover:bg-muted/40"
          >
            {file ? (
              <p className="font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Click to select file
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  .tribe or .tribe.enc
                </p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".tribe,.enc"
              className="hidden"
            />
          </button>

          {file && encrypted && (
            <div>
              <label
                htmlFor="backup-password"
                className="block text-sm font-medium"
              >
                Backup password
              </label>
              <Input
                id="backup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Same password you set when the file was exported.
              </p>
            </div>
          )}

          {file && !encrypted && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 flex-none mt-0.5" />
              <span>
                This backup is unencrypted and contains your identity secrets in
                cleartext. Only proceed if you trust the file&apos;s source.
              </span>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
              Account restored successfully — reloading…
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={loading || success}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleImport}
              disabled={!file || loading || success}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? "Restoring…"
                : success
                  ? "Restored"
                  : "Restore account"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
