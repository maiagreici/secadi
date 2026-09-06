"use strict";
/**
 * tutor-rules.js
 * Alertas automáticos mínimos (seção 47) e inteligência pedagógica da
 * turma (seção 63).
 *
 * REGRA ABSOLUTA (seção 46): automatedAlert != tutorConclusion. Toda
 * função aqui apenas detecta condições e cria um `tutorAlert` com
 * status inicial "open" — nunca decide o significado pedagógico, nunca
 * marca o alerta como resolvido/relevante sozinha, e nunca sobrescreve
 * status/comentário já registrados pelo tutor (ver ensureAlert).
 *
 * Nenhuma regra aqui corrige dado do cursista, exclui item automaticamente
 * ou converte achado em nota/score. Regras produzem apenas: type, message,
 * sourceIds, stage.
 */

const TDM = () => window.TutorDataModel;
const DI = () => window.DiagnosisImporter;

function ga(diagnosis, fieldId) {
  return DI().readField(diagnosis, fieldId).value;
}

/* ---------------------------------------------------------------------- */
/* TUT_ALERT_001 — Construção do diagnóstico predominantemente individual */
/* ---------------------------------------------------------------------- */

function ruleConstructionIndividual(notebook, schoolId, diagnosisVersion, diagnosis) {
  const participants = ga(diagnosis, "MET_PARTICIPANTS") || [];
  if (participants.length === 1 && participants[0] === "only_respondent") {
    TDM().ensureAlert(notebook, `TUT_ALERT_001::${schoolId}`, {
      schoolId, diagnosisVersion, stage: 1, type: "reflection", sourceIds: ["MET_PARTICIPANTS"],
      message: "A construção do diagnóstico parece predominantemente individual. Considere verificar se outras vozes precisam ser incorporadas.",
    });
  }
}

/* ---------------------------------------------------------------------- */
/* TUT_ALERT_002 — Risco selecionado para planejamento sem evidência      */
/* ---------------------------------------------------------------------- */

function ruleRiskWithoutEvidence(notebook, schoolId, diagnosisVersion, diagnosis) {
  (diagnosis.risks || []).forEach((risk) => {
    if (risk.selectedForPlanning && (risk.evidenceIds || []).length === 0) {
      TDM().ensureAlert(notebook, `TUT_ALERT_002::${schoolId}::${risk.riskId}`, {
        schoolId, diagnosisVersion, stage: 4, type: "attention", sourceIds: [risk.riskId],
        message: `O risco "${risk.riskType || "sem tipo definido"}" foi selecionado para planejamento, mas não possui evidência diagnóstica vinculada.`,
      });
    }
  });
}

/* ---------------------------------------------------------------------- */
/* TUT_ALERT_003 — Muitas lacunas de conhecimento em uma mesma dimensão   */
/* Limiar configurável via notebook.ruleConfig.manyGapsThreshold (seção   */
/* 48 — nunca hardcoded sem configuração explícita e ajustável em UI).    */
/* ---------------------------------------------------------------------- */

const DIMENSION_LABELS = {
  territory: "Território", environmentalEducation: "Educação Ambiental", participation: "Participação e redes",
  risks: "Riscos", monitoring: "Monitoramento", methodology: "Metodologia do diagnóstico", misc: "Geral",
};

function ruleManyGapsInDimension(notebook, schoolId, diagnosisVersion, diagnosis) {
  const gaps = diagnosis.knowledgeGaps || [];
  const byDimension = {};
  gaps.forEach((g) => {
    const dim = g.dimension || "misc";
    byDimension[dim] = byDimension[dim] || [];
    byDimension[dim].push(g.gapId);
  });
  const threshold = notebook.ruleConfig.manyGapsThreshold;
  Object.entries(byDimension).forEach(([dim, ids]) => {
    if (ids.length >= threshold) {
      TDM().ensureAlert(notebook, `TUT_ALERT_003::${schoolId}::${dim}`, {
        schoolId, diagnosisVersion, stage: null, type: "information", sourceIds: ids,
        message: `Foram registradas ${ids.length} lacunas de conhecimento na dimensão "${DIMENSION_LABELS[dim] || dim}" (limiar configurado: ${threshold}). Isto não é necessariamente um problema — "não sabemos" é uma resposta válida —, mas pode ser útil avaliar se alguma dessas lacunas precisa de investigação antes de decisões importantes.`,
      });
    }
  });
}

/* ---------------------------------------------------------------------- */
/* TUT_ALERT_004 — EA institucionalizada + continuidade dependente de     */
/* indivíduos                                                             */
/* ---------------------------------------------------------------------- */

function ruleEAInstitutionalDependency(notebook, schoolId, diagnosisVersion, diagnosis) {
  const level = ga(diagnosis, "EA_INSTITUTIONAL_LEVEL");
  const continuity = ga(diagnosis, "EA_PROJECT_CONTINUITY");
  if (level === "institutionalized_continuous" && continuity === "people_dependent") {
    TDM().ensureAlert(notebook, `TUT_ALERT_004::${schoolId}`, {
      schoolId, diagnosisVersion, stage: 3, type: "reflection", sourceIds: ["EA_INSTITUTIONAL_LEVEL", "EA_PROJECT_CONTINUITY"],
      message: "A Educação Ambiental foi descrita como institucionalizada e contínua, mas sua continuidade depende de pessoas específicas. Vale explorar com a escola o que sustentaria essa institucionalização além das pessoas envolvidas hoje.",
    });
  }
}

