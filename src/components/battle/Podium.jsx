import React from "react";

/** items: [{ rank:1|2|3, name, value, color }] */
export default function Podium({ items = [], highlight }) {
  return (
    <div className="podium">
      {items.map((it) => (
        <div key={it.rank} className={`podium-slot podium-slot--${it.rank}`}>
          <div className="badge" style={{ borderColor: it.color }}>
            {it.rank === 1 ? "🥇" : it.rank === 2 ? "🥈" : "🥉"}
          </div>
          <div className="podium-name">{it.name}</div>
          <div className="podium-value muted">
            {highlight ? highlight(it) : it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
