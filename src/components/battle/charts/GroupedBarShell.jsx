import React from "react";
export default function GroupedBarShell({ children, height = 360 }) {
  return <div className="chart chart--grouped" style={{ height }}>{children ?? <span className="muted">Chart placeholder</span>}</div>;
}
