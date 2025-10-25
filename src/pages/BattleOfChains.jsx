// src/pages/BattleOfChains.jsx
import React from "react";
import CategorySection from "../components/battle/sections/CategorySection";
import RollupStackSection from "../components/battle/sections/RollupStackSection";
import PerformanceSection from "../components/battle/sections/PerformanceSection";
import DeveloperSection from "../components/battle/sections/DeveloperSection";
import AltDASection from "../components/battle/sections/AltDASection";
import RaaSCountSection from "../components/battle/sections/RaaSCountSection";
import L2vsL3Section from "../components/battle/sections/L2vsL3Section";
import L3SettlementSection from "../components/battle/sections/L3SettlementSection";
import TokenVsEthSection from "../components/battle/sections/TokenVsEthSection";

export default function BattleOfChains() {
  return (
    <main className="battle">
      <style>{css}</style>

      {/* Hero */}
      <header className="battle-hero">
        <div className="battle-hero__eyebrow">RollUpAndDown</div>
        <h1 className="battle-hero__title">⚔️ Battle of Chains</h1>
        <p className="battle-hero__subtitle">
          Nine arenas. Pick metrics. See who dominates.
        </p>
        <div className="battle-hero__glow" />
      </header>

      {/* Arenas */}
      <section className="battle-stack">
        <article className="arena-card">
          <h2 className="arena-card__title">1) Category</h2>
          <p className="arena-card__subtitle">
            Compare RaaS performance across verticals.
          </p>
          <CategorySection />
        </article>

        <article className="arena-card">
          <h2 className="arena-card__title">2) Rollup Stack</h2>
          <p className="arena-card__subtitle">
            Stack-level dominance per RaaS.
          </p>
          <RollupStackSection />
        </article>

        <article className="arena-card">
          <h2 className="arena-card__title">3) Performance</h2>
          <p className="arena-card__subtitle">
            Total Tx / Active Addresses / Avg Block Time.
          </p>
          <PerformanceSection />
        </article>

        <article className="arena-card">
          <h2 className="arena-card__title">4) Developer</h2>
          <p className="arena-card__subtitle">
            Total Gas Used &amp; Contracts Deployed.
          </p>
          <DeveloperSection />
        </article>

        <article className="arena-card">
          <h2 className="arena-card__title">5) AltDA</h2>
          <p className="arena-card__subtitle">
            Ethereum DA, Celestia, EigenDA, Avail, Others.
          </p>
          <AltDASection />
        </article>

        <article className="arena-card">
          <h2 className="arena-card__title">6) RaaS Count</h2>
          <p className="arena-card__subtitle">
            How many mainnet chains each RaaS powers.
          </p>
          <RaaSCountSection />
        </article>

        <article className="arena-card">
          <h2 className="arena-card__title">7) L2 vs L3</h2>
          <p className="arena-card__subtitle">
            Composition of chains per RaaS.
          </p>
          <L2vsL3Section />
        </article>

        <article className="arena-card">
          <h2 className="arena-card__title">8) L3 Settlement</h2>
          <p className="arena-card__subtitle">
            Where L3s settle: Arbitrum, Base, Optimism, Others.
          </p>
          <L3SettlementSection />
        </article>

        <article className="arena-card">
          <h2 className="arena-card__title">9) Token vs ETH</h2>
          <p className="arena-card__subtitle">
            Native currency usage per ecosystem.
          </p>
          <TokenVsEthSection />
        </article>
      </section>

      <footer className="battle-footer">
        Data Source: Blockscout + RollUpAndDown Index
      </footer>
    </main>
  );
}

/* ---------- local, component-scoped CSS ---------- */
const css = `
/* Page canvas */
.battle {
  --bg: #0b1118;
  --panel: #0f1722;
  --panel-2: #0d141d;
  --text: #c8d1e1;
  --muted: #92a0b5;
  --border: #1b2432;
  --ring: rgba(255,255,255,0.06);
  --glow: rgba(59,130,246,0.18);
  --radius: 20px;

  color: var(--text);
  background: radial-gradient(1200px 600px at 15% -10%, #0f2034 0%, var(--bg) 55%) fixed,
              radial-gradient(900px 500px at 95% 10%, #09131f 0%, var(--bg) 60%) fixed,
              var(--bg);
  min-height: 100vh;
  padding: 28px clamp(16px, 3.5vw, 40px) 60px;
  font-family: ui-sans-serif, system-ui, -apple-system, "Inter", "Space Grotesk", Segoe UI, Roboto, Arial, sans-serif;
}

/* Hero */
.battle-hero {
  position: relative;
  padding: 24px 18px 16px 8px;
  margin-bottom: 18px;
}
.battle-hero__eyebrow {
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.battle-hero__title {
  font-weight: 800;
  font-size: clamp(26px, 4.2vw, 38px);
  margin: 0 0 8px 0;
  text-shadow: 0 8px 42px rgba(0,0,0,0.5);
}
.battle-hero__subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 15px;
}
.battle-hero__glow {
  position: absolute;
  inset: -20px -10px auto -10px;
  height: 2px;
  background: linear-gradient(90deg, rgba(99,102,241,0.25), rgba(56,189,248,0.12), rgba(236,72,153,0.2));
  filter: blur(0.5px);
  pointer-events: none;
}

/* Stack layout */
.battle-stack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

/* Arena cards */
.arena-card {
  position: relative;
  border-radius: var(--radius);
  background:
    radial-gradient(120% 100% at 0% 0%, rgba(255,255,255,0.02), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%);
  padding: clamp(16px, 2vw, 22px);
  border: 1px solid var(--border);
  box-shadow:
    0 1px 0 var(--ring) inset,
    0 15px 50px rgba(0,0,0,0.45);
}
.arena-card::before {
  /* subtle neon edge */
  content:"";
  position:absolute;
  inset:-1px;
  border-radius: calc(var(--radius) + 2px);
  padding:1px;
  background: linear-gradient(135deg, rgba(253,79,0,0.25), rgba(35,183,181,0.18), rgba(127,133,232,0.2), rgba(6,98,254,0.22), rgba(255,60,88,0.18));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events:none;
}
.arena-card + .arena-card { margin-top: 2px; }

.arena-card__title {
  margin: 0 0 4px 0;
  font-size: clamp(18px, 2.3vw, 22px);
  font-weight: 700;
  letter-spacing: 0.2px;
}
.arena-card__subtitle {
  margin: 0 0 12px 0;
  color: var(--muted);
  font-size: 14px;
}

/* Footer */
.battle-footer {
  color: var(--muted);
  text-align: center;
  font-size: 13px;
  margin-top: 24px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
  opacity: 0.9;
}

/* Small screens tweaks */
@media (max-width: 720px) {
  .arena-card { padding: 14px; }
  .battle { padding: 20px 14px 48px; }
}

/* Nice focus/hover affordances for any buttons/filters inside sections */
.arena-card :is(button, .chip, .toggle, .select) {
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.02);
  color: var(--text);
}
.arena-card :is(button, .chip, .toggle, .select):hover {
  box-shadow: 0 0 0 4px var(--glow);
  transform: translateY(-0.5px);
  transition: box-shadow .18s ease, transform .18s ease;
}
`;
