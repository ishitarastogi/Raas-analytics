import React from "react";
import SectionCard from "../SectionCard";
import SectionHeader from "../SectionHeader";
import BarChartShell from "../charts/BarChartShell";

export default function L3SettlementSection() {
  return (
    <SectionCard>
      <SectionHeader
        title="8) L3 Settlement"
        subtitle="Where L3s settle: Arbitrum, Base, Optimism, Others"
      />
      <BarChartShell />
      <div className="muted footnote">Grouped bars by RaaS</div>
    </SectionCard>
  );
}
