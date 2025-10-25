// src/components/RaasTxBar.jsx
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from "recharts";

const COLORS = {
  caldera: "#5AA6FF",
  conduit: "#28C2B8",
  "altlayer-raas": "#FF8A37",
  "gelato-raas": "#D96B93",
  alchemy: "#3DD1C2",
};

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export default function RaasTxBar({ rows }) {
  const data = useMemo(() => {
    const m = new Map();
    for (const r of rows) m.set(r.raas, (m.get(r.raas) || 0) + (r.totalTx || 0));
    return [...m.entries()]
      .map(([key, value]) => ({ key, name: cap(key.replace("-raas","")), value }))
      .sort((a,b) => b.value - a.value);
  }, [rows]);

  return (
    <div className="ov-card">
      <div className="ov-card-head">
        <h3>Total Transactions by RaaS</h3>
      </div>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v)=>v.toLocaleString()} />
            <Tooltip formatter={(v)=>v.toLocaleString()} />
            <Legend />
            <Bar dataKey="value" name="Total Tx">
              {data.map((d, i) => <Cell key={i} fill={COLORS[d.key]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
