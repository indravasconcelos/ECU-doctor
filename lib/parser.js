const DTC_PATTERN = /[PBCU]\d{4}/gi;
const PAIR_PATTERN = /([A-Za-zÀ-ÿ0-9_ ./-]{2,60})\s*[:=]\s*(-?\d+(?:[.,]\d+)?)/g;

function detectFormat(buffer, filename) {
  const name = (filename || "").toLowerCase();
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".csv") || name.endsWith(".txt")) return name.endsWith(".csv") ? "csv" : "text";
  const head = buffer.slice(0, 64).toString("utf8").trim();
  if (head.startsWith("{") || head.startsWith("[")) return "json";
  if (head.includes(";") || (head.includes(",") && head.split(",").length > head.split(":").length)) return "csv";
  return "text";
}

function normalizeKey(key) {
  return key
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function pushPair(target, key, value) {
  const k = normalizeKey(key);
  const n = Number(String(value).replace(",", "."));
  if (!k) return;
  if (Number.isFinite(n)) {
    target[k] = n;
  } else if (!(k in target)) {
    target[k] = String(value).trim();
  }
}

function parseJson(buffer) {
  const raw = JSON.parse(buffer.toString("utf8"));
  const items = Array.isArray(raw) ? raw : [raw];
  const metrics = {};
  const dtcs = [];
  let vehicle = {};
  let freezeFrame = {};

  items.forEach((item) => {
    if (!item || typeof item !== "object") return;
    Object.entries(item).forEach(([key, value]) => {
      const k = normalizeKey(key);
      if (Array.isArray(value)) {
        if (k.includes("dtc") || k.includes("codigo") || k.includes("code")) {
          value.forEach((v) => {
            const found = String(v).match(DTC_PATTERN);
            if (found) found.forEach((c) => dtcs.push(c.toUpperCase()));
          });
        } else if (k.includes("freeze") || k.includes("frame")) {
          Object.assign(freezeFrame, flatten(value));
        } else if (k === "pids" || k === "metrics" || k === "leituras") {
          Object.assign(metrics, flatten(value));
        } else {
          value.forEach((v) => {
            if (v && typeof v === "object") Object.assign(metrics, flatten(v));
            else if (typeof v === "number") metrics[k] = v;
          });
        }
      } else if (value && typeof value === "object") {
        if (k.includes("vehicle") || k.includes("veiculo") || k.includes("carro")) vehicle = { ...vehicle, ...flatten(value) };
        else if (k.includes("freeze")) freezeFrame = { ...freezeFrame, ...flatten(value) };
        else Object.assign(metrics, flatten(value));
      } else if (typeof value === "string" && DTC_PATTERN.test(value)) {
        value.match(DTC_PATTERN).forEach((c) => dtcs.push(c.toUpperCase()));
        DTC_PATTERN.lastIndex = 0;
      } else if (typeof value === "number" || typeof value === "string") {
        if (k.includes("dtc") || k.includes("codigo") || k.includes("fault")) return;
        if (k.includes("vin") || k.includes("marca") || k.includes("modelo") || k.includes("ano") || k.includes("placa")) vehicle[k] = value;
        else pushPair(metrics, key, value);
      }
    });
  });

  return { dtcs: dedupe(dtcs), metrics, vehicle, freezeFrame };
}

function flatten(obj, prefix = "", out = {}) {
  Object.entries(obj).forEach(([key, value]) => {
    const k = prefix ? `${prefix}.${normalizeKey(key)}` : normalizeKey(key);
    if (value && typeof value === "object" && !Array.isArray(value)) flatten(value, k, out);
    else if (Array.isArray(value)) value.forEach((v, i) => (typeof v === "object" ? flatten(v, `${k}_${i}`, out) : (out[`${k}_${i}`] = v)));
    else out[k] = value;
  });
  return out;
}

function detectDelimiter(lines) {
  const candidates = [";", ",", "\t", "|"];
  let best = ",";
  let bestScore = -1;

  candidates.forEach((d) => {
    const counts = lines.slice(0, 12).map((l) => l.split(d).length);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, c) => a + (c - avg) ** 2, 0) / counts.length;
    const score = avg > 1 ? avg - variance : -1;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  });

  return best;
}

function looksLikeHeader(cells) {
  const normalized = cells.map((c) => normalizeKey(c));
  const hasText = normalized.some((c) => /[a-z]/.test(c));
  const allNumeric = cells.every((c) => Number.isFinite(Number(String(c).replace(",", "."))));
  return hasText && !allNumeric;
}

function isVehicleKey(key) {
  return /^(vin|placa|plate|marca|brand|modelo|model|ano|year|motor|engine|chassi|chassis)$/.test(key);
}

const HEADER_WORDS = ["modelo", "marca", "ano", "placa", "vin", "motor", "chassi", "parameter", "value", "codigo", "nome", "label", "key", "id", "param", "leitura", "valor", "unit", "unidade"];

