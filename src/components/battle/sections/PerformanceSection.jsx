import React from "react";
import SectionCard from "../SectionCard";
import SectionHeader from "../SectionHeader";
import BarChartShell from "../charts/BarChartShell";

export default function PerformanceSection() {
  return (
    <SectionCard>
      <SectionHeader
        title="3) Performance"
        subtitle="Total Tx / Active Addr / Avg Block Time"
      />
      <BarChartShell />
      <div className="muted footnote">Tabbed bars + chain-level contribution</div>
    </SectionCard>
  );
}
