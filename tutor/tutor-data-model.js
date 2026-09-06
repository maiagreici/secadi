"use strict";
/**
 * tutor-data-model.js
 * Estrutura de dados do Caderno de Diagnóstico Escolar e Territorial para
 * Tutores (SECADI-UFPEL).
 *
 * Princípio de autoria (seção 3 da especificação):
 *   studentDiagnosis = READ ONLY
 *   tutorLayer       = WRITE
 *
 * Este arquivo NUNCA define uma função capaz de alterar o objeto do
 * cursista. Toda mutação aqui produzida vai para o objeto `tutorNotebook`,
 * que referencia o diagnóstico apenas por `schoolId`/`diagnosisVersion` —
 * nunca copia respostas do cursista para dentro de si.
 *
 * DECISÃO TÉCNICA (não pedagógica): o diagnóstico do cursista não possui,
 * na V1 do sistema do cursista, um `schoolId` estável (metadata.schoolId
 * nunca é preenchido). Usamos `diagnosis.metadata.diagnosisId` — sempre
 * presente e estável — como chave de junção entre os dois sistemas. Os
 * campos SCH_NAME/SCH_CITY/SCH_STATE são apenas rótulos de exibição,
 * sempre relidos do diagnóstico, nunca copiados como fonte de verdade.
 */

const TUTOR_INSTRUMENT_VERSION = "1.0.0";

function tutorUid(prefix) {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-5);
  return `${prefix}_${time}${rand}`;
}

function tutorNowIso() {
  return new Date().toISOString();
}

/* ---------------------------------------------------------------------- */
/* Congelamento profundo — garante em tempo de execução que o diagnóstico */
/* importado é READ ONLY: qualquer tentativa de escrita lança TypeError.  */
/* ---------------------------------------------------------------------- */

function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object" || Object.isFrozen(obj)) return obj;
  Object.getOwnPropertyNames(obj).forEach((key) => {
    deepFreeze(obj[key]);
  });
  return Object.freeze(obj);
}

/* ---------------------------------------------------------------------- */
/* Fábricas — camada do tutor                                             */
/* ---------------------------------------------------------------------- */

function createTutorNotebook(partial = {}) {
  const ts = tutorNowIso();
  return {
    metadata: {
      instrumentVersion: TUTOR_INSTRUMENT_VERSION,
      createdAt: ts,
      updatedAt: ts,
      lastSavedAt: null,
    },
    tutor: { TUT_ID: "", TUT_NAME: "", TUT_CLASS: "" },
    activeRole: "tutor", // student | tutor | coordinator previstos; só "tutor" é funcional na V1
    ruleConfig: {
      // seção 48: limiares nunca hardcoded sem configuração explícita.
      // Valor inicial sugerido (DECISÃO PEDAGÓGICA registrada em README-DECISOES.md);
      // ajustável nesta própria interface (Painel > Configurações de regras).
      manyGapsThreshold: 3,
    },
    schools: [],
    currentSchoolId: null,
    stageReviews: [],
    comments: [],
    feedbackQuestions: [],
    alerts: [],
    reviewHistory: [],
    generalNotes: [],
    classInsights: null, // recalculado sob demanda (ver tutor-rules.js#computeClassInsights)
    finalAssessment: [],
    ...partial,
  };
}

function createSchoolEntry(partial = {}) {
  return {
    schoolId: null, // === diagnosis.metadata.diagnosisId
    schoolName: "",
    schoolCity: "",
    schoolState: "",
    studentName: "",
    studentRole: "",
    diagnosisVersion: "1.0",
    lastKnownUpdatedAt: null,
    importedAt: tutorNowIso(),
    reviewStatus: "waiting_student",
    currentStage: 0,
    ...partial,
  };
}

