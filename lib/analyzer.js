const codes = require("./rules/codes");
const labels = require("./labels");

const SENSOR_HINTS = [
  { match: /(map|maf|tps|ect|iat|ckp|cmp|o2|lambda|sensor|sonda)/i, area: "Sensores" },
  { match: /(injetor|injector|combustivel|fuel|bomba|pressao.*combust)/i, area: "Combustível" },
  { match: /(vela|spark|bobina|coil|ignicao|ignition|misfire|falha.*ign)/i, area: "Ignição" },
  { match: /(can|lin|barramento|rede|modulo|module)/i, area: "Rede" },
  { match: /(tensao|voltage|bateria|alimenta|massa|ground|fusivel|rele|relé)/i, area: "Elétrico" }
];

function analyze(parsed) {
  const findings = [];
  const dtcs = parsed.dtcs || [];

  dtcs.forEach((code) => {
    const entry = codes.find(code);
    if (entry) {
      findings.push({
        type: "dtc",
        ref: code,
        severity: severityFromCode(code),
        title: softenTitle(entry.desc),
        code,
        area: entry.area,
        detail: `Lido no arquivo como código ${code}.`,
        causes: entry.causes,
        tests: entry.tests,
        evidence: "suspeita_automatica"
      });
    } else {
      findings.push({
        type: "dtc",
        ref: code,
        severity: "media",
        title: `Código ${code} sem descrição na base`,
        code,
        area: "Geral",
        detail: "O código foi lido no arquivo, mas não temos a descrição dele. Consulte a tabela do fabricante do veículo.",
        causes: ["Consultar a documentação do veículo"],
        tests: ["Conferir o código novamente no scanner"],
        evidence: "suspeita_automatica"
      });
    }
  });

  const metrics = parsed.metrics || {};
  Object.entries(metrics).forEach(([key, value]) => {
    const rule = matchMetric(key, value);
    if (rule) findings.push(rule);
  });

  if (dtcs.length === 0 && findings.length === 0) {
    findings.push({
      type: "info",
      ref: "no_data",
      severity: "info",
      title: "Nada de errado encontrado nos dados",
      area: "Geral",
      detail: "O arquivo não trouxe códigos de falha nem leituras fora do padrão. Use a seção de testes físicos para completar a avaliação.",
      causes: [],
      tests: [],
      evidence: "sem_evidencia"
    });
  }

  return findings;
}

function softenTitle(desc) {
  return desc
    .replace(/\s*-\s*circuito aberto$/i, " com o fio rompido")
    .replace(/\s*-\s*circuito em curto$/i, " em curto")
    .replace(/\s*-\s*circuito$/i, " com problema no circuito")
    .replace(/\s*-\s*erro de verificação$/i, " com erro de verificação")
    .trim();
}

function matchMetric(key, value) {
  const k = key.toLowerCase();
  if (typeof value !== "number") return null;
  const reading = labels.labelOf(key);

  const rules = [
    { test: /rpm|rotacao|engine_speed/.test(k) && value > 9000, severity: "alta", title: "Rotação acima do que o motor suporta", detail: `A leitura mostra ${value} rotações por minuto. Pode ser ruído no sensor de rotação ou fiação com problema.`, tests: ["Observar o sinal do sensor de rotação no osciloscópio"] },
    { test: /temperatura.*(motor|agua|ect)|coolant_temp|temp_motor/.test(k) && value > 118, severity: "alta", title: "Motor quente demais", detail: `A leitura mostra ${value} °C. Pode ser problema no sensor, no radiador ou no líquido de arrefecimento.`, tests: ["Conferir a temperatura do sensor com um termômetro de bancada", "Verificar o nível e o funcionamento do radiador"] },
    { test: /temperatura.*(motor|agua|ect)|coolant_temp|temp_motor/.test(k) && value < -40, severity: "media", title: "Sensor de temperatura sem resposta", detail: `A leitura mostra ${value} °C, o que indica sensor desconectado ou fiação cortada.`, tests: ["Medir a resistência do sensor", "Conferir o conector e os fios"] },
    { test: isSupplyVoltage(k) && value > 0 && value < 11.5, severity: "alta", title: "Tensão baixa na alimentação da central", detail: `A leitura mostra ${value} V. Com tensão baixa a central pode reiniciar ou funcionar de forma instável.`, tests: ["Medir a bateria parada e com o motor ligado", "Verificar os cabos de massa da central"] },
    { test: /5v|trilho.*5|rail.*5/.test(k) && (value < 4.75 || value > 5.25), severity: "alta", title: "Alimentação de 5 V fora do padrão", detail: `A leitura mostra ${value} V. Um sensor em curto ou um fio rompido pode estar derrubando essa tensão.`, tests: ["Medir com todos os sensores desconectados", "Procurar algum sensor com curto"] },
    { test: /pressao.*(coletor|map)|map_pressure/.test(k) && value > 105 && value < 400, severity: "baixa", title: "Pressão do coletor parece fora de escala", detail: `A leitura é ${value}. Pode estar em outra unidade (kPa em vez de hPa). Confira antes de concluir.`, tests: ["Confirmar a unidade usada na leitura"] },
    { test: /(map|maf).*(fluxo|flow)/.test(k) && value === 0, severity: "media", title: "Sensor de fluxo de ar sem leitura", detail: "O sensor de fluxo retornou zero, o que aponta para desconexão ou curto.", tests: ["Verificar o conector do sensor", "Medir a tensão do sinal"] },
    { test: /misfire|falha_ignicao|contador.*falha/.test(k) && value > 0, severity: "alta", title: "Falhas de ignição registradas", detail: `A central registrou ${value} episódios de falha de ignição.`, tests: ["Conferir velas e bobinas", "Medir a compressão do motor"] },
    { test: /fuel.*trim|trim.*combustivel|correcao.*combust/.test(k) && Math.abs(value) > 25, severity: "alta", title: "Mistura de ar e combustível corrigida ao limite", detail: `A correção chegou a ${value}%. Isso costuma indicar vazamento de ar ou bomba de combustível fraca.`, tests: ["Procurar vazamentos de ar no motor", "Medir a pressão da linha de combustível"] }
  ];

  const hit = rules.find((r) => r.test);
  if (!hit) return null;

  return {
    type: "metric",
    ref: key,
    severity: hit.severity,
    title: hit.title,
    area: areaOf(key),
    detail: `${hit.detail} Leitura usada: ${reading} = ${value}.`,
    causes: [],
    tests: hit.tests,
    evidence: "suspeita_automatica"
  };
}

function isSupplyVoltage(key) {
  const supply = /(bateria|battery|tensao.*alimenta|alimentacao.*tensao|supply_voltage|voltage_ecu|ecu_voltage|tensao_ecu|tensao_sistema)/.test(key);
  const sensorSignal = /(o2|lambda|tps|map|maf|ect|iat|ckp|cmp|sensor|sonda|sinal|signal|trilho|rail|5v|12v|pressao)/.test(key);
  return supply && !sensorSignal;
}

function areaOf(key) {
  const hit = SENSOR_HINTS.find((h) => h.match.test(key));
  return hit ? hit.area : "Geral";
}

function severityFromCode(code) {
  const area = codes.find(code)?.area || "Geral";
  if (area === "Central" || area === "Segurança") return "alta";
  if (/^P03/.test(code) || /^P02/.test(code)) return "alta";
  if (/^P06/.test(code) || /^U/.test(code)) return "alta";
  if (area === "Sensores" || area === "Elétrico") return "media";
  return "media";
}

module.exports = { analyze };
