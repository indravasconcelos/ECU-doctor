const electrical = [
  { id: "battery_rest", label: "Tensão da bateria (com o motor desligado)", unit: "V", min: 12.4, max: 12.7, ideal: [12.6, 12.7], lowMsg: "Bateria descarregada ou com célula ruim.", highMsg: "Tensão alta demais, vale checar o carregador." },
  { id: "battery_load", label: "Tensão da bateria (com o motor ligado)", unit: "V", min: 13.8, max: 14.4, ideal: [13.9, 14.4], lowMsg: "O alternador não está carregando direito.", highMsg: "Tensão de carga alta, possível problema no regulador." },
  { id: "voltage_ecu", label: "Tensão que chega na central", unit: "V", min: 11.5, max: 14.5, ideal: [12.0, 14.4], lowMsg: "Tensão caindo na central: confira fusível, relé e cabos.", highMsg: "Tensão fora do padrão, pode ser o regulador." },
  { id: "ground_ecu", label: "Queda de tensão na massa da central", unit: "V", min: 0, max: 0.1, ideal: [0, 0.05], lowMsg: "", highMsg: "Massa da central oxidada ou mal apertada." },
  { id: "rail_5v", label: "Alimentação de 5 V dos sensores", unit: "V", min: 4.75, max: 5.25, ideal: [4.9, 5.1], lowMsg: "Fio rompido ou algum sensor com curto puxando a tensão.", highMsg: "O regulador de tensão da central está fora do padrão." },
  { id: "rail_12v", label: "Alimentação de 12 V dos acessórios", unit: "V", min: 11.5, max: 14.5, ideal: [12.0, 14.4], lowMsg: "Alimentação de 12 V instável, confira as conexões.", highMsg: "Tensão alta, vale checar o regulador." },
  { id: "fuel_pressure", label: "Pressão da linha de combustível", unit: "bar", min: 3.0, max: 4.5, ideal: [3.3, 4.0], lowMsg: "Pressão baixa: bomba, filtro ou regulador desgastados.", highMsg: "Pressão alta: regulador travado ou retorno entupido." },
  { id: "injector_resistance", label: "Resistência de um injetor", unit: "ohms", min: 11, max: 18, ideal: [12, 16], lowMsg: "Resistência baixa: possível curto dentro do injetor.", highMsg: "Resistência alta: bobina do injetor desgastada." },
  { id: "ignition_coil_resistance", label: "Resistência da bobina de ignição", unit: "ohms", min: 0.5, max: 3, ideal: [0.8, 2.0], lowMsg: "O lado de baixa tensão da bobina está em curto.", highMsg: "Fio interno da bobina rompido ou solda solta." },
  { id: "sensor_ckp_resistance", label: "Resistência do sensor de rotação", unit: "ohms", min: 700, max: 1800, ideal: [800, 1600], lowMsg: "Sensor de rotação com curto interno.", highMsg: "Sensor de rotação com fio rompido." },
  { id: "ect_resistance", label: "Resistência do sensor de temperatura (a frio)", unit: "kohms", min: 1.5, max: 6, ideal: [2, 4], lowMsg: "Sensor de temperatura em curto.", highMsg: "Sensor de temperatura com fio rompido ou desconectado." },
  { id: "tps_voltage_idle", label: "Tensão do sensor da borboleta (em repouso)", unit: "V", min: 0.3, max: 1.0, ideal: [0.4, 0.9], lowMsg: "Sensor ajustado baixo demais ou borboleta fora de ponto.", highMsg: "Borboleta não está fechando por completo ou sensor desgastado." },
  { id: "o2_voltage", label: "Tensão da sonda lambda (variando)", unit: "V", min: 0.1, max: 0.9, ideal: [0.1, 0.9], lowMsg: "Sonda não está variando: pode estar queimada ou mistura pobre.", highMsg: "Sonda travada em valor alto: mistura rica ou sonda com defeito." }
];

