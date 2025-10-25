import React from "react";
import SectionCard from "../SectionCard";
import SectionHeader from "../SectionHeader";
import BarChartShell from "../charts/BarChartShell";

export default function RaaSCountSection() {
  return (
    <SectionCard>
      <SectionHeader
        title="6) RaaS Count"
        subtitle="How many mainnet chains each RaaS powers"
      />
      <BarChartShell />
      <div className="muted footnote">Toggle: Past 90 days launches</div>
    </SectionCard>
  );
}
