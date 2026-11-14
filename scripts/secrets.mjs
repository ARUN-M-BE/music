#!/usr/bin/env node
/**
 * Secrets operator CLI - encryption at rest, rotation and verification.
 *
 *   node scripts/secrets.mjs keygen                 generate a master key
 *   node scripts/secrets.mjs seal   [--env .env]    seal every plaintext secret
 *   node scripts/secrets.mjs seal-wrangler [--file wrangler.jsonc] [--all]
 *                                                   seal the values in a `vars` block
 *   node scripts/secrets.mjs rekey  [--env .env]    re-seal with a new master key
 *   node scripts/secrets.mjs doctor [--env .env]    list every secret's state
 *   node scripts/secrets.mjs sync   [--apply]       seal .env values into wrangler.jsonc
 *   node scripts/secrets.mjs push   [--apply]       upload .env secrets to the Worker
 *   node scripts/secrets.mjs encrypt <value>        seal one value (stdout)
 *   node scripts/secrets.mjs decrypt <token>        open one value (stdout)
 *   node scripts/secrets.mjs scan   [--history]     find secrets in tracked files
 *   node scripts/secrets.mjs verify [--env .env]    prove rotated keys work
 *   node scripts/secrets.mjs test                   crypto self-test (no secrets)
 *
 * The cryptography is imported from `src/lib/secrets-core.mjs`, the same module
 * the Next.js server uses, so anything sealed here opens in the app and nothing
 * can drift out of sync. No dependency is required beyond Node.js.
 *
 * Nothing in this file prints a secret value except `decrypt`, which exists for
 * recovery and warns on stderr.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, readFile, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  MASTER_KEY_ENV,
  PREVIOUS_MASTER_KEY_ENV,
  SEALABLE_ENV_NAMES,
  STRICT_ENV,
  buildKeyRing,
  describeSecretValue,
  generateMasterKey,
  isEncryptedSecret,
  keyIdFor,
  openValue,
  sealValue,
} from "../src/lib/secrets-core.mjs";

const MIN_NODE = 18;
const OK = "[OK]  ";
const WARN = "[WARN]";
const FAIL = "[FAIL]";
const SKIP = "[SKIP]";

/**
 * Server-side configuration that is not a secret but still has to exist in the
 * Worker. `wrangler secret bulk` stores it encrypted, which is harmless: the
 * app reads every one of these through `process.env`.
 */
const SERVER_CONFIG_ENV_NAMES = [
  "UPSTASH_REDIS_REST_URL",
  "IMAGEKIT_URL_ENDPOINT",
  "RESEND_FROM",
  "RESEND_FROM_EMAIL",
  "RESEND_ADMIN_NOTIFY_EMAIL",
  "RESEND_AUDIENCE_ID",
  "TINYBIRD_HOST",
  "TINYBIRD_URL",
  "TINYBIRD_PLAYS_DATASOURCE",
  "EVOLUTION_API_URL",
  "EVOLUTION_INSTANCE",
  "EVOLUTION_ADMIN_NUMBER",
  "SESSION_VERSION",
  "SESSION_TTL_SECONDS",
  "ALLOW_GUEST_SESSIONS",
  "ALLOWED_ORIGINS",
  "MONGODB_DB",
  "MAX_AUDIO_UPLOAD_BYTES",
  "MAX_IMAGE_UPLOAD_BYTES",
];

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const flags = {};
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const [name, inline] = token.slice(2).split("=");
    if (inline !== undefined) flags[name] = inline;
    else if (argv[index + 1] && !argv[index + 1].startsWith("--")) flags[name] = argv[++index];
    else flags[name] = true;
  }

  return { flags, positional };
}

// ----------------------------------------------------------------- env file

function parseEnvFile(content) {
  return content.split(/\r?\n/).map((raw) => {
    const match = /^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(raw);
    if (!match) return { raw };

    const [, lead, key, rest] = match;
    let value = rest.trim();
    let quote = "";

    if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.endsWith(value[0])) {
      quote = value[0];
      value = value.slice(1, -1);
    } else {
      const comment = value.indexOf(" #");
      if (comment >= 0) value = value.slice(0, comment).trim();
    }

    return { lead, key, quote, value, raw, dirty: false, present: true };
  });
}

function serializeEnvFile(entries) {
  return entries
    .map((entry) => (entry.present === false ? "" : entry.dirty ? `${entry.lead}${entry.key}=${entry.quote}${entry.value}${entry.quote}` : entry.raw))
    .join("\n");
}

function envValue(entries, name) {
  let value;
  for (const entry of entries) {
    if (entry.key === name) value = entry.value;
  }
  return value;
}

async function readEnvFile(file) {
  const content = await readFile(file, "utf8");
  return { content, entries: parseEnvFile(content) };
}

async function backupFile(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = `${file}.bak.${stamp}`;
  await copyFile(file, target);
  return target;
}

/** Ring built from an explicit --key, the env file, then process.env. */
function resolveRing(entries, flags, { previous = true } = {}) {
  const current =
    (typeof flags.key === "string" ? flags.key : undefined) ??
    (entries ? envValue(entries, MASTER_KEY_ENV) : undefined) ??
    process.env[MASTER_KEY_ENV];
  const previousKey = previous
    ? (typeof flags["previous-key"] === "string" ? flags["previous-key"] : undefined) ??
      (entries ? envValue(entries, PREVIOUS_MASTER_KEY_ENV) : undefined) ??
      process.env[PREVIOUS_MASTER_KEY_ENV]
    : undefined;

  return buildKeyRing(current, previousKey);
}

