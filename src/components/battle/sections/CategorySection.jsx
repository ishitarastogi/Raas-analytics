import React from "react";
import SectionCard from "../SectionCard";
import SectionHeader from "../SectionHeader";
import BarChartShell from "../charts/BarChartShell";

export default function CategorySection() {
  return (
    <SectionCard>
      <SectionHeader
        title="1) Category"
        subtitle="Compare RaaS performance across verticals."
        right={<div className="muted">Filters here</div>}
      />
      <BarChartShell />
      <div className="muted footnote">🥇 Podium + Top Chain highlight</div>
    </SectionCard>
  );
}
