const manual = require("./manual");
const analyzer = require("./analyzer");
const merge = require("./merge");
const labels = require("./labels");
const thresholds = require("./rules/thresholds");

function build(parsed, manualPayload) {
  const validation = manual.validate(manualPayload);

  const autoFindings = analyzer.analyze(parsed);
  const manualFindings = manual.evaluate(validation.values);
  const findings = merge.merge(autoFindings, manualFindings);

  const failures = findings.filter((f) => f.severity !== "info");
  const info = findings.filter((f) => f.severity === "info");

  const orientations = buildOrientations(failures, validation.values);
  const nextSteps = buildNextSteps(failures, parsed, validation.values);
  const byArea = merge.groupByArea(findings);

  return {
    generatedAt: new Date().toISOString(),
    summary: buildSummary(parsed, validation.values, failures),
    file: {
      filename: parsed.filename,
      format: parsed.format,
      dtcs: parsed.dtcs,
      metricCount: Object.keys(parsed.metrics).length
    },
    manual: {
      provided: Object.keys(validation.values).length,
      values: validation.values,
      readings: describeManual(validation.values),
      errors: validation.errors
    },
    failures,
    info,
    byArea,
    orientations,
    nextSteps
  };
}

function describeManual(values) {
  const readings = [];
  const fieldMap = new Map(thresholds.manualFields.map((f) => [f.id, f]));
  const scopeMap = new Map(thresholds.electrical.map((s) => [s.id, s]));
  const waveMap = new Map(thresholds.oscilloscope.map((s) => [s.id, s]));

  Object.entries(values).forEach(([id, value]) => {
    const field = fieldMap.get(id);
    const scope = scopeMap.get(id);
    const wave = waveMap.get(id);
    const label = field ? field.label : labels.labelOf(id);
    const unit = field ? field.unit : scope ? scope.unit : "";
    const shown = wave ? (value === "regular" ? "Normal" : "Anormal") : `${value} ${unit}`.trim();
    readings.push({ id, label, shown });
  });

  return readings;
}

function buildSummary(parsed, values, failures) {
  const confirmed = failures.filter((f) => f.sources.includes("manual")).length;
  const high = failures.filter((f) => f.severity === "alta").length;

  let status = "atencao";
  if (failures.length === 0) status = "ok";
  else if (high > 0) status = "critico";

  return {
    status,
    dtcCount: parsed.dtcs.length,
    metricCount: Object.keys(parsed.metrics).length,
    manualCount: Object.keys(values).length,
    failureCount: failures.length,
    confirmedCount: confirmed,
    highCount: high,
    headline: labels.statusText(status, failures.length)
  };
}

function buildOrientations(failures, values) {
  const confirmFirst = [];
  const stillMissing = [];
  const seen = new Set();

  failures.forEach((f) => {
    (f.tests || []).forEach((step) => {
      if (seen.has(step)) return;
      seen.add(step);
      confirmFirst.push({
        area: f.area || "Geral",
        step,
        confirmed: f.sources.includes("manual")
      });
    });
  });

  thresholds.electrical.forEach((spec) => {
    if (spec.id in values) return;
    stillMissing.push({
      area: groupOf(spec.id),
      step: spec.label
    });
  });

  thresholds.oscilloscope.forEach((spec) => {
    if (spec.id in values) return;
    stillMissing.push({
      area: "Osciloscópio",
      step: spec.label
    });
  });

  return {
    confirmFirst: groupList(confirmFirst),
    stillMissing: groupList(stillMissing)
  };
}

function groupOf(id) {
  const field = thresholds.manualFields.find((f) => f.id === id);
  return field ? field.group : "Outros";
}

function groupList(items) {
  const map = new Map();
  items.forEach((item) => {
    if (!map.has(item.area)) map.set(item.area, []);
    map.get(item.area).push(item);
  });
  return [...map.entries()].map(([area, list]) => ({ area, items: list }));
}

function shorten(title) {
  return title.replace(/\s*-\s*circuito.*/i, "").replace(/\s*\(.*?\)/g, "").trim();
}

function buildNextSteps(failures, parsed, values) {
  const steps = [];
  const critical = failures.filter((f) => f.severity === "alta");
  const confirmed = failures.filter((f) => f.sources.includes("manual"));

  if (critical.length) {
    const names = critical.slice(0, 3).map((f) => shorten(f.title));
    steps.push({ priority: 1, text: `Comece pela parte mais grave: ${names.join("; ")}.` });
  }

  if (parsed.dtcs.length) {
    steps.push({
      priority: 2,
      text: `Compare os ${parsed.dtcs.length} código(s) lidos (${parsed.dtcs.join(", ")}) com as medições que você fez.`
    });
  }

  if (confirmed.length) {
    steps.push({
      priority: 3,
      text: "Confirme com segurança as falhas que já bateram com o teste físico, antes de trocar qualquer peça."
    });
  }

  if (Object.keys(values).length < 5) {
    steps.push({
      priority: 4,
      text: "Complete os testes físicos ainda faltantes: alimentação, massa, tensões de 5 V e 12 V e os sinais no osciloscópio."
    });
  }

  const ecuRelated = failures.some((f) => f.area === "Central" || f.ref === "P0601" || f.ref === "P0606");
  if (ecuRelated) {
    steps.push({
      priority: 5,
      text: "Há sinal de problema na própria central: só mande reprogramar ou substituir com arquivo autorizado."
    });
  }

  steps.push({
    priority: 6,
    text: "Anotou, corrigiu, mediu de novo: refaça o teste para confirmar que os códigos sumiram."
  });

  if (!steps.some((s) => s.priority === 1) && !steps.some((s) => s.priority === 2)) {
    steps.unshift({
      priority: 0,
      text: "Não apareceu código nem valor fora do padrão: faça um teste com o carro rodando e capture os dados de novo antes de desmontar qualquer coisa."
    });
  }

  return steps.sort((a, b) => a.priority - b.priority);
}

module.exports = { build };
