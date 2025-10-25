// src/pages/BattleOfChains.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchChainMetrics,
  aggregate,
  METRIC_KEYS,
  readMetric,
  CHAINS, // meta used for counts (L2/L3, settlement, RaaS, DA)
} from "../utils/fetchChainData.js";
import "./BattleOfChains.css";

/* ---------- helpers ---------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const fmtInt = (n) =>
  (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtTPS = (n) =>
  (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
const fmtUSD = (n) =>
  `$${(Number(n) || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
const fmtBlockTime = (v) => {
  const n = Number(v) || 0;
  const secs = n > 1000 ? n / 1000 : n;
  if (secs < 1) return `${secs.toFixed(3)}s`;
  if (secs < 10) return `${secs.toFixed(2)}s`;
  if (secs < 100) return `${secs.toFixed(1)}s`;
  return `${Math.round(secs).toLocaleString()}s`;
};

const METRIC_LABEL = {
  [METRIC_KEYS.AVG_TPS]: "Average TPS",
  [METRIC_KEYS.TX_COUNT]: "Transaction Count",
  [METRIC_KEYS.PROJECT_COUNT]: "Project Count",
  [METRIC_KEYS.TVL]: "TVL",
};

const PERF = { TX: "TX", ADDR: "ADDR", BLK: "BLK" };
const PERF_LABEL = {
  [PERF.TX]: "Transaction Count",
  [PERF.ADDR]: "Active Addresses",
  [PERF.BLK]: "Avg Block Time",
};

const DEV = { GAS: "GAS", CONTRACTS: "CONTRACTS" };
const DEV_LABEL = {
  [DEV.GAS]: "Gas Used (last 30d)",
  [DEV.CONTRACTS]: "New Contracts (last 30d)",
};

const RCOLORS = {
  Caldera: "#FD4F00",
  Conduit: "#23B7B5",
  AltLayer: "#7F85E8",
  Alchemy: "#0662FE",
  Gelato: "#FF3C58",
  Other: "#8B8E98",
};

/* ------- minimal fetchers for Developer section ------- */
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
const sumLastDays = (chart = [], days = 30) => {
  const tail = chart.slice(-days);
  if (!tail.length) return 0;
  return tail.reduce((a, d) => a + (Number(d?.value) || 0), 0);
};

/* ---------- thin bar row ---------- */
function BarRow({ name, value, max, right, color }) {
  const pct = max > 0 ? Math.max(0, (value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <div className="bar-label">{name}</div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{
            width: `${pct}%`,
            background:
              color ||
              "linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.35))",
          }}
        />
      </div>
      <div className="bar-value">{right}</div>
    </div>
  );
}

