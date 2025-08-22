// index.js — FAARIZ License Server (OPERATION 5 core)

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// --- security: simple allowlist for your scripts (change IDs as you release new scripts)
const ALLOWED_SCRIPTS = new Set([
  "FKBP-PRO-1.0",   // FAARIZ KING BOT PRO v1
  "FKBP-PRO-1.1"    // future example
]);

// --- in-memory DB (for demo). For production use a real DB.
const KEYS = new Map();
/*
  KEYS.set("FAARIZ-KEY-9999-PRO", {
    scriptId: "FKBP-PRO-1.0",
    expiresAt: Date.now() + 30*24*60*60*1000, // 30 days
    fingerprint: null,  // will be bound on first verify
    revoked: false
  });
*/

app.use(cors());
app.use(express.json());

// --- helpers
const daysLeft = (ms) => Math.max(0, Math.ceil((ms - Date.now())/86400000));

// --- home/health
app.get("/", (_, res) => res.send("FAARIZ License Server is running ✅"));
app.get("/health", (_, res) => res.json({ ok: true, ts: Date.now() }));

// --- VERIFY (client uses this)
app.post("/verify", (req, res) => {
  const { key, scriptId, fingerprint } = req.body || {};
  if (typeof key !== "string" || typeof scriptId !== "string" || typeof fingerprint !== "string") {
    return res.status(400).json({ ok: false, reason: "bad_request" });
  }
  if (!ALLOWED_SCRIPTS.has(scriptId)) {
    return res.status(403).json({ ok: false, reason: "script_not_allowed" });
  }

  const rec = KEYS.get(key);
  if (!rec) return res.json({ ok: false, reason: "invalid_key" });
  if (rec.revoked) return res.json({ ok: false, reason: "revoked" });
  if (rec.scriptId !== scriptId) return res.json({ ok: false, reason: "script_mismatch" });
  if (Date.now() > rec.expiresAt) return res.json({ ok: false, reason: "expired" });

  // bind fingerprint first time; then enforce match
  if (!rec.fingerprint) {
    rec.fingerprint = fingerprint;
  } else if (rec.fingerprint !== fingerprint) {
    return res.json({ ok: false, reason: "fingerprint_mismatch" });
  }

  return res.json({
    ok: true,
    days_left: daysLeft(rec.expiresAt),
    bound: !!rec.fingerprint
  });
});

// --- ADMIN: issue key
app.post("/issue", (req, res) => {
  const admin = req.headers["x-admin-token"];
  if (admin !== process.env.ADMIN_TOKEN) return res.status(401).json({ ok: false, reason: "unauthorized" });

  const { key, scriptId, days = 30 } = req.body || {};
  if (!key || !scriptId || !ALLOWED_SCRIPTS.has(scriptId)) {
    return res.status(400).json({ ok: false, reason: "bad_request" });
  }
  const expiresAt = Date.now() + (Number(days) || 30) * 86400000;

  KEYS.set(key, { scriptId, expiresAt, fingerprint: null, revoked: false });
  return res.json({ ok: true, key, scriptId, days });
});

// --- ADMIN: revoke key
app.post("/revoke", (req, res) => {
  const admin = req.headers["x-admin-token"];
  if (admin !== process.env.ADMIN_TOKEN) return res.status(401).json({ ok: false, reason: "unauthorized" });

  const { key } = req.body || {};
  const rec = KEYS.get(key);
  if (!rec) return res.json({ ok: false, reason: "not_found" });

  rec.revoked = true;
  return res.json({ ok: true, key, revoked: true });
});

app.listen(PORT, () => {
  console.log(`License server on :${PORT}`);
});
