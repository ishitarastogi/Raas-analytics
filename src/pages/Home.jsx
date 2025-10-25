import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import LaunchTimeline from "../components/LaunchTimeline";
import TxByRaaS from "../components/TxByRaaS";
import Leaderboard from "../components/Leaderboard";
import Footer from "../components/Footer";
import CHAINS from "../data/chains";

/* Fetch total tx + avg block time per chain (client-side).
   In production: use a tiny proxy to avoid CORS. */
async function fetchTotals(chains) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const list = await Promise.all(
      chains.map(async (c, i) => {
        let totalTx = null;
        let avgBlockTimeMs = null;
        if (c.statsUrl) {
          try {
            const r = await fetch(c.statsUrl, { signal: controller.signal });
            if (r.ok) {
              const j = await r.json();
              if (j && typeof j.total_transactions !== "undefined") {
                const val = Number(j.total_transactions);
                totalTx = Number.isFinite(val) ? val : null;
              }
              if (j && typeof j.average_block_time !== "undefined") {
                avgBlockTimeMs = Number(j.average_block_time);
              }
            }
          } catch {
            // leave nulls
          }
        }
        return { ...c, id: `${c.name}-${i}`, totalTx, avgBlockTimeMs };
      })
    );
    return list;
  } finally {
    clearTimeout(timeout);
  }
}

export default function HomePage(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const enriched = await fetchTotals(CHAINS);
        setRows(enriched);
      } catch (e) {
        setErr("Some stats endpoints blocked the browser (CORS). Use a small server proxy for perfect data.");
        setRows(CHAINS.map((c, i) => ({ ...c, id: `${c.name}-${i}`, totalTx: null, avgBlockTimeMs: null })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <Header />
      {err && (
        <div className="container" style={{ paddingTop: 12 }}>
          <div className="card" style={{ borderStyle: "dashed" }}>
            <div className="kicker">Heads up</div>
            <div className="sub" style={{ marginTop: 6 }}>{err}</div>
          </div>
        </div>
      )}

      {/* Scatter */}
      {loading ? (
        <div className="container section">
          <div className="skel" />
        </div>
      ) : (
        <LaunchTimeline chains={rows.length ? rows : CHAINS} />
      )}

      {/* Bar */}
      {loading ? (
        <div className="container section">
          <div className="skel" />
        </div>
      ) : (
        <TxByRaaS enriched={rows} />
      )}

      {/* Leaderboard */}
      {loading ? (
        <div className="container section">
          <div className="skel" />
        </div>
      ) : (
        <Leaderboard enriched={rows} />
      )}

      <Footer />
    </>
  );
}