// ------------------------------------------------------------------ helpers

function redact(text) {
  return String(text)
    .replace(/mongodb(\+srv)?:\/\/[^\s"'<>]+/gi, "mongodb://<redacted>")
    .replace(/\bre_[A-Za-z0-9_-]{8,}/g, "re_<redacted>")
    .replace(/\bprivate_[A-Za-z0-9/+=]{8,}/g, "private_<redacted>")
    .replace(/\bpublic_[A-Za-z0-9/+=]{8,}/g, "public_<redacted>")
    .replace(/\bAIza[0-9A-Za-z_-]{20,}/g, "AIza<redacted>")
    .replace(/\bp\.eyJ[A-Za-z0-9_.-]{20,}/g, "p.<redacted>")
    .replace(/\bgQAAAA[A-Za-z0-9_=-]{10,}/g, "gQAAAA<redacted>")
    .replace(/\bwhsec_[A-Za-z0-9]{8,}/g, "whsec_<redacted>");
}

function line(label, status, detail) {
  const suffix = detail ? ` ${detail}` : "";
  console.log(`${status} ${label}${suffix}`);
}

function requireRing(ring, hint) {
  if (!ring) {
    throw new Error(
      `No master key. Generate one with "npm run secrets:keygen" and export ${MASTER_KEY_ENV}. ${hint ?? ""}`.trim()
    );
  }
  return ring;
}

// ----------------------------------------------------------------- commands

function cmdKeygen() {
  const key = generateMasterKey();
  console.log("New 32-byte master key (base64url). Store it in the platform secret");
  console.log("store, never in the repository and never in the sealed .env:\n");
  console.log(`${MASTER_KEY_ENV}=${key}`);
  console.log(`\nkey id: ${keyIdFor(key)}`);
  console.log("\nNext steps:");
  console.log("  1. put it in the deployment:  npx wrangler secret put " + MASTER_KEY_ENV);
  console.log("  2. export it locally:         $env:" + MASTER_KEY_ENV + '="' + key + '"');
  console.log("  3. seal the values:           npm run secrets:seal");
}

function cmdEncrypt({ flags, positional }, stdinValue) {
  const plaintext = stdinValue ?? positional.join(" ");
  if (!plaintext) throw new Error("Usage: node scripts/secrets.mjs encrypt <value>  (or --stdin)");

  const ring = requireRing(buildKeyRing(flags.key ?? process.env[MASTER_KEY_ENV], null));
  console.log(sealValue(plaintext, ring));
}

function cmdDecrypt({ flags, positional }) {
  const token = positional[0];
  if (!token) throw new Error("Usage: node scripts/secrets.mjs decrypt <enc:v1:...>");

  const ring = requireRing(buildKeyRing(flags.key ?? process.env[MASTER_KEY_ENV], process.env[PREVIOUS_MASTER_KEY_ENV]));
  console.error("warning: printing a decrypted secret to stdout");
  console.log(openValue(token, ring, "token"));
}

async function cmdSeal({ flags }) {
  const file = flags.env ?? ".env";
  const { entries } = await readEnvFile(file);
  const ring = requireRing(
    resolveRing(entries, flags, { previous: false }),
    "Add --key <master key> if it is not in the environment."
  );

  let sealed = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.key || entry.present === false) continue;
    if (!SEALABLE_ENV_NAMES.includes(entry.key)) continue;

    if (!entry.value) {
      skipped += 1;
      continue;
    }
    if (isEncryptedSecret(entry.value)) {
      skipped += 1;
      continue;
    }

    entry.value = sealValue(entry.value, ring);
    entry.dirty = true;
    sealed += 1;
  }

  if (sealed === 0) {
    console.log(`${WARN} nothing to seal in ${file} (${skipped} already sealed or empty)`);
    return;
  }

  if (flags["in-place"]) {
    const backup = await backupFile(file);
    console.log(`${OK} backup written to ${backup}`);
    await writeFile(file, serializeEnvFile(entries), "utf8");
    console.log(`${OK} sealed ${sealed} secret(s) in ${file} (${skipped} skipped)`);
  } else {
    const out = typeof flags.out === "string" ? flags.out : `${file}.sealed`;
    await writeFile(out, serializeEnvFile(entries), "utf8");
    console.log(`${OK} sealed ${sealed} secret(s) -> ${out} (${skipped} skipped)`);
    console.log(`     review it, then replace ${file} with it`);
  }
  console.log(`     key id: ${ring.currentId}`);
}

/**
 * Counts object braces outside strings and `//` comments, so a `}` inside a
 * value cannot make the `vars` block end early.
 */
function braceDelta(text) {
  let delta = 0;
  let quote = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "/" && text[index + 1] === "/") return delta;
    if (char === "{") delta += 1;
    else if (char === "}") delta -= 1;
  }
  return delta;
}

/**
 * Seals the values of a committed config file (`wrangler.jsonc`).
 *
 * Configuration that lives in the repository is public, so a value that must
 * stay private becomes an `enc:v1:` token: the ciphertext is safe to commit and
 * the Worker opens it at runtime with SECRETS_MASTER_KEY (a Wrangler secret).
 * `NEXT_PUBLIC_*` values are skipped - they are inlined into the browser bundle
 * at build time and can never be ciphertext.
 */
