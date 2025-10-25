import CHAINS_RAW from "../data/chains.js";

/** RaaS we care about */
export const RaaS_SET = new Set([
  "Caldera",
  "Conduit",
  "AltLayer",
  "Alchemy",
  "Gelato",
]);

/** Normalize & keep only our RaaS */
export const CHAINS = (Array.isArray(CHAINS_RAW) ? CHAINS_RAW : []).filter(
  (c) => c && RaaS_SET.has(c.raas)
);

/** parse numbers safely */
const num = (v) => {
  if (v == null || v === "—") return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v.replace(/[, $]/g, "")) || 0;
  return 0;
};

const buildLinesUrl = (linesUrl, id) => {
  if (!linesUrl) return null;
  if (linesUrl.endsWith("/newTxns")) return linesUrl.replace("newTxns", id);
  if (linesUrl.endsWith("/lines/")) return linesUrl + id;
  return linesUrl;
};

const smartFetchJson = async (url) => {
  if (!url) return null;
  try {
    const r = await fetch(`/api/explorer?url=${encodeURIComponent(url)}`, {
      cache: "no-store",
    });
    if (r.ok) return await r.json();
  } catch {}
  try {
    const r = await fetch(url, { mode: "cors", cache: "no-store" });
    if (r.ok) return await r.json();
  } catch {}
  return null;
};

const avgTpsFromDaily = (chart = [], days = 7) => {
  const tail = chart.slice(-days);
  if (!tail.length) return 0;
  const sum = tail.reduce((a, d) => a + (Number(d?.value) || 0), 0);
  return sum / (tail.length * 86400);
};

/**
 * Live pull: returns one row per chain with best-effort stats.
 * NOTE: Project counting must NEVER depend on this succeeding.
 */
export async function fetchChainMetrics() {
  const rows = [];

  for (const c of CHAINS) {
    let stats = null;
    let avgTPS = 0;

    // try snapshot
    stats = await smartFetchJson(c.statsUrl);

    // try time-series for Average TPS
    if (c.linesUrl) {
      const newTxnsUrl = buildLinesUrl(c.linesUrl, "newTxns");
      const series = await smartFetchJson(newTxnsUrl);
      avgTPS = avgTpsFromDaily(series?.chart || []);
      if (!avgTPS && stats?.transactions_today) {
        avgTPS = (Number(stats.transactions_today) || 0) / 86400;
      }
    }

    rows.push({
      name: c.name,
      raas: c.raas,
      vertical: c.vertical,
      rollup: c.rollup,
      layer: c.layer,
      totalTx: num(stats?.total_transactions),
      avgTPS,
      tvl: num(stats?.tvl),
      totalAddresses: num(stats?.total_addresses),
      average_block_time: num(stats?.average_block_time),
      total_gas_used: num(stats?.total_gas_used),
    });
  }

  return rows;
}

/** ------------ Aggregation helpers (Category + Rollup Stack) ------------ **/

// metrics keys we support in the UI
export const METRIC_KEYS = {
  AVG_TPS: "avgTPS",
  TX_COUNT: "totalTx",
  PROJECT_COUNT: "projectCount",
  TVL: "tvl",
};

const by = (obj, k) => (obj[k] ?? (obj[k] = {}), obj[k]);

/**
 * Returns:
 * {
 *   totals: { projectCount, txCount, avgTPS, tvl },
 *   byVertical: { [vertical]: { // across RaaS
 *       perRaaS: { [raas]: { projectCount, totalTx, avgTPS, tvl } },
 *       combined: { projectCount, totalTx, avgTPS, tvl }
 *   }},
 *   byStack: { [stack]: { perRaaS: {...}, combined: {...} } }
 * }
 */
