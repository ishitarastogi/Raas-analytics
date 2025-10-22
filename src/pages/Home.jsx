import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  LineChart, Line, Area, AreaChart
} from "recharts";
import { TrendingUp, Layers, Database, Zap, Filter, Search, Download, RefreshCw } from "lucide-react";

/* ---------- Config ---------- */
const RAAS_HOSTS = ["caldera", "gelato-raas", "conduit", "altlayer-raas", "alchemy"];
const COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#14b8a6","#f97316"];
const GRADIENT_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e"];
const ucfirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const toSeries = (m) => [...m.entries()].map(([name, value]) => ({ name: String(name), value })).sort((a,b)=>b.value-a.value);
const renderCells = (arr) => arr.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />);

const NAME_ROLLUP_OVERRIDES = new Map([
  ["degen chain", "arbitrum"],
  ["edu chain", "arbitrum"],
  ["fluence", "arbitrum"],
  ["ink", "optimism"],
  ["proof of play", "arbitrum"],
]);

const NAME_SETTLEMENT_OVERRIDES = new Map([
  ["playnance playblock", "arbitrum"],
]);

/* ---------- Normalize & rules ---------- */
function normalize(raw) {
  const ecosystems = Array.isArray(raw.ecosystem) ? raw.ecosystem : raw.ecosystem ? [raw.ecosystem] : [];
  const host = String(raw?.explorers?.[0]?.hostedBy || "unknown").toLowerCase();
  const keyName = String(raw.name || "").toLowerCase().trim();

  let settlementFamily;
  if (raw.layer === 2) {
    settlementFamily = "ethereum";
  } else if (raw.layer === 3) {
    const tags = ecosystems.map(t=>String(t).toLowerCase());
    settlementFamily =
      tags.some(t=>t.includes("arbitrum")) ? "arbitrum" :
      tags.some(t=>t.includes("base")) ? "base" :
      (tags.some(t=>t.includes("optimism")) || tags.some(t=>t.includes("superchain"))) ? "optimism" :
      "other";
  }

  if (raw.layer === 3 && NAME_SETTLEMENT_OVERRIDES.has(keyName)) {
    settlementFamily = NAME_SETTLEMENT_OVERRIDES.get(keyName);
  }

  let rollupType = String(raw.rollupType || "other").toLowerCase();
  if (rollupType === "optimistic") rollupType = "optimism";

  if ((!rollupType || rollupType === "other") && raw.layer === 3 && settlementFamily && settlementFamily !== "other") {
    rollupType = settlementFamily;
  }

  if (NAME_ROLLUP_OVERRIDES.has(keyName)) {
    rollupType = NAME_ROLLUP_OVERRIDES.get(keyName);
  }

  return {
    name: raw.name,
    layer: raw.layer,
    isTestnet: !!raw.isTestnet,
    explorerHost: host,
    ecosystems,
    rollupType,
    nativeCurrency: String(raw.native_currency || "OTHER").trim().toUpperCase(),
    settlementFamily
  };
}

/* ---------- Data hook ---------- */
function useRaas() {
  const [data, setData] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://chains.blockscout.com/api/chains");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const items = Object.values(json)
          .map(normalize)
          .filter(c => !c.isTestnet && (c.layer === 2 || c.layer === 3))
          .filter(c => RAAS_HOSTS.includes(c.explorerHost));

        setData(items);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, err, loading };
}

