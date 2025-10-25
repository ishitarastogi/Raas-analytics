// src/services/normalize.js
// Utilities to normalize Blockscout "chains" API into what we need.

export const RAAS_KEYS = [
  "caldera",
  "gelato-raas",
  "conduit",
  "altlayer-raas",
  "alchemy",
];

// Infer a RaaS provider from explorers[].hostedBy or URL domain.
export function inferRaaS(explorers = []) {
  const first = explorers?.[0] || {};
  const hosted = String(first.hostedBy || "").toLowerCase();

  // If Blockscout already supplies hostedBy (caldera, conduit, altlayer-raas, gelato-raas, alchemy), prefer it.
  if (RAAS_KEYS.includes(hosted)) return hosted;

  const url = String(first.url || "").toLowerCase();
  if (url.includes("caldera")) return "caldera";
  if (url.includes("conduit.xyz")) return "conduit";
  if (url.includes("alt.technology") || url.includes("altlayer"))
    return "altlayer-raas";
  if (url.includes("alchemy.com")) return "alchemy";
  if (url.includes("gelato") || url.includes("arena-z.gg"))
    return "gelato-raas";

  return "unknown";
}

// Clean up rollup type label to match your naming.
export function normalizeRollupType(rollupType) {
  const v = String(rollupType || "other").toLowerCase();
  if (v === "optimistic") return "optimism";
  return v;
}

// Compute settlement family for L3, based on ecosystem tags.
export function settlementFamilyFromEcosystem(ecosystem, layer) {
  if (layer === 2) return "ethereum";
  if (layer !== 3) return null;

  const tags = Array.isArray(ecosystem)
    ? ecosystem
    : ecosystem
    ? [ecosystem]
    : [];
  const low = tags.map((t) => String(t).toLowerCase());
  if (low.some((t) => t.includes("arbitrum"))) return "arbitrum";
  if (low.some((t) => t.includes("base"))) return "base";
  if (low.some((t) => t.includes("optimism") || t.includes("superchain")))
    return "optimism";
  return "other";
}

// Optional: launch dates you’ve curated (extend anytime).
// Keyed by lower-cased chain name.
export const LAUNCH_MAP = new Map([
  ["aevo", "2023-06-14"],
  ["alienx", "2024-06-24"],
  ["ancient8 mainnet", "2024-02-22"],
  ["arena-z", "2024-09-04"],
  ["cheese chain", "2024-05-01"],
  ["conwai mainnet", "2024-12-11"],
  ["degen chain", "2024-12-11"],
  ["derive mainnet", "2023-12-15"],
  ["dia lasernet mainnet", "2024-11-26"],
  ["edgeless", "2024-03-28"],
  ["edu chain", "2024-08-29"],
  ["fluence", "2024-08-20"],
  ["ham", "2024-06-05"],
  ["huddle01 mainnet", "2024-09-23"],
  ["hychain", "2024-03-08"],
  ["inevm mainnet", "2024-04-24"],
  ["ink", "2024-10-24"],
  ["k2", "2025-01-01"],
  ["lisk", "2024-06-01"],
  ["lumia mainnet", "2024-02-28"],
  ["manta pacific", "2023-09-12"],
  ["mode", "2024-02-01"],
  ["molten", "2024-04-01"],
  ["muster network", "2023-11-07"],
  ["oev network", "2024-07-16"],
  ["orderly", "2024-01-22"],
  ["playnance playblock", "2024-03-01"],
  ["prom mainnet", "2024-03-16"],
  ["proof of play", "2024-02-22"],
  ["rari chain", "2024-01-24"],
  ["reya", "2024-04-01"],
  ["rivalz", "2024-08-20"],
  ["sanko nitro mainnet", "2024-05-19"],
  ["shape", "2024-09-30"],
  ["swell chain", "2024-03-13"],
  ["syndicate frame", "2024-02-15"],
  ["world chain", "2024-06-26"],
]);

