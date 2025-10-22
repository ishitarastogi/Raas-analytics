import React from "react";

export default function Footer() {
  return (
    <footer className="rud-footer">
      <span>© {new Date().getFullYear()} RollUpAndDown</span>
      <span className="rud-muted">Mainnet L2 & L3 overview (Blockscout Chains API)</span>
    </footer>
  );
}