/* ---------------------------------------------------------------------- */
/* TUT_ALERT_005 — Ator usado como parceiro no plano sem relação atual    */
/* ---------------------------------------------------------------------- */

function ruleActorWithoutRelationship(notebook, schoolId, diagnosisVersion, diagnosis) {
  const actorsById = {};
  (diagnosis.actors || []).forEach((a) => (actorsById[a.actorId] = a));
  (diagnosis.actionPlans || []).forEach((plan) => {
    (plan.partnerActorIds || []).forEach((actorId) => {
      const actor = actorsById[actorId];
      if (actor && actor.relationshipLevel === "none") {
        TDM().ensureAlert(notebook, `TUT_ALERT_005::${schoolId}::${plan.actionPlanId}::${actorId}`, {
          schoolId, diagnosisVersion, stage: 6, type: "attention", sourceIds: [plan.actionPlanId, actorId],
          message: `Esta ação depende de "${actor.name || "um ator"}", com o(a) qual ainda não foi registrada articulação (relação atual: nenhuma). Verifique a viabilidade.`,
        });
      }
    });
  });
}

/* ---------------------------------------------------------------------- */
/* TUT_ALERT_006 — Problema sem evidência                                 */
/* ---------------------------------------------------------------------- */

function ruleProblemWithoutEvidence(notebook, schoolId, diagnosisVersion, diagnosis) {
  (diagnosis.problems || []).forEach((problem) => {
    if ((problem.evidenceIds || []).length === 0) {
      TDM().ensureAlert(notebook, `TUT_ALERT_006::${schoolId}::${problem.problemId}`, {
        schoolId, diagnosisVersion, stage: 5, type: "revision", sourceIds: [problem.problemId],
        message: `O problema "${problem.title || "(sem título)"}" não possui evidência diagnóstica vinculada.`,
      });
    }
  });
}

/* ---------------------------------------------------------------------- */
/* TUT_ALERT_007 — Ação sem vínculo com prioridade                        */
/* ---------------------------------------------------------------------- */

function ruleActionWithoutPriority(notebook, schoolId, diagnosisVersion, diagnosis) {
  const priorityIds = new Set((diagnosis.priorities || []).map((p) => p.priorityId));
  (diagnosis.actionPlans || []).forEach((plan) => {
    if (!plan.priorityId || !priorityIds.has(plan.priorityId)) {
      TDM().ensureAlert(notebook, `TUT_ALERT_007::${schoolId}::${plan.actionPlanId}`, {
        schoolId, diagnosisVersion, stage: 6, type: "revision", sourceIds: [plan.actionPlanId],
        message: `A ação "${plan.objective || "(objetivo não definido)"}" não está vinculada a nenhuma prioridade registrada.`,
      });
    }
  });
}

/* ---------------------------------------------------------------------- */
/* TUT_ALERT_008 — Meta percentual sem linha de base                      */
/* ---------------------------------------------------------------------- */

function ruleTargetWithoutBaseline(notebook, schoolId, diagnosisVersion, diagnosis) {
  (diagnosis.indicators || []).forEach((ind) => {
    const hasPercentTarget = ind.target && /%/.test(ind.target);
    if (hasPercentTarget && ind.baselineUnknown) {
      TDM().ensureAlert(notebook, `TUT_ALERT_008::${schoolId}::${ind.indicatorId}`, {
        schoolId, diagnosisVersion, stage: 6, type: "critical", sourceIds: [ind.indicatorId],
        message: `O indicador "${ind.name || "(sem nome)"}" define uma meta percentual, mas a linha de base é desconhecida. Não há linha de base para interpretar a meta percentual.`,
      });
    }
  });
}

/* ---------------------------------------------------------------------- */
/* TUT_ALERT_009 — Educomunicação sem escuta                              */
/* ---------------------------------------------------------------------- */

function ruleCommunicationWithoutListening(notebook, schoolId, diagnosisVersion, diagnosis) {
  (diagnosis.communicationStrategies || []).forEach((strategy) => {
    const purposes = strategy.purposes || [];
    if (purposes.includes("inform") && (strategy.listeningChannels || []).length === 0) {
      TDM().ensureAlert(notebook, `TUT_ALERT_009::${schoolId}::${strategy.communicationId}`, {
        schoolId, diagnosisVersion, stage: 6, type: "reflection", sourceIds: [strategy.communicationId],
        message: "A estratégia está predominantemente orientada à divulgação. Avalie se há espaço para diálogo, escuta ou produção coletiva.",
      });
    }
  });
}

