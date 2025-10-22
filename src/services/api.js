const BLOCKSCOUT_API = "https://chains.blockscout.com/api/chains";

const normalizeEcosystem = (ecosystem) =>
  !ecosystem
    ? []
    : Array.isArray(ecosystem)
    ? ecosystem.filter(Boolean).map(String)
    : [String(ecosystem)];

const firstExplorerHost = (explorers) => {
  if (!Array.isArray(explorers) || explorers.length === 0) return "unknown";
  const found = explorers.find((e) => e?.hostedBy);
  return (found?.hostedBy || explorers[0]?.hostedBy || "unknown").toLowerCase();
};

const safeRollupType = (t) => (t ? String(t).toLowerCase() : "unspecified");

export async function fetchMainnetL2L3() {
  const res = await fetch(BLOCKSCOUT_API, { mode: "cors" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const obj = await res.json();
  const flat = Object.values(obj || {}).map((c) => ({
    id: c.id ?? c.chainId ?? c.name,
    name: c.name,
    description: c.description,
    logo: c.logo,
    ecosystems: normalizeEcosystem(c.ecosystem),
    isTestnet: Boolean(c.isTestnet),
    layer: Number(c.layer),
    rollupType: safeRollupType(c.rollupType),
    nativeCurrency: c.native_currency || c.nativeCurrency || "UNKNOWN",
    website: c.website,
    explorers: Array.isArray(c.explorers) ? c.explorers : [],
    explorerHost: firstExplorerHost(c.explorers),
    settlementLayerChainId: c.settlementLayerChainId || null,
  }));
  return flat.filter((x) => !x.isTestnet && (x.layer === 2 || x.layer === 3));
}
