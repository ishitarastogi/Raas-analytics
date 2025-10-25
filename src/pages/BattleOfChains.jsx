import React, { useEffect, useMemo, useState } from "react";
import {
  fetchChainMetrics,
  aggregate,
  METRIC_KEYS,
  readMetric,
} from "../utils/fetchChainData.js";
import "./BattleOfChains.css";

/* ---------- small helpers ---------- */
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

const METRIC_LABEL = {
  [METRIC_KEYS.AVG_TPS]: "Average TPS",
  [METRIC_KEYS.TX_COUNT]: "Transaction Count",
  [METRIC_KEYS.PROJECT_COUNT]: "Project Count",
  [METRIC_KEYS.TVL]: "TVL",
};

/* ---------- tiny bar row ---------- */
function BarRow({ name, value, max }) {
  const pct = max > 0 ? Math.max(0, (value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <div className="bar-label">{name}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="bar-value">{value.toLocaleString()}</div>
    </div>
  );
}

/* ---------- podium pills ---------- */
function Podium({ items }) {
  const slots = items.slice(0, 3);
  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉");
  return (
    <div className="podium">
      {slots.map((it, i) => (
        <div key={it.name} className="podium-card">
          <div className="podium-medal">{medal(i)}</div>
          <div>
            <div className="podium-title">{it.name}</div>
            <div className="podium-sub">
              {it.valueLabel}: <span className="val">{it.valueFmt}</span>
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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: which category the podium should drill into
  const [focusCat, setFocusCat] = useState(null);

  /* fetch once */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetchChainMetrics();
        if (mounted) setRows(Array.isArray(r) ? r : []);
      } catch {
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* compute aggregates — pass rows as the 2nd arg */
  const agg = useMemo(() => aggregate(null, rows), [rows]);

  /* formatting chosen metric */
  const metricFormatter = (v) => {
    switch (metric) {
      case METRIC_KEYS.AVG_TPS:
        return fmtTPS(v);
      case METRIC_KEYS.TX_COUNT:
      case METRIC_KEYS.PROJECT_COUNT:
        return fmtInt(v);
      case METRIC_KEYS.TVL:
        return fmtUSD(v);
      default:
        return fmtInt(v);
    }
  };

  /* leaderboards (categories & stacks) */
  const verticalLB = useMemo(() => {
    const entries = Object.entries(agg.byVertical || {}).map(([name, obj]) => {
      const val = readMetric(obj.combined, metric);
      return { name, raw: val, fmt: metricFormatter(val) };
    });
    entries.sort((a, b) => b.raw - a.raw);
    const max = entries[0]?.raw || 0;
    return { entries, max };
  }, [agg, metric]);

  const stackLB = useMemo(() => {
    const entries = Object.entries(agg.byStack || {}).map(([name, obj]) => {
      const val = readMetric(obj.combined, metric);
      return { name, raw: val, fmt: metricFormatter(val) };
    });
    entries.sort((a, b) => b.raw - a.raw);
    const max = entries[0]?.raw || 0;
    return { entries, max };
  }, [agg, metric]);

  // -------- NEW: Focus Category controls and RaaS podium inside it --------
  const categoriesList = useMemo(
    () => verticalLB.entries.map((e) => e.name),
    [verticalLB]
  );

  useEffect(() => {
    if (!categoriesList.length) return;
    if (!focusCat || !categoriesList.includes(focusCat)) {
      setFocusCat(categoriesList[0]); // default to top category by current metric
    }
  }, [categoriesList, focusCat]);

  const raasLBInFocusedCategory = useMemo(() => {
    if (!focusCat) return { entries: [], max: 0 };
    const node = agg.byVertical?.[focusCat];
    const per = node?.perRaaS || {};
    const entries = Object.entries(per).map(([raas, bucket]) => {
      const val = readMetric(bucket, metric);
      return { name: raas, raw: val, fmt: metricFormatter(val) };
    });
    entries.sort((a, b) => b.raw - a.raw);
    const max = entries[0]?.raw || 0;
    return { entries, max };
  }, [agg, focusCat, metric]);

  /* top stats (from totals) */
  const totalProjects = agg?.totals?.projectCount || 0;
  const totalTx = agg?.totals?.txCount || 0;
  const totalAvgTps = agg?.totals?.avgTPS || 0;
  const totalTvl = agg?.totals?.tvl || 0;

  return (
    <main className="battle-root">
      {/* header */}
      <header className="battle-header">
        <h1>⚔️ Battle of Chains</h1>
        <p className="subtitle">Nine arenas. Pick metrics. See who dominates.</p>
      </header>

      {/* metric toolbar */}
      <div className="metric-toolbar">
        <span className="label">Global Metric</span>
        <div className="metric-btns">
          {[
            METRIC_KEYS.AVG_TPS,
            METRIC_KEYS.TX_COUNT,
            METRIC_KEYS.PROJECT_COUNT,
            METRIC_KEYS.TVL,
          ].map((k) => (
            <button
              key={k}
              onClick={() => setMetric(k)}
              className={cx("metric-btn", metric === k && "is-active")}
            >
              {METRIC_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <section className="kpi-grid">
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

      {/* loading note */}
      {loading && (
        <div className="mt-6" style={{ color: "var(--muted)" }}>
          Fetching live explorer stats…
        </div>
      )}

      {/* ============ Section 1: Category Arena ============ */}
      <section className="arena mt-8">
        <div className="arena-header">
          <div>
            <h2>🏆 Category Arena</h2>
            <p className="subtitle">Compare RaaS dominance across verticals.</p>
          </div>

          <div className="metric-note" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>
              Metric: <strong>{METRIC_LABEL[metric]}</strong>
            </span>

            {/* Focus Category picker */}
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ opacity: 0.85 }}>Focus Category:</span>
              <select
                value={focusCat || ""}
                onChange={(e) => setFocusCat(e.target.value)}
                className="metric-btn"
                style={{ padding: "0.4rem 0.8rem" }}
              >
                {categoriesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* category bars */}
        <div className="bar-list">
          {verticalLB.entries.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.6)" }}>No data.</div>
          ) : (
            verticalLB.entries.map((e) => (
              <BarRow key={e.name} name={e.name} value={e.raw} max={verticalLB.max} />
            ))
          )}
        </div>

        {/* podium: TOP RaaS inside the focused category */}
        {raasLBInFocusedCategory.entries.length > 0 && (
          <>
            <div className="mt-6" style={{ color: "var(--muted)" }}>
              Top RaaS in <strong style={{ color: "var(--text)" }}>{focusCat}</strong>
            </div>
            <Podium
              items={raasLBInFocusedCategory.entries.slice(0, 3).map((e) => ({
                name: e.name,
                valueLabel: METRIC_LABEL[metric],
                valueFmt: e.fmt,
              }))}
            />
          </>
        )}
      </section>

      {/* ============ Section 2: Rollup Stack Arena ============ */}
      <section className="arena mt-8">
        <div className="arena-header">
          <div>
            <h2>🧱 Rollup Stack Arena</h2>
            <p className="subtitle">Which stacks dominate across RaaS.</p>
          </div>
          <div className="metric-note">
            Metric: <strong>{METRIC_LABEL[metric]}</strong>
          </div>
        </div>

        {/* stack bars */}
        <div className="bar-list">
          {stackLB.entries.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.6)" }}>No data.</div>
          ) : (
            stackLB.entries.map((e) => (
              <BarRow key={e.name} name={e.name} value={e.raw} max={stackLB.max} />
            ))
          )}
        </div>

        {/* podium: top stacks overall */}
        {stackLB.entries.length > 0 && (
          <Podium
            items={stackLB.entries.slice(0, 3).map((e) => ({
              name: e.name,
              valueLabel: METRIC_LABEL[metric],
              valueFmt: e.fmt,
            }))}
          />
        )}
      </section>

      {/* footer */}
      <footer className="battle-footer">Data Source: Blockscout + RollUpAndDown Index</footer>
    </main>
  );
}
