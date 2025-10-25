import React from "react";
import SectionCard from "../SectionCard";
import SectionHeader from "../SectionHeader";
import BarChartShell from "../charts/BarChartShell";

export default function DeveloperSection() {
  return (
    <SectionCard>
      <SectionHeader
        title="4) Developer"
        subtitle="Total Gas Used & Contracts Deployed"
      />
      <BarChartShell />
      <div className="muted footnote">Dual bars per RaaS</div>
    </SectionCard>
  );
}
