const path = require("path");
const express = require("express");
const multer = require("multer");
const parser = require("../lib/parser");
const report = require("../lib/report");
const thresholds = require("../lib/rules/thresholds");
const flash = require("../lib/flash");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }
});

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "ecu-doctor" });
});

app.get("/api/fields", (req, res) => {
  res.json({ fields: thresholds.manualFields });
});

app.post("/api/parse", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });

    let parsed;
    try {
      parsed = parser.parse(req.file.buffer, req.file.originalname);
    } catch (err) {
      return res.status(422).json({ error: "Não consegui ler o arquivo. Envie JSON, CSV ou texto com os dados do diagnóstico." });
    }

    if (parsed.dtcs.length === 0 && Object.keys(parsed.metrics).length === 0) {
      return res.status(422).json({ error: "O arquivo não continha códigos nem leituras reconhecidos." });
    }

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: "Falha ao processar o arquivo." });
  }
});

app.post("/api/report", (req, res) => {
  try {
    const { parsed, manual: manualPayload } = req.body || {};

    if (!parsed || typeof parsed !== "object") {
      return res.status(400).json({ error: "Envie o resultado do upload antes de gerar o relatório." });
    }

    const normalized = {
      filename: parsed.filename || "dados_enviados",
      format: parsed.format || "desconhecido",
      dtcs: Array.isArray(parsed.dtcs) ? parsed.dtcs : [],
      metrics: parsed.metrics && typeof parsed.metrics === "object" ? parsed.metrics : {},
      vehicle: parsed.vehicle || {},
      freezeFrame: parsed.freezeFrame || {},
      availableKeys: Array.isArray(parsed.availableKeys) ? parsed.availableKeys : Object.keys(parsed.metrics || {}),
      missing: Array.isArray(parsed.missing) ? parsed.missing : []
    };

    const result = report.build(normalized, manualPayload);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Falha ao gerar o relatório." });
  }
});

app.get("/api/flash", (req, res) => {
  res.status(501).json({ error: "Módulo de programação ainda não implementado.", available: ["readEcu", "writeEcu", "cleanEcu", "validateAuthorizedFile"] });
});

app.use("/api", (req, res) => res.status(404).json({ error: "Rota não encontrada." }));

app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Arquivo muito grande. O limite é de 4 MB." });
  }
  if (err && err.name === "MulterError") {
    return res.status(422).json({ error: "Falha no envio do arquivo." });
  }
  res.status(500).json({ error: "Erro interno." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

module.exports = app;
