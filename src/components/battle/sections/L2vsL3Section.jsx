import React from "react";
import SectionCard from "../SectionCard";
import SectionHeader from "../SectionHeader";
import BarChartShell from "../charts/BarChartShell";

export default function L2vsL3Section() {
  return (
    <SectionCard>
      <SectionHeader
        title="7) L2 vs L3"
        subtitle="Composition of chains per RaaS"
      />
      <BarChartShell />
      <div className="muted footnote">100% stacked bar</div>
    </SectionCard>
  );
}
