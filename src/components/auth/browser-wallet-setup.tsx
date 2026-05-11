"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  BROWSER_WALLET_NAME,
  BROWSER_WALLET_READY,
  BROWSER_WALLET_SETUP_REQUIRED,
} from "@/lib/browser-wallet/adapter";
import {
  type DerivedAccount,
  deriveAccountsFromMnemonic,
  generateMnemonic,
  isValidMnemonic,
  normalizeMnemonic,
} from "@/lib/browser-wallet/mnemonic";
import {
  saveKeypair,
  saveMnemonic,
} from "@/lib/browser-wallet/keypair-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const ACCOUNTS_TO_SHOW = 5;
type BalanceState = number | null | "error";

function visibleAccountIndexes(balances: BalanceState[]): number[] {
  if (!balances.every((b) => b !== null)) return [];
  const funded = balances
    .map((b, i) => (typeof b === "number" && b > 0 ? i : -1))
    .filter((i) => i !== -1);
  return funded.length > 0 ? funded : [0];
}

function nextSelected(balances: BalanceState[], current: number): number {
  const visible = visibleAccountIndexes(balances);
  if (visible.length === 0) return current;
  return visible.includes(current) ? current : visible[0];
}

type Step =
  | { kind: "choose" }
  | { kind: "create"; mnemonic: string; confirmed: boolean }
  | { kind: "import"; phrase: string; error: string | null }
  | {
      kind: "select";
      phrase: string;
      accounts: DerivedAccount[];
      balances: BalanceState[];
      selected: number;
    };

/**
 * Modal that handles BIP39 create / import for the Browser Wallet
 * adapter. Listens for the BROWSER_WALLET_SETUP_REQUIRED event the
 * adapter fires when the user picks "Browser Wallet" but no keypair
 * has been saved yet. On completion, dispatches BROWSER_WALLET_READY
 * and re-runs connect() so the wallet-adapter-react state moves on
 * without a second click.
 */