async function cmdSealWrangler({ flags }) {
  const file = typeof flags.file === "string" ? flags.file : "wrangler.jsonc";
  const source = await readFile(file, "utf8");
  const ring = requireRing(
    resolveRing(null, flags, { previous: false }),
    "Pass --key <master key> or export " + MASTER_KEY_ENV + "."
  );

  const lines = source.split(/\r?\n/);
  const sealedNames = [];
  const skipped = [];
  let inVars = false;
  let depth = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index];

    if (!inVars) {
      if (/^\s*"vars"\s*:\s*\{/.test(text)) {
        inVars = true;
        depth = 1;
      }
      continue;
    }

    const pair = /^(\s*")([A-Za-z_][A-Za-z0-9_]*)("\s*:\s*")((?:[^"\\]|\\.)*)("\s*,?\s*(?:\/\/.*)?)$/.exec(text);
    if (pair) {
      const [, lead, name, middle, escaped, tail] = pair;
      const value = JSON.parse(`"${escaped}"`);

      if (isEncryptedSecret(value)) skipped.push(`${name} (already sealed)`);
      else if (name.startsWith("NEXT_PUBLIC_")) skipped.push(`${name} (build-time public value)`);
      else if (!flags.all && !SEALABLE_ENV_NAMES.includes(name)) {
        skipped.push(`${name} (not a sealable name; use --all to force)`);
      } else if (!value) skipped.push(`${name} (empty)`);
      else {
        const token = sealValue(value, ring);
        lines[index] = `${lead}${name}${middle}${JSON.stringify(token).slice(1, -1)}${tail}`;
        sealedNames.push(name);
      }
    }

    depth += braceDelta(text);
    if (depth <= 0) inVars = false;
  }

  if (sealedNames.length === 0) {
    console.log(`${WARN} nothing to seal in the vars block of ${file}`);
    for (const item of skipped) console.log(`${SKIP} ${item}`);
    return;
  }

  if (flags["in-place"]) {
    const backup = await backupFile(file);
    console.log(`${OK} backup written to ${backup}`);
    await writeFile(file, lines.join("\n"), "utf8");
  } else {
    const out = typeof flags.out === "string" ? flags.out : `${file}.sealed`;
    await writeFile(out, lines.join("\n"), "utf8");
    console.log(`${OK} sealed ${sealedNames.length} value(s) -> ${out}`);
    console.log(`     review it, then replace ${file} with it`);
  }

  for (const name of sealedNames) console.log(`${OK} sealed ${name}`);
  for (const item of skipped) console.log(`${SKIP} ${item}`);
  console.log(`     key id: ${ring.currentId}`);
  console.log(`\nThe Worker must hold the same key: npx wrangler secret put ${MASTER_KEY_ENV}`);
  console.log(`     ${STRICT_ENV}=true also requires the same names to be sealed in .env`);
}

async function cmdRekey({ flags }) {
  const file = flags.env ?? ".env";
  const { entries } = await readEnvFile(file);

  const oldRing = resolveRing(entries, flags, { previous: false });
  if (!oldRing) throw new Error(`No current master key: set ${MASTER_KEY_ENV} or pass --key.`);

  const newKey = typeof flags["new-key"] === "string" ? flags["new-key"] : generateMasterKey();
  const newRing = buildKeyRing(newKey, null);
  if (!newRing) throw new Error("--new-key is not a valid 32-byte key (base64url/base64/hex).");

  let rekeyed = 0;
  let failed = 0;

  for (const entry of entries) {
    if (!entry.key || !isEncryptedSecret(entry.value)) continue;
    try {
      entry.value = sealValue(openValue(entry.value, oldRing, entry.key), newRing);
      entry.dirty = true;
      rekeyed += 1;
    } catch (error) {
      failed += 1;
      line(entry.key, FAIL, redact(error.message));
    }
  }

  const out = typeof flags.out === "string" ? flags.out : `${file}.rekeyed`;
  if (flags["in-place"]) {
    const backup = await backupFile(file);
    console.log(`${OK} backup written to ${backup}`);
    await writeFile(file, serializeEnvFile(entries), "utf8");
  } else {
    await writeFile(out, serializeEnvFile(entries), "utf8");
  }

  console.log(`${OK} re-sealed ${rekeyed} value(s) with key ${newRing.currentId}${failed ? ` (${failed} failed)` : ""}`);
  console.log("\nFinish the rotation:");
  console.log(`  1. npx wrangler secret put ${MASTER_KEY_ENV}      (paste the new key)`);
  console.log(`  2. keep the old key as ${PREVIOUS_MASTER_KEY_ENV} until every instance restarts`);
  console.log("  3. deploy, check GET /api/health -> secrets.selfTest=true,");
  console.log(`  4. then remove ${PREVIOUS_MASTER_KEY_ENV}.`);
  if (!flags["in-place"]) console.log(`\nNew file: ${out}`);
  console.log(`\n${MASTER_KEY_ENV}=${newKey}`);
}