/* ---------- Custom Tooltip ---------- */
function EnhancedTooltip({ active, payload, label, namesByType }) {
  if (!active || !payload || !payload.length) return null;
  const type = label?.toString?.() || payload[0]?.payload?.name || "other";
  const list = namesByType?.get(type) || [];
  return (
    <div style={{
      background: "rgba(15, 23, 42, 0.98)",
      border: "1px solid rgba(148, 163, 184, 0.2)",
      borderRadius: "12px",
      padding: "12px 16px",
      backdropFilter: "blur(12px)",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)"
    }}>
      <div style={{color: "#f1f5f9", fontWeight: 600, marginBottom: 8, fontSize: 14}}>
        {type} — {payload[0].value}
      </div>
      {list.length ? (
        <ul style={{margin: 0, paddingLeft: 16, fontSize: 12, color: "#cbd5e1", maxHeight: 180, overflowY: "auto"}}>
          {list.slice(0, 15).map(n => <li key={n} style={{marginBottom: 4}}>{n}</li>)}
          {list.length > 15 && <li style={{color: "#64748b", fontStyle: "italic"}}>+{list.length - 15} more</li>}
        </ul>
      ) : (
        <div style={{color: "#64748b", fontSize: 12}}>No chains</div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */
export default function Ecosystem() {
  const { data, err, loading } = useRaas();
  const [selectedHost, setSelectedHost] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("overview"); // overview | table

  const filtered = useMemo(
    () => {
      let result = selectedHost === "all" ? data : data.filter(c => c.explorerHost === selectedHost);
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(c => c.name.toLowerCase().includes(term));
      }
      return result;
    },
    [data, selectedHost, searchTerm]
  );

  /* Stats */
  const stats = useMemo(() => {
    const l2 = filtered.filter(c=>c.layer===2).length;
    const l3 = filtered.filter(c=>c.layer===3).length;
    const ethCurrency = filtered.filter(c=>c.nativeCurrency==="ETH").length;
    return { total: filtered.length, l2, l3, ethCurrency };
  }, [filtered]);

  /* Charts */
  const l2l3Pie = useMemo(() => [
    {name:"Layer 2", value:stats.l2},
    {name:"Layer 3", value:stats.l3}
  ], [stats]);

  const rollupGroups = useMemo(() => {
    const map = new Map();
    for (const c of filtered) {
      const k = c.rollupType || "other";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(c.name);
    }
    for (const [, arr] of map) arr.sort((a,b)=>a.localeCompare(b));
    return map;
  }, [filtered]);

  const rollupBar = useMemo(() => {
    const m = new Map();
    for (const [k, arr] of rollupGroups) m.set(k, arr.length);
    return toSeries(m);
  }, [rollupGroups]);

  const l3SplitBar = useMemo(() => {
    const m = new Map();
    for (const c of filtered) if (c.layer===3) m.set(c.settlementFamily||"other",(m.get(c.settlementFamily||"other")||0)+1);
    return toSeries(m);
  }, [filtered]);

  const hostSplitBar = useMemo(() => {
    const m = new Map(RAAS_HOSTS.map(h=>[h,0]));
    for (const c of filtered) m.set(c.explorerHost,(m.get(c.explorerHost)||0)+1);
    return toSeries(m);
  }, [filtered]);

  const currencyPie = useMemo(() => [
    {name:"ETH", value:stats.ethCurrency},
    {name:"Own Token", value:stats.total - stats.ethCurrency}
  ], [stats]);

  const otherRollupNames = rollupGroups.get("other") || [];
  const l3OtherNames = useMemo(
    () => filtered
      .filter(c => c.layer === 3 && (!c.settlementFamily || c.settlementFamily === "other"))
      .map(c => c.name)
      .sort((a,b)=>a.localeCompare(b)),
    [filtered]
  );

  if (loading) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#f1f5f9"
    }}>
      <div style={{textAlign: "center"}}>
        <div style={{
          width: 60,
          height: 60,
          border: "4px solid rgba(99, 102, 241, 0.2)",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px"
        }}/>
        <div style={{fontSize: 18, fontWeight: 500}}>Loading ecosystem data...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );

  if (err) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#f87171",
      padding: 24
    }}>
      <div style={{textAlign: "center", maxWidth: 400}}>
        <div style={{fontSize: 48, marginBottom: 16}}>⚠️</div>
        <div style={{fontSize: 18, fontWeight: 600, marginBottom: 8}}>Failed to load data</div>
        <div style={{color: "#cbd5e1"}}>{err}</div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      color: "#f1f5f9",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
        padding: "24px 0",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
      }}>
        <div style={{maxWidth: 1400, margin: "0 auto", padding: "0 24px"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20}}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: 8
              }}>
                RaaS Ecosystem Analytics
              </h1>
              <p style={{margin: 0, color: "#94a3b8", fontSize: 14}}>
                Real-time insights into Layer 2 & Layer 3 blockchain infrastructure
              </p>
            </div>
            
            <div style={{display: "flex", gap: 12, alignItems: "center"}}>
              <button
                onClick={() => setViewMode(viewMode === "overview" ? "table" : "overview")}
                style={{
                  background: viewMode === "overview" ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "rgba(51, 65, 85, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.3s"
                }}
              >
                <Layers size={16} />
                {viewMode === "overview" ? "Overview" : "Table View"}
              </button>
              
              <select
                value={selectedHost}
                onChange={(e)=>setSelectedHost(e.target.value)}
                style={{
                  background: "rgba(51, 65, 85, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#f1f5f9",
                  padding: "10px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  minWidth: 160
                }}
              >
                <option value="all">All Providers</option>
                {RAAS_HOSTS.map(h => <option key={h} value={h}>{ucfirst(h)}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div style={{maxWidth: 1400, margin: "0 auto", padding: 32}}>
        {/* Stats Cards */}
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32}}>
          {[
            {label: "Total Chains", value: stats.total, icon: Database, color: "#6366f1"},
            {label: "Layer 2", value: stats.l2, icon: Layers, color: "#10b981"},
            {label: "Layer 3", value: stats.l3, icon: TrendingUp, color: "#f59e0b"},
            {label: "ETH Native", value: stats.ethCurrency, icon: Zap, color: "#8b5cf6"}
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: "rgba(30, 41, 59, 0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 16,
                padding: 24,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 20px 25px -5px ${stat.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: `radial-gradient(circle, ${stat.color}20 0%, transparent 70%)`,
                borderRadius: "50%"
              }}/>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12}}>
                <stat.icon size={24} color={stat.color} />
                <span style={{fontSize: 12, color: "#64748b", fontWeight: 500}}>{stat.label}</span>
              </div>
              <div style={{fontSize: 36, fontWeight: 700, color: "#f1f5f9"}}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{marginBottom: 32}}>
          <div style={{
            position: "relative",
            maxWidth: 600,
            margin: "0 auto"
          }}>
            <Search style={{position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#64748b"}} size={20} />
            <input
              type="text"
              placeholder="Search chains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(30, 41, 59, 0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 12,
                padding: "14px 16px 14px 48px",
                color: "#f1f5f9",
                fontSize: 15,
                outline: "none",
                transition: "all 0.3s"
              }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "rgba(148, 163, 184, 0.2)"}
            />
          </div>
        </div>

        {viewMode === "overview" ? (
          <>
            {/* Row 1: L2 vs L3 + Rollup Stack */}
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: 24, marginBottom: 24}}>
              <ChartCard title="L2 vs L3 Distribution">
                <ResponsiveContainer width="100%" height={280}>
                  <RPieChart>
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                      <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <Pie 
                      data={l2l3Pie} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius={60} 
                      outerRadius={110} 
                      paddingAngle={4}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      <Cell fill="url(#grad1)" />
                      <Cell fill="url(#grad2)" />
                    </Pie>
                    <Tooltip contentStyle={{background: "rgba(15, 23, 42, 0.98)", border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: 12}} />
                    <Legend />
                  </RPieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Rollup Stack Distribution" subtitle={`${rollupBar.length} different stacks`}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={rollupBar} margin={{top:10,right:16,bottom:8,left:0}}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148, 163, 184, 0.1)" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:12, fill:"#94a3b8"}}/>
                    <YAxis allowDecimals={false} tick={{fontSize:12, fill:"#94a3b8"}}/>
                    <Tooltip content={<EnhancedTooltip namesByType={rollupGroups} />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={800}>
                      {renderCells(rollupBar)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {otherRollupNames.length > 0 && (
                  <SubList title="'Other' Rollup Stack" items={otherRollupNames} />
                )}
              </ChartCard>
            </div>

            {/* Row 2: L3 Split + RaaS Host */}
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: 24, marginBottom: 24}}>
              <ChartCard title="L3 Settlement Family" subtitle={`${l3SplitBar.length} settlement layers`}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={l3SplitBar} layout="vertical" margin={{top:10,right:16,bottom:8,left:0}}>
                    <CartesianGrid stroke="rgba(148, 163, 184, 0.1)"/>
                    <XAxis type="number" allowDecimals={false} tick={{fill:"#94a3b8"}}/>
                    <YAxis type="category" dataKey="name" width={120} tick={{fill:"#94a3b8"}}/>
                    <Tooltip contentStyle={{background: "rgba(15, 23, 42, 0.98)", border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: 12}}/>
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={800}>
                      {renderCells(l3SplitBar)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {l3OtherNames.length > 0 && (
                  <SubList title="'Other' Settlement" items={l3OtherNames} />
                )}
              </ChartCard>

              <ChartCard title="RaaS Provider Split" subtitle={selectedHost === "all" ? "All providers" : ucfirst(selectedHost)}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hostSplitBar} layout="vertical" margin={{top:10,right:16,bottom:8,left:0}}>
                    <CartesianGrid stroke="rgba(148, 163, 184, 0.1)"/>
                    <XAxis type="number" allowDecimals={false} tick={{fill:"#94a3b8"}}/>
                    <YAxis type="category" dataKey="name" width={140} tick={{fill:"#94a3b8"}}/>
                    <Tooltip contentStyle={{background: "rgba(15, 23, 42, 0.98)", border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: 12}}/>
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={800}>
                      {renderCells(hostSplitBar)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 3: Native Currency */}
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: 24}}>
              <ChartCard title="Native Currency Distribution" subtitle="ETH vs Custom Tokens">
                <ResponsiveContainer width="100%" height={280}>
                  <RPieChart>
                    <defs>
                      <linearGradient id="grad3" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                      <linearGradient id="grad4" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                    </defs>
                    <Pie 
                      data={currencyPie} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius={60} 
                      outerRadius={110} 
                      paddingAngle={4}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      <Cell fill="url(#grad3)" />
                      <Cell fill="url(#grad4)" />
                    </Pie>
                    <Tooltip contentStyle={{background: "rgba(15, 23, 42, 0.98)", border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: 12}} />
                    <Legend />
                  </RPieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Quick Insights" subtitle="Key metrics at a glance">
                <div style={{display: "flex", flexDirection: "column", gap: 16, padding: "24px 0"}}>
                  <InsightRow label="Avg chains per provider" value={Math.round(stats.total / RAAS_HOSTS.length)} />
                  <InsightRow label="L3 to L2 ratio" value={stats.l2 > 0 ? (stats.l3 / stats.l2).toFixed(2) : "N/A"} />
                  <InsightRow label="ETH adoption rate" value={`${Math.round((stats.ethCurrency / stats.total) * 100)}%`} />
                  <InsightRow label="Most common rollup" value={rollupBar[0]?.name || "N/A"} />
                </div>
              </ChartCard>
            </div>
          </>
        ) : (
          <ChainTable data={filtered} selectedHost={selectedHost} />
        )}
      </div>
    </div>
  );
}

