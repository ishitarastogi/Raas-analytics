import React from "react";
import SectionCard from "../SectionCard";
import SectionHeader from "../SectionHeader";
import BarChartShell from "../charts/BarChartShell";

export default function TokenVsEthSection() {
  return (
    <SectionCard>
      <SectionHeader
        title="9) Token vs ETH"
        subtitle="Native currency usage per ecosystem"
      />
      <BarChartShell />
      <div className="muted footnote">100% stacked bar: ETH vs Token</div>
    </SectionCard>
  );
}