async function cmdDoctor({ flags }) {
  const file = flags.env ?? ".env";
  let entries = [];
  try {
    ({ entries } = await readEnvFile(file));
  } catch {
    console.log(`${WARN} ${file} not found; using the process environment only`);
  }

  const ring = resolveRing(entries, flags);
  const current = (typeof flags.key === "string" ? flags.key : envValue(entries, MASTER_KEY_ENV)) ?? process.env[MASTER_KEY_ENV];
  const previous = envValue(entries, PREVIOUS_MASTER_KEY_ENV) ?? process.env[PREVIOUS_MASTER_KEY_ENV];
  const strict = /^(1|true|yes|on)$/i.test(String(envValue(entries, STRICT_ENV) ?? process.env[STRICT_ENV] ?? ""));

  console.log(`file      : ${file}`);
  console.log(`master key: ${current ? `present (id ${keyIdFor(current)})` : "MISSING"}`);
  console.log(`previous  : ${previous ? `present (id ${keyIdFor(previous)})` : "absent"}`);
  console.log(`strict    : ${strict ? "on (plaintext refused)" : "off (plaintext accepted, reported)"}`);
  console.log("");

  let failures = 0;
  let plaintext = 0;
  let sealed = 0;
  let missing = 0;

  for (const name of SEALABLE_ENV_NAMES) {
    const raw = envValue(entries, name) ?? process.env[name];
    if (!raw) {
      missing += 1;
      console.log(`${SKIP} ${name.padEnd(26)} not set`);
      continue;
    }
    if (!isEncryptedSecret(raw)) {
      plaintext += 1;
      console.log(`${WARN} ${name.padEnd(26)} ${describeSecretValue(raw)}`);
      continue;
    }
    try {
      openValue(raw, ring, name);
      sealed += 1;
      console.log(`${OK} ${name.padEnd(26)} ${describeSecretValue(raw)}`);
    } catch (error) {
      failures += 1;
      console.log(`${FAIL} ${name.padEnd(26)} ${redact(error.message)}`);
    }
  }

  console.log("");
  console.log(`sealed: ${sealed}   plaintext: ${plaintext}   missing: ${missing}   broken: ${failures}`);
  if (failures > 0) {
    console.log(`\n${FAIL} at least one sealed value cannot be opened: set ${PREVIOUS_MASTER_KEY_ENV} if it was sealed with an older key.`);
    process.exitCode = 1;
  } else if (plaintext > 0) {
    console.log(`\n${WARN} run "npm run secrets:seal -- --in-place" to encrypt the plaintext values.`);
  }
}

const SCAN_RULES = [
  { name: "mongodb-uri", pattern: /mongodb(\+srv)?:\/\/[^/\s"'<>,@:]+:[^/\s"'<>@]+@/ },
  { name: "resend-key", pattern: /\bre_[A-Za-z0-9_-]{16,}/ },
  { name: "imagekit-private", pattern: /\bprivate_[A-Za-z0-9/+=]{16,}/ },
  { name: "imagekit-public", pattern: /\bpublic_[A-Za-z0-9/+=]{16,}/ },
  { name: "firebase-key", pattern: /\bAIza[0-9A-Za-z_-]{30,}/ },
  { name: "tinybird-token", pattern: /\bp\.eyJ[A-Za-z0-9_.-]{20,}/ },
  { name: "upstash-token", pattern: /\bgQAAAA[A-Za-z0-9_=-]{20,}/ },
  { name: "webhook-secret", pattern: /\bwhsec_[A-Za-z0-9]{20,}/ },
  { name: "private-key-block", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

/**
 * Documentation placeholders must not fail the scan: `.env.example` legitimately
 * contains `USER:PASSWORD@CLUSTER.mongodb.net` and `<...>` templates.
 */
function isPlaceholder(text) {
  if (/(your|xxxx|example|placeholder|changeme|dummy|redacted|sample|test)[-_]/i.test(text)) return true;
  if (/<[^>]{3,}>/.test(text)) return true;
  if (/USER(NAME)?:PASSWORD/.test(text)) return true;
  if (/CLUSTER\.mongodb\.net/.test(text)) return true;
  return false;
}

function runGit(args, cwd, maxBytes = 8 * 1024 * 1024) {
  return new Promise((resolve) => {
    const child = spawn("git", args, { cwd, windowsHide: true });
    let out = "";
    let size = 0;
    let truncated = false;

    child.stdout.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        truncated = true;
        child.kill();
        return;
      }
      out += chunk.toString("utf8");
    });
    child.on("error", () => resolve({ ok: false, out: "", truncated }));
    child.on("close", () => resolve({ ok: true, out, truncated }));
  });
}

/**
 * Names defined in the `vars` block of a Wrangler config, or `null` when the
 * file is missing or not parseable (then nothing is skipped).
 */
async function readConfigVarNames(configFile) {
  try {
    const source = await readFile(configFile, "utf8");
    const json = source
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");
    const parsed = JSON.parse(json);
    return new Set(Object.keys(parsed?.vars ?? {}));
  } catch {
    return null;
  }
}

/**
 * Uploads the server secrets from `.env` to the Worker (`wrangler secret bulk`).
 *
 * The values are normally sealed already, so the Worker only needs the same
 * SECRETS_MASTER_KEY to open them - and that key is part of the upload. A dry
 * run is the default: writing to a production Worker must be an explicit
 * choice (`--apply`).
 */
async function cmdPush({ flags }) {
  const file = flags.env ?? ".env";
  const { entries } = await readEnvFile(file);

  // A binding name belongs to the `vars` block OR to a secret, never both:
  // Cloudflare rejects the upload of a secret that shadows a var
  // ("Binding name 'X' already in use", code 10053). Values already shipped by
  // `wrangler.jsonc` are therefore skipped - they only need SECRETS_MASTER_KEY.
  const configVars = await readConfigVarNames(
    typeof flags.file === "string" ? flags.file : "wrangler.jsonc"
  );

  const payload = {};
  const fromConfig = [];
  const candidates = [
    ...SEALABLE_ENV_NAMES,
    ...SERVER_CONFIG_ENV_NAMES,
    MASTER_KEY_ENV,
    PREVIOUS_MASTER_KEY_ENV,
  ];
  for (const name of candidates) {
    const value = envValue(entries, name);
    if (!value) continue;
    if (configVars?.has(name)) {
      fromConfig.push(name);
      continue;
    }
    payload[name] = value;
  }

  if (fromConfig.length > 0) {
    console.log(`${SKIP} already provided by the vars block: ${fromConfig.join(", ")}`);
  }

  const names = Object.keys(payload);
  if (names.length === 0) {
    console.log(`${WARN} nothing to push: no secret is set in ${file}`);
    return;
  }

  const sealed = names.filter((name) => isEncryptedSecret(payload[name])).length;
  console.log(`${OK} ${names.length} secret(s) from ${file}: ${names.join(", ")}`);
  if (sealed > 0) console.log(`     ${sealed} of them are sealed (enc:v1:)`);

  if (sealed > 0 && !payload[MASTER_KEY_ENV]) {
    console.log(`${FAIL} sealed values need ${MASTER_KEY_ENV} in ${file}, otherwise the Worker cannot open them`);
    process.exitCode = 1;
    return;
  }

  if (!flags.apply) {
    console.log(`${WARN} dry run: re-run with --apply to upload them to the Worker`);
    return;
  }

  const tmpFile = path.join(os.tmpdir(), `music-secrets-${process.pid}-${Date.now()}.json`);
  await writeFile(tmpFile, JSON.stringify(payload), { encoding: "utf8", mode: 0o600 });

  try {
    const args = ["secret", "bulk", tmpFile];
    if (typeof flags.worker === "string") args.push("--name", flags.worker);
    console.log(`${OK} wrangler ${args.join(" ")} <temporary file>`);

    // Windows: spawning `npx.cmd` without a shell fails with EINVAL on Node 20+.
    // Run the installed Wrangler bin with this Node instead, and only fall back
    // to `npx` (through a shell) when wrangler is not installed locally.
    const localBin = path.join(process.cwd(), "node_modules", "wrangler", "bin", "wrangler.js");
    const command = existsSync(localBin) ? process.execPath : "npx";
    const commandArgs = existsSync(localBin) ? [localBin, ...args] : ["-y", "wrangler", ...args];

    await new Promise((resolve, reject) => {
      const child = spawn(command, commandArgs, { stdio: "inherit", shell: command === "npx" });
      child.on("error", reject);
      child.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`wrangler exited with code ${code}`))
      );
    });

    console.log(`${OK} uploaded ${names.length} secret(s); redeploy so the Worker restarts`);
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

