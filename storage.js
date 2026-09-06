/**
 * storage.js
 * Persistência local (localStorage), autosave, exportação e importação de JSON.
 */

const STORAGE_KEY = "resilientSchoolDiagnosis_v1";
const AUTOSAVE_DEBOUNCE_MS = 600;

let autosaveTimer = null;
let onSavedCallback = null;

function setOnSaved(cb) {
  onSavedCallback = cb;
}

function loadDiagnosis() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.metadata) return null;
    return parsed;
  } catch (err) {
    console.error("Falha ao carregar diagnóstico salvo:", err);
    return null;
  }
}

function saveDiagnosisNow(diagnosis) {
  diagnosis.metadata.updatedAt = window.DataModel.nowIso();
  diagnosis.metadata.lastSavedAt = window.DataModel.nowIso();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diagnosis));
    if (typeof onSavedCallback === "function") {
      onSavedCallback(diagnosis.metadata.lastSavedAt);
    }
    return true;
  } catch (err) {
    console.error("Falha ao salvar diagnóstico (localStorage cheio?):", err);
    return false;
  }
}

function scheduleAutosave(diagnosis) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => saveDiagnosisNow(diagnosis), AUTOSAVE_DEBOUNCE_MS);
}

function clearDiagnosis() {
  localStorage.removeItem(STORAGE_KEY);
}

/* ---------------------------------------------------------------------- */
/* Coleta de IDs de anexo presentes no diagnóstico (evidências, cartografia)*/
/* ---------------------------------------------------------------------- */

function collectAttachmentIds(diagnosis) {
  const ids = [];
  diagnosis.evidence.forEach((e) => e.file && ids.push(e.file));
  if (diagnosis.cartography && diagnosis.cartography.MAP_FILE) {
    ids.push(diagnosis.cartography.MAP_FILE);
  }
  return ids;
}

/* ---------------------------------------------------------------------- */
/* Exportação                                                              */
/* ---------------------------------------------------------------------- */

async function exportDiagnosisToFile(diagnosis) {
  const attachmentIds = collectAttachmentIds(diagnosis);
  const attachments = await window.attachmentService.exportAsBase64Map(attachmentIds);
  const payload = {
    exportedAt: window.DataModel.nowIso(),
    instrumentVersion: window.DataModel.INSTRUMENT_VERSION,
    diagnosis,
    attachments,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const schoolName = (diagnosis.school && diagnosis.school.SCH_NAME) || "diagnostico";
  const safeName = String(schoolName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  a.href = url;
  a.download = `diagnostico-socioambiental-${safeName || "escola"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------------- */
/* Importação                                                              */
/* ---------------------------------------------------------------------- */

function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (err) {
        reject(new Error("Arquivo não é um JSON válido."));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function importDiagnosisFromFile(file) {
  const payload = await readJsonFile(file);
  const diagnosis = payload.diagnosis || payload; // aceita também um export "cru" do objeto diagnosis
  if (!diagnosis || !diagnosis.metadata) {
    throw new Error("Estrutura de diagnóstico não reconhecida no arquivo importado.");
  }
  if (payload.attachments) {
    await window.attachmentService.importBase64Map(payload.attachments);
  }
  return diagnosis;
}

window.Storage = {
  STORAGE_KEY,
  setOnSaved,
  loadDiagnosis,
  saveDiagnosisNow,
  scheduleAutosave,
  clearDiagnosis,
  exportDiagnosisToFile,
  importDiagnosisFromFile,
};
