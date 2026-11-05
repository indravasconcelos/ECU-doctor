const thresholds = require("./rules/thresholds");

function validate(payload) {
  const values = {};
  const errors = [];
  const input = payload && typeof payload === "object" ? payload : {};

  thresholds.manualFields.forEach((field) => {
    const raw = input[field.id];
    if (raw === undefined || raw === null || raw === "") return;

    if (field.type === "select") {
      const value = String(raw).toLowerCase();
      if (!field.options.includes(value)) {
        errors.push({ field: field.id, message: `${field.label}: opção inválida.` });
        return;
      }
      values[field.id] = value;
      return;
    }

    const value = Number(String(raw).replace(",", "."));
    if (!Number.isFinite(value)) {
      errors.push({ field: field.id, message: `${field.label}: informe um número válido.` });
      return;
    }
    if (value < 0) {
      errors.push({ field: field.id, message: `${field.label}: o valor não pode ser negativo.` });
      return;
    }
    values[field.id] = value;
  });

  return { values, errors };
}

function evaluate(values) {
  const findings = [];

  thresholds.electrical.forEach((spec) => {
    if (!(spec.id in values)) return;
    const value = values[spec.id];
    if (value < spec.min || value > spec.max) {
      findings.push({
        type: "manual_electrical",
        ref: spec.id,
        severity: severityOf(value, spec),
        title: `${spec.label}: fora do esperado`,
        area: "Testes físicos",
        detail: `Você mediu ${value} ${spec.unit}. O esperado é de ${spec.min} a ${spec.max} ${spec.unit}. ${value < spec.min ? spec.lowMsg : spec.highMsg}`,
        evidence: "confirmado_por_teste_fisico",
        value,
        unit: spec.unit
      });
    }
  });

  thresholds.oscilloscope.forEach((spec) => {
    const value = values[spec.id];
    if (!value) return;
    if (value !== spec.ok) {
      findings.push({
        type: "manual_oscilloscope",
        ref: spec.id,
        severity: "alta",
        title: `${spec.label} fora do padrão`,
        area: "Osciloscópio",
        detail: `O que apareceu no aparelho: ${spec.bad}.`,
        evidence: "confirmado_por_teste_fisico"
      });
    }
  });

  return findings;
}

function severityOf(value, spec) {
  const center = (spec.min + spec.max) / 2;
  const range = (spec.max - spec.min) / 2 || 1;
  const distance = Math.abs(value - center) / range;
  if (distance > 1.5) return "alta";
  if (distance > 0.75) return "media";
  return "baixa";
}

module.exports = { validate, evaluate };
