import React from "react";
export default function StackedBar100Shell({ children, height = 360 }) {
  return <div className="chart chart--stacked100" style={{ height }}>{children ?? <span className="muted">Chart placeholder</span>}</div>;
}
