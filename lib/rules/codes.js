const codes = {
  P0001: { desc: "Regulador de combustível - circuito aberto", area: "Combustível", causes: ["Conector do regulador solto", "Fio do regulador rompido", "Falha interna da central"], tests: ["Medir a continuidade entre o conector do regulador e a central", "Verificar tensão de alimentação no regulador com ignição ligada"] },
  P0010: { desc: "Comando de comando de válvula (VVT) - circuito aberto", area: "Motor", causes: ["Bobina do atuador VVT aberta", "Fiação até a central rompida"], tests: ["Medir resistência da bobina do atuador (12 a 20 ohms)", "Verificar sinal PWM na central com osciloscópio"] },
  P0016: { desc: "Sincronização entre sensor CKP e CKP", area: "Sensores", causes: ["Sensor CKP ou CKP com defeito", "Correia/rolamento fora de ponto", "Conector oxidado"], tests: ["Comparar formas de onda CKP e CKP no osciloscópio", "Verificar folga do sensor e dentes da roda fônica"] },
  P0087: { desc: "Pressão da linha de combustível baixa", area: "Combustível", causes: ["Bomba de combustível desgastada", "Filtro entupido", "Regulador com vazamento"], tests: ["Medir pressão da linha com manômetro", "Verificar tensão e corrente da bomba no soco"] },
  P0100: { desc: "Sensor de fluxo de ar (MAF) - circuito", area: "Sensores", causes: ["MAF sujo ou contaminado", "Conector com umidade", "Fiação aberta"], tests: ["Limpar o MAF com produto específico", "Medir tensão do sinal em repouso (0,5 V a 1,0 V)"] },
  P0105: { desc: "Sensor de pressão do coletor (MAP) - circuito", area: "Sensores", causes: ["MAP desconectado", "Vácuo do tubo rompido", "Falha do sensor"], tests: ["Verificar vácuo na mangueira do MAP", "Medir tensão do sinal com ignição ligada"] },
  P0110: { desc: "Sensor de temperatura do ar (IAT) - circuito", area: "Sensores", causes: ["Conector do IAT solto", "Cabeçote do sensor rompido"], tests: ["Medir resistência do IAT (varia com a temperatura)"] },
  P0115: { desc: "Sensor de temperatura do líquido (ECT) - circuito", area: "Sensores", causes: ["Sensor ECT oxidado", "Conector com ferrugem", "Fiação em curto"], tests: ["Medir resistência do ECT a frio (2 a 4 kohms)", "Verificar se o sinal acompanha a temperatura do motor"] },
  P0120: { desc: "Sensor de borboleta (TPS) - circuito", area: "Sensores", causes: ["TPS desgastado", "Eixo da borboleta emperrado"], tests: ["Medir tensão do TPS varrendo a borboleta (deve ser contínua, sem saltos)"] },
  P0130: { desc: "Sensor de oxigênio banco 1 - circuito", area: "Emissores", causes: ["Sonda lambda com fio cortado", "Conector derretido", "Falha da sonda"], tests: ["Verificar tensão alternada da sonda (0,1 V a 0,9 V oscilando)", "Conferir aquecedor da sonda (12 V)"] },
  P0131: { desc: "Sonda lambda banco 1 - tensão baixa", area: "Emissores", causes: ["Sonda envenenada ou com vazamento", "Mistura muito pobre"], tests: ["Verificar se a sonda alterna rapidamente acima de 300 °C", "Checar vazamento de escapamento perto da sonda"] },
  P0135: { desc: "Aquecedor da sonda lambda - circuito", area: "Emissores", causes: ["Resistência do aquecedor aberta", "Relé do aquecedor com defeito"], tests: ["Medir resistência do aquecedor (cerca de 10 ohms)", "Verificar 12 V no conector com ignição ligada"] },
  P0171: { desc: "Mistura excessivamente pobre (banco 1)", area: "Combustível", causes: ["Vazamento de vácuo", "Bomba de combustível fraca", "Sensor de O2 com defeito"], tests: ["Procurar vazamentos de vácuo com fumaça", "Medir pressão da linha de combustível"] },
  P0172: { desc: "Mistura excessivamente rica (banco 1)", area: "Combustível", causes: ["Injetor vazando", "Regulador de pressão com defeito", "Filtro de ar entupido"], tests: ["Verificar vazamento de injetores (teste de retorno)", "Conferir pressão da linha"] },
  P0201: { desc: "Injetor cilindro 1 - circuito", area: "Combustível", causes: ["Bobina do injetor aberta", "Fio do injetor rompido", "Circuito de comando da central com defeito"], tests: ["Medir resistência do injetor (12 a 18 ohms)", "Verificar pulso de comando no osciloscópio"] },
  P0202: { desc: "Injetor cilindro 2 - circuito", area: "Combustível", causes: ["Bobina do injetor aberta", "Fiação com defeito"], tests: ["Medir resistência do injetor", "Verificar pulso de comando no osciloscópio"] },
  P0203: { desc: "Injetor cilindro 3 - circuito", area: "Combustível", causes: ["Bobina do injetor aberta", "Fiação com defeito"], tests: ["Medir resistência do injetor", "Verificar pulso de comando no osciloscópio"] },
  P0204: { desc: "Injetor cilindro 4 - circuito", area: "Combustível", causes: ["Bobina do injetor aberta", "Fiação com defeito"], tests: ["Medir resistência do injetor", "Verificar pulso de comando no osciloscópio"] },
  P0300: { desc: "Falha de ignição aleatória (misfire)", area: "Ignição", causes: ["Velas gastas", "Bobinas com defeito", "Pressão de compressão baixa"], tests: ["Trocar velas e bobinas de teste", "Medir compressão dos cilindros"] },
  P0301: { desc: "Falha de ignição cilindro 1", area: "Ignição", causes: ["Vela do cilindro 1 gasta", "Bobina do cilindro 1 com defeito"], tests: ["Substituir vela e bobina de teste", "Verificar resistência do cabo de velas"] },
  P0302: { desc: "Falha de ignição cilindro 2", area: "Ignição", causes: ["Vela do cilindro 2 gasta", "Bobina do cilindro 2 com defeito"], tests: ["Substituir vela e bobina de teste", "Verificar resistência do cabo de velas"] },
  P0303: { desc: "Falha de ignição cilindro 3", area: "Ignição", causes: ["Vela do cilindro 3 gasta", "Bobina do cilindro 3 com defeito"], tests: ["Substituir vela e bobina de teste", "Verificar resistência do cabo de velas"] },
  P0304: { desc: "Falha de ignição cilindro 4", area: "Ignição", causes: ["Vela do cilindro 4 gasta", "Bobina do cilindro 4 com defeito"], tests: ["Substituir vela e bobina de teste", "Verificar resistência do cabo de velas"] },
  P0335: { desc: "Sensor de posição do virabrequim (CKP) - circuito", area: "Sensores", causes: ["Sensor CKP com defeito", "Fiação em curto ou aberta", "Ruído elétrico próximo"], tests: ["Medir resistência do sensor (800 a 1600 ohms)", "Observar a forma de onda no osciloscópio com o motor girando"] },
  P0340: { desc: "Sensor de posição do comando de válvulas (CKP) - circuito", area: "Sensores", causes: ["Sensor CKP com defeito", "Correia de comando esticada"], tests: ["Medir resistência do sensor", "Comparar o sinal com o CKP no osciloscópio"] },
  P0401: { desc: "Fluxo insuficiente de EGR", area: "Emissores", causes: ["Válvula EGR carbonizada", "Passagem obstruída"], tests: ["Desmontar e limpar a válvula EGR", "Verificar vácuo na linha de comando"] },
  P0420: { desc: "Eficiência do catalisador abaixo do limite", area: "Emissores", causes: ["Catalisador desgastado", "Sonda lambda traseira com defeito"], tests: ["Comparar tensões das sondas dianteira e traseira", "Medir temperatura do catalisador (entrada e saída)"] },
  P0440: { desc: "Sistema de emissões de vapores (EVAP)", area: "Emissores", causes: ["Tampa de combustível mal fechada", "Mangueira EVAP rompida", "Válvula canister com defeito"], tests: ["Fazer teste de fumaça no tanque", "Verificar comando da válvula purgadora"] },
  P0455: { desc: "EVAP - vazamento grande detectado", area: "Emissores", causes: ["Tampa de combustível solta", "Mangueira do tanque desconectada"], tests: ["Conferir a tampa", "Inspecionar mangueiras do tanque"] },
  P0500: { desc: "Sensor de velocidade do veículo (VSS)", area: "Sensores", causes: ["Sensor VSS com defeito", "Painel com problema de comunicação"], tests: ["Medir sinal do VSS com o carro no elevador", "Verificar comunicação no barramento"] },
  P0505: { desc: "Sistema de controle da marcha lenta (IAC)", area: "Motor", causes: ["Corpo da borboleta carbonizado", "Atuador IAC emperrado"], tests: ["Limpar o corpo da borboleta", "Medir resistência do atuador IAC"] },
  P0560: { desc: "Tensão do sistema - circuito", area: "Elétrico", causes: ["Bateria fraca", "Alternador com defeito", "Massa da central oxidada"], tests: ["Medir tensão da bateria parado (12,4 V a 12,7 V)", "Medir tensão em carga (13,8 V a 14,4 V)", "Verificar queda de tensão nos cabos de massa"] },
  P0600: { desc: "Linha de comunicação CAN", area: "Rede", causes: ["Fiação do CAN cortada", "Módulo em curto puxando a rede", "Terminador do barramento com defeito"], tests: ["Medir resistência do CAN entre pinos 6 e 14 do conector OBD (60 ohms)", "Observar a forma de onda do CAN no osciloscópio"] },
  P0601: { desc: "Memória da central com erro de leitura", area: "Central", causes: ["Dados internos da central corrompidos", "Falha de alimentação durante escrita"], tests: ["Verificar estabilidade da tensão na central", "Avaliar reprogramação com arquivo autorizado"] },
  P0603: { desc: "Memória temporária da central com erro", area: "Central", causes: ["Tensão instável na central", "Falha interna de memória"], tests: ["Medir a tensão que chega na central com o multímetro em modo de captura"] },
  P0606: { desc: "Processador da central com falha interna", area: "Central", causes: ["Falha interna do processador", "Dano por água ou calor"], tests: ["Inspecionar a placa da central (oxidado, bolhas, soldas frias)"] },
  P0685: { desc: "Relé principal da central - circuito aberto", area: "Central", causes: ["Relé da central com defeito", "Fusível queimado"], tests: ["Testar o relé na bancada", "Medir 12 V no pino de alimentação da central"] },
  P0700: { desc: "Falha no sistema de transmissão (comando)", area: "Transmissão", causes: ["Falha interna da TCU", "Sensor de velocidade da transmissão"], tests: ["Ler códigos da transmissão", "Verificar sensores de velocidade e pressão"] },
  P0705: { desc: "Sensor de posição do seletor (PRND)", area: "Transmissão", causes: ["Cabo do seletor desregulado", "Sensor PRND com defeito"], tests: ["Regular o cabo do seletor", "Medir tensão do sensor em cada marcha"] },
  B0001: { desc: "Módulo de comando do airbag", area: "Segurança", causes: ["Módulo do airbag com defeito", "Conector do módulo oxidado"], tests: ["Ler códigos do sistema SRS", "Inspecionar conectores e contato de massa"] },
  C0035: { desc: "Sensor de velocidade da roda dianteira esquerda", area: "Freios", causes: ["Sensor ABS com defeito", "Anel encravado ou magnetizado"], tests: ["Medir resistência do sensor ABS", "Conferir o anel tonel na roda"] },
  C0040: { desc: "Sensor de velocidade da roda dianteira direita", area: "Freios", causes: ["Sensor ABS com defeito", "Fiação cortada"], tests: ["Medir resistência do sensor ABS", "Inspecionar a fiação no coxil"] },
  U0001: { desc: "Falha geral do barramento de dados (CAN)", area: "Rede", causes: ["Fiação do CAN comprometida", "Módulo travado na rede"], tests: ["Medir 60 ohms entre CAN-H e CAN-L", "Isolar módulos um a um para achar o culpado"] },
  U0100: { desc: "Perda de comunicação com a central do motor", area: "Rede", causes: ["Central sem alimentação", "Fiação CAN rompida", "Central em falha"], tests: ["Verificar 12 V e massa na central", "Conferir os fios da rede de comunicação"] }
};

function find(code) {
  return codes[code] || null;
}

function list() {
  return Object.keys(codes);
}

module.exports = { codes, find, list };
