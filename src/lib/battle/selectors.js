// src/lib/battle/selectors.js
import COLORS from "../../data/raasColors";

/** Input: chains[] from chains.json (your sheet) */
export function byCategoryRaaS(chains, category, metricKey) {
  // return [{ raas: "Caldera", value: 123, color: COLORS.Caldera }, ...]
  return [];
}

export function byRollupStack(chains, metricKey) {
  // return:
  // [{ stack: "Optimism", items: [{ raas:"Caldera", value, color }, ...] }, ...]
  return [];
}

export function performanceByRaaS(chains) {
  // return map: { raas: { totalTx, activeAddr, avgBlock }, color }
  return {};
}

export function developerByRaaS(chains) {
  // return [{ raas, totalGas, contracts, color }]
  return [];
}

export function altDAShareByRaaS(chains) {
  // return [{ raas, parts: { ethereum: n, celestia:n, eigenDA:n, avail:n, others:n }, color }]
  return [];
}

export function countByRaaS(chains, { last90Days = false } = {}) {
  // return [{ raas, count, color }]
  return [];
}

export function l2vsl3ByRaaS(chains) {
  // return [{ raas, l2: n, l3: n, color }]
  return [];
}

export function l3SettlementByRaaS(chains) {
  // return [{ raas, arbitrum:n, base:n, optimism:n, others:n, color }]
  return [];
}

export function tokenVsEthByRaaS(chains) {
  // return [{ raas, eth:n, token:n, color }]
  return [];
}
