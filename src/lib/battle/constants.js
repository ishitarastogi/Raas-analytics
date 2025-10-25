// src/lib/battle/constants.js
export const CATEGORIES = ["Gaming", "DeFi", "Infra", "Social", "NFT"];

export const CATEGORY_METRICS = [
  { value: "projectCount", label: "Project Count" },
  { value: "totalTx", label: "Total Tx Count" },
  { value: "avgTPS", label: "Average TPS" },
  { value: "tvl", label: "TVL" },
];

export const ROLLUP_METRICS = CATEGORY_METRICS; // same menu

export const PERFORMANCE_TABS = [
  { value: "totalTx", label: "Total Tx Count" },
  { value: "activeAddr", label: "Active Addresses" },
  { value: "avgBlock", label: "Avg Block Time" },
];
