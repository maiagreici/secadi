"use strict";
/**
 * tutor-storage.js
 * Persistência local do Caderno do Tutor (localStorage), separada da
 * persistência do sistema do cursista (chaves diferentes — nunca se
 * sobrescrevem). Também cuida de exportação/impressão.
 *
 * Duas chaves:
 *  - secadiTutorNotebook_v1              -> tutorNotebook (camada do tutor)
 *  - secadiTutorNotebook_v1__diagnoses   -> { [schoolId]: diagnosis }
 *    (blobs somente leitura importados; guardados à parte para não
 *    misturar a autoria do cursista com a estrutura de dados do tutor —
 *    seção 7: "o sistema de tutoria não deve duplicar seus dados" nos
 *    campos que ele próprio possui, embora precise arquivá-los para
 *    persistir a leitura entre sessões.)
 */

const TUTOR_STORAGE_KEY = "secadiTutorNotebook_v1";
const TUTOR_DIAGNOSES_KEY = "secadiTutorNotebook_v1__diagnoses";
const TUTOR_AUTOSAVE_DEBOUNCE_MS = 600;

let tutorAutosaveTimer = null;
let tutorOnSavedCallback = null;

function setTutorOnSaved(cb) {
  tutorOnSavedCallback = cb;
}

function loadTutorState() {
  try {
    const rawNotebook = localStorage.getItem(TUTOR_STORAGE_KEY);
    const rawDiagnoses = localStorage.getItem(TUTOR_DIAGNOSES_KEY);
    if (!rawNotebook) return null;
    const notebook = JSON.parse(rawNotebook);
    const diagnosesStore = rawDiagnoses ? JSON.parse(rawDiagnoses) : {};
    // Reconstitui o congelamento read-only ao recarregar do disco.
    Object.keys(diagnosesStore).forEach((id) => {
      diagnosesStore[id] = window.TutorDataModel.deepFreeze(diagnosesStore[id]);
    });
    if (!notebook || !notebook.metadata) return null;
    return { notebook, diagnosesStore };
  } catch (err) {
    console.error("Falha ao carregar o Caderno do Tutor salvo:", err);
    return null;
  }
}

function saveTutorStateNow(notebook, diagnosesStore) {
  notebook.metadata.updatedAt = window.TutorDataModel.tutorNowIso();
  notebook.metadata.lastSavedAt = window.TutorDataModel.tutorNowIso();
  try {
    localStorage.setItem(TUTOR_STORAGE_KEY, JSON.stringify(notebook));
    localStorage.setItem(TUTOR_DIAGNOSES_KEY, JSON.stringify(diagnosesStore));
    if (typeof tutorOnSavedCallback === "function") tutorOnSavedCallback(notebook.metadata.lastSavedAt);
    return true;
  } catch (err) {
    console.error("Falha ao salvar o Caderno do Tutor (localStorage cheio?):", err);
    return false;
  }
}

function scheduleTutorAutosave(notebook, diagnosesStore) {
  if (tutorAutosaveTimer) clearTimeout(tutorAutosaveTimer);
  tutorAutosaveTimer = setTimeout(() => saveTutorStateNow(notebook, diagnosesStore), TUTOR_AUTOSAVE_DEBOUNCE_MS);
}

function clearTutorState() {
  localStorage.removeItem(TUTOR_STORAGE_KEY);
  localStorage.removeItem(TUTOR_DIAGNOSES_KEY);
}

/* ---------------------------------------------------------------------- */
/* Importação do diagnóstico do cursista (arquivo externo)                */
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

async function importDiagnosisFile(file) {
  return readJsonFile(file);
}

/* ---------------------------------------------------------------------- */
/* Exportação — Caderno do Tutor (nunca o arquivo do cursista)            */
/* ---------------------------------------------------------------------- */

function triggerDownload(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportTutorNotebookToFile(notebook, diagnosesStore) {
  const payload = {
    exportedAt: window.TutorDataModel.tutorNowIso(),
    instrumentVersion: window.TutorDataModel.TUTOR_INSTRUMENT_VERSION,
    tutorNotebook: notebook,
    // Incluído para permitir reabrir o caderno em outro navegador sem
    // perder a leitura já feita. Continua sendo tratado como somente
    // leitura ao ser recarregado (deepFreeze em loadTutorState).
    sourceDiagnoses: diagnosesStore,
  };
  const safeName = (notebook.tutor.TUT_NAME || "tutor").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  triggerDownload(payload, `caderno-do-tutor-${safeName || "secadi"}.json`);
}

function exportFinalAssessmentToFile(finalAssessment, schoolEntry) {
  const payload = {
    exportedAt: window.TutorDataModel.tutorNowIso(),
    instrumentVersion: window.TutorDataModel.TUTOR_INSTRUMENT_VERSION,
    school: { schoolName: schoolEntry.schoolName, schoolCity: schoolEntry.schoolCity, schoolState: schoolEntry.schoolState },
    diagnosisVersion: finalAssessment.diagnosisVersion,
    finalAssessment,
  };
  const safeName = (schoolEntry.schoolName || "escola").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  triggerDownload(payload, `parecer-formativo-${safeName || "escola"}-v${finalAssessment.diagnosisVersion}.json`);
}

async function importTutorNotebookFromFile(file) {
  const payload = await readJsonFile(file);
  const notebook = payload.tutorNotebook || payload;
  if (!notebook || !notebook.metadata) {
    throw new Error("Estrutura de Caderno do Tutor não reconhecida no arquivo importado.");
  }
  const diagnosesStore = payload.sourceDiagnoses || {};
  Object.keys(diagnosesStore).forEach((id) => {
    diagnosesStore[id] = window.TutorDataModel.deepFreeze(diagnosesStore[id]);
  });
  return { notebook, diagnosesStore };
}

window.TutorStorage = {
  TUTOR_STORAGE_KEY,
  TUTOR_DIAGNOSES_KEY,
  setTutorOnSaved,
  loadTutorState,
  saveTutorStateNow,
  scheduleTutorAutosave,
  clearTutorState,
  importDiagnosisFile,
  exportTutorNotebookToFile,
  exportFinalAssessmentToFile,
  importTutorNotebookFromFile,
};
