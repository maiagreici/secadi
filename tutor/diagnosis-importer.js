"use strict";
/**
 * diagnosis-importer.js
 * Importa o JSON exportado pelo cursista (mesmo formato produzido por
 * storage.js do outro sistema: { exportedAt, instrumentVersion, diagnosis,
 * attachments }, ou o objeto `diagnosis` "cru"). Valida estrutura mínima,
 * calcula a versão local do diagnóstico para fins de rastreabilidade da
 * tutoria e devolve o objeto **congelado** (Object.freeze profundo) para
 * que nenhuma parte do Caderno do Tutor consiga escrevê-lo.
 *
 * Nunca inventa dado ausente (seção 70): quando uma seção inteira não
 * existe na versão importada, `readField` sinaliza isso explicitamente
 * (available: false) em vez de tratar como resposta vazia.
 */

function validateDiagnosisStructure(diagnosis) {
  const missing = [];
  if (!diagnosis || typeof diagnosis !== "object") {
    return { valid: false, missing: ["objeto diagnosis"] };
  }
  if (!diagnosis.metadata || !diagnosis.metadata.diagnosisId) missing.push("metadata.diagnosisId");
  if (!diagnosis.school) missing.push("school");
  if (!diagnosis.metadata || !diagnosis.metadata.instrumentVersion) missing.push("metadata.instrumentVersion");
  // Estrutural, não bloqueante: outras seções podem faltar em versões
  // antigas do instrumento — isso é tratado por readField, não aqui.
  return { valid: missing.length === 0, missing };
}

function extractDiagnosis(payload) {
  return payload && payload.diagnosis ? payload.diagnosis : payload;
}

function schoolLabel(diagnosis) {
  const school = diagnosis.school || {};
  return {
    schoolName: school.SCH_NAME || "(nome não informado)",
    schoolCity: school.SCH_CITY || "",
    schoolState: school.SCH_STATE || "",
  };
}

function respondentLabel(diagnosis) {
  const resp = diagnosis.respondent || {};
  return {
    studentName: resp.RESP_NAME || "(nome não informado)",
    studentRole: resp.RESP_ROLE || "",
  };
}

/** Lê um campo do diagnóstico distinguindo "não disponível nesta versão
 * importada" (seção completamente ausente) de "não respondido" (seção
 * presente, campo vazio — um estado epistêmico legítimo, não um erro). */
function readField(diagnosis, fieldId) {
  if (!diagnosis || !window.DataModel) return { available: false, value: undefined };
  const domain = window.DataModel.domainForField(fieldId);
  if (!(domain in diagnosis)) return { available: false, value: undefined };
  const value = window.DataModel.getAnswer(diagnosis, fieldId);
  return { available: true, value };
}

function readCollection(diagnosis, key) {
  if (!diagnosis || !(key in diagnosis)) return { available: false, items: [] };
  const value = diagnosis[key];
  return { available: true, items: Array.isArray(value) ? value : [] };
}

/**
 * DECISÃO TÉCNICA DE VERSIONAMENTO (registrada como DECISÃO PEDAGÓGICA
 * NECESSÁRIA #1 na primeira resposta deste projeto — nenhuma decisão
 * humana adicional chegou até a implementação, portanto adotamos a opção
 * (d) ali descrita, documentada aqui): o sistema do cursista não grava um
 * número de versão explícito no diagnóstico. O Caderno do Tutor gera sua
 * própria numeração sequencial local (1.0, 1.1, 1.2, ...) por escola,
 * incrementando sempre que detecta uma nova importação cujo
 * `metadata.updatedAt` difere do último importado para aquela escola.
 * Isso é reversível e reconfigurável sem alterar o sistema do cursista,
 * mas deve ser revisto caso a coordenação decida adotar um identificador
 * de versão explícito do lado do cursista no futuro.
 */
