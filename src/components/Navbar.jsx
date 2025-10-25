// src/components/NavBar.jsx
import React from "react";
import { RAAS } from "../utils/raas";

export default function NavBar({ selectedRaas, onChange }) {
  return (
    <header className="nav">
      <div className="nav__brand">RaaS Analytics</div>
      <div className="nav__controls">
        <label className="field">
          <span>Provider</span>
          <select
            value={selectedRaas}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="all">All RaaS</option>
            {RAAS.map(r => (
              <option key={r} value={r}>
                {r.replace("-raas","").replace(/^\w/, c => c.toUpperCase())}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
