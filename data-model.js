/**
 * data-model.js
 * Estrutura de dados do Diagnóstico Socioambiental, Climático e de Educação Ambiental.
 * Define o objeto `diagnosis`, fábricas de subobjetos e funções de memória (getAnswer etc).
 * Nenhuma regra de negócio/validação vive aqui — apenas forma dos dados e acesso a eles.
 */

const INSTRUMENT_VERSION = "1.0.0";

/* ---------------------------------------------------------------------- */
/* Utilitários de identificação                                           */
/* ---------------------------------------------------------------------- */

function uid(prefix) {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-5);
  return `${prefix}_${time}${rand}`;
}

function nowIso() {
  return new Date().toISOString();
}

/* Prefixo do ID de campo -> domínio onde a resposta simples é guardada.
   Domínios são objetos de resposta "achatados" (fieldId -> valor), o que
   permite que qualquer etapa registre/leia campos de forma genérica sem
   perder a agrupação semântica exigida (escola, respondente, metodologia,
   território, EA, participação, contexto de risco, cartografia, FOFA,
   capacidades adaptativas e síntese). Instâncias estruturadas (atores,
   evidências, riscos, problemas, prioridades, planos, comunicação,
   indicadores, lacunas, alertas) vivem em arrays próprios — nunca aqui. */
const PREFIX_TO_DOMAIN = [
  ["SCH_", "school"],
  ["RESP_", "respondent"],
  ["MET_", "methodology"],
  ["INF_", "territory"],
  ["WAT_", "territory"],
  ["SAN_", "territory"],
  ["WST_", "territory"],
  ["TER_", "territory"],
  ["EA_", "environmentalEducation"],
  ["PAR_", "participation"],
  ["NET_", "participation"],
  ["RISK_", "riskContext"],
  ["MAP_", "cartography"],
  ["SWOT_", "swotContext"],
  ["CAP_", "adaptiveCapacities"],
  ["PRI_", "priorityContext"],
  ["ACT_", "actionPlanContext"],
  ["COM_", "communicationContext"],
  ["MON_", "monitoringContext"],
  ["SYN_", "finalSynthesis"],
];

function domainForField(fieldId) {
  const entry = PREFIX_TO_DOMAIN.find(([prefix]) => fieldId.startsWith(prefix));
  return entry ? entry[1] : "misc";
}

/* ---------------------------------------------------------------------- */
/* Fábricas de subobjetos                                                 */
/* ---------------------------------------------------------------------- */

function createEvidence(partial = {}) {
  return {
    evidenceId: uid("EVID"),
    sourceQuestionId: null,
    stage: null,
    dimension: null,
    type: null, // observation | document | photo | testimony | record | other
    description: "",
    file: null, // attachmentId (ver attachment-service.js)
    createdAt: nowIso(),
    linkedProblems: [],
    linkedRisks: [],
    linkedActions: [],
    ...partial,
  };
}

function createActor(partial = {}) {
  return {
    actorId: uid("ACTOR"),
    category: null,
    name: "",
    existsInTerritory: null, // yes | no | dontknow
    relationshipLevel: null, // none | knows_exists | occasional_contact | partnership | permanent_articulation
    currentContributions: [],
    potentialContributions: [],
    priorityForStrengthening: false,
    priorityReason: "",
    ...partial,
  };
}

function createRisk(partial = {}) {
  return {
    riskId: uid("RISK"),
    riskType: null,
    occurredBefore: null, // yes | no | dontknow
    affectedSchoolOrCommunity: null, // school | community | both | neither | dontknow
    frequency: null,
    lastOccurrenceYear: null,
    lastOccurrencePeriod: "",
    observedImpacts: [],
    impactDescription: "",
    exposedAssets: [],
    exposedGroups: [],
    vulnerabilityConditions: [],
    responseCapacities: [],
    responseCapacityAssessment: "",
    perceivedProbability: null,
    potentialSeverity: null,
    severityJustification: "",
    communityAttentionLevel: null,
    attentionSignal: null, // low_signal | moderate_signal | high_signal (uso interno, nunca exposto como "risco técnico")
    knowledgeGap: false,
    requiresTechnicalAssessment: false,
    evidenceIds: [],
    selectedForPlanning: false,
    ...partial,
  };
}

function createKnowledgeGap(partial = {}) {
  return {
    gapId: uid("GAP"),
    sourceQuestionId: null,
    dimension: null,
    relatedRiskId: null,
    description: "",
    suggestedSources: [],
    status: "open", // open | investigating | resolved
    resolution: "",
    createdAt: nowIso(),
    ...partial,
  };
}