/* ---------- podium ---------- */
function Podium({ items }) {
  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉");
  return (
    <div className="podium">
      {items.slice(0, 3).map((it, i) => (
        <div key={`${it.title}-${i}`} className="podium-card">
          <div className="podium-medal">{medal(i)}</div>
          <div className="flex-1">
            <div className="podium-title">{it.title}</div>
            <div className="podium-sub">
              {it.label}: <span className="val">{it.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */
export default function BattleOfChains() {
  const [metric, setMetric] = useState(METRIC_KEYS.AVG_TPS);
  const [perfMetric, setPerfMetric] = useState(PERF.TX);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Developer section state
  const [devMetric, setDevMetric] = useState(DEV.GAS);
  const [devLoading, setDevLoading] = useState(false);
  const [devCacheBump, setDevCacheBump] = useState(0);

  /* ----------- Global data with SWR cache ----------- */
  useEffect(() => {
    const KEY = "bochains-cache-v1";
    const STALE_MS = 6 * 60 * 60 * 1000; // 6h
    (async () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const { at, data } = JSON.parse(raw);
          if (Array.isArray(data)) {
            setRows(data);
            setLoading(false);
          }
          if (!at || Date.now() - at > STALE_MS) {
            const fresh = await fetchChainMetrics();
            setRows(Array.isArray(fresh) ? fresh : []);
            localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data: fresh }));
          }
        } else {
          const fresh = await fetchChainMetrics();
          setRows(Array.isArray(fresh) ? fresh : []);
          localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data: fresh }));
          setLoading(false);
        }
      } catch {
        const fresh = await fetchChainMetrics();
        setRows(Array.isArray(fresh) ? fresh : []);
        setLoading(false);
      }
    })();
  }, []);

  /* ----------- Global aggregation (category + stack) ----------- */
  const agg = useMemo(() => aggregate(null, rows), [rows]);

  /* ---------- KPIs ---------- */
  const totalProjects = agg?.totals?.projectCount || 0;
  const totalTx = agg?.totals?.txCount || 0;
  const totalAvgTps = agg?.totals?.avgTPS || 0;
  const totalTvl = agg?.totals?.tvl || 0;

  /* ---------- Category leaderboard ---------- */
  const verticalLB = useMemo(() => {
    const fmt = (k, v) =>
      k === METRIC_KEYS.AVG_TPS ? fmtTPS(v) : k === METRIC_KEYS.TVL ? fmtUSD(v) : fmtInt(v);
    const entries = Object.entries(agg.byVertical || {}).map(([name, obj]) => {
      const val = readMetric(obj.combined, metric);
      return { name, raw: val, fmt: fmt(metric, val) };
    });
    entries.sort((a, b) => b.raw - a.raw);
    return { entries, max: entries[0]?.raw || 0 };
  }, [agg, metric]);

  /* ---------- Stack leaderboard ---------- */
  const stackLB = useMemo(() => {
    const fmt = (k, v) =>
      k === METRIC_KEYS.AVG_TPS ? fmtTPS(v) : k === METRIC_KEYS.TVL ? fmtUSD(v) : fmtInt(v);
    const entries = Object.entries(agg.byStack || {}).map(([name, obj]) => {
      const val = readMetric(obj.combined, metric);
      return { name, raw: val, fmt: fmt(metric, val) };
    });
    entries.sort((a, b) => b.raw - a.raw);
    return { entries, max: entries[0]?.raw || 0 };
  }, [agg, metric]);

  /* ---------- Performance (RaaS bars + winners rule) ---------- */
  const perfByRaaS = useMemo(() => {
    const buckets = {};
    for (const r of rows || []) {
      const group = r.raas || "Other";
      if (!buckets[group]) buckets[group] = { name: group, val: 0 };
      const chainVal =
        perfMetric === PERF.TX
          ? Number(r.totalTx) || 0
          : perfMetric === PERF.ADDR
          ? Number(r.totalAddresses) || 0
          : Number(r.average_block_time) || 0;
      if (perfMetric === PERF.BLK) {
        buckets[group]._sum = (buckets[group]._sum || 0) + chainVal;
        buckets[group]._n = (buckets[group]._n || 0) + 1;
      } else {
        buckets[group].val += chainVal;
      }
    }
    if (perfMetric === PERF.BLK) {
      Object.values(buckets).forEach((b) => {
        b.val = b._n ? b._sum / b._n : 0;
        delete b._sum;
        delete b._n;
      });
    }
    const bars = Object.values(buckets).sort((a, b) =>
      perfMetric === PERF.BLK ? a.val - b.val : b.val - a.val
    );
    const max = bars.reduce((m, x) => Math.max(m, x.val), 0);
    const allChains = rows
      .map((r) => ({
        chain: r.name,
        raas: r.raas,
        value:
          perfMetric === PERF.TX
            ? Number(r.totalTx) || 0
            : perfMetric === PERF.ADDR
            ? Number(r.totalAddresses) || 0
            : Number(r.average_block_time) || 0,
      }))
      .filter((x) => Number.isFinite(x.value))
      .sort((a, b) => (perfMetric === PERF.BLK ? a.value - b.value : b.value - a.value))
      .slice(0, 3);

    const winners = allChains.map((c) => ({
      title: perfMetric === PERF.TX ? `${c.chain} • ${c.raas}` : c.chain,
      label: PERF_LABEL[perfMetric],
      value: perfMetric === PERF.BLK ? fmtBlockTime(c.value) : fmtInt(c.value),
    }));

    return {
      bars: bars.map((b) => ({
        name: b.name,
        value: b.val,
        right: perfMetric === PERF.BLK ? fmtBlockTime(b.val) : fmtInt(b.val),
        color: RCOLORS[b.name],
      })),
      max,
      winners,
    };
  }, [rows, perfMetric]);

  /* ---------- Developer: fetch + aggregate by RaaS, winners by chain ---------- */
  const DEV_KEYS = {
    [DEV.GAS]: "bochains-dev-gas-v1",
    [DEV.CONTRACTS]: "bochains-dev-contracts-v1",
  };

  useEffect(() => {
    let ignore = false;
    const key = DEV_KEYS[devMetric];
    const STALE_MS = 6 * 60 * 60 * 1000;

    const parseSeriesValue = (json) => (Array.isArray(json?.chart) ? sumLastDays(json.chart, 30) : 0);
    const getMetricId = devMetric === DEV.GAS ? "gasUsedGrowth" : "newContracts";

    const saveCache = (data) => {
      try {
        localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
        setDevCacheBump((n) => n + 1);
      } catch {}
    };

    const fetchFresh = async () => {
      setDevLoading(true);
      const results = [];
      for (const c of CHAINS) {
        const url = buildLinesUrl(c.linesUrl, getMetricId);
        if (!url) continue;
        const json = await smartFetchJson(url);
        const value = parseSeriesValue(json);
        results.push({ chain: c.name, raas: c.raas || "Other", value });
      }
      if (!ignore) {
        saveCache(results);
        setDevLoading(false);
      }
    };

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const { at, data } = JSON.parse(raw);
        setDevCacheBump((n) => n + 1);
        if (!at || Date.now() - at > STALE_MS) fetchFresh();
      } else {
        fetchFresh();
      }
    } catch {
      fetchFresh();
    }

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devMetric]);

  const devByRaaS = useMemo(() => {
    const key = DEV_KEYS[devMetric];
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(key) || "null")?.data || [];
    } catch {
      cached = [];
    }
    const rowsDev = Array.isArray(cached) ? cached : [];

    const map = {};
    for (const r of rowsDev) {
      const g = r.raas || "Other";
      map[g] = (map[g] || 0) + (Number(r.value) || 0);
    }
    const bars = Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const max = bars.reduce((m, x) => Math.max(m, x.value), 0);

    const winners = rowsDev
      .slice()
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((c) => ({
        title: c.chain,
        label: DEV_LABEL[devMetric],
        value: fmtInt(c.value),
      }));

    return {
      bars: bars.map((b) => ({
        name: b.name,
        value: b.value,
        right: fmtInt(b.value),
        color: RCOLORS[b.name],
      })),
      max,
      winners,
    };
  }, [devMetric, devCacheBump]);

  /* ---------- NEW: Structure (Counts) from CHAINS meta ---------- */
  const structure = useMemo(() => {
    const all = Array.isArray(CHAINS) ? CHAINS : [];

    // Layer counts
    const l2 = all.filter((c) => Number(c.layer) === 2).length;
    const l3 = all.filter((c) => Number(c.layer) === 3).length;

    // L3 settlement family (from ecosystem)
    const settle = {};
    for (const c of all) {
      if (Number(c.layer) === 3) {
        const fam = c.settlementL3 && c.settlementL3 !== "—" ? c.settlementL3 : "Unknown";
        settle[fam] = (settle[fam] || 0) + 1;
      }
    }
    const settleArr = Object.entries(settle)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // RaaS counts
    const raasMap = {};
    for (const c of all) {
      const r = c.raas || "Other";
      raasMap[r] = (raasMap[r] || 0) + 1;
    }
    const raasArr = Object.entries(raasMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // DA counts (if not present in meta => Unknown)
    const daMap = {};
    for (const c of all) {
      const da = c.da || "Unknown";
      daMap[da] = (daMap[da] || 0) + 1;
    }
    const daArr = Object.entries(daMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      layer: {
        bars: [
          { name: "L2", value: l2 },
          { name: "L3", value: l3 },
        ].sort((a, b) => b.value - a.value),
        max: Math.max(l2, l3, 0),
        winner: l2 >= l3 ? "L2" : "L3",
      },
      settlement: {
        bars: settleArr,
        max: settleArr[0]?.value || 0,
        winner: settleArr[0]?.name || "—",
      },
      raas: {
        bars: raasArr.map((b) => ({ ...b, color: RCOLORS[b.name] })),
        max: raasArr[0]?.value || 0,
        winner: raasArr[0]?.name || "—",
      },
      da: {
        bars: daArr,
        max: daArr[0]?.value || 0,
        winner: daArr[0]?.name || "—",
      },
    };
  }, []);

  /* ============================= RENDER ============================= */
  return (
    <main className="battle min-h-screen bg-[#0B1118] text-white px-4 md:px-8 pb-16">
      {/* header */}
      <header className="battle-header pt-8 pb-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
          <span>⚔️ Battle of Chains</span>
        </h1>
        <p className="subtitle text-neutral-300/90 mt-2">
          Nine arenas. Pick metrics. See who dominates.
        </p>
      </header>

      {/* metric toolbar */}
      <div className="metric-toolbar">
        <span className="label">Global Metric</span>
        <span className="metric-btns">
          {[METRIC_KEYS.AVG_TPS, METRIC_KEYS.TX_COUNT, METRIC_KEYS.PROJECT_COUNT, METRIC_KEYS.TVL].map(
            (k) => (
              <button
                key={k}
                onClick={() => setMetric(k)}
                className={cx("metric-btn", metric === k && "is-active")}
              >
                {METRIC_LABEL[k]}
              </button>
            )
          )}
        </span>
      </div>

      {/* KPIs */}
      <section className="kpi-grid mt-6">
        <div className="kpi">
          <div className="kpi-label">Total Projects</div>
          <div className="kpi-value">{fmtInt(totalProjects)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Transactions</div>
          <div className="kpi-value">{fmtInt(totalTx)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Avg TPS</div>
          <div className="kpi-value">{fmtTPS(totalAvgTps)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">TVL</div>
          <div className="kpi-value">{fmtUSD(totalTvl)}</div>
        </div>
      </section>

      {loading && (
        <div className="mt-6 text-neutral-300/80 text-sm">
          Fetching live explorer stats…
        </div>
      )}

      {/* Category Arena */}
      <section className="arena mt-8">
        <div className="arena-header">
          <div>
            <h2>🏆 Category Arena</h2>
            <p className="text-neutral-300/90 mt-1">
              Compare RaaS dominance across verticals.
            </p>
          </div>
        </div>
        <div className="bar-list">
          {verticalLB.entries.map((e) => (
            <BarRow key={e.name} name={e.name} value={e.raw} right={e.fmt} max={verticalLB.max} />
          ))}
        </div>
      </section>

      {/* Rollup Stack Arena */}
      <section className="arena mt-8">
        <div className="arena-header">
          <div>
            <h2>🧱 Rollup Stack Arena</h2>
            <p className="text-neutral-300/90 mt-1">Which stacks dominate across RaaS.</p>
          </div>
        </div>
        <div className="bar-list">
          {stackLB.entries.map((e) => (
            <BarRow key={e.name} name={e.name} value={e.raw} right={e.fmt} max={stackLB.max} />
          ))}
        </div>
      </section>

      {/* Performance */}
      <section className="arena mt-8">
        <div className="arena-header">
          <div>
            <h2>🚀 Performance</h2>
            <p className="text-neutral-300/90 mt-1">Bars are totals per RaaS.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-300/80">Metric:</span>
            {[PERF.TX, PERF.ADDR, PERF.BLK].map((k) => (
              <button
                key={k}
                onClick={() => setPerfMetric(k)}
                className={cx("metric-btn", perfMetric === k && "is-active")}
              >
                {PERF_LABEL[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="bar-list">
          {perfByRaaS.bars.map((b) => (
            <BarRow
              key={b.name}
              name={b.name}
              value={b.value}
              right={b.right}
              max={perfByRaaS.max}
              color={b.color}
            />
          ))}
        </div>
        <Podium items={perfByRaaS.winners} />
      </section>

      {/* Developer */}
      <section className="arena mt-8">
        <div className="arena-header">
          <div>
            <h2>👨‍💻 Developer</h2>
            <p className="text-neutral-300/90 mt-1">
              Aggregated by RaaS from <code>/api/v1/lines</code> (last 30 days).
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-300/80">Metric:</span>
            {[DEV.GAS, DEV.CONTRACTS].map((k) => (
              <button
                key={k}
                onClick={() => setDevMetric(k)}
                className={cx("metric-btn", devMetric === k && "is-active")}
              >
                {DEV_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        {devLoading && (
          <div className="mt-3 text-neutral-400 text-sm">Refreshing developer data…</div>
        )}

        <div className="bar-list">
          {devByRaaS.bars.map((b) => (
            <BarRow
              key={b.name}
              name={b.name}
              value={b.value}
              right={b.right}
              max={devByRaaS.max}
              color={b.color}
            />
          ))}
        </div>

        <Podium items={devByRaaS.winners} />
      </section>

      {/* ===================== NEW: Structure (Counts) ===================== */}
      <section className="arena mt-8">
        <div className="arena-header">
          <div>
            <h2>🏗️ Structure (Counts)</h2>
            <p className="text-neutral-300/90 mt-1">
              Simple diagram with symbols, text and lines — metadata only.
            </p>
          </div>
        </div>

        {/* L2 vs L3 */}
        <div className="mt-4">
          <div className="text-sm text-neutral-300/80 mb-2">🧬 L2 vs L3</div>
          <div className="bar-list">
            {structure.layer.bars.map((b) => (
              <BarRow
                key={b.name}
                name={b.name}
                value={b.value}
                right={fmtInt(b.value)}
                max={structure.layer.max}
              />
            ))}
          </div>
        </div>

        {/* L3 Settlement Family */}
        <div className="mt-6">
          <div className="text-sm text-neutral-300/80 mb-2">
            🪜 L3 Settlement Family (from ecosystem)
          </div>
          <div className="bar-list">
            {structure.settlement.bars.map((b) => (
              <BarRow
                key={b.name}
                name={b.name}
                value={b.value}
                right={fmtInt(b.value)}
                max={structure.settlement.max}
              />
            ))}
          </div>
        </div>

        {/* RaaS Count */}
        <div className="mt-6">
          <div className="text-sm text-neutral-300/80 mb-2">🧰 RaaS Count</div>
          <div className="bar-list">
            {structure.raas.bars.map((b) => (
              <BarRow
                key={b.name}
                name={b.name}
                value={b.value}
                right={fmtInt(b.value)}
                max={structure.raas.max}
                color={b.color}
              />
            ))}
          </div>
        </div>

        {/* DA Count */}
        <div className="mt-6">
          <div className="text-sm text-neutral-300/80 mb-2">🧱 DA Count</div>
          <div className="bar-list">
            {structure.da.bars.map((b) => (
              <BarRow
                key={b.name}
                name={b.name}
                value={b.value}
                right={fmtInt(b.value)}
                max={structure.da.max}
              />
            ))}
          </div>
        </div>

        {/* Winners (RaaS winner name required) */}
        <div className="mt-6">
          <div className="text-sm text-neutral-300/80 mb-2">🏅 Winners</div>
          <div className="grid gap-2 md:grid-cols-4">
            <div className="podium-card">
              <div className="podium-medal">⭐</div>
              <div>
                <div className="podium-title">RaaS</div>
                <div className="podium-sub">
                  Winner: <span className="val">{structure.raas.winner}</span>
                </div>
              </div>
            </div>
            <div className="podium-card">
              <div className="podium-medal">📊</div>
              <div>
                <div className="podium-title">Layer</div>
                <div className="podium-sub">
                  Winner: <span className="val">{structure.layer.winner}</span>
                </div>
              </div>
            </div>
            <div className="podium-card">
              <div className="podium-medal">🪜</div>
              <div>
                <div className="podium-title">Settlement Family</div>
                <div className="podium-sub">
                  Winner: <span className="val">{structure.settlement.winner}</span>
                </div>
              </div>
            </div>
            <div className="podium-card">
              <div className="podium-medal">🧱</div>
              <div>
                <div className="podium-title">DA</div>
                <div className="podium-sub">
                  Winner: <span className="val">{structure.da.winner}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-neutral-400 mt-2">
            Note: DA counts depend on a <code>da</code> field in chain metadata. Missing entries
            are grouped into <em>Unknown</em>.
          </div>
        </div>
      </section>

      <footer className="battle-footer">Data Source: Blockscout + RollUpAndDown Index</footer>
    </main>
  );
}
