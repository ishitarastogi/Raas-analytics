import React from "react";

export default function Header(){
  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <span className="gradient">RollUp</span><span>&nbsp;And&nbsp;Down</span>
          <span className="brand-underline" />
        </div>
        <div className="badge">
          <span className="kicker">Live</span>
          <span>Dashboard v0.2</span>
        </div>
      </div>
    </header>
  );
}
