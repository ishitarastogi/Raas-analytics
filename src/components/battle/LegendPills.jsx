import React from "react";

export default function LegendPills({ items = [] }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span key={it.key} className="pill">
          <i style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