function computeNextVersion(previousVersion) {
  if (!previousVersion) return "1.0";
  const parts = String(previousVersion).split(".");
  const minor = parseInt(parts[1] || "0", 10);
  return `${parts[0]}.${minor + 1}`;
}

/**
 * Importa um diagnóstico para dentro do notebook do tutor.
 * @returns {{schoolEntry, diagnosis, isNewVersion, warnings}}
 */
function importDiagnosis(notebook, diagnosesStore, rawPayload) {
  const diagnosis = extractDiagnosis(rawPayload);
  const validation = validateDiagnosisStructure(diagnosis);
  if (!validation.valid) {
    throw new Error(
      `Estrutura de diagnóstico não reconhecida. Campos ausentes: ${validation.missing.join(", ")}.`
    );
  }

  const warnings = [];
  const expectedSections = [
    "methodology", "territory", "environmentalEducation", "participation",
    "riskContext", "actors", "evidence", "risks", "cartography", "knowledgeGaps",
    "swotItems", "problems", "priorities", "actionPlans", "communicationStrategies",
    "indicators",
  ];
  expectedSections.forEach((key) => {
    if (!(key in diagnosis)) {
      warnings.push(`A seção "${key}" não está disponível nesta versão importada.`);
    }
  });

  const schoolId = diagnosis.metadata.diagnosisId;
  const frozen = window.TutorDataModel.deepFreeze(JSON.parse(JSON.stringify(diagnosis)));

  let entry = window.TutorDataModel.getSchool(notebook, schoolId);
  const label = schoolLabel(diagnosis);
  const respLabel = respondentLabel(diagnosis);
  const updatedAt = diagnosis.metadata.updatedAt || null;
  let isNewVersion = false;

  if (!entry) {
    entry = window.TutorDataModel.createSchoolEntry({
      schoolId,
      ...label,
      ...respLabel,
      diagnosisVersion: "1.0",
      lastKnownUpdatedAt: updatedAt,
      reviewStatus: mapDiagnosisStatusToReviewStatus(diagnosis.metadata.status),
    });
    notebook.schools.push(entry);
    isNewVersion = true;
  } else {
    Object.assign(entry, label, respLabel);
    if (entry.lastKnownUpdatedAt !== updatedAt) {
      entry.diagnosisVersion = computeNextVersion(entry.diagnosisVersion);
      entry.lastKnownUpdatedAt = updatedAt;
      entry.reviewStatus = mapDiagnosisStatusToReviewStatus(diagnosis.metadata.status, entry.reviewStatus);
      isNewVersion = true;
    }
  }

  diagnosesStore[schoolId] = frozen;
  notebook.metadata.updatedAt = window.TutorDataModel.tutorNowIso();

  return { schoolEntry: entry, diagnosis: frozen, isNewVersion, warnings };
}

/** Traduz o status do diagnóstico do cursista para o vocabulário de
 * status da tutoria (seção 11). Uma revisão solicitada volta ao início
 * do ciclo assim que uma nova versão chega. */
function mapDiagnosisStatusToReviewStatus(diagnosisStatus, currentTutorStatus) {
  if (currentTutorStatus === "revision_requested" || currentTutorStatus === "waiting_student") {
    if (diagnosisStatus === "ready_for_review" || diagnosisStatus === "under_review" || diagnosisStatus === "completed") {
      return "ready_for_review";
    }
    return "waiting_student";
  }
  if (!currentTutorStatus) {
    return diagnosisStatus === "ready_for_review" || diagnosisStatus === "completed" || diagnosisStatus === "under_review"
      ? "ready_for_review"
      : "waiting_student";
  }
  return currentTutorStatus;
}

window.DiagnosisImporter = {
  validateDiagnosisStructure,
  extractDiagnosis,
  schoolLabel,
  respondentLabel,
  readField,
  readCollection,
  computeNextVersion,
  importDiagnosis,
  mapDiagnosisStatusToReviewStatus,
};
