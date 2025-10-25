// src/components/TopChains.jsx
import React, { useMemo } from "react";

const COLORS = {
  caldera: "#5AA6FF",
  conduit: "#28C2B8",
  "altlayer-raas": "#FF8A37",
  "gelato-raas": "#D96B93",
  alchemy: "#3DD1C2",
};

export default function TopChains({ rows }) {
  const top6 = useMemo(() => {
    return [...rows].sort((a,b) => (b.totalTx||0) - (a.totalTx||0)).slice(0,6);
  }, [rows]);

  return (
    <div className="ov-card">
      <div className="ov-card-head">
        <h3>Top 6 Chains — by Total Transactions</h3>
      </div>

      <div className="ov-grid-3">
        {top6.map((c, idx) => (
          <div key={c.key} className="ov-mini-card" style={{ borderColor: COLORS[c.raas] }}>
            <div className="ov-mini-top">
              <span className="ov-chip" style={{ background: (COLORS[c.raas] || "#2b3648")+"22", color: COLORS[c.raas] }}>
                {c.raas.replace("-raas","")}
              </span>
              <span className={`ov-rank`}>#{idx+1}</span>
            </div>
            <h4 className="ov-name">{c.name}</h4>
            <div className="ov-meta"><span>Launch:</span> {c.launch ? c.launch.toLocaleDateString() : "—"}</div>
            <div className="ov-meta"><span>Total Tx:</span> {c.totalTx?.toLocaleString?.() || 0}</div>
            <div className="ov-meta"><span>Avg Block:</span> {c.avgBlock ? `${c.avgBlock} ms` : "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
