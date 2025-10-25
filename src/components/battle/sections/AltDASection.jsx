import React from "react";
import SectionCard from "../SectionCard";
import SectionHeader from "../SectionHeader";
import BarChartShell from "../charts/BarChartShell";

export default function AltDASection() {
  return (
    <SectionCard>
      <SectionHeader
        title="5) AltDA"
        subtitle="Ethereum DA, Celestia, EigenDA, Avail, Others"
      />
      <BarChartShell />
      <div className="muted footnote">100% stacked bar per RaaS</div>
    </SectionCard>
  );
}
