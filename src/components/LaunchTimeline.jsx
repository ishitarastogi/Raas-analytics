import React, { useMemo, useState, useRef } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

/* RaaS brand colors */
const COLORS = {
  Caldera: "#FD4F00",
  Conduit: "#23B7B5",
  AltLayer: "#7F85E8",
  Alchemy: "#0662FE",
  Gelato: "#FF3C58",
};

/* ---------- helpers ---------- */
const cleanRaaS = (v) => {
  const s = (v ?? "").toString().trim();
  // Drop placeholders entirely (no "Other" row)
  if (!s || s === "—" || s === "-") return null;
  return s;
};

const toTS = (s) => {
  if (!s || s === "—") return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
};

/* Jitter vertical positions when multiple chains share the same date */
function jitterPositions(n, amp = 0.26) {
  if (n === 1) return [0];
  if (n === 2) return [-amp / 2, amp / 2];
  const arr = [];
  const step = (2 * amp) / (n - 1);
  for (let i = 0; i < n; i++) arr.push(-amp + i * step);
  return arr;
}

/* Simple hover card (absolute, per-dot) */
function HoverCard({ point, pos }) {
  if (!point) return null;
  const fmt = (ts) =>
    new Date(ts).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  return (
    <div
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        background: "rgba(17,24,39,0.92)",
        border: "1px solid #1B2432",
        borderRadius: 10,
        padding: "8px 10px",
        color: "var(--text, #CFE7FF)",
        fontSize: 12,
        lineHeight: 1.35,
        pointerEvents: "none",
        zIndex: 3,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ fontWeight: 800 }}>{point.name}</div>
      <div style={{ opacity: 0.85 }}>{fmt(point.x)}</div>
    </div>
  );
}