export function BrowserWalletSetup() {
  const { select, connect, wallet } = useWallet();
  const { connection } = useConnection();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ kind: "choose" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handler = () => {
      setStep({ kind: "choose" });
      setOpen(true);
    };
    window.addEventListener(BROWSER_WALLET_SETUP_REQUIRED, handler);
    return () =>
      window.removeEventListener(BROWSER_WALLET_SETUP_REQUIRED, handler);
  }, []);

  const finishSetup = useCallback(async () => {
    setOpen(false);
    setStep({ kind: "choose" });
    window.dispatchEvent(new Event(BROWSER_WALLET_READY));

    if (wallet?.adapter.name !== BROWSER_WALLET_NAME) {
      select(BROWSER_WALLET_NAME);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    try {
      await connect();
    } catch (err) {
      console.warn("Browser wallet connect after setup failed:", err);
    }
  }, [select, connect, wallet]);

  const handleCreate = useCallback(async () => {
    if (step.kind !== "create" || !step.confirmed) return;
    setBusy(true);
    try {
      await saveMnemonic(step.mnemonic);
      await finishSetup();
    } finally {
      setBusy(false);
    }
  }, [step, finishSetup]);

  const handleImport = useCallback(async () => {
    if (step.kind !== "import") return;
    const normalized = normalizeMnemonic(step.phrase);
    if (!isValidMnemonic(normalized)) {
      setStep({
        kind: "import",
        phrase: step.phrase,
        error: "That doesn't look like a valid 12 or 24 word BIP39 phrase.",
      });
      return;
    }
    setBusy(true);
    try {
      const accounts = await deriveAccountsFromMnemonic(
        normalized,
        ACCOUNTS_TO_SHOW,
      );
      setStep({
        kind: "select",
        phrase: normalized,
        accounts,
        balances: accounts.map(() => null),
        selected: 0,
      });
      accounts.forEach((acct, idx) => {
        const apply = (value: BalanceState) => {
          setStep((prev) => {
            if (prev.kind !== "select") return prev;
            const balances = prev.balances.slice();
            balances[idx] = value;
            return {
              ...prev,
              balances,
              selected: nextSelected(balances, prev.selected),
            };
          });
        };
        connection
          .getBalance(acct.keypair.publicKey)
          .then(apply)
          .catch(() => apply("error"));
      });
    } catch (err) {
      setStep({
        kind: "import",
        phrase: step.phrase,
        error: err instanceof Error ? err.message : "Failed to import",
      });
    } finally {
      setBusy(false);
    }
  }, [step, connection]);

  const handleSelectConfirm = useCallback(async () => {
    if (step.kind !== "select") return;
    setBusy(true);
    try {
      const account = step.accounts[step.selected];
      saveKeypair(step.phrase, account.keypair, account.index);
      await finishSetup();
    } finally {
      setBusy(false);
    }
  }, [step, finishSetup]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Browser wallet</DialogTitle>
          <DialogDescription>
            A Solana keypair that lives in this browser&apos;s storage. No
            extension required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 flex-none mt-0.5" />
          <div>
            <strong>Dev / demo only.</strong> Keys are stored unencrypted in
            this browser&apos;s localStorage. Anyone with access to this
            profile can read them.
          </div>
        </div>

        {step.kind === "choose" && (
          <div className="flex flex-col gap-3">
            <Button
              onClick={() =>
                setStep({
                  kind: "create",
                  mnemonic: generateMnemonic(24),
                  confirmed: false,
                })
              }
            >
              Create new wallet
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setStep({ kind: "import", phrase: "", error: null })
              }
            >
              Import existing wallet
            </Button>
          </div>
        )}

        {step.kind === "create" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Write these 24 words down in order. They are the only way to
              recover this wallet.
            </p>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 font-mono text-xs">
              {step.mnemonic.split(" ").map((word, i) => (
                <div key={i} className="flex gap-1">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>{word}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="text-xs text-primary underline self-start"
              onClick={() => navigator.clipboard.writeText(step.mnemonic)}
            >
              Copy phrase
            </button>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={step.confirmed}
                onChange={(e) =>
                  setStep({ ...step, confirmed: e.target.checked })
                }
              />
              <span>
                I&apos;ve written down the seed phrase somewhere safe. I
                understand losing it means losing access.
              </span>
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep({ kind: "choose" })}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!step.confirmed || busy}
                onClick={handleCreate}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? "Creating…" : "Create wallet"}
              </Button>
            </div>
          </div>
        )}

        {step.kind === "import" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Paste your 12 or 24 word BIP39 phrase. Same derivation Phantom
              and Solflare use (<code className="text-xs">m/44&apos;/501&apos;/i&apos;/0&apos;</code>).
            </p>
            <Textarea
              placeholder="word1 word2 word3 …"
              className="font-mono text-sm"
              rows={4}
              value={step.phrase}
              onChange={(e) =>
                setStep({
                  kind: "import",
                  phrase: e.target.value,
                  error: null,
                })
              }
            />
            {step.error && (
              <p className="text-xs text-red-600">{step.error}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep({ kind: "choose" })}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={busy || step.phrase.trim().length === 0}
                onClick={handleImport}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? "Deriving…" : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {step.kind === "select" && (() => {
          const allLoaded = step.balances.every((b) => b !== null);
          const visibleIdxs = visibleAccountIndexes(step.balances);
          const noFunded =
            allLoaded &&
            !step.balances.some((b) => typeof b === "number" && b > 0);
          return (
            <div className="flex flex-col gap-3">
              {!allLoaded ? (
                <p className="text-sm text-muted-foreground">
                  Checking balances on Solana…
                </p>
              ) : noFunded ? (
                <p className="text-sm text-muted-foreground">
                  No funded accounts found. Importing account #1 — fund it
                  from another wallet to start using it.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {visibleIdxs.length === 1
                    ? "Found one funded account on this seed."
                    : `Found ${visibleIdxs.length} funded accounts. Pick which to import.`}
                </p>
              )}

              {visibleIdxs.length > 0 && (
                <div className="overflow-hidden rounded-lg border divide-y">
                  {visibleIdxs.map((i) => {
                    const acct = step.accounts[i];
                    const address = acct.keypair.publicKey.toBase58();
                    const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
                    const balance = step.balances[i];
                    return (
                      <label
                        key={acct.index}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50",
                          step.selected === i && "bg-muted",
                        )}
                      >
                        <input
                          type="radio"
                          name="account"
                          checked={step.selected === i}
                          onChange={() =>
                            setStep({ ...step, selected: i })
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">
                            Account #{acct.index + 1}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {short}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          {typeof balance === "number"
                            ? `${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`
                            : balance === "error"
                              ? "—"
                              : "…"}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    setStep({
                      kind: "import",
                      phrase: step.phrase,
                      error: null,
                    })
                  }
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={busy || !allLoaded}
                  onClick={handleSelectConfirm}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {busy ? "Importing…" : "Import account"}
                </Button>
              </div>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