const oscilloscope = [
  { id: "ckp_waveform", label: "Sinal do sensor de rotação (CKP)", ok: "regular", bad: "sem sinal, muito ruído ou altura fora do esperado" },
  { id: "cmp_waveform", label: "Sinal do sensor do comando (CMP)", ok: "regular", bad: "sem sinal, muito ruído ou fora de fase com o sensor de rotação" },
  { id: "injector_waveform", label: "Pulso de comando do injetor", ok: "regular", bad: "sem pulso, pico de tensão ausente ou pulso cortado" },
  { id: "coil_waveform", label: "Pulso de ignição da bobina", ok: "regular", bad: "sem carga, sem corte ou pico de tensão anormal" },
  { id: "can_waveform", label: "Sinal da rede de comunicação (CAN)", ok: "regular", bad: "nível fixo, muito ruído ou sem comunicação" }
];

const manualFields = [
  { id: "battery_rest", group: "Alimentação", label: "Tensão da bateria (motor desligado)", unit: "V", type: "number", step: "0.1" },
  { id: "battery_load", group: "Alimentação", label: "Tensão da bateria (motor ligado)", unit: "V", type: "number", step: "0.1" },
  { id: "voltage_ecu", group: "Alimentação", label: "Tensão que chega na central", unit: "V", type: "number", step: "0.1" },
  { id: "ground_ecu", group: "Alimentação", label: "Queda de tensão na massa da central", unit: "V", type: "number", step: "0.01" },
  { id: "rail_5v", group: "Alimentação", label: "Alimentação de 5 V dos sensores", unit: "V", type: "number", step: "0.01" },
  { id: "rail_12v", group: "Alimentação", label: "Alimentação de 12 V dos acessórios", unit: "V", type: "number", step: "0.1" },
  { id: "fuel_pressure", group: "Combustível", label: "Pressão da linha de combustível", unit: "bar", type: "number", step: "0.1" },
  { id: "injector_resistance", group: "Combustível", label: "Resistência de um injetor", unit: "ohms", type: "number", step: "0.1" },
  { id: "ignition_coil_resistance", group: "Ignição", label: "Resistência da bobina de ignição", unit: "ohms", type: "number", step: "0.1" },
  { id: "sensor_ckp_resistance", group: "Sensores", label: "Resistência do sensor de rotação", unit: "ohms", type: "number", step: "1" },
  { id: "ect_resistance", group: "Sensores", label: "Resistência do sensor de temperatura (a frio)", unit: "kohms", type: "number", step: "0.1" },
  { id: "tps_voltage_idle", group: "Sensores", label: "Tensão do sensor da borboleta (repouso)", unit: "V", type: "number", step: "0.01" },
  { id: "o2_voltage", group: "Sensores", label: "Tensão da sonda lambda (variando)", unit: "V", type: "number", step: "0.01" },
  { id: "ckp_waveform", group: "Osciloscópio", label: "Sinal do sensor de rotação (CKP)", unit: "", type: "select", options: ["regular", "anormal"] },
  { id: "cmp_waveform", group: "Osciloscópio", label: "Sinal do sensor do comando (CMP)", unit: "", type: "select", options: ["regular", "anormal"] },
  { id: "injector_waveform", group: "Osciloscópio", label: "Pulso de comando do injetor", unit: "", type: "select", options: ["regular", "anormal"] },
  { id: "coil_waveform", group: "Osciloscópio", label: "Pulso de ignição da bobina", unit: "", type: "select", options: ["regular", "anormal"] },
  { id: "can_waveform", group: "Osciloscópio", label: "Sinal da rede de comunicação (CAN)", unit: "", type: "select", options: ["regular", "anormal"] }
];

function getElectrical(id) {
  return electrical.find((item) => item.id === id) || null;
}

function getOscilloscope(id) {
  return oscilloscope.find((item) => item.id === id) || null;
}

module.exports = { electrical, oscilloscope, manualFields, getElectrical, getOscilloscope };