/* ---------- main component ---------- */
export default function LaunchTimeline({ chains }) {
  /* Normalize input; keep only rows with valid date & RaaS */
  const rows = useMemo(() => {
    return chains
      .map((c, i) => {
        const launchTs = toTS(c.launchDate);
        const raas = cleanRaaS(c.raas);
        return {
          id: `${c.name}-${i}`,
          name: c.name,
          raas,
          x: launchTs,
          vertical: c.vertical,
          launchDate: c.launchDate,
        };
      })
      .filter((d) => d.x !== null && d.raas !== null);
  }, [chains]);

  /* RaaS categories in a nice order (no "Other") */
  const present = useMemo(
    () => Array.from(new Set(rows.map((d) => d.raas))),
    [rows]
  );
  const paletteOrder = ["Caldera", "Conduit", "AltLayer", "Alchemy", "Gelato"];
  const yCats = useMemo(() => {
    const ordered = paletteOrder.filter((r) => present.includes(r));
    const rest = present.filter((r) => !ordered.includes(r)).sort();
    return [...ordered, ...rest];
  }, [present]);

  /* Map categories to band centers 1..N; fixed ticks */
  const yIndex = useMemo(
    () => Object.fromEntries(yCats.map((r, i) => [r, i + 1])),
    [yCats]
  );
  const yTicks = useMemo(() => yCats.map((_, i) => i + 1), [yCats]);

  /* Legend filters */
  const [active, setActive] = useState(() => new Set(yCats));
  const toggle = (r) => {
    const n = new Set(active);
    n.has(r) ? n.delete(r) : n.add(r);
    setActive(n);
  };
  const setAll = (on) => setActive(on ? new Set(yCats) : new Set());

  /* Group by (raas, date) then apply jitter so same-day chains all show */
  const jittered = useMemo(() => {
    const groups = new Map(); // key: `${raas}|${x}`
    for (const r of rows) {
      if (!active.has(r.raas)) continue;
      const key = `${r.raas}|${r.x}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    const out = [];
    for (const list of groups.values()) {
      const band = yIndex[list[0].raas] || 0;
      const jit = jitterPositions(list.length, 0.26);
      list.forEach((item, i) => {
        out.push({ ...item, y: band + jit[i] });
      });
    }
    return out;
  }, [rows, active, yIndex]);

  /* Split jittered points into series by RaaS (prevents band mixing) */
  const series = useMemo(() => {
    const g = {};
    for (const p of jittered) (g[p.raas] ||= []).push(p);
    return g;
  }, [jittered]);

  const fmtX = (ts) =>
    new Date(ts).toLocaleDateString(undefined, {
      year: "2-digit",
      month: "short",
    });

  /* Custom hover (per dot) using true mouse position + clamping */
  const containerRef = useRef(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [hoverPos, setHoverPos] = useState({ left: 0, top: 0 });

  const handleEnterMove = (pt, _idx, e) => {
    const card = containerRef.current;
    if (!card) {
      setHoverPoint(pt);
      return;
    }

    // Mouse/touch position in viewport space
    const ne = e?.nativeEvent;
    let clientX, clientY;
    if (ne?.clientX != null) {
      clientX = ne.clientX;
      clientY = ne.clientY;
    } else if (ne?.touches && ne.touches[0]) {
      clientX = ne.touches[0].clientX;
      clientY = ne.touches[0].clientY;
    } else {
      setHoverPoint(pt);
      return;
    }

    // Convert to container-local space
    const rect = card.getBoundingClientRect();
    // slight offsets to the right and above the cursor
    let left = clientX - rect.left + 12;
    let top = clientY - rect.top - 12;

    // Clamp the hover card within the card bounds
    const PAD = 8;
    const CARD_W = 180; // approx width
    const CARD_H = 56;  // approx height
    left = Math.max(PAD, Math.min(rect.width - CARD_W - PAD, left));
    top = Math.max(PAD, Math.min(rect.height - CARD_H - PAD, top));

    setHoverPoint(pt);
    setHoverPos({ left, top });
  };
  const handleLeave = () => setHoverPoint(null);

  return (
    <section className="section">
      <div className="container">
        <h2 className="h2">RaaS Launch Timeline</h2>
        <p className="sub">
          Multiple chains on the same day appear as separate dots within the
          band.
        </p>

        {/* Legend / chips */}
        <div className="filters">
          <button className="chip" onClick={() => setAll(true)}>
            Select All
          </button>
          <button className="chip" onClick={() => setAll(false)}>
            Clear
          </button>
          {yCats.map((r) => (
            <button
              key={r}
              className={`chip ${active.has(r) ? "on" : ""}`}
              onClick={() => toggle(r)}
            >
              <span
                className="chip-dot"
                style={{ background: COLORS[r] || "#7F85E8" }}
              />
              {r}
            </button>
          ))}
        </div>

        <div
          className="card"
          style={{ padding: 12, position: "relative" }}
          ref={containerRef}
        >
          {/* absolute custom hover card */}
          <HoverCard point={hoverPoint} pos={hoverPos} />

          <div style={{ height: 420 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 24, left: 10 }}>
                <defs>
                  {yCats.map((r, i) => (
                    <radialGradient key={r} id={`pt-${i}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={COLORS[r] || "#7F85E8"} stopOpacity="0.95" />
                      <stop offset="70%" stopColor={COLORS[r] || "#7F85E8"} stopOpacity="0.45" />
                      <stop offset="100%" stopColor={COLORS[r] || "#7F85E8"} stopOpacity="0.15" />
                    </radialGradient>
                  ))}
                </defs>

                <CartesianGrid />

                <XAxis
                  dataKey="x"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={fmtX}
                  tick={{ fill: "var(--text, #CFE7FF)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border, #1B2432)" }}
                />

                <YAxis
                  dataKey="y"
                  type="number"
                  domain={[0.5, yCats.length + 0.5]}
                  ticks={yTicks}
                  allowDecimals={false}
                  tickFormatter={(v) => yCats[v - 1] || ""}
                  tick={{ fill: "var(--text, #CFE7FF)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border, #1B2432)" }}
                />

                <ZAxis dataKey="z" range={[60, 140]} />

                {yCats.map((r, i) => (
                  <Scatter
                    key={r}
                    name={r}
                    data={series[r] || []}
                    fill={`url(#pt-${i})`}
                    stroke={COLORS[r] || "#7F85E8"}
                    strokeOpacity={0.7}
                    shape="circle"
                    isAnimationActive
                    animationDuration={520}
                    activeDot={{ r: 6 }}
                    onMouseEnter={handleEnterMove}
                    onMouseMove={handleEnterMove}
                    onMouseLeave={handleLeave}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
