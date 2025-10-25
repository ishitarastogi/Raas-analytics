// src/pages/BattleOfChains.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchChainMetrics,
  aggregate,
  METRIC_KEYS,
  readMetric,
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

const RCOLORS = {
  Caldera: "#FD4F00",
  Conduit: "#23B7B5",
  AltLayer: "#7F85E8",
  Alchemy: "#0662FE",
  Gelato: "#FF3C58",
  Other: "#8B8E98",
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
        <div key={`${it.name}-${i}`} className="podium-card">
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

  // ---- CACHE: show stale immediately, then revalidate
  useEffect(() => {
    const KEY = "bochains-cache-v1";
    const STALE_MS = 6 * 60 * 60 * 1000; // 6h
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const { at, data } = JSON.parse(raw);
        if (Array.isArray(data)) {
          setRows(data);
          setLoading(false); // show cached instantly
        }
        // still fetch in background if stale
        if (!at || Date.now() - at > STALE_MS) {
          (async () => {
            const fresh = await fetchChainMetrics();
            setRows(Array.isArray(fresh) ? fresh : []);
            localStorage.setItem(
              KEY,
              JSON.stringify({ at: Date.now(), data: fresh })
            );
          })();
        }
      } else {
        // no cache — fetch
        (async () => {
          const fresh = await fetchChainMetrics();
          setRows(Array.isArray(fresh) ? fresh : []);
          localStorage.setItem(
            KEY,
            JSON.stringify({ at: Date.now(), data: fresh })
          );
          setLoading(false);
        })();
      }
    } catch {
      // fallback
      (async () => {
        const fresh = await fetchChainMetrics();
        setRows(Array.isArray(fresh) ? fresh : []);
        setLoading(false);
      })();
    }
  }, []);

  // Global aggregation (category + stack)
  const agg = useMemo(() => aggregate(null, rows), [rows]);

  /* ---------- Top KPIs ---------- */
  const totalProjects = agg?.totals?.projectCount || 0;
  const totalTx = agg?.totals?.txCount || 0;
  const totalAvgTps = agg?.totals?.avgTPS || 0;
  const totalTvl = agg?.totals?.tvl || 0;

  /* ---------- Category leaderboard (combined) ---------- */
  const verticalLB = useMemo(() => {
    const fmtMetric = (k, v) =>
      k === METRIC_KEYS.AVG_TPS
        ? fmtTPS(v)
        : k === METRIC_KEYS.TVL
        ? fmtUSD(v)
        : fmtInt(v);

    const entries = Object.entries(agg.byVertical || {}).map(([name, obj]) => {
      const val = readMetric(obj.combined, metric);
      return { name, raw: val, fmt: fmtMetric(metric, val) };
    });
    entries.sort((a, b) => b.raw - a.raw);
    const max = entries[0]?.raw || 0;
    return { entries, max };
  }, [agg, metric]);

  /* ---------- Stack leaderboard (combined) ---------- */
  const stackLB = useMemo(() => {
    const fmtMetric = (k, v) =>
      k === METRIC_KEYS.AVG_TPS
        ? fmtTPS(v)
        : k === METRIC_KEYS.TVL
        ? fmtUSD(v)
        : fmtInt(v);

    const entries = Object.entries(agg.byStack || {}).map(([name, obj]) => {
      const val = readMetric(obj.combined, metric);
      return { name, raw: val, fmt: fmtMetric(metric, val) };
    });
    entries.sort((a, b) => b.raw - a.raw);
    const max = entries[0]?.raw || 0;
    return { entries, max };
  }, [agg, metric]);

  /* ---------- Performance panel ----------
     Bars = totals per RaaS; Podium = top 3 chains by the selected metric.
  */
  const perfByRaaS = useMemo(() => {
    // aggregate rows by raas for selected perf metric
    const buckets = {};
    for (const r of rows || []) {
      const group = r.raas || "Other";
      if (!buckets[group]) {
        buckets[group] = { name: group, val: 0, chains: [] };
      }
      // collect chain-level metric too (for podium)
      const chainVal =
        perfMetric === PERF.TX
          ? Number(r.totalTx) || 0
          : perfMetric === PERF.ADDR
          ? Number(r.totalAddresses) || 0
          : Number(r.average_block_time) || 0;

      // sum/avg logic
      if (perfMetric === PERF.BLK) {
        // for display we show average block time per RaaS
        buckets[group].chains.push({ chain: r.name, raas: r.raas, value: chainVal });
      } else {
        buckets[group].val += chainVal;
        buckets[group].chains.push({ chain: r.name, raas: r.raas, value: chainVal });
      }
    }

    // finalize avg for block time
    if (perfMetric === PERF.BLK) {
      Object.values(buckets).forEach((b) => {
        const vals = b.chains.map((c) => c.value).filter((x) => Number.isFinite(x));
        b.val = vals.length ? vals.reduce((a, x) => a + x, 0) / vals.length : 0;
      });
    }

    // sort for chart (desc; but block time is asc = lower better)
    const arr = Object.values(buckets);
    arr.sort((a, b) =>
      perfMetric === PERF.BLK ? a.val - b.val : b.val - a.val
    );

    const max = arr.reduce((m, x) => Math.max(m, x.val), 0);

    // build winners (top 3 chains globally, not by RaaS)
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
      .filter((x) => Number.isFinite(x.value));

    allChains.sort((a, b) =>
      perfMetric === PERF.BLK ? a.value - b.value : b.value - a.value
    );
    const top3 = allChains.slice(0, 3).map((c) => ({
      // winners formatting rule:
      // TX → "Chain • RaaS", others → "Chain"
      title:
        perfMetric === PERF.TX ? `${c.chain} • ${c.raas}` : `${c.chain}`,
      label: PERF_LABEL[perfMetric],
      value:
        perfMetric === PERF.BLK ? fmtBlockTime(c.value) : fmtInt(c.value),
    }));

    return {
      bars: arr.map((b) => ({
        name: b.name,
        value: b.val,
        right:
          perfMetric === PERF.BLK ? fmtBlockTime(b.val) : fmtInt(b.val),
        color: RCOLORS[b.name] || undefined,
      })),
      max,
      winners: top3,
    };
  }, [rows, perfMetric]);

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
          <div className="metric-note">
            Metric: <span className="font-medium text-white">{METRIC_LABEL[metric]}</span>
          </div>
        </div>

        <div className="bar-list">
          {verticalLB.entries.map((e) => (
            <BarRow
              key={e.name}
              name={e.name}
              value={e.raw}
              right={e.fmt}
              max={verticalLB.max}
            />
          ))}
        </div>
      </section>

      {/* Rollup Stack Arena */}
      <section className="arena mt-8">
        <div className="arena-header">
          <div>
            <h2>🧱 Rollup Stack Arena</h2>
            <p className="text-neutral-300/90 mt-1">
              Which stacks dominate across RaaS.
            </p>
          </div>
          <div className="metric-note">
            Metric: <span className="font-medium text-white">{METRIC_LABEL[metric]}</span>
          </div>
        </div>

        <div className="bar-list">
          {stackLB.entries.map((e) => (
            <BarRow
              key={e.name}
              name={e.name}
              value={e.raw}
              right={e.fmt}
              max={stackLB.max}
            />
          ))}
        </div>
      </section>

      {/* Performance */}
      <section className="arena mt-8">
        <div className="arena-header">
          <div>
            <h2>🚀 Performance</h2>
            <p className="text-neutral-300/90 mt-1">
              One chart. Toggle metrics. Bars are totals per RaaS.
            </p>
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

        {/* RaaS bars */}
        <div className="bar-list">
          {perfByRaaS.bars.map((b) => (
            <BarRow
              key={b.name}
              name={b.name}
              value={b.value}
              right={b.right}
              max={perfByRaaS.max}
              color={RCOLORS[b.name]}
            />
          ))}
        </div>

        {/* Winners: rule from you → TX shows "Chain • RaaS"; others show chain only */}
        <Podium items={perfByRaaS.winners} />
      </section>

      <footer className="battle-footer">
        Data Source: Blockscout + RollUpAndDown Index
      </footer>
    </main>
  );
}
