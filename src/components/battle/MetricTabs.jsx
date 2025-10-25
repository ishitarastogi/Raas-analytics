// src/components/battle/MetricTabs.jsx
import React from "react";

export default function MetricTabs({ options, value, onChange }) {
  return (
    <div className="tabs">
      {options.map(o => (
        <button
          key={o.value}
          className={`tab ${o.value === value ? "is-active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
