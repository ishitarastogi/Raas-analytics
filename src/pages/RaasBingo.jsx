// src/pages/RaasBingo.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchChainMetrics } from "../utils/fetchChainData.js";
import "./PulseReactor.css";

/* -----------------------------
   Small helpers
----------------------------- */
const fmtInt = (n) =>
  (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtTPS = (n) =>
  (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
const fmtSec = (msOrS) => {
  const s = msOrS > 1000 ? msOrS / 1000 : msOrS;
  if (!s || s <= 0) return "—";
  if (s < 1) return `${s.toFixed(3)}s`;
  if (s < 10) return `${s.toFixed(2)}s`;
  if (s < 100) return `${s.toFixed(1)}s`;
  return `${Math.round(s)}s`;
};
const cx = (...c) => c.filter(Boolean).join(" ");

/* -----------------------------
   Build snapshot (rows + byRaas)
----------------------------- */
function useSnapshot(rows) {
  return useMemo(() => {
    const byRaas = {};
    for (const r of rows || []) {
      const key = r.raas || "Other";
      if (!Array.isArray(byRaas[key])) byRaas[key] = [];
      byRaas[key].push(r);
    }
    return { rows: rows || [], byRaas };
  }, [rows]);
}

/* -----------------------------
   Question → Answer (heuristics)
----------------------------- */
function answerQuestion(q, snapshot) {
  const text = (q || "").toLowerCase().trim();
  const { rows, byRaas } = snapshot;

  if (!rows?.length) {
    return {
      title: "Loading live data…",
      body: "Give me a sec while I pull fresh explorer stats.",
      facts: [],
    };
  }

  // helpers
  const topBy = (key, asc = false, filter = (x) => true) => {
    const arr = rows.filter((r) => Number.isFinite(Number(r[key])) && filter(r));
    const sorted = arr.sort((a, b) =>
      asc ? Number(a[key]) - Number(b[key]) : Number(b[key]) - Number(a[key])
    );
    return sorted.slice(0, 3);
  };

  // intent detection
  const wantsTX =
    text.includes("tx") ||
    text.includes("transactions") ||
    text.includes("transaction count");
  const wantsADDR = text.includes("address");
  const wantsTPS = text.includes("tps");
  const wantsBLOCK =
    text.includes("block") ||
    text.includes("avg block") ||
    text.includes("blocktime") ||
    text.includes("latency") ||
    text.includes("time");
  const wantsRAAS = text.includes("raas") || text.includes("provider");
  const wantsSummary = text === "" || text === "summary" || text.includes("overview");

  // RaaS breakdown summary
  if (wantsRAAS || text.includes("breakdown") || text.includes("share")) {
    const lines = Object.entries(byRaas)
      .map(([raas, list]) => {
        const tx = list.reduce((a, r) => a + (Number(r.totalTx) || 0), 0);
        const addrs = list.reduce((a, r) => a + (Number(r.totalAddresses) || 0), 0);
        const avgBlock =
          list.filter((r) => r.average_block_time > 0).reduce((a, r) => a + r.average_block_time, 0) /
          Math.max(1, list.filter((r) => r.average_block_time > 0).length);
        return { raas, tx, addrs, avgBlock: Number.isFinite(avgBlock) ? avgBlock : 0 };
      })
      .sort((a, b) => b.tx - a.tx);

    const facts = lines.slice(0, 5).map((x) => ({
      label: x.raas,
      value: `${fmtInt(x.tx)} tx • ${fmtInt(x.addrs)} addrs • ${fmtSec(x.avgBlock)} avg block`,
    }));

    return {
      title: "RaaS breakdown",
      body:
        lines.length === 0
          ? "No RaaS data yet."
          : "Top providers by total transactions, with addresses & avg block time:",
      facts,
    };
  }

  // Transaction leaders
  if (wantsTX) {
    const top = topBy("totalTx", false);
    const facts = top.map((c, i) => ({
      label: `${i + 1}. ${c.name} (${c.raas || "Other"})`,
      value: `${fmtInt(c.totalTx)} tx`,
    }));
    return {
      title: "Top by Transactions",
      body: !top.length ? "No transaction data yet." : "3 biggest chains by total transactions:",
      facts,
    };
  }

  // Address leaders
  if (wantsADDR) {
    const top = topBy("totalAddresses", false);
    const facts = top.map((c, i) => ({
      label: `${i + 1}. ${c.name} (${c.raas || "Other"})`,
      value: `${fmtInt(c.totalAddresses)} addresses`,
    }));
    return {
      title: "Top by Addresses",
      body: !top.length ? "No address data yet." : "3 chains with the most addresses:",
      facts,
    };
  }

  // TPS leaders (already averaged at source level)
  if (wantsTPS) {
    const top = topBy("avgTPS", false);
    const facts = top.map((c, i) => ({
      label: `${i + 1}. ${c.name} (${c.raas || "Other"})`,
      value: `${fmtTPS(c.avgTPS)} TPS`,
    }));
    return {
      title: "Top by Average TPS",
      body: !top.length ? "No TPS data yet." : "3 chains with the highest average TPS:",
      facts,
    };
  }

  // Fastest blocks (lowest average_block_time)


  // Summary / default: a curated overview
  if (wantsSummary || !text) {
    const txTop = topBy("totalTx", false)[0];
    const addrTop = topBy("totalAddresses", false)[0];
    const tpsTop = topBy("avgTPS", false)[0];
    const blockFast = topBy("average_block_time", true, (r) => r.average_block_time > 0)[0];

    const facts = [
      txTop && {
        label: `TX Leader — ${txTop.name} (${txTop.raas || "Other"})`,
        value: `${fmtInt(txTop.totalTx)} tx`,
      },
      addrTop && {
        label: `Address Leader — ${addrTop.name} (${addrTop.raas || "Other"})`,
        value: `${fmtInt(addrTop.totalAddresses)} addresses`,
      },
      tpsTop && {
        label: `TPS Leader — ${tpsTop.name} (${tpsTop.raas || "Other"})`,
        value: `${fmtTPS(tpsTop.avgTPS)} TPS`,
      },
      blockFast && {
        label: `Fastest Blocks — ${blockFast.name} (${blockFast.raas || "Other"})`,
        value: `${fmtSec(blockFast.average_block_time)} avg`,
      },
    ].filter(Boolean);

    return {
      title: "Quick Overview",
      body:
        facts.length === 0
          ? "I couldn’t compute an overview yet—try asking for tx, addresses, TPS or block time."
          : "Here’s what stands out right now:",
      facts,
    };
  }

  // Fallback: help
  return {
    title: "I didn’t catch that",
    body: 'Try questions like: "top tx", "most addresses", "fastest blocks", "top tps", or "RaaS breakdown".',
    facts: [],
  };
}

/* -----------------------------
   Suggestion chips
----------------------------- */
const SUGGESTIONS = [
  { q: "top tx", desc: "Who leads by total transactions?" },
  { q: "most addresses", desc: "Biggest user base" },
  { q: "top tps", desc: "Highest average TPS" },
  { q: "fastest blocks", desc: "Lowest average block time" },
  { q: "RaaS breakdown", desc: "Provider-level share" },
  { q: "summary", desc: "One-card overview" },
];

/* -----------------------------
   Components
----------------------------- */
function KPI({ label, value, sub }) {
  return (
    <div className="card" style={{ borderRadius: 16 }}>
      <div className="kicker">{label}</div>
      <div className="counter" style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
        {value}
      </div>
      {sub && <div className="sub" style={{ marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function FactRow({ label, value }) {
  return (
    <div className="qa-fact">
      <div className="qa-fact-label">{label}</div>
      <div className="qa-fact-value">{value}</div>
    </div>
  );
}

/* -----------------------------
   Page
----------------------------- */
export default function RaasBingo() {
  // live rows
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Q&A state
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState({ title: "", body: "", facts: [] });
  const [history, setHistory] = useState([]); // [{q, answer}]

  // Load & poll
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetchChainMetrics();
        if (alive) setRows(Array.isArray(r) ? r : []);
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 90_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const snapshot = useSnapshot(rows);

  // initial overview
  useEffect(() => {
    if (!loading) {
      const a = answerQuestion("summary", snapshot);
      setAnswer(a);
    }
  }, [loading, snapshot]);

  // KPIs (tiny)
  const kpis = useMemo(() => {
    if (!rows?.length) return { total: 0, withAddr: 0, withTPS: 0, withBlock: 0 };
    const total = rows.length;
    const withAddr = rows.filter((r) => (r.totalAddresses || 0) > 0).length;
    const withTPS = rows.filter((r) => (r.avgTPS || 0) > 0).length;
    const withBlock = rows.filter((r) => (r.average_block_time || 0) > 0).length;
    return { total, withAddr, withTPS, withBlock };
  }, [rows]);

  // submit handler
  const onAsk = (e) => {
    e?.preventDefault?.();
    const a = answerQuestion(q, snapshot);
    setAnswer(a);
    if (q.trim()) {
      setHistory((h) => [{ q: q.trim(), answer: a, ts: Date.now() }, ...h].slice(0, 6));
    }
  };

  // click a suggestion
  const onPick = (prompt) => {
    setQ(prompt);
    const a = answerQuestion(prompt, snapshot);
    setAnswer(a);
    setHistory((h) => [{ q: prompt, answer: a, ts: Date.now() }, ...h].slice(0, 6));
  };

  return (
    <main className="qa-root container" style={{ paddingTop: 18, paddingBottom: 40 }}>
      {/* Header */}
      <header className="header">
        <div className="container header-inner">
          <div className="brand">
            <div className="gradient">Ask Analytics</div>
          </div>
          <span className="badge">{loading ? "Fetching explorers…" : "Live"}</span>
        </div>
      </header>

      <div className="section">
        {/* Top row: left (ask), right (kpis) */}
        <div className="grid grid-2">
          {/* Ask card */}
          <div className="card" style={{ borderRadius: 20 }}>
            <h2 className="h2">Ask anything about the live RaaS dataset</h2>
            <div className="sub">
              Try quick prompts or type your own natural question. Answers are computed client-side
              from live Blockscout stats.
            </div>

            {/* Suggestions */}
            <div className="filters" style={{ marginTop: 8 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.q}
                  className={cx("chip")}
                  onClick={() => onPick(s.q)}
                  title={s.desc}
                >
                  <span className="chip-dot" />
                  {s.q}
                </button>
              ))}
            </div>

            {/* Ask form */}
            <form onSubmit={onAsk} className="qa-form">
              <input
                className="qa-input"
                placeholder='e.g. "top tx", "most addresses", "fastest blocks", "RaaS breakdown"'
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="btn" type="submit">
                Ask
              </button>
            </form>

            {/* Answer */}
            <div className="qa-answer card" style={{ marginTop: 14, borderRadius: 16 }}>
              <div className="qa-answer-title">{answer.title || "—"}</div>
              <div className="qa-answer-body">{answer.body || ""}</div>
              <div className="qa-facts">
                {answer.facts?.length ? (
                  answer.facts.map((f, i) => <FactRow key={i} label={f.label} value={f.value} />)
                ) : (
                  <div className="sub" style={{ marginTop: 6 }}>
                    No highlights right now—ask another question!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid">
            <KPI label="Chains tracked" value={fmtInt(kpis.total)} sub="From your RaaS list" />
            <KPI label="With addresses" value={fmtInt(kpis.withAddr)} sub="Chains reporting addresses" />
            <KPI label="With avg TPS" value={fmtInt(kpis.withTPS)} sub="Chains reporting TPS" />
            <KPI label="With block time" value={fmtInt(kpis.withBlock)} sub="Chains reporting avg block time" />
          </div>
        </div>

        {/* History */}
        <div className="card" style={{ marginTop: 18, borderRadius: 18 }}>
          <h2 className="h2">Recent questions</h2>
          {!history.length ? (
            <div className="sub">Ask something to see it show up here.</div>
          ) : (
            <div className="qa-history">
              {history.map((h, i) => (
                <button
                  key={h.ts + "-" + i}
                  className="qa-history-item"
                  onClick={() => onPick(h.q)}
                  title="Ask again"
                >
                  <div className="qa-history-q">“{h.q}”</div>
                  <div className="qa-history-a">
                    {h.answer?.title ? `→ ${h.answer.title}` : "→ Answered"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Explorer note */}
        <div className="card" style={{ marginTop: 14, borderRadius: 18, borderStyle: "dashed" }}>
        
        </div>
      </div>

      <style>{`
        /* Page scope additions (piggybacks on your global theme) */
        .qa-root .qa-form {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          margin-top: 10px;
        }
        .qa-root .qa-input {
          width: 100%;
          outline: none;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.06);
          color: var(--text);
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 14px;
        }
        .qa-answer-title {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .qa-answer-body {
          color: var(--muted);
          font-size: 13px;
          margin-bottom: 10px;
        }
        .qa-facts {
          display: grid;
          gap: 8px;
        }
        .qa-fact {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.04);
          border-radius: 12px;
          padding: 10px 12px;
        }
        .qa-fact-label {
          font-weight: 600;
        }
        .qa-fact-value {
          color: var(--text);
          font-feature-settings: "tnum" 1, "lnum" 1;
        }
        .qa-history {
          display: grid;
          gap: 8px;
          margin-top: 6px;
        }
        .qa-history-item {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          color: var(--text);
          text-align: left;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }
        .qa-history-item:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-soft);
          background: rgba(255,255,255,0.06);
        }
        .qa-history-q {
          font-weight: 600;
        }
        .qa-history-a {
          color: var(--muted);
          font-size: 12px;
        }

        /* Make suggestion chips bright on dark */
        .qa-root .chip { border-color: #233044; background: rgba(255,255,255,0.10); color: var(--text); }
        .qa-root .chip:hover { background: rgba(255,255,255,0.14); }
        .qa-root .chip-dot { background: rgba(255,255,255,0.65); }
      `}</style>
    </main>
  );
}