export function aggregate(chainsMeta, liveRows) {
  // Index live rows by chain name (not ideal but works with your list)
  const live = new Map(liveRows.map((r) => [r.name, r]));

  // Build enriched rows (fallback numbers to 0 if live missing)
  const rows = CHAINS.map((c) => {
    const L = live.get(c.name);
    return {
      name: c.name,
      raas: c.raas,
      vertical: c.vertical || "—",
      rollup: c.rollup || "—",
      layer: c.layer,
      totalTx: num(L?.totalTx),
      avgTPS: num(L?.avgTPS),
      tvl: num(L?.tvl),
    };
  });

  // Totals (global)
  const totals = {
    projectCount: rows.length,
    txCount: rows.reduce((a, r) => a + r.totalTx, 0),
    // avgTPS global = mean of per-chain avgTPS (not weighted)
    avgTPS: rows.length
      ? rows.reduce((a, r) => a + r.avgTPS, 0) / rows.length
      : 0,
    tvl: rows.reduce((a, r) => a + r.tvl, 0),
  };

  // By vertical + RaaS
  const byVertical = {};
  for (const r of rows) {
    const v = r.vertical && r.vertical !== "—" ? r.vertical : "Uncategorized";
    const vr = by(byVertical, v); // object for this vertical
    const per = vr.perRaaS ?? (vr.perRaaS = {});
    const rsum =
      per[r.raas] ??
      (per[r.raas] = {
        projectCount: 0,
        totalTx: 0,
        tvl: 0,
        _tpsSum: 0,
        _tpsN: 0,
      });
    rsum.projectCount += 1;
    rsum.totalTx += r.totalTx;
    rsum.tvl += r.tvl;
    rsum._tpsSum += r.avgTPS;
    rsum._tpsN += 1;
  }
  // finalize per-vertical combined + avgTPS
  Object.values(byVertical).forEach((v) => {
    const combined = { projectCount: 0, totalTx: 0, tvl: 0, avgTPS: 0 };
    let tpsSum = 0,
      tpsN = 0;
    Object.values(v.perRaaS).forEach((bucket) => {
      bucket.avgTPS = bucket._tpsN ? bucket._tpsSum / bucket._tpsN : 0;
      delete bucket._tpsSum;
      delete bucket._tpsN;
      combined.projectCount += bucket.projectCount;
      combined.totalTx += bucket.totalTx;
      combined.tvl += bucket.tvl;
      tpsSum += bucket.avgTPS;
      tpsN += 1;
    });
    combined.avgTPS = tpsN ? tpsSum / tpsN : 0;
    v.combined = combined;
  });

  // By stack (rollup) + RaaS
  const byStack = {};
  for (const r of rows) {
    const s = r.rollup && r.rollup !== "—" ? r.rollup : "Other";
    const sr = by(byStack, s);
    const per = sr.perRaaS ?? (sr.perRaaS = {});
    const rsum =
      per[r.raas] ??
      (per[r.raas] = {
        projectCount: 0,
        totalTx: 0,
        tvl: 0,
        _tpsSum: 0,
        _tpsN: 0,
      });
    rsum.projectCount += 1;
    rsum.totalTx += r.totalTx;
    rsum.tvl += r.tvl;
    rsum._tpsSum += r.avgTPS;
    rsum._tpsN += 1;
  }
  Object.values(byStack).forEach((s) => {
    const combined = { projectCount: 0, totalTx: 0, tvl: 0, avgTPS: 0 };
    let tpsSum = 0,
      tpsN = 0;
    Object.values(s.perRaaS).forEach((bucket) => {
      bucket.avgTPS = bucket._tpsN ? bucket._tpsSum / bucket._tpsN : 0;
      delete bucket._tpsSum;
      delete bucket._tpsN;
      combined.projectCount += bucket.projectCount;
      combined.totalTx += bucket.totalTx;
      combined.tvl += bucket.tvl;
      tpsSum += bucket.avgTPS;
      tpsN += 1;
    });
    combined.avgTPS = tpsN ? tpsSum / tpsN : 0;
    s.combined = combined;
  });

  return { totals, byVertical, byStack };
}

/** map a metric key -> numeric value on an aggregate bucket */
export function readMetric(bucket, metricKey) {
  switch (metricKey) {
    case METRIC_KEYS.PROJECT_COUNT:
      return bucket.projectCount || 0;
    case METRIC_KEYS.TX_COUNT:
      return bucket.totalTx || 0;
    case METRIC_KEYS.AVG_TPS:
      return bucket.avgTPS || 0;
    case METRIC_KEYS.TVL:
      return bucket.tvl || 0;
    default:
      return 0;
  }
}

export default fetchChainMetrics;
