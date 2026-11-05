const state = {
  parsed: null,
  fields: [],
  report: null
};

const el = (id) => document.getElementById(id);

async function init() {
  try {
    const res = await fetch("/api/fields");
    const data = await res.json();
    state.fields = data.fields || [];
  } catch {
    state.fields = [];
  }
  renderManualFields();
  bindUpload();
  bindActions();
  updateStep(1);
}

function bindUpload() {
  const dropzone = el("dropzone");
  const input = el("file-input");

  el("pick-btn").addEventListener("click", () => input.click());
  dropzone.addEventListener("click", (e) => {
    if (e.target === el("pick-btn")) return;
    input.click();
  });

  input.addEventListener("change", () => {
    if (input.files.length) handleFile(input.files[0]);
  });

  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("drag");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag");
    })
  );
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  el("clear-file").addEventListener("click", () => {
    state.parsed = null;
    input.value = "";
    el("file-info").hidden = true;
    el("upload-error").hidden = true;
    dropzone.hidden = false;
    el("report-card").hidden = true;
    updateReportButton();
    updateStep(1);
  });
}

async function handleFile(file) {
  const errorBox = el("upload-error");
  errorBox.hidden = true;

  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch("/api/parse", { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok) {
      errorBox.textContent = data.error || "Falha ao enviar o arquivo.";
      errorBox.hidden = false;
      return;
    }

    state.parsed = data;
    renderFileInfo(data);
    updateReportButton();
    updateStep(2);
  } catch {
    errorBox.textContent = "Não foi possível falar com o servidor. Tente novamente.";
    errorBox.hidden = false;
  }
}

function renderFileInfo(parsed) {
  el("dropzone").hidden = true;
  el("file-info").hidden = false;
  el("file-name").textContent = parsed.filename;
  el("file-format").textContent = parsed.format;

  const stats = [];
  stats.push(`${parsed.dtcs.length} código(s)`);
  stats.push(`${Object.keys(parsed.metrics).length} leitura(s)`);
  if (Object.keys(parsed.vehicle).length) stats.push("dados do veículo");
  el("file-stats").innerHTML = stats.map((s) => `<span>${escapeHtml(s)}</span>`).join("");

  const missing = parsed.missing || [];
  const box = el("missing-box");
  if (missing.length) {
    box.hidden = false;
    el("missing-list").innerHTML = missing.map((m) => `<li>${escapeHtml(m.label)}</li>`).join("");
  } else {
    box.hidden = true;
  }
}

function renderManualFields() {
  const container = el("manual-groups");
  const groups = {};

  state.fields.forEach((field) => {
    if (!groups[field.group]) groups[field.group] = [];
    groups[field.group].push(field);
  });

  container.innerHTML = Object.entries(groups)
    .map(([name, fields]) => `
      <div class="field-group">
        <h3>${escapeHtml(name)}</h3>
        <div class="fields">
          ${fields.map(fieldTemplate).join("")}
        </div>
      </div>
    `)
    .join("");

  container.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", () => {
      input.closest(".field").classList.toggle("filled", input.value !== "");
      updateReportButton();
    });
  });
}

function fieldTemplate(field) {
  const unit = field.unit ? `<span class="unit">${escapeHtml(field.unit)}</span>` : "";
  if (field.type === "select") {
    const options = field.options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("");
    return `
      <div class="field" data-id="${escapeHtml(field.id)}">
        <label for="f-${escapeHtml(field.id)}">${escapeHtml(field.label)} ${unit}</label>
        <select id="f-${escapeHtml(field.id)}" data-id="${escapeHtml(field.id)}">
          <option value="">—</option>
          ${options}
        </select>
      </div>`;
  }
  return `
    <div class="field" data-id="${escapeHtml(field.id)}">
      <label for="f-${escapeHtml(field.id)}">${escapeHtml(field.label)} ${unit}</label>
      <input id="f-${escapeHtml(field.id)}" data-id="${escapeHtml(field.id)}" type="number" step="${escapeHtml(field.step || "any")}" inputmode="decimal" placeholder="—">
    </div>`;
}

function collectManual() {
  const values = {};
  el("manual-groups").querySelectorAll("input[data-id], select[data-id]").forEach((input) => {
    if (input.value !== "") values[input.dataset.id] = input.value;
  });
  return values;
}

function updateReportButton() {
  const count = Object.keys(collectManual()).length;
  el("manual-count").textContent = `${count} medições preenchidas`;
  el("report-btn").disabled = !state.parsed;
}

function bindActions() {
  el("report-btn").addEventListener("click", generateReport);
  el("download-btn").addEventListener("click", downloadReport);
  el("print-btn").addEventListener("click", () => window.print());
  el("restart-btn").addEventListener("click", () => window.location.reload());
}

async function generateReport() {
  const errorBox = el("manual-error");
  errorBox.hidden = true;
  el("report-btn").disabled = true;
  el("report-btn").textContent = "Gerando...";

  try {
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parsed: state.parsed, manual: collectManual() })
    });
    const data = await res.json();

    if (!res.ok) {
      errorBox.textContent = data.error || "Falha ao gerar o relatório.";
      errorBox.hidden = false;
      return;
    }

    state.report = data;
    renderReport(data);
    updateStep(3);
    el("report-card").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    errorBox.textContent = "Erro de comunicação ao gerar o relatório.";
    errorBox.hidden = false;
  } finally {
    el("report-btn").disabled = false;
    el("report-btn").textContent = "Gerar relatório";
    updateReportButton();
  }
}