function createSwotItem(partial = {}) {
  return {
    swotItemId: uid("SWOT"),
    category: null, // strength | weakness | opportunity | threat
    label: "",
    description: "",
    sourceQuestionIds: [],
    evidenceIds: [],
    originDimension: null,
    systemSuggested: false,
    userConfirmed: false,
    priority: false,
    justification: "",
    ...partial,
  };
}

function createStrategicRelation(partial = {}) {
  return {
    relationId: uid("REL"),
    relationType: null, // strength_threat | opportunity_weakness | weakness_threat
    elementAId: null,
    elementBId: null,
    interpretation: "",
    ...partial,
  };
}

function createProblem(partial = {}) {
  return {
    problemId: uid("PROB"),
    title: "",
    description: "",
    originDimensions: [],
    sourceQuestionIds: [],
    evidenceIds: [],
    severity: null,
    urgency: null,
    reach: null,
    schoolActionability: null,
    affectedGroups: [],
    decisionParticipants: [],
    confirmed: false,
    custom: false,
    selectedAsPriority: false,
    priorityOrder: null,
    ...partial,
  };
}

function createPriority(partial = {}) {
  return {
    priorityId: uid("PRI"),
    problemId: null,
    order: null,
    justification: "",
    expectedChange: "",
    selectionParticipants: [],
    selectionMethod: null,
    selectionMethodOther: "",
    ...partial,
  };
}

function createActivity(partial = {}) {
  return {
    activityId: uid("ACTV"),
    actionPlanId: null,
    description: "",
    implementationMethod: "",
    responsible: "",
    partnerActorIds: [],
    expectedStart: "",
    expectedEnd: "",
    status: "planned", // planned | in_progress | completed | not_completed
    ...partial,
  };
}

function createActionPlan(partial = {}) {
  return {
    actionPlanId: uid("PLAN"),
    priorityId: null,
    problemStatement: "",
    evidenceIds: [],
    desiredChange: "",
    objective: "",
    responseTypes: [],
    activities: [],
    audiences: [],
    studentParticipation: "",
    coordinator: "",
    otherParticipants: "",
    partnerActorIds: [],
    partnerContribution: "",
    resources: "",
    viability: null,
    start: "",
    duration: "",
    dependencies: [],
    dependencyDetail: "",
    expectedResult: "",
    executionEvidenceTypes: [],
    implementationRisks: [],
    mitigation: "",
    coherenceValidation: null, // coherent | partially_coherent | not_sure
    coherenceNote: "",
    ...partial,
  };
}

function createCommunicationStrategy(partial = {}) {
  return {
    communicationId: uid("COM"),
    actionPlanId: null,
    purposes: [],
    audiences: [],
    centralMessage: "",
    listeningChannels: [],
    media: [],
    accessBarriers: [],
    accessibilityNeeds: [],
    accessibilityStrategies: "",
    producers: [],
    studentDecisionLevel: null,
    timing: "",
    ...partial,
  };
}

function createIndicator(partial = {}) {
  return {
    indicatorId: uid("IND"),
    actionPlanId: null,
    type: null, // process | participation | result
    name: "",
    measurementDescription: "",
    baseline: "",
    baselineUnknown: false,
    target: "",
    verificationSource: "",
    periodicity: "",
    responsible: "",
    qualitativeChange: "",
    qualitativeRecognition: "",
    ...partial,
  };
}

function createAlert(partial = {}) {
  return {
    alertId: uid("ALERT"),
    type: "info", // info | reflection | missing | coherence | critical
    stage: null,
    ruleId: null,
    relatedFieldIds: [],
    message: "",
    createdAt: nowIso(),
    dismissed: false,
    ...partial,
  };
}

function createTutorReview(partial = {}) {
  return {
    stage: null,
    completion: 0,
    alerts: [],
    knowledgeGaps: [],
    evidenceCount: 0,
    studentValidated: false,
    tutorStatus: "not_reviewed", // not_reviewed | reviewed | revision_requested | approved
    tutorComment: "",
    reviewedAt: null,
    ...partial,
  };
}

/* ---------------------------------------------------------------------- */
/* Fábrica principal                                                      */
/* ---------------------------------------------------------------------- */