function createStageReview(partial = {}) {
  return {
    schoolId: null,
    stage: null,
    diagnosisVersion: null,
    fields: {}, // TUT_xxx -> valor (campos de escala do próprio estágio)
    itemReviews: {}, // objectId -> { TUT_xxx: valor, ... } (por risco/swot/prioridade/ação/indicador/lacuna)
    updatedAt: tutorNowIso(),
    ...partial,
  };
}

function createTutorAlert(partial = {}) {
  return {
    alertId: tutorUid("TALERT"),
    ruleId: null, // chave natural (TUT_ALERT_001 etc + identificador do objeto de origem)
    schoolId: null,
    diagnosisVersion: null,
    stage: null,
    type: "information", // information | reflection | attention | revision | critical
    sourceIds: [],
    message: "",
    status: "open", // open | acknowledged | resolved | not_relevant
    tutorComment: "",
    createdAt: tutorNowIso(),
    ...partial,
  };
}

function createTutorComment(partial = {}) {
  return {
    commentId: tutorUid("TCOM"),
    tutorId: "",
    schoolId: null,
    diagnosisVersion: null,
    stage: null,
    relatedObjectType: null, // question|answer|evidence|risk|problem|priority|action|indicator|stage
    relatedObjectId: null,
    type: "suggestion", // recognition | question | suggestion | revision_request | attention
    text: "",
    createdAt: tutorNowIso(),
    visibility: "student_visible", // student_visible | tutor_only
    ...partial,
  };
}

function createFeedbackQuestion(partial = {}) {
  return {
    questionId: tutorUid("TQ"),
    schoolId: null,
    diagnosisVersion: null,
    stage: null,
    relatedObjectType: null,
    relatedObjectId: null,
    text: "",
    status: "open", // open | answered | resolved
    createdAt: tutorNowIso(),
    ...partial,
  };
}

function createTutorNote(partial = {}) {
  return {
    noteId: tutorUid("TNOTE"),
    schoolId: null,
    tutorId: "",
    createdAt: tutorNowIso(),
    type: "meeting", // meeting | guidance | agreement | follow_up | internal_note | other
    text: "",
    ...partial,
  };
}

function createReviewRubric(partial = {}) {
  const v = "not_applicable"; // consistent | partially_consistent | needs_deepening | not_applicable
  return {
    completeness: v,
    evidence: v,
    coherence: v,
    participation: v,
    traceability: v,
    ...partial,
  };
}

function createReviewHistoryItem(partial = {}) {
  return {
    reviewId: tutorUid("REVIEW"),
    schoolId: null,
    tutorId: "",
    diagnosisVersion: null,
    stage: null, // etapa em que o parecer foi emitido (tipicamente 7)
    createdAt: tutorNowIso(),
    status: null, // snapshot de TUT_FINAL_STATUS no momento do fechamento
    rubric: createReviewRubric(),
    comments: [], // snapshot de commentIds desta versão
    questions: [], // snapshot de questionIds desta versão
    alertsReviewed: [], // alertIds com status != open no momento do fechamento
    revisionRequested: false,
    locked: false,
    ...partial,
  };
}

function createFinalAssessment(partial = {}) {
  return {
    schoolId: null,
    diagnosisVersion: null,
    TUT_FINAL_STATUS: null, // adequate_to_continue | adequate_with_minor_adjustments | revision_required | significant_deepening_required
    TUT_FINAL_STRENGTHS: "",
    TUT_FINAL_DEEPENING: "",
    TUT_FINAL_NEXT_STEP: "",
    openQuestions: [], // feedbackQuestion ids ainda abertos no momento do parecer
    pendingRevisions: [], // strings livres: pontos que precisam ser revistos
    createdAt: tutorNowIso(),
    updatedAt: tutorNowIso(),
    locked: false,
    ...partial,
  };
}

function createReviewReference(sourceType, sourceId) {
  return { sourceType, sourceId };
}

/* ---------------------------------------------------------------------- */
/* Acesso — escola                                                        */
/* ---------------------------------------------------------------------- */

function getSchool(notebook, schoolId) {
  return notebook.schools.find((s) => s.schoolId === schoolId) || null;
}

