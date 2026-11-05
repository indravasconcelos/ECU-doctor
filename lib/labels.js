const terms = {
  misfire: "falha de ignição",
  trilho: "linha de tensão",
  freeze_frame: "registro no momento da falha",
  eec: "central da ECU",
  ecu: "central",
  ckp: "sensor de posição do virabrequim (CKP)",
  cmp: "sensor do comando de válvulas (CMP)",
  maf: "sensor de fluxo de ar (MAF)",
  map: "sensor de pressão do coletor (MAP)",
  tps: "sensor da borboleta (TPS)",
  ect: "sensor de temperatura do motor (ECT)",
  iat: "sensor de temperatura do ar de admissão (IAT)",
  o2: "sonda lambda",
  lambda: "sonda lambda",
  dtc: "código de falha",
  driver: "circuito de comando",
  rail: "linha de tensão",
  pwm: "sinal pulsado",
  crc: "verificação de dados",
  rom: "memória da central",
  ram: "memória temporária da central",
  can: "rede de comunicação (CAN)",
  bdm: "modo de bancada",
  idle: "marcha lenta",
  fuel_trim: "correção de mistura",
  spark: "ignição",
  coil: "bobina",
  injector: "injetor",
  battery: "bateria",
  voltage: "tensão",
  pressure: "pressão",
  temperature: "temperatura",
  resistance: "resistência",
  ground: "massa",
  power: "alimentação",
  circuit: "circuito",
  open: "aberto",
  short: "curto",
  sensor: "sensor",
  solenoid: "eletroválvula",
  relay: "relé",
  fuse: "fusível",
  harness: "chicote",
  connector: "conector",
  waveform: "forma de onda",
  oscilloscope: "osciloscópio",
  multimeter: "multímetro",
  cylinder: "cilindro",
  crankshaft: "virabrequim",
  camshaft: "comando de válvulas",
  catalytic: "catalisador",
  evap: "vapores de combustível",
  egr: "recirculação de gases (EGR)",
  airbag: "airbag",
  transmission: "câmbio",
  throttle: "borboleta",
  pump: "bomba",
  filter: "filtro",
  plug: "vela",
  glow: "pré-aquecimento",
  injector: "injetor",
  leak: "vazamento",
  corr: "correção",
  count: "contador",
  value: "valor",
  temp: "temperatura",
  speed: "velocidade",
  rpm: "rotação",
  airflow: "fluxo de ar",
  misf: "falha de ignição",
  integ: "integridade",
  pos: "posição",
  sig: "sinal",
  sup: "alimentação",
  bat: "bateria",
  eng: "motor",
  veh: "veículo",
  sys: "sistema",
  comp: "componente",
  perf: "desempenho",
  emis: "emissões",
  ign: "ignição",
  fuel: "combustível",
  refrig: "arrefecimento",
  lubr: "lubrificação",
  turbo: "turbo",
  boost: "pressurização",
  abs: "travamento (ABS)",
  esp: "estabilidade",
  srs: "airbag",
  immobilizer: "antipartida",
  key: "chave",
  transponder: "transponder",
  checksum: "verificação de integridade",
  flash: "memória da central",
  eeprom: "memória de ajustes",
  boot: "modo de inicialização",
  bench: "bancada",
  obd: "conector de diagnóstico",
  immobil: "antipartida",
  immobiliser: "antipartida",
  variant: "versão",
  family: "família",
  protocol: "protocolo",
  file: "arquivo",
  read: "leitura",
  write: "gravação",
  backup: "cópia de segurança",
  original: "original",
  modified: "modificado",
  stage: "etapa",
  tune: "preparação",
  remap: "reprogramação",
  dpf: "filtro de partículas",
  gpf: "filtro de partículas",
  adblue: "AdBlue",
  urea: "uréia",
  nox: "óxidos de nitrogênio",
  soot: "fuligem",
  regen: "regeneração",
  diff: "diferença",
  speed: "velocidade",
  rpm: "rotação",
  coolant: "líquido de arrefecimento",
  intake: "admissão",
  exhaust: "escapamento",
  ambient: "ambiente",
  battery_voltage: "tensão da bateria",
  supply_voltage: "tensão de alimentação",
  fuel_pressure: "pressão do combustível",
  oil_pressure: "pressão do óleo",
  oil_temp: "temperatura do óleo",
  intake_temp: "temperatura de admissão",
  exhaust_temp: "temperatura de escapamento",
  coolant_temp: "temperatura do motor",
  engine_speed: "rotação do motor",
  vehicle_speed: "velocidade do veículo",
  throttle_pos: "posição da borboleta",
  maf_airflow: "fluxo de ar do MAF",
  lambda_voltage: "tensão da sonda lambda",
  battery_current: "corrente da bateria",
  charging_voltage: "tensão de carga",
  misfire_count: "falhas de ignição",
  injector_time: "tempo de abertura do injetor",
  boost_pressure: "pressão de turbocompressão",
  rail_pressure: "pressão da linha de combustível",
  injection_time: "tempo de injeção",
  ignition_advance: "avanço de ignição",
  lambda1: "sonda lambda dianteira",
  lambda2: "sonda lambda traseira",
  cyl1: "cilindro 1",
  cyl2: "cilindro 2",
  cyl3: "cilindro 3",
  cyl4: "cilindro 4",
  bank1: "banco 1",
  bank2: "banco 2"
};

function normalize(key) {
  return String(key)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function labelOf(key) {
  const clean = normalize(key);
  if (terms[clean]) return capitalize(terms[clean]);

  const parts = clean.split("_").filter((p) => p && p !== "de" && p !== "do" && p !== "da" && p !== "em" && p !== "com");
  const translated = parts.map((p) => terms[p] || p.replace(/^(count|num|val)_/, ""));
  const joined = translated.join(" ").replace(/\s+/g, " ").trim();
  return capitalize(joined);
}

function humanize(key) {
  const clean = normalize(key);
  return capitalize(clean.replace(/_/g, " "));
}

function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function apply(text) {
  if (!text || typeof text !== "string") return text;
  let out = text;
  const keys = Object.keys(terms)
    .filter((k) => k.length > 2)
    .sort((a, b) => b.length - a.length);
  keys.forEach((k) => {
    const re = new RegExp(`\\b${k}\\b`, "gi");
    out = out.replace(re, terms[k]);
  });
  out = out
    .replace(/\bisso\s+glitchy\b/gi, "com falha")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .trim();
  return capitalize(out);
}

function severityLabel(severity) {
  return { alta: "Grave", media: "Média", baixa: "Leve", info: "Informativo" }[severity] || severity;
}

function confidenceLabel(confidence) {
  return { alta: "Confirmado", media: "Provável", baixa: "Em avaliação", info: "" }[confidence] || confidence;
}

function statusText(status, count) {
  if (status === "ok") return "Nenhum problema encontrado nos dados enviados.";
  if (status === "critico") return `Encontramos ${count} possíveis problemas. Comece pelos mais graves.`;
  return `Encontramos ${count} possíveis problemas. Confirme com os testes indicados.`;
}

module.exports = { labelOf, humanize, apply, severityLabel, confidenceLabel, statusText, terms };
