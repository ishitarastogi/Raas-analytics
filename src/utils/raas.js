// src/utils/raas.js
export const RAAS = [
  "caldera",
  "gelato-raas",
  "conduit",
  "altlayer-raas",
  "alchemy",
];

// Heuristic: derive provider from explorer URL or hostedBy string
export function detectRaasProvider(explorers = [], chainName = "") {
  const url = String(explorers?.[0]?.url || "").toLowerCase();
  const hosted = String(explorers?.[0]?.hostedBy || "").toLowerCase();

  // 1) Trust explicit hostedBy when it’s one of the RaaS
  if (RAAS.includes(hosted)) return hosted;

  // 2) URL heuristics
  if (url.includes("conduit.xyz") || url.includes(".t.conduit.xyz"))
    return "conduit";
  if (url.includes("calderaexplorer.xyz")) return "caldera";
  if (url.includes("alt.technology") || url.includes("altlayer"))
    return "altlayer-raas";
  if (url.includes("alchemy.com")) return "alchemy";
  if (url.includes("gelato")) return "gelato-raas";

  // 3) Some well-known Conduit chains by name (safety net)
  const name = String(chainName).toLowerCase();
  const CONDUIT_NAMES = [
    "aevo",
    "orderly",
    "mode",
    "derive",
    "dia lasernet",
    "proof of play",
    "proof of play apex",
    "perennial",
    "reya",
  ];
  if (CONDUIT_NAMES.some((n) => name.includes(n))) return "conduit";

  return null; // unknown / not RaaS
}

export const COLORS = {
  bg: "#0b1118",
  card: "#0f1722",
  border: "#1b2432",
  text: "#c8d1e1",
  sub: "#92a0b5",
  brand: "#86e1ff",
};

// consistent colors per raas for charts
export const RAAS_COLOR = {
  caldera: "#66b3ff",
  "gelato-raas": "#c26fff",
  conduit: "#6ae3c0",
  "altlayer-raas": "#ffa24d",
  alchemy: "#49d2d0",
};