/**
 * Copies the server secrets from `.env` into the `vars` block of a committed
 * config file, sealed (`enc:v1:`).
 *
 * The point is a deployment that needs exactly one piece of external
 * configuration: SECRETS_MASTER_KEY. Everything else travels with the code as
 * ciphertext, so a Git-based build (Cloudflare Workers Builds, a CI runner) is
 * fully configured without pasting values into a dashboard.
 *
 * The `vars` block is rewritten in a normalised form. Dry run by default;
 * `--apply` rewrites the file after taking a backup.
 */
async function cmdSync({ flags }) {
  const envFile = flags.env ?? ".env";
  const configFile = typeof flags.file === "string" ? flags.file : "wrangler.jsonc";
  const { entries } = await readEnvFile(envFile);
  const ring = requireRing(
    resolveRing(entries, flags, { previous: false }),
    `Add --key <master key> if it is not in ${envFile}.`
  );

  const wanted = new Map();
  for (const name of SEALABLE_ENV_NAMES) {
    const value = envValue(entries, name);
    if (!value) continue;
    wanted.set(name, isEncryptedSecret(value) ? value : sealValue(value, ring));
  }

  // Non-secret server configuration travels as plaintext: it has to reach the
  // Worker too (rate-limit URL, mail sender, session TTL, CORS allow-list).
  for (const name of SERVER_CONFIG_ENV_NAMES) {
    const value = envValue(entries, name);
    if (value && !isEncryptedSecret(value)) wanted.set(name, value);
  }

  if (wanted.size === 0) {
    console.log(`${WARN} nothing to sync: no sealable value is set in ${envFile}`);
    return;
  }

  const source = await readFile(configFile, "utf8");
  const lines = source.split(/\r?\n/);
  const pairPattern = /^(\s*)"([A-Za-z_][A-Za-z0-9_]*)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,?\s*(?:\/\/.*)?$/;

  let inVars = false;
  let depth = 0;
  let openIndex = -1;
  let closeIndex = -1;
  let indent = "    ";
  const existing = new Map();

  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index];
    if (!inVars) {
      if (/^\s*"vars"\s*:\s*\{/.test(text)) {
        inVars = true;
        depth = 1;
        openIndex = index;
      }
      continue;
    }

    const pair = pairPattern.exec(text);
    if (pair) {
      const [, lead, name, escaped] = pair;
      existing.set(name, JSON.parse(`"${escaped}"`));
      indent = lead || indent;
    }

    depth += braceDelta(text);
    if (depth <= 0) {
      inVars = false;
      closeIndex = index;
      break;
    }
  }

  if (openIndex < 0 || closeIndex < 0) {
    throw new Error(`could not find the "vars" block in ${configFile}`);
  }

  const updated = [];
  const added = [];
  for (const [name, token] of wanted) {
    if (existing.has(name)) updated.push(name);
    else added.push(name);
    existing.set(name, token);
  }

  const body = [...existing].map(
    ([name, value], index, all) =>
      `${indent}"${name}": ${JSON.stringify(value)}${index === all.length - 1 ? "" : ","}`
  );
  const sealedCount = [...wanted.values()].filter((value) => isEncryptedSecret(value)).length;

  console.log(
    `${OK} ${updated.length} value(s) refreshed, ${added.length} added in ${configFile}: ${[...wanted.keys()].join(
      ", "
    )}`
  );
  console.log(`     ${sealedCount} sealed with key ${ring.currentId}, ${wanted.size - sealedCount} plaintext`);

  if (!flags.apply) {
    console.log(`${WARN} dry run: re-run with --apply to rewrite ${configFile}`);
    return;
  }

  lines.splice(openIndex + 1, closeIndex - openIndex - 1, ...body);
  await backupFile(configFile);
  await writeFile(configFile, lines.join("\n"), "utf8");
  console.log(`${OK} ${configFile} now carries the sealed values (key id: ${ring.currentId})`);
  console.log(`     the Worker only needs one secret: ${MASTER_KEY_ENV}`);
}

