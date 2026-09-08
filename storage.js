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

/**
 * Migra campos que mudaram de formato entre versões do instrumento (ex.:
 * de escolha única para múltipla escolha), para que um diagnóstico salvo
 * com uma versão anterior não quebre ao ser aberto com o código atual.
 * Nunca descarta o diagnóstico inteiro — apenas normaliza o formato de
 * campos pontuais, na pior hipótese perdendo a seleção anterior desses
 * poucos campos (que a pessoa pode revisar/reconfirmar na respectiva etapa).
 */
function toArrayField(value) {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

function migrateLegacyFields(diagnosis) {
  if (diagnosis.territory) {
    diagnosis.territory.WST_TERRITORIAL_PROBLEMS = toArrayField(diagnosis.territory.WST_TERRITORIAL_PROBLEMS);
    diagnosis.territory.INF_THERMAL_CONDITION = toArrayField(diagnosis.territory.INF_THERMAL_CONDITION);
    if (diagnosis.territory.TER_ELEMENT_RELATION && typeof diagnosis.territory.TER_ELEMENT_RELATION === "object") {
      const migrated = {};
      Object.entries(diagnosis.territory.TER_ELEMENT_RELATION).forEach(([key, value]) => {
        migrated[key] = toArrayField(value);
      });
      diagnosis.territory.TER_ELEMENT_RELATION = migrated;
    }
  }
  if (diagnosis.environmentalEducation) {
    diagnosis.environmentalEducation.EA_INTERDISCIPLINARITY_MODE = toArrayField(
      diagnosis.environmentalEducation.EA_INTERDISCIPLINARITY_MODE
    );
  }
  return diagnosis;
}

function loadDiagnosis() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.metadata) return null;
    return migrateLegacyFields(parsed);
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
  return migrateLegacyFields(diagnosis);
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
