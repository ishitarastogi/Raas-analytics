// server.js
import express from "express";
import fetch from "node-fetch";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 4000;
const ONLY = new Set(["Caldera", "Conduit", "AltLayer", "Alchemy", "Gelato"]);

const parseTotal = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/[, ]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const app = express();

// CORS for your front-end
app.use((_, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// GET /raas-totals  ->  { Caldera: 123, Conduit: 456, ... }
app.get("/raas-totals", async (_req, res) => {
  try {
    // Load your sheet data (keep raas + statsUrl [+ optional totalTransactions])
    const chainsPath = path.join(__dirname, "src", "data", "chains.json");
    const chainsJson = JSON.parse(await fs.readFile(chainsPath, "utf8"));

    const by = {};
    await Promise.all(
      chainsJson
        .filter((c) => ONLY.has((c?.raas || "").trim()))
        .map(async (c) => {
          let total = 0;

          try {
            if (c.totalTransactions != null) {
              total = parseTotal(c.totalTransactions);
            } else if (c.statsUrl) {
              const r = await fetch(c.statsUrl, { cache: "no-store" });
              const j = await r.json().catch(() => null);
              total = parseTotal(j?.total_transactions);
            }
          } catch (_) {
            // leave total = 0 if fetch fails
          }

          by[c.raas] = (by[c.raas] || 0) + total;
        })
    );

    res.json(by);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed_to_build_totals" });
  }
});

app.listen(PORT, () => {
  console.log(`RaaS proxy running on http://localhost:${PORT}`);
});