async function cmdScan({ flags }, cwd) {
  const history = Boolean(flags.history);
  const rules = flags.rule
    ? SCAN_RULES.filter((rule) => rule.name === flags.rule)
    : SCAN_RULES;

  if (history) return scanHistory(cwd, rules);

  const tracked = await runGit(["ls-files", "-z"], cwd);
  if (!tracked.ok) throw new Error("git is not available; run from the repository root");

  const untracked = await runGit(["ls-files", "--others", "--exclude-standard", "-z"], cwd);
  const files = `${tracked.out}\u0000${untracked.ok ? untracked.out : ""}`
    .split("\u0000")
    .map((file) => file.trim())
    .filter(Boolean);

  const findings = [];

  for (const file of files) {
    if (/(^|\/)node_modules\//.test(file)) continue; // vendored code, not ours
    let content;
    try {
      content = await readFile(path.resolve(cwd, file), "utf8");
    } catch {
      continue; // deleted or binary
    }
    if (content.includes("\u0000")) continue; // binary

    content.split(/\r?\n/).forEach((text, index) => {
      for (const rule of rules) {
        if (!rule.pattern.test(text)) continue;
        if (isPlaceholder(text)) continue;
        findings.push({ file, line: index + 1, rule: rule.name });
      }
    });
  }

  if (findings.length === 0) {
    console.log(`${OK} no secrets found in ${files.length} tracked/untracked file(s)`);
    return;
  }

  for (const finding of findings) {
    console.log(`${FAIL} ${finding.file}:${finding.line}  [${finding.rule}]  <redacted>`);
  }
  console.log(`\n${FAIL} ${findings.length} potential secret(s) in the working tree.`);
  process.exitCode = 1;
}

/** Streams `git` output line by line so a large history cannot exhaust memory. */
function streamGit(args, cwd, onLine) {
  return new Promise((resolve) => {
    const child = spawn("git", args, { cwd, windowsHide: true });
    let buffer = "";

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        onLine(buffer.slice(0, index).replace(/\r$/, ""));
        buffer = buffer.slice(index + 1);
      }
    });
    child.on("error", () => resolve(false));
    child.on("close", () => {
      if (buffer) onLine(buffer.replace(/\r$/, ""));
      resolve(true);
    });
  });
}