/* ---------------------------------------------------------------------- */
/* Acesso — stageReviews / itemReviews (chave natural: schoolId+stage+ver)*/
/* ---------------------------------------------------------------------- */

function findStageReview(notebook, schoolId, stage, diagnosisVersion) {
  return (
    notebook.stageReviews.find(
      (r) => r.schoolId === schoolId && r.stage === stage && r.diagnosisVersion === diagnosisVersion
    ) || null
  );
}

function ensureStageReview(notebook, schoolId, stage, diagnosisVersion) {
  let review = findStageReview(notebook, schoolId, stage, diagnosisVersion);
  if (!review) {
    review = createStageReview({ schoolId, stage, diagnosisVersion });
    notebook.stageReviews.push(review);
  }
  return review;
}

function isVersionLocked(notebook, schoolId, diagnosisVersion) {
  return notebook.reviewHistory.some(
    (h) => h.schoolId === schoolId && h.diagnosisVersion === diagnosisVersion && h.locked
  );
}

/** Grava um campo TUT_* de nível de etapa. Recusa-se a escrever em versão
 * já travada (revisão encerrada é imutável — seção 12). */
function setStageField(notebook, schoolId, stage, diagnosisVersion, fieldId, value) {
  if (isVersionLocked(notebook, schoolId, diagnosisVersion)) {
    throw new Error("Esta revisão já foi encerrada e é imutável. Uma nova versão do diagnóstico deve ser importada.");
  }
  const review = ensureStageReview(notebook, schoolId, stage, diagnosisVersion);
  review.fields[fieldId] = value;
  review.updatedAt = tutorNowIso();
  notebook.metadata.updatedAt = tutorNowIso();
}

function getStageField(notebook, schoolId, stage, diagnosisVersion, fieldId) {
  const review = findStageReview(notebook, schoolId, stage, diagnosisVersion);
  return review ? review.fields[fieldId] : undefined;
}

/** Grava um campo TUT_* associado a um item específico do diagnóstico
 * (um risco, um item da FOFA, uma prioridade, uma ação, um indicador...). */
function setItemReviewField(notebook, schoolId, stage, diagnosisVersion, itemId, fieldId, value) {
  if (isVersionLocked(notebook, schoolId, diagnosisVersion)) {
    throw new Error("Esta revisão já foi encerrada e é imutável. Uma nova versão do diagnóstico deve ser importada.");
  }
  const review = ensureStageReview(notebook, schoolId, stage, diagnosisVersion);
  if (!review.itemReviews[itemId]) review.itemReviews[itemId] = {};
  review.itemReviews[itemId][fieldId] = value;
  review.updatedAt = tutorNowIso();
  notebook.metadata.updatedAt = tutorNowIso();
}

function getItemReview(notebook, schoolId, stage, diagnosisVersion, itemId) {
  const review = findStageReview(notebook, schoolId, stage, diagnosisVersion);
  return (review && review.itemReviews[itemId]) || {};
}

/* ---------------------------------------------------------------------- */
/* Acesso — comentários e perguntas devolutivas                           */
/* ---------------------------------------------------------------------- */

function addComment(notebook, partial) {
  if (isVersionLocked(notebook, partial.schoolId, partial.diagnosisVersion)) {
    throw new Error("Esta revisão já foi encerrada. Comentários não podem mais ser adicionados a esta versão.");
  }
  const comment = createTutorComment({ tutorId: notebook.tutor.TUT_ID, ...partial });
  notebook.comments.push(comment);
  notebook.metadata.updatedAt = tutorNowIso();
  return comment;
}

function getCommentsFor(notebook, schoolId, diagnosisVersion, relatedObjectId) {
  return notebook.comments.filter(
    (c) => c.schoolId === schoolId && c.diagnosisVersion === diagnosisVersion && c.relatedObjectId === relatedObjectId
  );
}

