import React, { useEffect, useMemo, useRef, useState } from "react";

const COLORS = {
  Caldera: "#FD4F00",
  Conduit: "#23B7B5",
  AltLayer: "#7F85E8",
  Alchemy: "#0662FE",
  Gelato:  "#FF3C58",
};

function useCounter(value){
  const [n, setN] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = (value || 0) - start;
    const t0 = performance.now();
    const dur = 600;
    let raf = 0;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = k < 0.5 ? 2*k*k : -1 + (4 - 2*k) * k; // easeInOutQuad
      setN(Math.round(start + diff * eased));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    prev.current = value || 0;
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return n;
}

function LeaderCard({ item, index }){
  const count = useCounter(item.totalTx);
  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`);
  const color = COLORS[String(item.raas)] || "#7F85E8";

  return (
    <article className="card card-leader">
      <div
        className="glow"
        style={{
          background: `radial-gradient(600px 180px at 0% 0%, ${color}26, transparent 60%)`,
        }}
      />
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }} aria-hidden>{medal(index)}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{item.name}</div>
            <div
              className="badge"
              style={{
                marginTop: 6,
                background: `${color}1a`,
                borderColor: `${color}55`
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
              {String(item.raas)}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="kicker">Total Txns</div>
          <div className="counter" style={{ fontSize: 22, fontWeight: 900 }}>
            {Number(count).toLocaleString()}
          </div>
          {typeof item.avgBlockTimeMs === "number" && (
            <div className="sub" style={{ margin: 2 }}>Avg Block: {Math.round(item.avgBlockTimeMs)} ms</div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Leaderboard({ enriched }){
  const top6 = useMemo(
    () => [...enriched].filter(d => d.totalTx != null).sort((a, b) => b.totalTx - a.totalTx).slice(0, 6),
    [enriched]
  );

  return (
    <section className="section">
      <div className="container">
        <h2 className="h2">Top 6 Chains</h2>
        <p className="sub">Ranked by total transactions. Hover for glow, watch counters animate.</p>

        <div className="grid grid-1 grid-2 grid-3">
          {top6.map((c, i) => (
            <LeaderCard key={c.id} item={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