/* Helper Components */
function ChartCard({title, subtitle, children}) {
  return (
    <div style={{
      background: "rgba(30, 41, 59, 0.6)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(148, 163, 184, 0.1)",
      borderRadius: 16,
      padding: 24,
      transition: "all 0.3s"
    }}>
      <div style={{marginBottom: 20}}>
        <h3 style={{margin: 0, fontSize: 18, fontWeight: 600, color: "#f1f5f9", marginBottom: 4}}>{title}</h3>
        {subtitle && <p style={{margin: 0, fontSize: 13, color: "#64748b"}}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function SubList({title, items}) {
  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      background: "rgba(15, 23, 42, 0.6)",
      borderRadius: 12,
      border: "1px solid rgba(148, 163, 184, 0.1)"
    }}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
        <h4 style={{margin: 0, fontSize: 14, fontWeight: 600, color: "#cbd5e1"}}>{title}</h4>
        <span style={{fontSize: 12, color: "#64748b", background: "rgba(100, 116, 139, 0.2)", padding: "4px 10px", borderRadius: 6}}>
          {items.length}
        </span>
      </div>
      <ul style={{
        margin: 0,
        paddingLeft: 20,
        maxHeight: 120,
        overflowY: "auto",
        fontSize: 13,
        color: "#94a3b8",
        lineHeight: 1.8
      }}>
        {items.map(n => <li key={n}>{n}</li>)}
      </ul>
    </div>
  );
}