function renderReport(report) {
  el("report-card").hidden = false;

  const s = report.summary;
  const stats = [
    { cls: s.status === "ok" ? "ok" : s.status === "critico" ? "crit" : "warn", value: s.failureCount, label: s.failureCount === 1 ? "possível problema" : "possíveis problemas" },
    { cls: "ok", value: s.confirmedCount, label: "confirmados por teste" },
    { cls: "", value: s.dtcCount, label: s.dtcCount === 1 ? "código lido" : "códigos lidos" }
  ];

  const failuresHtml = report.failures.length
    ? report.failures.map(findingTemplate).join("")
    : `<p class="empty">Nenhum problema identificado nos dados enviados.</p>`;

  const confirmHtml = renderOrientationGroup(report.orientations.confirmFirst, "Estas são as verificações que fecham as suspeitas:");
  const missingHtml = renderOrientationGroup(report.orientations.stillMissing, "Medidas que ainda faltam para completar o diagnóstico:");

  const stepsHtml = report.nextSteps.length
    ? report.nextSteps.map((step, i) => `
        <div class="list-item">
          <span class="badge-step">${i + 1}</span>
          <span>${escapeHtml(step.text)}</span>
        </div>`).join("")
    : `<p class="empty">Sem próximos passos registrados.</p>`;

  const readings = report.manual.readings || [];
  const manualHtml = readings.length
    ? `<div class="manual-summary"><strong>Medições que você fez:</strong> ${readings.map((r) => `${escapeHtml(r.label)} = ${escapeHtml(r.shown)}`).join(" · ")}</div>`
    : `<div class="manual-summary">Nenhuma medição física informada — o relatório usa apenas os dados do arquivo.</div>`;

  el("report-content").innerHTML = `
    <div class="headline ${escapeHtml(s.status)}">${escapeHtml(s.headline)}</div>
    <div class="summary">
      ${stats.map((st) => `
        <div class="stat ${st.cls}">
          <div class="value">${st.value}</div>
          <div class="label">${escapeHtml(st.label)}</div>
        </div>`).join("")}
    </div>
    ${manualHtml}
    <div class="report-section">
      <h3>Possíveis problemas</h3>
      ${failuresHtml}
    </div>
    <div class="report-section">
      <h3>Como confirmar</h3>
      ${confirmHtml}
    </div>
    <div class="report-section">
      <h3>Ainda falta medir</h3>
      ${missingHtml}
    </div>
    <div class="report-section">
      <h3>Próximos passos</h3>
      ${stepsHtml}
    </div>
  `;
}

function renderOrientationGroup(groups, intro) {
  if (!groups || !groups.length) return `<p class="empty">Nada pendente por aqui.</p>`;
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (!total) return `<p class="empty">Nada pendente por aqui.</p>`;
  return `
    <p class="section-intro">${escapeHtml(intro)}</p>
    ${groups.map((g) => `
      <div class="check-group">
        <h4>${escapeHtml(g.area)}</h4>
        <ul class="check-list">
          ${g.items.map((item) => `
            <li>${item.confirmed ? `<span class="check-mark" title="confirmado">✓</span>` : `<span class="check-box"></span>`}${escapeHtml(item.step)}</li>`).join("")}
        </ul>
      </div>`).join("")}
  `;
}

function findingTemplate(f) {
  const code = f.code ? `<span class="finding-code">${escapeHtml(f.code)}</span>` : "";
  const badge = f.evidence === "confirmado_por_teste_fisico"
    ? `<span class="badge-confirmed">Confirmado pelo seu teste</span>`
    : `<span class="badge-suspect">Suspeita</span>`;
  const severity = f.severity === "alta" ? `<span class="badge-severe">Grave</span>` : "";

  const causes = (f.causes || []).length
    ? `<p class="finding-causes"><strong>Pode ser:</strong> ${escapeHtml(f.causes.join(" · "))}</p>`
    : "";
  const tests = (f.tests || []).length
    ? `<div class="finding-tests"><strong>Como confirmar:</strong><ul>${f.tests.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul></div>`
    : "";

  return `
    <div class="finding ${escapeHtml(f.severity)}">
      <div class="finding-top">
        <span class="finding-title">${escapeHtml(f.title)} ${code}</span>
        <span class="finding-tags">${severity}${badge}</span>
      </div>
      <p class="finding-detail">${escapeHtml(f.detail)}</p>
      ${causes}
      ${tests}
    </div>`;
}

function downloadReport() {
  if (!state.report) return;
  const blob = new Blob([JSON.stringify(state.report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-ecu-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function updateStep(current) {
  document.querySelectorAll(".step").forEach((step) => {
    const n = Number(step.dataset.step);
    step.classList.toggle("active", n === current);
    step.classList.toggle("done", n < current);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

init();
