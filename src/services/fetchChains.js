// src/services/fetchChains.js
import { normalizeChain, RAAS_KEYS } from "./normalize";

export async function loadRaasChains() {
  const res = await fetch("https://chains.blockscout.com/api/chains");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  const all = Object.values(json).map(normalizeChain);

  // Only mainnets (L2/L3) hosted by one of your 5 RaaS
  const filtered = all
    .filter((c) => !c.isTestnet)
    .filter((c) => c.layer === 2 || c.layer === 3)
    .filter((c) => RAAS_KEYS.includes(c.raas));

  return filtered;
}

export async function enrichTotals(rows) {
  // Fetch total tx for each row that has statsUrl; tolerate CORS failures.
  const enriched = await Promise.all(
    rows.map(async (r) => {
      let totalTx = 0,
        totalAddresses = 0,
        avgBlock = 0;
      if (r.statsUrl) {
        try {
          const res = await fetch(r.statsUrl);
          if (res.ok) {
            const j = await res.json();
            totalTx = Number(j.total_transactions || 0);
            totalAddresses = Number(j.total_addresses || 0);
            avgBlock = Number(j.average_block_time || 0);
          }
        } catch (_) {}
      }
      return { ...r, totalTx, totalAddresses, avgBlock };
    })
  );
  return enriched;
}