function getCommentsForStage(notebook, schoolId, diagnosisVersion, stage) {
  return notebook.comments.filter((c) => c.schoolId === schoolId && c.diagnosisVersion === diagnosisVersion && c.stage === stage);
}

function addFeedbackQuestion(notebook, partial) {
  if (isVersionLocked(notebook, partial.schoolId, partial.diagnosisVersion)) {
    throw new Error("Esta revisão já foi encerrada. Perguntas não podem mais ser adicionadas a esta versão.");
  }
  const q = createFeedbackQuestion(partial);
  notebook.feedbackQuestions.push(q);
  notebook.metadata.updatedAt = tutorNowIso();
  return q;
}

function getFeedbackQuestionsFor(notebook, schoolId, diagnosisVersion, relatedObjectId) {
  return notebook.feedbackQuestions.filter(
    (q) => q.schoolId === schoolId && q.diagnosisVersion === diagnosisVersion && q.relatedObjectId === relatedObjectId
  );
}

function getOpenFeedbackQuestions(notebook, schoolId, diagnosisVersion) {
  return notebook.feedbackQuestions.filter(
    (q) => q.schoolId === schoolId && q.diagnosisVersion === diagnosisVersion && q.status !== "resolved"
  );
}

/* Banco inicial de perguntas devolutivas (seção 52) — apenas sugestões de
 * texto, sempre editáveis antes de salvar; nunca enviadas automaticamente. */
const FEEDBACK_QUESTION_BANK = [
  "Que evidência sustenta esta interpretação?",
  "Quem participou dessa conclusão?",
  "Como esta situação aparece no cotidiano da escola?",
  "Esta afirmação é uma percepção ou está apoiada em dado técnico?",
  "O que vocês ainda precisam investigar?",
  "Que capacidade já existente pode contribuir?",
  "Como esta prioridade decorre do diagnóstico?",
  "O que está sob governabilidade da escola?",
  "Que ator territorial precisa ser envolvido?",
  "Como os estudantes participarão das decisões?",
  "Que resultado concreto vocês esperam?",
  "Como saberão se houve mudança?",
];

/* ---------------------------------------------------------------------- */
/* Acesso — alertas                                                       */
/* ---------------------------------------------------------------------- */

/** Cria o alerta se ainda não existir um com a mesma chave natural
 * (ruleId). Nunca sobrescreve status/tutorComment de um alerta já
 * existente — a regra automática não pode contradizer/apagar a decisão
 * já tomada pelo tutor (seção 46). */
function ensureAlert(notebook, ruleId, partial) {
  const existing = notebook.alerts.find((a) => a.ruleId === ruleId);
  if (existing) return existing;
  const alert = createTutorAlert({ ruleId, ...partial });
  notebook.alerts.push(alert);
  return alert;
}

function getAlertsForSchool(notebook, schoolId, diagnosisVersion) {
  return notebook.alerts.filter((a) => a.schoolId === schoolId && a.diagnosisVersion === diagnosisVersion);
}

function getAlertsForStage(notebook, schoolId, diagnosisVersion, stage) {
  return getAlertsForSchool(notebook, schoolId, diagnosisVersion).filter((a) => a.stage === stage);
}

function setAlertStatus(notebook, alertId, status, tutorComment) {
  const alert = notebook.alerts.find((a) => a.alertId === alertId);
  if (!alert) return;
  alert.status = status;
  if (tutorComment !== undefined) alert.tutorComment = tutorComment;
  notebook.metadata.updatedAt = tutorNowIso();
}

/* ---------------------------------------------------------------------- */
/* Acesso — histórico / versionamento                                     */
/* ---------------------------------------------------------------------- */