async function scanHistory(cwd, rules) {
  const seen = new Set();
  let commit = "unknown";
  let file = "unknown";

  const ok = await streamGit(
    ["log", "--all", "-p", "--pretty=format:__COMMIT__%H"],
    cwd,
    (text) => {
      if (text.startsWith("__COMMIT__")) {
        commit = text.slice("__COMMIT__".length);
        file = "unknown";
        return;
      }
      if (text.startsWith("diff --git ")) {
        const match = / b\/(.+)$/.exec(text);
        // Vendored dependencies were committed by an old layout; they are not
        // our credentials and only add noise.
        if (match && !/(^|\/)node_modules\//.test(match[1])) file = match[1];
        return;
      }
      if (file === "unknown") return;
      if (!text.startsWith("+")) return; // only added lines, never context

      for (const rule of rules) {
        if (!rule.pattern.test(text)) continue;
        if (isPlaceholder(text)) continue;
        const key = `${commit}|${file}|${rule.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        console.log(`${FAIL} ${commit.slice(0, 9)} ${file}  [${rule.name}]  <redacted>`);
      }
    }
  );

  if (!ok) throw new Error("git is not available; run from the repository root");

  if (seen.size === 0) {
    console.log(`${OK} no secrets found in git history`);
    return;
  }
  console.log(`\n${FAIL} ${seen.size} historical occurrence(s). Rotation is mandatory: removing`);
  console.log("     the blob does not un-leak a credential that was already pushed.");
  process.exitCode = 1;
}

// ------------------------------------------------------------------- verify

async function cmdVerify({ flags }) {
  const file = flags.env ?? ".env";
  const values = {};

  try {
    const { entries } = await readEnvFile(file);
    const ring = resolveRing(entries, flags);
    for (const entry of entries) {
      if (!entry.key) continue;
      values[entry.key] = isEncryptedSecret(entry.value)
        ? openValue(entry.value, ring, entry.key)
        : entry.value;
    }
  } catch (error) {
    console.log(`${WARN} could not read ${file}: ${redact(error.message)}`);
  }
  for (const [name, value] of Object.entries(process.env)) {
    if (!(name in values) && value) values[name] = value;
  }

  const results = [];
  const record = (name, status, detail) => {
    results.push({ name, status, detail });
    line(name.padEnd(14), status, detail);
  };

  // --- MongoDB (proves the rotated password and the new URI work)
  const mongoUri = values.MONGODB_URI || values.DATABASE_STRING;
  if (!mongoUri) {
    record("MongoDB", SKIP, "MONGODB_URI is not set");
  } else {
    let client;
    try {
      const { MongoClient } = await import("mongodb");
      client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 8000 });
      await client.connect();
      await client.db().admin().command({ ping: 1 });
      record("MongoDB", OK, "authenticated, ping=1");
    } catch (error) {
      record("MongoDB", FAIL, redact(error.message));
    } finally {
      await client?.close().catch(() => {});
    }
  }

  // --- ImageKit (read-only listing; a rotated private key must still list)
  if (!values.IMAGEKIT_PRIVATE_KEY) {
    record("ImageKit", SKIP, "IMAGEKIT_PRIVATE_KEY is not set");
  } else {
    try {
      const basic = Buffer.from(`${values.IMAGEKIT_PRIVATE_KEY}:`).toString("base64");
      const response = await fetch("https://api.imagekit.io/v1/files?limit=1", {
        headers: { Authorization: `Basic ${basic}` },
        signal: AbortSignal.timeout(15000),
      });
      record("ImageKit", response.ok ? OK : FAIL, `HTTP ${response.status}`);
    } catch (error) {
      record("ImageKit", FAIL, redact(error.message));
    }
  }

  // --- Resend (R-2: a rejected key must be a hard, visible failure)
  if (!values.RESEND_API_KEY) {
    record("Resend", SKIP, "RESEND_API_KEY is not set");
  } else {
    try {
      const response = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${values.RESEND_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) record("Resend", OK, "key accepted");
      else if (response.status === 401 || response.status === 403) {
        record("Resend", FAIL, `key rejected (HTTP ${response.status}) - rotate RESEND_API_KEY`);
      } else record("Resend", FAIL, `HTTP ${response.status}`);
    } catch (error) {
      record("Resend", FAIL, redact(error.message));
    }
  }

  // --- Firebase (the web API key may be public, but a revoked one breaks sign-in)
  if (!values.NEXT_PUBLIC_FIREBASE_API_KEY && !values.FIREBASE_WEB_API_KEY) {
    record("Firebase", SKIP, "no web API key is set");
  } else {
    try {
      const key = values.FIREBASE_WEB_API_KEY || values.NEXT_PUBLIC_FIREBASE_API_KEY;
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: "probe" }),
          signal: AbortSignal.timeout(10000),
        }
      );
      const payload = await response.json().catch(() => ({}));
      const message = String(payload?.error?.message ?? "");
      if (/API key not valid|API_KEY_INVALID/i.test(message)) {
        record("Firebase", FAIL, "API key rejected - restrict and rotate it in Google Cloud");
      } else {
        record("Firebase", OK, `key accepted (${message || "HTTP " + response.status})`);
      }
    } catch (error) {
      record("Firebase", FAIL, redact(error.message));
    }
  }

  // --- Upstash (optional)
  if (!values.UPSTASH_REDIS_REST_URL || !values.UPSTASH_REDIS_REST_TOKEN) {
    record("Upstash", SKIP, "not configured");
  } else {
    try {
      const response = await fetch(`${values.UPSTASH_REDIS_REST_URL.replace(/\/$/, "")}/ping`, {
        headers: { Authorization: `Bearer ${values.UPSTASH_REDIS_REST_TOKEN}` },
        signal: AbortSignal.timeout(10000),
      });
      const payload = await response.json().catch(() => ({}));
      record("Upstash", payload?.result === "PONG" ? OK : FAIL, `HTTP ${response.status}`);
    } catch (error) {
      record("Upstash", FAIL, redact(error.message));
    }
  }

  // --- Tinybird (token validity only; deployment is a separate step)
  if (!values.TINYBIRD_TOKEN) {
    record("Tinybird", SKIP, "TINYBIRD_TOKEN is not set");
  } else {
    try {
      const host = (values.TINYBIRD_HOST || values.TINYBIRD_URL || "https://api.tinybird.co").replace(/\/$/, "");
      const response = await fetch(`${host}/v0/datasources`, {
        headers: { Authorization: `Bearer ${values.TINYBIRD_TOKEN}` },
        signal: AbortSignal.timeout(10000),
      });
      record("Tinybird", response.ok ? OK : FAIL, `HTTP ${response.status}`);
    } catch (error) {
      record("Tinybird", FAIL, redact(error.message));
    }
  }

  const failed = results.filter((item) => item.status === FAIL);
  console.log("");
  if (failed.length > 0) {
    console.log(`${FAIL} ${failed.length} credential(s) rejected: ${failed.map((item) => item.name).join(", ")}`);
    console.log("     rotate them, then re-run: npm run secrets:verify");
    process.exitCode = 1;
  } else {
    console.log(`${OK} every configured credential was accepted`);
  }
}

// --------------------------------------------------------------------- test

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertThrows(fn, label) {
  try {
    fn();
  } catch {
    console.log(`${OK} ${label}`);
    return;
  }
  throw new Error(`${label}: expected a failure, got a value`);
}

function assertRejects(fn, label) {
  return Promise.resolve()
    .then(fn)
    .then(
      () => {
        throw new Error(`${label}: expected a failure, got a value`);
      },
      () => {
        console.log(`${OK} ${label}`);
      }
    );
}

async function cmdTest() {
  const keyA = generateMasterKey();
  const keyB = generateMasterKey();
  const ringA = buildKeyRing(keyA, null);
  const sample = `selftest-${Date.now()}-ünïcødé`;

  const token = sealValue(sample, ringA);
  assert(token.startsWith("enc:v1:"), "token prefix");
  assert(token.split(":")[2] === keyIdFor(keyA), "token carries the current key id");
  assert(openValue(token, ringA, "sample") === sample, "round trip");
  console.log(`${OK} seal -> open round trip`);

  const rotated = buildKeyRing(keyB, keyA);
  assert(rotated.currentId === keyIdFor(keyB), "rotation prefers the current key");
  assert(openValue(token, rotated, "sample") === sample, "old ciphertext opens during rotation");
  assert(openValue(sealValue(sample, ringA), ringA, "sample") !== token, "a fresh IV per value");
  console.log(`${OK} rotation reads old and new ciphertext`);

  assertThrows(() => openValue(token, buildKeyRing(keyB, null), "sample"), "wrong master key is rejected");

  const parts = token.split(":");
  const payload = Buffer.from(parts[3], "base64url");
  payload[payload.length - 1] ^= 0xff;
  assertThrows(
    () => openValue(`${parts[0]}:${parts[1]}:${parts[2]}:${payload.toString("base64url")}`, ringA, "sample"),
    "tampered ciphertext is rejected by AES-GCM"
  );

  assertThrows(() => openValue("plaintext-value", ringA, "sample"), "plaintext is not mistaken for a token");
  assertThrows(() => openValue(token, null, "sample"), "a sealed value without a master key fails closed");

  // --- the browser (WebCrypto) implementation must agree byte for byte, or a
  // value sealed in the tool page could not be read by the server.
  const web = await import("../src/lib/secrets-web.mjs");
  assert((await web.keyIdOf(keyA)) === keyIdFor(keyA), "WebCrypto derives the same key id");
  assert((await web.openText(token, keyA)) === sample, "a Node-sealed token opens in WebCrypto");
  assert(
    openValue(await web.sealText(sample, keyA), ringA, "sample") === sample,
    "a WebCrypto-sealed token opens in Node"
  );
  await assertRejects(() => web.openText(token, keyB), "WebCrypto rejects the wrong master key");
  console.log(`${OK} browser and Node.js produce interchangeable tokens`);

  const passphrase = "correct horse battery staple";
  const derived = await web.deriveMasterKey(passphrase);
  const derivedRing = buildKeyRing(derived, null);
  assert(derived === (await web.deriveMasterKey(passphrase)), "passphrase derivation is reproducible");
  assert(derivedRing?.currentId === (await web.keyIdOf(derived)), "a passphrase yields a valid master key");
  assert(
    openValue(await web.sealText(sample, derived), derivedRing, "sample") === sample,
    "passphrase-derived values open on the server"
  );
  console.log(`${OK} passphrase mode derives a server-usable master key`);

  console.log(`\n${OK} secrets self-test passed`);
}

// --------------------------------------------------------------------- main

function usage() {
  console.log(`secrets CLI - encryption at rest and rotation

  keygen                    generate a master key
  seal   [--env .env] [--in-place] [--out FILE] [--key K]
  seal-wrangler [--file wrangler.jsonc] [--in-place] [--out FILE] [--all] [--key K]
  rekey  [--env .env] [--new-key K] [--in-place]
  doctor [--env .env] [--key K]
  sync   [--env .env] [--file wrangler.jsonc] [--apply]
                           copy sealed secrets from .env into the vars block
  push   [--env .env] [--apply] [--worker NAME]
                           upload the secrets from .env to the Worker
  encrypt <value> [--key K] (or --stdin)
  decrypt <token> [--key K]
  scan   [--history] [--rule NAME]
  verify [--env .env] [--key K]
  test

Rules for scan: ${SCAN_RULES.map((rule) => rule.name).join(", ")}
`);
}

async function main() {
  if (Number(process.versions.node.split(".")[0]) < MIN_NODE) {
    throw new Error(`Node.js ${MIN_NODE}+ is required (found ${process.versions.node})`);
  }

  const { flags, positional } = parseArgs(process.argv.slice(2));
  const command = positional.shift() ?? "help";
  const cwd = process.cwd();

  switch (command) {
    case "keygen":
      return cmdKeygen();
    case "seal":
      return cmdSeal({ flags });
    case "seal-wrangler":
      return cmdSealWrangler({ flags });
    case "rekey":
      return cmdRekey({ flags });
    case "doctor":
      return cmdDoctor({ flags });
    case "push":
      return cmdPush({ flags });
    case "sync":
      return cmdSync({ flags });
    case "verify":
      return cmdVerify({ flags });
    case "scan":
      return cmdScan({ flags }, cwd);
    case "test":
      return cmdTest();
    case "encrypt": {
      const stdinValue = flags.stdin
        ? await new Promise((resolve) => {
            let data = "";
            process.stdin.setEncoding("utf8");
            process.stdin.on("data", (chunk) => (data += chunk));
            process.stdin.on("end", () => resolve(data.trim()));
          })
        : undefined;
      return cmdEncrypt({ flags, positional }, stdinValue);
    }
    case "decrypt":
      return cmdDecrypt({ flags, positional });
    case "help":
    case "--help":
    case "-h":
      return usage();
    default:
      usage();
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(`${FAIL} ${redact(error?.message ?? error)}`);
  process.exitCode = 1;
});