function parseCsv(buffer) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const metrics = {};
  const dtcs = [];
  const vehicle = {};

  if (!lines.length) return { dtcs: [], metrics, vehicle, freezeFrame: {} };

  const delimiter = detectDelimiter(lines);
  const rows = lines.map((l) => l.split(delimiter));
  const uniform = rows.every((r) => r.length === rows[0].length);

  if (uniform && rows[0].length >= 2 && looksLikeHeader(rows[0])) {
    const headers = rows[0].map((h) => normalizeKey(h));
    rows.slice(1).forEach((cells) => {
      headers.forEach((h, i) => {
        const v = cells[i];
        if (v === undefined || v === "" || !h) return;
        if (DTC_PATTERN.test(v)) {
          v.match(DTC_PATTERN).forEach((c) => dtcs.push(c.toUpperCase()));
        } else if (isVehicleKey(h)) {
          vehicle[h] = v.trim();
        } else {
          pushPair(metrics, h, v);
        }
        DTC_PATTERN.lastIndex = 0;
      });
    });
  } else {
    rows.forEach((cells) => {
      if (cells.length >= 2) {
        const key = normalizeKey(cells[0]);
        const value = cells[1];
        if (DTC_PATTERN.test(value)) {
          value.match(DTC_PATTERN).forEach((c) => dtcs.push(c.toUpperCase()));
        } else if (Number.isFinite(Number(String(value).replace(",", ".")))) {
          pushPair(metrics, key, value);
        } else if (isVehicleKey(key) && !HEADER_WORDS.includes(String(value).trim().toLowerCase())) {
          vehicle[key] = value.trim();
        }
        DTC_PATTERN.lastIndex = 0;
      }
    });
  }

  if (!dtcs.length) text.match(DTC_PATTERN)?.forEach((c) => dtcs.push(c.toUpperCase()));

  return { dtcs: dedupe(dtcs), metrics, vehicle, freezeFrame: {} };
}

function parseText(buffer) {
  const text = buffer.toString("utf8");
  const dtcs = [];
  const metrics = {};
  collectFromText(text, dtcs, metrics);
  return { dtcs: dedupe(dtcs), metrics, vehicle: {}, freezeFrame: {} };
}

function collectFromText(text, dtcs, metrics) {
  text.match(DTC_PATTERN)?.forEach((c) => dtcs.push(c.toUpperCase()));
  DTC_PATTERN.lastIndex = 0;
  let match;
  PAIR_PATTERN.lastIndex = 0;
  while ((match = PAIR_PATTERN.exec(text)) !== null) {
    const isDtc = DTC_PATTERN.test(match[0]);
    DTC_PATTERN.lastIndex = 0;
    if (isDtc) continue;
    pushPair(metrics, match[1], match[2]);
  }
}

function dedupe(list) {
  return [...new Set(list.map((c) => c.toUpperCase()))];
}

function parse(buffer, filename) {
  const format = detectFormat(buffer, filename);
  let result;
  if (format === "json") result = parseJson(buffer);
  else if (format === "csv") result = parseCsv(buffer);
  else result = parseText(buffer);

  const metrics = result.metrics;
  const availableKeys = Object.keys(metrics);
  const missing = inferMissing(availableKeys, result.dtcs);

  return {
    format,
    filename,
    dtcs: result.dtcs,
    metrics,
    vehicle: result.vehicle,
    freezeFrame: result.freezeFrame,
    availableKeys,
    missing
  };
}

function inferMissing(keys, dtcs) {
  const groups = [
    { id: "alimentacao", label: "Tensões de alimentação", has: ["tensao_bateria", "bateria_tensao", "voltage", "volt", "ecu_voltage", "supply_voltage", "alimentacao"] },
    { id: "sensores", label: "Leituras de sensores", has: ["temperatura", "temperature", "temp", "pressao", "pressure", "rpm", "map", "maf", "tps", "o2", "lambda"] },
    { id: "combustivel", label: "Sistema de combustível", has: ["pressao_combustivel", "fuel_pressure", "injetor", "injector", "combustivel"] },
    { id: "ignicao", label: "Sistema de ignição", has: ["vela", "spark", "ignicao", "ignition", "bobina", "coil"] },
    { id: "freeze_frame", label: "Freeze frame (foto do defeito)", has: [] },
    { id: "dtcs", label: "Códigos de falha (DTC)", has: [] }
  ];

  const normalizedKeys = keys.map((k) => k.toLowerCase());
  const missing = [];

  groups.forEach((group) => {
    if (group.id === "dtcs") {
      if (dtcs.length === 0) missing.push({ id: group.id, label: group.label });
      return;
    }
    if (group.id === "freeze_frame") {
      if (normalizedKeys.length === 0) missing.push({ id: group.id, label: group.label });
      return;
    }
    const found = group.has.some((needle) => normalizedKeys.some((k) => k.includes(needle)));
    if (!found) missing.push({ id: group.id, label: group.label });
  });

  return missing;
}

module.exports = { parse, detectFormat, normalizeKey };
