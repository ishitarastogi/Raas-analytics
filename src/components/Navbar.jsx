import React from "react";
import { NavLink, Link } from "react-router-dom";
import { RAAS } from "../utils/raas";
import "./NavBar.css";

export default function NavBar({ selectedRaas = "all", onChange = () => {} }) {
  return (
    <header className="nav">
      <div className="nav__left">
        <Link to="/" className="nav__brand">RaaS Analytics</Link>

        <nav className="nav__links" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "nav__link" + (isActive ? " is-active" : "")
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/battle"
            className={({ isActive }) =>
              "nav__link" + (isActive ? " is-active" : "")
            }
          >
            Battle
          </NavLink>
          <NavLink
            to="/bingo"
            className={({ isActive }) =>
              "nav__link" + (isActive ? " is-active" : "")
            }
          >
            Bingo
          </NavLink>
        </nav>
      </div>

      <div className="nav__controls">
        <label className="field">
          <span className="field__label">Provider</span>
          <select
            className="field__select"
            value={selectedRaas}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="all">All RaaS</option>
            {RAAS.map((r) => (
              <option key={r} value={r}>
                {r.replace("-raas", "").replace(/^\w/, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