function getReviewHistoryForSchool(notebook, schoolId) {
  return notebook.reviewHistory
    .filter((h) => h.schoolId === schoolId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/** Encerra a revisão corrente de uma escola/versão: cria um
 * reviewHistoryItem IMUTÁVEL (locked = true) com um snapshot dos
 * comentários, perguntas e alertas já tratados. Nunca sobrescreve um
 * reviewHistoryItem existente — sempre cria um novo registro. */
function lockReview(notebook, { schoolId, diagnosisVersion, stage, status, revisionRequested, rubric }) {
  if (isVersionLocked(notebook, schoolId, diagnosisVersion)) {
    throw new Error("Esta versão já possui uma revisão encerrada.");
  }
  const comments = notebook.comments.filter((c) => c.schoolId === schoolId && c.diagnosisVersion === diagnosisVersion);
  const questions = notebook.feedbackQuestions.filter((q) => q.schoolId === schoolId && q.diagnosisVersion === diagnosisVersion);
  const alertsReviewed = getAlertsForSchool(notebook, schoolId, diagnosisVersion)
    .filter((a) => a.status !== "open")
    .map((a) => a.alertId);

  const item = createReviewHistoryItem({
    schoolId,
    diagnosisVersion,
    stage,
    tutorId: notebook.tutor.TUT_ID,
    status,
    rubric: rubric || createReviewRubric(),
    comments: comments.map((c) => c.commentId),
    questions: questions.map((q) => q.questionId),
    alertsReviewed,
    revisionRequested: !!revisionRequested,
    locked: true,
  });
  notebook.reviewHistory.push(item);
  notebook.metadata.updatedAt = tutorNowIso();
  return item;
}

/* ---------------------------------------------------------------------- */
/* Acesso — registros gerais e parecer final                              */
/* ---------------------------------------------------------------------- */

function addGeneralNote(notebook, partial) {
  const note = createTutorNote({ tutorId: notebook.tutor.TUT_ID, ...partial });
  notebook.generalNotes.push(note);
  notebook.metadata.updatedAt = tutorNowIso();
  return note;
}

function getFinalAssessment(notebook, schoolId, diagnosisVersion) {
  return notebook.finalAssessment.find((f) => f.schoolId === schoolId && f.diagnosisVersion === diagnosisVersion) || null;
}

function ensureFinalAssessment(notebook, schoolId, diagnosisVersion) {
  let fa = getFinalAssessment(notebook, schoolId, diagnosisVersion);
  if (!fa) {
    fa = createFinalAssessment({ schoolId, diagnosisVersion });
    notebook.finalAssessment.push(fa);
  }
  return fa;
}

function setFinalAssessmentField(notebook, schoolId, diagnosisVersion, fieldId, value) {
  if (isVersionLocked(notebook, schoolId, diagnosisVersion)) {
    throw new Error("O parecer desta versão já foi emitido e é imutável.");
  }
  const fa = ensureFinalAssessment(notebook, schoolId, diagnosisVersion);
  fa[fieldId] = value;
  fa.updatedAt = tutorNowIso();
  notebook.metadata.updatedAt = tutorNowIso();
}

window.TutorDataModel = {
  TUTOR_INSTRUMENT_VERSION,
  FEEDBACK_QUESTION_BANK,
  tutorUid,
  tutorNowIso,
  deepFreeze,
  createTutorNotebook,
  createSchoolEntry,
  createStageReview,
  createTutorAlert,
  createTutorComment,
  createFeedbackQuestion,
  createTutorNote,
  createReviewRubric,
  createReviewHistoryItem,
  createFinalAssessment,
  createReviewReference,
  getSchool,
  findStageReview,
  ensureStageReview,
  isVersionLocked,
  setStageField,
  getStageField,
  setItemReviewField,
  getItemReview,
  addComment,
  getCommentsFor,
  getCommentsForStage,
  addFeedbackQuestion,
  getFeedbackQuestionsFor,
  getOpenFeedbackQuestions,
  ensureAlert,
  getAlertsForSchool,
  getAlertsForStage,
  setAlertStatus,
  getReviewHistoryForSchool,
  lockReview,
  addGeneralNote,
  getFinalAssessment,
  ensureFinalAssessment,
  setFinalAssessmentField,
};
