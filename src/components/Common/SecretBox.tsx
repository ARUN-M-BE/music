"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
} from "lucide-react";
import {
  PBKDF2_ITERATIONS,
  deriveMasterKey,
  generateMasterKey,
  keyIdOf,
  openText,
  sealText,
  selfTest,
} from "@/lib/secrets-web.mjs";

type Mode = "encrypt" | "decrypt";
type KeySource = "passphrase" | "master";

const FIELD_CLASS =
  "w-full px-3 py-2 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/**
 * Browser-only text encryption tool.
 *
 * It produces and reads the same `enc:v1:<keyId>:<payload>` token as
 * `src/lib/secrets-core.mjs`, so a value encrypted here can be pasted into
 * `wrangler.jsonc` (`vars`), `.env` or a platform secret and the server will
 * open it with `SECRETS_MASTER_KEY`. Nothing is sent anywhere: there is no
 * fetch, no API route and no logging. The master key stays in this tab.
 */
export function SecretBox() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [keySource, setKeySource] = useState<KeySource>("passphrase");
  const [passphrase, setPassphrase] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [resolved, setResolved] = useState<{ masterKey: string; keyId: string } | null>(null);
  const [revealKey, setRevealKey] = useState(false);
  const [revealTypedKey, setRevealTypedKey] = useState(false);
  const [revealPassphrase, setRevealPassphrase] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resolveKey = async (): Promise<string> => {
    if (keySource === "master") {
      const value = masterKey.trim();
      if (!value) throw new Error("Paste the master key first.");
      return value;
    }
    if (!passphrase.trim()) throw new Error("Enter a passphrase first.");
    return deriveMasterKey(passphrase.trim());
  };

  const handleRun = async () => {
    setError(null);
    setNotice(null);
    setCopied(false);
    setIsBusy(true);
    try {
      const key = await resolveKey();
      const keyId = await keyIdOf(key);
      const result =
        mode === "encrypt" ? await sealText(input, key) : await openText(input.trim(), key);
      setOutput(result);
      setResolved({ masterKey: key, keyId });
    } catch (caught) {
      setOutput("");
      setResolved(null);
      setError(errorMessage(caught));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelfTest = async () => {
    setError(null);
    setNotice(null);
    const ok = await selfTest(generateMasterKey());
    if (ok) setNotice("WebCrypto works in this browser: seal and open round-tripped.");
    else setError("WebCrypto is unavailable here. Open this page over HTTPS or on localhost.");
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("The clipboard is blocked by the browser; select the text and copy it manually.");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setResolved(null);
    setError(null);
    setNotice(null);
    setCopied(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <div className="flex items-start gap-3">
        <div className="size-11 rounded-full bg-[#1db954]/15 border border-[#1db954]/30 flex items-center justify-center text-[#1db954] shrink-0">
          <KeyRound className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Text Encryption Tool</h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1">
            Encrypt or decrypt a word, a sentence or an entire connection string. The output is the
            same <code className="text-[#1db954]">enc:v1:</code> token the server already
            understands.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200/90 leading-relaxed">
        <ShieldAlert className="size-4 shrink-0 mt-0.5" />
        <p>
          Runs entirely in this tab with WebCrypto: no request is made and nothing is logged. Only
          commit a token when the master key lives outside the repository (<code>wrangler secret
          put SECRETS_MASTER_KEY</code>). Anyone holding the key can decrypt every token.
        </p>
      </div>

      {/* Key source */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#181818] border border-[#282828] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            1. Choose the key
          </span>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#242424]">
            {(
              [
                { id: "passphrase", label: "Passphrase" },
                { id: "master", label: "Master key" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setKeySource(option.id);
                  setResolved(null);
                  setError(null);
                }}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                  keySource === option.id
                    ? "bg-[#1db954] text-black"
                    : "text-[#b3b3b3] hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {keySource === "passphrase" ? (
          <div className="space-y-2">
            <label className="text-[11px] text-[#b3b3b3] block" htmlFor="secret-passphrase">
              Passphrase
            </label>
            <div className="flex items-center gap-2">
              <input
                id="secret-passphrase"
                type={revealPassphrase ? "text" : "password"}
                autoComplete="new-password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                placeholder="At least 8 characters, the longer the better"
                className={FIELD_CLASS}
              />
              <button
                type="button"
                onClick={() => setRevealPassphrase((value) => !value)}
                className="size-9 shrink-0 rounded-lg bg-[#242424] text-[#b3b3b3] hover:text-white flex items-center justify-center"
                title={revealPassphrase ? "Hide passphrase" : "Show passphrase"}
              >
                {revealPassphrase ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[#727272] leading-relaxed">
              The master key is derived with PBKDF2-SHA256 ({PBKDF2_ITERATIONS.toLocaleString()}{" "}
              iterations) over a salt made from the passphrase itself, so the same passphrase always
              gives the same key and no extra file has to be kept. Changing the passphrase later
              invalidates the tokens made with the old one.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-[11px] text-[#b3b3b3] block" htmlFor="secret-master-key">
              Master key (base64url, base64 or 64-character hex)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="secret-master-key"
                type={revealTypedKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={masterKey}
                onChange={(event) => setMasterKey(event.target.value)}
                placeholder="Paste SECRETS_MASTER_KEY"
                className={`${FIELD_CLASS} font-mono`}
              />
              <button
                type="button"
                onClick={() => setRevealTypedKey((value) => !value)}
                className="size-9 shrink-0 rounded-lg bg-[#242424] text-[#b3b3b3] hover:text-white flex items-center justify-center"
                title={revealTypedKey ? "Hide key" : "Show key"}
              >
                {revealTypedKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMasterKey(generateMasterKey());
                  setRevealTypedKey(true);
                  setResolved(null);
                  setNotice("New master key generated. Store it now: wrangler secret put SECRETS_MASTER_KEY");
                }}
                className="size-9 shrink-0 rounded-lg bg-[#242424] text-[#1db954] hover:bg-[#2e2e2e] flex items-center justify-center"
                title="Generate a new master key"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
            <p className="text-[10px] text-[#727272] leading-relaxed">
              Use the key that is already deployed, otherwise the Worker cannot open the token.
            </p>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#181818] border border-[#282828] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            2. {mode === "encrypt" ? "Text to encrypt" : "Token to decrypt"}
          </span>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#242424]">
            {(
              [
                { id: "encrypt", label: "Encrypt", icon: Lock },
                { id: "decrypt", label: "Decrypt", icon: Unlock },
              ] as const
            ).map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setMode(option.id);
                    setOutput("");
                    setError(null);
                    setNotice(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                    mode === option.id ? "bg-[#1db954] text-black" : "text-[#b3b3b3] hover:text-white"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={mode === "encrypt" ? 4 : 3}
          spellCheck={false}
          placeholder={
            mode === "encrypt"
              ? "mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/music"
              : "enc:v1:AbCdEfGh:... "
          }
          className={`${FIELD_CLASS} resize-y font-mono leading-relaxed`}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRun}
            disabled={isBusy || input.trim().length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs transition-transform active:scale-95 disabled:opacity-40"
          >
            {isBusy ? <Loader2 className="size-4 animate-spin" /> : mode === "encrypt" ? <Lock className="size-4" /> : <Unlock className="size-4" />}
            <span>{mode === "encrypt" ? "Encrypt" : "Decrypt"}</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-[#b3b3b3] hover:text-white text-xs font-semibold transition-colors"
          >
            <Trash2 className="size-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={handleSelfTest}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-[#b3b3b3] hover:text-white text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="size-3.5" />
            <span>Test this browser</span>
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-red-400 leading-relaxed break-words">{error}</p>
        )}
        {notice && <p className="text-[11px] text-[#1db954] leading-relaxed">{notice}</p>}
      </div>

      {/* Result */}
      {output && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#181818] border border-[#1db954]/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white">
              3. {mode === "encrypt" ? "Ciphertext (safe to commit)" : "Decrypted value"}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(output)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1db954]/15 text-[#1db954] border border-[#1db954]/30 text-[11px] font-bold"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <textarea
            readOnly
            value={output}
            rows={mode === "encrypt" ? 4 : 3}
            spellCheck={false}
            onFocus={(event) => event.currentTarget.select()}
            className={`${FIELD_CLASS} resize-y font-mono leading-relaxed`}
          />

          {resolved && (
            <div className="space-y-2 pt-1 border-t border-[#282828]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#727272]">
                <span>
                  key id: <span className="text-white font-mono">{resolved.keyId}</span>
                </span>
                <span>
                  algorithm: <span className="text-white font-mono">AES-256-GCM</span>
                </span>
                <span>
                  length: <span className="text-white font-mono">{output.length} chars</span>
                </span>
              </div>

              {keySource === "passphrase" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#b3b3b3]">
                      Derived master key (what the server needs)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRevealKey((value) => !value)}
                        className="text-[10px] text-[#b3b3b3] hover:text-white flex items-center gap-1"
                      >
                        {revealKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        <span>{revealKey ? "Hide" : "Reveal"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(resolved.masterKey)}
                        className="text-[10px] text-[#1db954] hover:text-[#1ed760] flex items-center gap-1"
                      >
                        <Copy className="size-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                  <input
                    readOnly
                    value={revealKey ? resolved.masterKey : "•".repeat(resolved.masterKey.length)}
                    onFocus={(event) => event.currentTarget.select()}
                    className={`${FIELD_CLASS} font-mono text-[11px]`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="p-4 rounded-xl bg-[#181818]/60 border border-[#282828] text-[11px] text-[#b3b3b3] leading-relaxed space-y-1.5">
        <p className="font-bold text-white text-[11px] uppercase tracking-wider">Where to put it</p>
        <p>
          <span className="text-white">wrangler.jsonc</span> → <code>vars</code>: paste the token,
          or run <code className="text-[#1db954]">npm run secrets:seal:wrangler -- --in-place</code>{" "}
          to seal every sealable name in the file at once.
        </p>
        <p>
          <span className="text-white">.env</span>: paste the token, or run{" "}
          <code className="text-[#1db954]">npm run secrets:seal -- --in-place</code>.
        </p>
        <p>
          <span className="text-white">Master key</span>:{" "}
          <code className="text-[#1db954]">npx wrangler secret put SECRETS_MASTER_KEY</code> (never
          in the repository). A comma separated list such as <code>ADMIN_EMAILS</code> is encrypted
          as one value.
        </p>
        <p>
          Check the result on <code className="text-[#1db954]">/api/health</code>:{" "}
          <code>secrets.selfTest</code> must be <code>true</code> and{" "}
          <code>secrets.failed</code> empty.
        </p>
      </div>
    </div>
  );
}
