import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="rud-header">
      <div className="rud-header-inner">
        <h1 className="rud-logo">RollUpAndDown</h1>
        <nav className="rud-nav">
          <Link to="/">Home</Link>
          <Link to="/stats">Stats</Link>
        </nav>
      </div>
    </header>
  );
}
