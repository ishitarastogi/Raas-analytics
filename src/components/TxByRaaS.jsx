 import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Cell
} from "recharts";

const COLORS = {
  Caldera: "#FD4F00",
  Conduit: "#23B7B5",
  AltLayer: "#7F85E8",
  Alchemy: "#0662FE",
  Gelato:  "#FF3C58",
  Other:   "#8892a6"
};

const norm = (v) => {
  const s = (v ?? "").toString().trim();
  if (!s || s === "—" || s === "-") return "Other";
  return s;
};

export default function TxByRaaS({ enriched }){
  const [sortKey, setSortKey] = useState("total"); // total | name
  const [dir, setDir] = useState("desc");          // asc | desc

  const rowsRaw = useMemo(() => {
    const agg = {};
    enriched.forEach(d => {
      const raas = norm(d.raas);
      if (d.totalTx != null && Number.isFinite(d.totalTx)) {
        agg[raas] = (agg[raas] || 0) + d.totalTx;
      }
    });
    return Object.entries(agg).map(([raas, total]) => ({ raas, total }));
  }, [enriched]);

  // (Optional) drop "Other" if you don't want it visible:
  // const rowsClean = rowsRaw.filter(r => r.raas !== "Other");
  const rowsClean = rowsRaw;

  const rows = useMemo(() => {
    const out = [...rowsClean];
    out.sort((a, b) => {
      if (sortKey === "name") return dir === "asc" ? a.raas.localeCompare(b.raas) : b.raas.localeCompare(a.raas);
      return dir === "asc" ? a.total - b.total : b.total - a.total;
    });
    return out;
  }, [rowsClean, sortKey, dir]);

  const pretty = (n) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n.toLocaleString());

  return (
    <section className="section">
      <div className="container">
        <h2 className="h2">Total Transactions by RaaS</h2>
        <p className="sub">Sort, hover, enjoy the glow.</p>

        <div className="controls">
          <label className="kicker">Sort</label>
          <select className="select" value={sortKey} onChange={(e)=>setSortKey(e.target.value)}>
            <option value="total">By Value</option>
            <option value="name">By Name</option>
          </select>
          <button className="btn" onClick={()=>setDir(d=>d==="asc"?"desc":"asc")}>
            Direction: {dir.toUpperCase()}
          </button>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div style={{ height: 420 }}>
            <ResponsiveContainer>
              <BarChart data={rows} layout="vertical" margin={{ top: 10, right: 14, bottom: 10, left: 10 }}>
                <defs>
                  {rows.map((r, i) => (
                    <linearGradient key={r.raas} id={`grad-${i}`} x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%"  stopColor={(COLORS[r.raas] || "#7F85E8")} stopOpacity="0.35" />
                      <stop offset="60%" stopColor={(COLORS[r.raas] || "#7F85E8")} stopOpacity="0.85" />
                      <stop offset="100%" stopColor={(COLORS[r.raas] || "#7F85E8")} stopOpacity="1" />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid />
                <XAxis
                  type="number"
                  tickFormatter={pretty}
                  tick={{ fill: "var(--text)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  type="category"
                  dataKey="raas"
                  width={130}
                  tick={{ fill: "var(--text)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <ReTooltip formatter={(v) => [Number(v).toLocaleString(), "Total Txns"]} />
                <Bar dataKey="total" barSize={22} radius={[12,12,12,12]} isAnimationActive animationDuration={520}>
                  {rows.map((r, i) => (
                    <Cell key={r.raas} fill={`url(#grad-${i})`} stroke={(COLORS[r.raas] || "#7F85E8")} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