function createDiagnosis() {
  const ts = nowIso();
  return {
    metadata: {
      diagnosisId: uid("DIAG"),
      schoolId: null,
      userId: null,
      createdAt: ts,
      updatedAt: ts,
      lastSavedAt: null,
      instrumentVersion: INSTRUMENT_VERSION,
      status: "draft", // draft | in_progress | ready_for_review | under_review | revision_requested | completed
      currentStage: 0,
      completionPercentage: 0,
      activeRole: "student",
    },
    school: {},
    respondent: {},
    methodology: {},
    territory: {},
    environmentalEducation: {},
    participation: {},
    riskContext: {},
    priorityContext: {},
    actionPlanContext: {},
    communicationContext: {},
    monitoringContext: {},
    misc: {},

    actors: [],
    evidence: [],
    risks: [],
    cartography: {
      MAP_FILE: null,
      MAP_PARTICIPANTS: [],
      MAP_NEW_FINDINGS: "",
      MAP_PERCEPTION_DIFFERENCES: null,
      MAP_DIFFERENCES_DESCRIPTION: "",
      MAP_NOT_DONE_REASON: "",
      zones: [], // {zoneId, type: risk|insecurity|affection|resource|memory|care, label, description}
    },
    knowledgeGaps: [],
    swotContext: {},
    swotItems: [],
    strategicRelations: [],
    adaptiveCapacities: {
      pedagogical: [],
      social: [],
      institutional: [],
      territorial: [],
      material: [],
      CAP_PRIORITY_TO_STRENGTHEN: [],
      CAP_PRIORITY_REASON: "",
    },
    problems: [],
    priorities: [],
    actionPlans: [],
    communicationStrategies: [],
    indicators: [],
    alerts: [],
    tutorReview: createTutorReview(),
    finalSynthesis: {},
  };
}

/* ---------------------------------------------------------------------- */
/* Funções de memória / leitura (Regra de Memória — seção 12)             */
/* ---------------------------------------------------------------------- */

function getAnswer(diagnosis, fieldId) {
  const domain = domainForField(fieldId);
  return diagnosis[domain] ? diagnosis[domain][fieldId] : undefined;
}

function setAnswer(diagnosis, fieldId, value) {
  const domain = domainForField(fieldId);
  if (!diagnosis[domain]) diagnosis[domain] = {};
  diagnosis[domain][fieldId] = value;
  diagnosis.metadata.updatedAt = nowIso();
}

function hasAnswer(diagnosis, fieldId) {
  const v = getAnswer(diagnosis, fieldId);
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

function getEvidenceByDimension(diagnosis, dimension) {
  return diagnosis.evidence.filter((e) => e.dimension === dimension);
}

function getEvidenceById(diagnosis, evidenceId) {
  return diagnosis.evidence.find((e) => e.evidenceId === evidenceId) || null;
}

function getSelectedRisks(diagnosis) {
  return diagnosis.risks.filter((r) => r.selectedForPlanning);
}

function getSelectedActors(diagnosis) {
  return diagnosis.actors.filter((a) => a.priorityForStrengthening);
}

function getPrioritizedProblems(diagnosis) {
  return diagnosis.priorities
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((p) => ({
      priority: p,
      problem: diagnosis.problems.find((pr) => pr.problemId === p.problemId) || null,
    }));
}

function getActionPlans(diagnosis) {
  return diagnosis.actionPlans;
}

function getActionPlanForPriority(diagnosis, priorityId) {
  return diagnosis.actionPlans.find((p) => p.priorityId === priorityId) || null;
}

function getKnowledgeGaps(diagnosis) {
  return diagnosis.knowledgeGaps;
}

function getOpenKnowledgeGaps(diagnosis) {
  return diagnosis.knowledgeGaps.filter((g) => g.status !== "resolved");
}

function getAlertsByStage(diagnosis, stage) {
  return diagnosis.alerts.filter((a) => a.stage === stage && !a.dismissed);
}

function getActiveAlerts(diagnosis) {
  return diagnosis.alerts.filter((a) => !a.dismissed);
}

function getProblemById(diagnosis, problemId) {
  return diagnosis.problems.find((p) => p.problemId === problemId) || null;
}

function getActorById(diagnosis, actorId) {
  return diagnosis.actors.find((a) => a.actorId === actorId) || null;
}

function getIndicatorsForAction(diagnosis, actionPlanId) {
  return diagnosis.indicators.filter((i) => i.actionPlanId === actionPlanId);
}

/* ---------------------------------------------------------------------- */
/* Exports (formato global — sem bundlers na V1)                          */
/* ---------------------------------------------------------------------- */

window.DataModel = {
  INSTRUMENT_VERSION,
  uid,
  nowIso,
  domainForField,
  createDiagnosis,
  createEvidence,
  createActor,
  createRisk,
  createKnowledgeGap,
  createSwotItem,
  createStrategicRelation,
  createProblem,
  createPriority,
  createActivity,
  createActionPlan,
  createCommunicationStrategy,
  createIndicator,
  createAlert,
  createTutorReview,
  getAnswer,
  setAnswer,
  hasAnswer,
  getEvidenceByDimension,
  getEvidenceById,
  getSelectedRisks,
  getSelectedActors,
  getPrioritizedProblems,
  getActionPlans,
  getActionPlanForPriority,
  getKnowledgeGaps,
  getOpenKnowledgeGaps,
  getAlertsByStage,
  getActiveAlerts,
  getProblemById,
  getActorById,
  getIndicatorsForAction,
};
