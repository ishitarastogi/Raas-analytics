import React from "react";
import SectionCard from "../SectionCard";
import SectionHeader from "../SectionHeader";
import BarChartShell from "../charts/BarChartShell";

export default function RollupStackSection() {
  return (
    <SectionCard>
      <SectionHeader
        title="2) Rollup Stack"
        subtitle="Stack-level dominance per RaaS."
        right={<div className="muted">Metric filter</div>}
      />
      <BarChartShell />
      <div className="muted footnote">Podium + breakdown tooltip</div>
    </SectionCard>
  );
}
