import React from "react";

export default function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="header-actions">{right}</div>
    </div>
  );
}
