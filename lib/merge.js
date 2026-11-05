const severityOrder = { alta: 0, media: 1, baixa: 2, info: 3 };

function keyOf(finding) {
  if (finding.type === "dtc") return `dtc:${finding.ref}`;
  return `${finding.type}:${finding.ref}`;
}

function merge(autoFindings, manualFindings) {
  const map = new Map();

  autoFindings.forEach((f) => map.set(keyOf(f), { ...f, sources: ["automatico"] }));

  manualFindings.forEach((f) => {
    const k = keyOf(f);
    if (map.has(k)) {
      const existing = map.get(k);
      existing.sources.push("manual");
      existing.evidence = "confirmado_por_teste_fisico";
      if (f.detail && !existing.detail.includes(f.detail)) existing.detail += ` ${f.detail}`;
      if (f.severity === "alta") existing.severity = "alta";
    } else {
      map.set(k, { ...f, sources: ["manual"] });
    }
  });

  const merged = [...map.values()].map((f) => ({
    ...f,
    confidence: confidenceOf(f),
    priority: priorityOf(f)
  }));

  merged.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.priority - a.priority);

  return merged;
}

function confidenceOf(finding) {
  if (finding.sources.includes("manual") && finding.sources.includes("automatico")) return "alta";
  if (finding.sources.includes("manual")) return "media";
  if (finding.type === "dtc") return "media";
  return "baixa";
}

function priorityOf(finding) {
  let score = 0;
  if (finding.sources.includes("manual")) score += 3;
  if (finding.sources.includes("automatico")) score += 2;
  if (finding.type === "dtc") score += 1;
  return score;
}

function groupByArea(findings) {
  return findings.reduce((acc, f) => {
    const area = f.area || "Geral";
    if (!acc[area]) acc[area] = [];
    acc[area].push(f);
    return acc;
  }, {});
}

module.exports = { merge, groupByArea };