// Stats endpoints for pulling total tx (extend freely).
export const STATS_ENDPOINTS = new Map([
  ["aevo", "https://explorer-aevo-mainnet-prod-0.t.conduit.xyz/api/v2/stats"],
  ["alienx", "https://api-explorer.alienxchain.io/api/v2/stats"],
  [
    "ancient8 mainnet",
    "https://explorer-ancient8-mainnet-0.t.conduit.xyz/api/v2/stats",
  ],
  ["arena-z", "https://explorer.arena-z.gg/api/v2/stats"],
  ["cheese chain", "https://cheesechain.calderaexplorer.xyz/api/v2/stats"],
  ["conwai mainnet", "https://conwai.calderaexplorer.xyz/api/v2/stats"],
  ["degen chain", "https://explorer.degen.tips/api/v2/stats"],
  [
    "derive mainnet",
    "https://explorer-lyra-mainnet-0.t.conduit.xyz/api/v2/stats",
  ],
  [
    "dia lasernet mainnet",
    "https://explorer-dia-lasernet-mainnet-n208gs8dc3.t.conduit.xyz/api/v2/stats",
  ],
  ["edgeless", "https://edgeless-mainnet.calderaexplorer.xyz/api/v2/stats"],
  ["edu chain", "https://educhain.blockscout.com/api/v2/stats"],
  ["fluence", "https://blockscout.mainnet.fluence.dev/api/v2/stats"],
  ["ham", "https://ham.calderaexplorer.xyz/api/v2/stats"],
  ["huddle01 mainnet", "https://huddle01.calderaexplorer.xyz/api/v2/stats"],
  ["hychain", "https://hychain.calderaexplorer.xyz/api/v2/stats"],
  ["inevm mainnet", "https://inevm.calderaexplorer.xyz/api/v2/stats"],
  ["ink", "https://explorer.inkonchain.com/api/v2/stats"],
  ["k2", "https://karak.calderaexplorer.xyz/api/v2/stats"],
  ["lisk", "https://blockscout.lisk.com/api/v2/stats"],
  ["lumia mainnet", "https://explorer.lumia.org/api/v2/stats"],
  ["manta pacific", "https://manta-pacific.calderaexplorer.xyz/api/v2/stats"],
  ["mode", "https://explorer-mode-mainnet-0.t.conduit.xyz/api/v2/stats"],
  ["molten", "https://molten.calderaexplorer.xyz/api/v2/stats"],
  ["muster network", "https://muster-explorer.alt.technology/api/v2/stats"],
  ["oev network", "https://oev-network.calderaexplorer.xyz/api/v2/stats"],
  ["orderly", "https://explorer-orderly-mainnet-0.t.conduit.xyz/api/v2/stats"],
  ["playnance playblock", "https://explorer.playblock.io/api/v2/stats"],
  ["prom mainnet", "https://promscan.io/api/v2/stats"],
  [
    "proof of play",
    "https://explorer-proofofplay-boss-mainnet.t.conduit.xyz/api/v2/stats",
  ],
  ["rari chain", "https://rari.calderaexplorer.xyz/api/v2/stats"],
  ["reya", "https://explorer.reya.network/api/v2/stats"],
  ["rivalz", "https://rivalz.calderaexplorer.xyz/api/v2/stats"],
  [
    "sanko nitro mainnet",
    "https://sanko-mainnet.calderaexplorer.xyz/api/v2/stats",
  ],
  ["shape", "https://shapescan.xyz/api/v2/stats"],
  ["swell chain", "https://explorer.swellnetwork.io/api/v2/stats"],
  [
    "syndicate frame",
    "https://syndicate-frame.calderaexplorer.xyz/api/v2/stats",
  ],
  [
    "world chain",
    "https://worldchain-mainnet.explorer.alchemy.com/api/v2/stats",
  ],
]);

export function normalizeChain(raw) {
  const name = raw?.name || "";
  const layer = raw?.layer ?? null;
  const rollupType = normalizeRollupType(raw?.rollupType);
  const raas = inferRaaS(raw?.explorers);
  const settlementFamily = settlementFamilyFromEcosystem(raw?.ecosystem, layer);
  const nativeCurrency = String(raw?.native_currency || "OTHER").toUpperCase();

  const key = name.toLowerCase().trim();
  const launchISO = LAUNCH_MAP.get(key) || null;
  const statsUrl = STATS_ENDPOINTS.get(key) || null;

  return {
    name,
    key, // lower-case key
    layer,
    raas,
    rollupType,
    ecosystem: raw?.ecosystem,
    settlementFamily,
    nativeCurrency,
    isTestnet: !!raw?.isTestnet,
    logo: raw?.logo,
    launch: launchISO ? new Date(launchISO) : null,
    statsUrl,
  };
}
