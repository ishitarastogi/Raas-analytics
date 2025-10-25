// src/pages/Overview.jsx
import React, { useEffect, useMemo, useState } from "react";
import NavBar from "../components/Navbar";
import { detectRaasProvider, RAAS, RAAS_COLOR } from "../utils/raas";
import {
  ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend
} from "recharts";

/* ---------- Helpers ---------- */
const fmt = (n) => n.toLocaleString();
const toDate = (s) => (s && !s.startsWith("—")) ? new Date(s) : null;

// rank helper for Top 6 cards
function topN(arr, n = 6) {
  return [...arr].sort((a, b) => (b.totalTx || 0) - (a.totalTx || 0)).slice(0, n);
}

/* ---------- Fetch chains + annotate with RaaS ---------- */
function useChains() {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://chains.blockscout.com/api/chains");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const enriched = Object.values(json).map((c) => {
          const raas = detectRaasProvider(c.explorers, c.name);
          return {
            id: c.id,
            name: c.name,
            isTestnet: !!c.isTestnet,
            layer: c.layer,
            explorers: c.explorers || [],
            raas,
            // optional launch date & vertical can be merged from your table later
            launchDate: null,
            vertical: null
          };
        }).filter(c => !c.isTestnet && c.raas); // keep only RaaS

        setChains(enriched);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { chains, loading, err };
}

/* ---------- Fetch per-chain totals (parallel but polite) ---------- */
async function fetchTotals(chains) {
  const withUrls = chains.map(c => {
    const statsUrl = c.explorers?.[0]?.url ? new URL(c.explorers[0].url) : null;
    // convert explorer URL to /api/v2/stats if possible
    let api = null;
    if (statsUrl) {
      // typical forms already are API bases; else append api/v2/stats
      api = statsUrl.href.endsWith("/") ? `${statsUrl.href}api/v2/stats` : `${statsUrl.href}/api/v2/stats`;
    }
    return { ...c, statsApi: api };
  });

  const results = await Promise.all(withUrls.map(async (c) => {
    try {
      if (!c.statsApi) return { ...c, totalTx: 0, totalAddr: 0, blockTime: null };
      const r = await fetch(c.statsApi, { cache: "no-store" });
      if (!r.ok) throw new Error(`stats ${r.status}`);
      const j = await r.json();
      return {
        ...c,
        totalTx: Number(j?.total_transactions || 0),
        totalAddr: Number(j?.total_addresses || 0),
        blockTime: Number(j?.average_block_time || 0)
      };
    } catch {
      return { ...c, totalTx: 0, totalAddr: 0, blockTime: null };
    }
  }));

  return results;
}

/* ---------- Page ---------- */
export default function Overview() {
  const { chains, loading, err } = useChains();
  const [selectedRaas, setSelectedRaas] = useState("all");
  const [totals, setTotals] = useState([]);
  const [busy, setBusy] = useState(false);

  // load totals once chains arrive
  useEffect(() => {
    if (!chains.length) return;
    setBusy(true);
    fetchTotals(chains).then(setTotals).finally(() => setBusy(false));
  }, [chains]);

  const filtered = useMemo(
    () => (selectedRaas === "all" ? totals : totals.filter(c => c.raas === selectedRaas)),
    [totals, selectedRaas]
  );

  // Scatter data: each dot = chain launch (we’ll use first-seen by tx time later; placeholder uses totalTx date = null)
  // If you already have launch dates mapped, plug them into chain.launchDate
  const scatterData = useMemo(() => {
    // Use a fake spread if no launch dates yet; keeps lanes visible
    return filtered.map((c, i) => ({
      raas: c.raas,
      x: i,          // temporary X (replace with time = +new Date(launchDate))
      chain: c.name,
      color: RAAS_COLOR[c.raas]
    }));
  }, [filtered]);

  // Bar: total tx per RaaS
  const txByRaas = useMemo(() => {
    const m = new Map(RAAS.map(r => [r, 0]));
    for (const c of filtered) m.set(c.raas, (m.get(c.raas) || 0) + (c.totalTx || 0));
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const top6 = useMemo(() => topN(filtered, 6), [filtered]);

  if (loading) return <div className="page"><div className="loader" /> Loading chains…</div>;
  if (err) return <div className="page"><div className="error">Failed: {err}</div></div>;

  return (
    <div className="page">
      <NavBar selectedRaas={selectedRaas} onChange={setSelectedRaas} />

      {/* Scatter (timeline lanes by RaaS). Replace x with launch timestamp when available */}
      <section className="card">
        <div className="card__head">
          <h2>RaaS Launch Timeline</h2>
          <div className="pill">dots = chains</div>
        </div>
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 16, right: 24, bottom: 32, left: 16 }}>
              <CartesianGrid stroke="#1b2432" />
              <XAxis
                type="number"
                dataKey="x"
                name="Launch (time)"
                tick={{ fill: "#8fa0b6" }}
              />
              <YAxis
                type="category"
                dataKey="raas"
                name="RaaS"
                tick={{ fill: "#8fa0b6" }}
                width={140}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              {RAAS.map(r => (
                <Scatter
                  key={r}
                  name={r}
                  data={scatterData.filter(d => d.raas === r)}
                  fill={RAAS_COLOR[r]}
                  shape="circle"
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tx bar by RaaS */}
      <section className="card">
        <div className="card__head">
          <h2>Total Transactions by RaaS</h2>
          {busy && <div className="pill">updating…</div>}
        </div>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={txByRaas} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#1b2432" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#8fa0b6" }} />
              <YAxis tick={{ fill: "#8fa0b6" }} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Legend />
              <Bar dataKey="value" name="Total Tx">
                {txByRaas.map((d, i) => (
                  <rect key={i} />
                ))}
              </Bar>
              {/* color per bar via function style prop */}
              <Bar dataKey="value" name="Total Tx" fill="#66b3ff">
                {txByRaas.map((entry, index) => (
                  <cell key={`c-${index}`} fill={RAAS_COLOR[entry.name] || "#66b3ff"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Top 6 chains */}
      <section className="card">
        <div className="card__head">
          <h2>Top 6 Chains by Total Tx</h2>
          <div className="pill">{selectedRaas === "all" ? "All RaaS" : selectedRaas}</div>
        </div>

        <div className="grid6">
          {top6.map((c, i) => (
            <div key={c.name} className="chainCard">
              <div className="chainCard__rank">#{i + 1}</div>
              <div className="chainCard__name">{c.name}</div>
              <div className="chainCard__meta">
                <span className="tag" style={{ background: RAAS_COLOR[c.raas] }}>{c.raas}</span>
                <span className="muted">Layer {c.layer}</span>
              </div>
              <div className="chainCard__stat">
                <div className="label">Total Tx</div>
                <div className="value">{fmt(c.totalTx || 0)}</div>
              </div>
              {c.blockTime != null && (
                <div className="chainCard__sub">Avg block time: {(c.blockTime/1000).toFixed(2)}s</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