function InsightRow({label, value}) {
  return (
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(15, 23, 42, 0.4)", borderRadius: 10}}>
      <span style={{fontSize: 14, color: "#94a3b8"}}>{label}</span>
      <span style={{fontSize: 16, fontWeight: 600, color: "#f1f5f9"}}>{value}</span>
    </div>
  );
}

function ChainTable({data, selectedHost}) {
  const grouped = useMemo(() => {
    if (selectedHost === "all") {
      const g = new Map(RAAS_HOSTS.map(h=>[h,[]]));
      for (const c of data) g.get(c.explorerHost)?.push(c);
      for (const [, arr] of g) arr.sort((a,b)=>a.name.localeCompare(b.name));
      return { mode:"host", groups:g };
    } else {
      const g = new Map([["Layer 2",[]],["Layer 3",[]]]);
      for (const c of data) (c.layer===2 ? g.get("Layer 2") : g.get("Layer 3")).push(c);
      for (const [, arr] of g) arr.sort((a,b)=>a.name.localeCompare(b.name));
      return { mode:"layer", groups:g };
    }
  }, [data, selectedHost]);

  return (
    <div style={{
      background: "rgba(30, 41, 59, 0.6)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(148, 163, 184, 0.1)",
      borderRadius: 16,
      padding: 24
    }}>
      <div style={{marginBottom: 20}}>
        <h3 style={{margin: 0, fontSize: 18, fontWeight: 600, color: "#f1f5f9", marginBottom: 4}}>
          All Chains
        </h3>
        <p style={{margin: 0, fontSize: 13, color: "#64748b"}}>
          {selectedHost === "all" ? "Grouped by RaaS provider" : `${ucfirst(selectedHost)} (by layer)`}
        </p>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: 20}}>
        {[...grouped.groups.entries()].map(([groupName, list]) => (
          <div key={groupName} style={{
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            borderRadius: 12,
            padding: 16,
            overflow: "hidden"
          }}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
              <h4 style={{margin: 0, fontSize: 16, fontWeight: 600, color: "#f1f5f9"}}>{ucfirst(groupName)}</h4>
              <span style={{fontSize: 12, color: "#64748b", background: "rgba(100, 116, 139, 0.2)", padding: "4px 10px", borderRadius: 6}}>
                {list.length}
              </span>
            </div>
            
            <div style={{overflowX: "auto"}}>
              <table style={{width: "100%", borderCollapse: "collapse", fontSize: 13}}>
                <thead>
                  <tr style={{borderBottom: "1px solid rgba(148, 163, 184, 0.1)"}}>
                    <th style={{padding: "10px 8px", textAlign: "left", color: "#94a3b8", fontWeight: 500}}>Name</th>
                    {grouped.mode === "host" && <th style={{padding: "10px 8px", textAlign: "left", color: "#94a3b8", fontWeight: 500}}>Layer</th>}
                    <th style={{padding: "10px 8px", textAlign: "left", color: "#94a3b8", fontWeight: 500}}>Rollup</th>
                    <th style={{padding: "10px 8px", textAlign: "left", color: "#94a3b8", fontWeight: 500}}>Currency</th>
                    <th style={{padding: "10px 8px", textAlign: "left", color: "#94a3b8", fontWeight: 500}}>Settlement</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length > 0 ? list.map(c => (
                    <tr key={c.name} style={{borderBottom: "1px solid rgba(148, 163, 184, 0.05)"}}>
                      <td style={{padding: "10px 8px", color: "#f1f5f9", fontWeight: 500}}>{c.name}</td>
                      {grouped.mode === "host" && <td style={{padding: "10px 8px", color: "#cbd5e1"}}>L{c.layer}</td>}
                      <td style={{padding: "10px 8px", color: "#cbd5e1", textTransform: "capitalize"}}>{c.rollupType}</td>
                      <td style={{padding: "10px 8px", color: "#cbd5e1"}}>{c.nativeCurrency}</td>
                      <td style={{padding: "10px 8px", color: "#cbd5e1", textTransform: "capitalize"}}>
                        {c.layer === 3 ? (c.settlementFamily || "other") : "ethereum"}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={grouped.mode === "host" ? 5 : 4} style={{padding: "20px 8px", textAlign: "center", color: "#64748b"}}>
                        No chains found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}