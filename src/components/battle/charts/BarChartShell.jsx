import React from "react";

export default function BarChartShell({ children, height = 320 }) {
  return (
    <div className="chart chart--bar" style={{ height }}>
      {children ?? <span className="muted">Chart placeholder</span>}
    </div>
  );
}