/* ---------------------------------------------------------------------- */
/* TUT_ALERT_010 — Possível classificação inconsistente na FOFA           */
/* Heurística deliberadamente branda (seção 31: o tutor decide, o sistema */
/* nunca corrige sozinho). Fraquezas de origem predominantemente externa  */
/* e oportunidades de origem predominantemente interna são sinalizadas    */
/* como pergunta reflexiva, nunca reclassificadas.                        */
/* ---------------------------------------------------------------------- */

const EXTERNAL_ORIGIN_DIMENSIONS = ["territory", "risks"];
const INTERNAL_ORIGIN_DIMENSIONS = ["environmentalEducation", "methodology"];

function ruleSwotInconsistency(notebook, schoolId, diagnosisVersion, diagnosis) {
  (diagnosis.swotItems || []).forEach((item) => {
    const suspect =
      (item.category === "weakness" && EXTERNAL_ORIGIN_DIMENSIONS.includes(item.originDimension)) ||
      (item.category === "opportunity" && INTERNAL_ORIGIN_DIMENSIONS.includes(item.originDimension));
    if (suspect) {
      TDM().ensureAlert(notebook, `TUT_ALERT_010::${schoolId}::${item.swotItemId}`, {
        schoolId, diagnosisVersion, stage: 5, type: "reflection", sourceIds: [item.swotItemId],
        message: `O item "${item.label || "(sem rótulo)"}" está classificado como ${item.category === "weakness" ? "fraqueza" : "oportunidade"}, mas sua origem sugere fator predominantemente ${item.category === "weakness" ? "externo" : "interno"}. Verifique se este elemento depende predominantemente da escola ou do contexto externo — a classificação final é uma decisão da escola/tutor, não automática.`,
      });
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Orquestração                                                           */
/* ---------------------------------------------------------------------- */

function runAllTutorRules(notebook, schoolId, diagnosisVersion, diagnosis) {
  ruleConstructionIndividual(notebook, schoolId, diagnosisVersion, diagnosis);
  ruleRiskWithoutEvidence(notebook, schoolId, diagnosisVersion, diagnosis);
  ruleManyGapsInDimension(notebook, schoolId, diagnosisVersion, diagnosis);
  ruleEAInstitutionalDependency(notebook, schoolId, diagnosisVersion, diagnosis);
  ruleActorWithoutRelationship(notebook, schoolId, diagnosisVersion, diagnosis);
  ruleProblemWithoutEvidence(notebook, schoolId, diagnosisVersion, diagnosis);
  ruleActionWithoutPriority(notebook, schoolId, diagnosisVersion, diagnosis);
  ruleTargetWithoutBaseline(notebook, schoolId, diagnosisVersion, diagnosis);
  ruleCommunicationWithoutListening(notebook, schoolId, diagnosisVersion, diagnosis);
  ruleSwotInconsistency(notebook, schoolId, diagnosisVersion, diagnosis);
}

/* ---------------------------------------------------------------------- */
/* Inteligência pedagógica da turma (seção 63) — agregações textuais,     */
/* nunca comparações nomeadas ("melhores"/"piores" escolas são proibidas).*/
/* ---------------------------------------------------------------------- */

function computeClassInsights(notebook, diagnosesStore) {
  const commonKnowledgeGaps = {};
  const commonRiskAnalysisDifficulties = [];
  const commonEAIssues = [];
  const commonPlanningIssues = [];
  const commonMonitoringIssues = [];
  const schoolsNeedingSupport = [];

  notebook.schools.forEach((school) => {
    const diagnosis = diagnosesStore[school.schoolId];
    if (!diagnosis) return;
    const alerts = TDM().getAlertsForSchool(notebook, school.schoolId, school.diagnosisVersion);

    (diagnosis.knowledgeGaps || []).forEach((g) => {
      const dim = g.dimension || "misc";
      commonKnowledgeGaps[dim] = (commonKnowledgeGaps[dim] || 0) + 1;
    });

    if (alerts.some((a) => a.ruleId.startsWith("TUT_ALERT_002"))) commonRiskAnalysisDifficulties.push(school.schoolId);
    if (alerts.some((a) => a.ruleId.startsWith("TUT_ALERT_004"))) commonEAIssues.push(school.schoolId);
    if (alerts.some((a) => a.ruleId.startsWith("TUT_ALERT_006") || a.ruleId.startsWith("TUT_ALERT_007"))) commonPlanningIssues.push(school.schoolId);
    if (alerts.some((a) => a.ruleId.startsWith("TUT_ALERT_008"))) commonMonitoringIssues.push(school.schoolId);

    const openCritical = alerts.filter((a) => a.status === "open" && (a.type === "critical" || a.type === "revision")).length;
    if (openCritical >= 2) schoolsNeedingSupport.push(school.schoolId);
  });

  return {
    commonKnowledgeGaps: Object.entries(commonKnowledgeGaps).map(([dimension, count]) => ({
      dimension, dimensionLabel: DIMENSION_LABELS[dimension] || dimension, count,
    })),
    commonRiskAnalysisDifficulties,
    commonEAIssues,
    commonPlanningIssues,
    commonMonitoringIssues,
    schoolsNeedingSupport,
  };
}

window.TutorRules = {
  DIMENSION_LABELS,
  runAllTutorRules,
  computeClassInsights,
};
