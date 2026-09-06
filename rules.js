/**
 * rules.js
 * Progresso, pré-requisitos entre etapas, geração de candidatos (nunca
 * conclusões automáticas), alertas e regras de coerência.
 *
 * Nenhuma função aqui decide por si só que algo é um problema ou um risco
 * elevado — apenas propõe candidatos com status pending_confirmation ou
 * gera alertas reflexivos/de pendência para apoiar a decisão humana.
 */

const STAGE_META = [
  { id: 0, key: "identification", label: "Identificação" },
  { id: 1, key: "territory", label: "Escola e Território" },
  { id: 2, key: "environmentalEducation", label: "Educação Ambiental" },
  { id: 3, key: "participation", label: "Participação e Redes" },
  { id: 4, key: "risks", label: "Riscos Climáticos" },
  { id: 5, key: "integratedReading", label: "Leitura Integrada" },
  { id: 6, key: "priorities", label: "Prioridades" },
  { id: 7, key: "actionPlan", label: "Plano de Ação" },
  { id: 8, key: "communication", label: "Educomunicação" },
  { id: 9, key: "monitoring", label: "Monitoramento" },
  { id: 10, key: "synthesis", label: "Síntese" },
];

/* ---------------------------------------------------------------------- */
/* Progresso (seção 17): não é respondidas/total, e sim aplicáveis/       */
/* obrigatórias aplicáveis respondidas.                                   */
/* ---------------------------------------------------------------------- */

function stageApplicableRequiredFields(diagnosis, stageId) {
  const stage = window.Stages && window.Stages[stageId];
  if (!stage) return [];
  const fromFields = (stage.fields || []).filter(
    (f) => Components_isApplicable(f, diagnosis) && Components_isRequired(f, diagnosis)
  );
  return fromFields;
}

function Components_isApplicable(fieldDef, diagnosis) {
  return typeof fieldDef.condition === "function" ? fieldDef.condition(diagnosis) : true;
}
function Components_isRequired(fieldDef, diagnosis) {
  return typeof fieldDef.required === "function" ? fieldDef.required(diagnosis) : !!fieldDef.required;
}

function computeStageProgress(diagnosis, stageId) {
  const stage = window.Stages && window.Stages[stageId];
  const requiredFields = stageApplicableRequiredFields(diagnosis, stageId);
  const extraChecks = stage && typeof stage.extraRequiredChecks === "function" ? stage.extraRequiredChecks(diagnosis) : [];

  const totalApplicable = requiredFields.length + extraChecks.length;
  const answered =
    requiredFields.filter((f) => window.DataModel.hasAnswer(diagnosis, f.id)).length +
    extraChecks.filter((c) => c.satisfied).length;

  const percentage = totalApplicable === 0 ? 100 : Math.round((answered / totalApplicable) * 100);
  return { applicable: totalApplicable, answered, percentage };
}

function computeOverallProgress(diagnosis) {
  const byStage = {};
  let totalApplicable = 0;
  let totalAnswered = 0;
  STAGE_META.forEach((s) => {
    const p = computeStageProgress(diagnosis, s.id);
    byStage[s.id] = p;
    totalApplicable += p.applicable;
    totalAnswered += p.answered;
  });
  const percentage = totalApplicable === 0 ? 0 : Math.round((totalAnswered / totalApplicable) * 100);
  return { percentage, byStage };
}

/* ---------------------------------------------------------------------- */
/* Pré-requisitos entre etapas (seção 19)                                 */
/* Distinção: bloqueio real (impede avançar) vs. pendência/alerta         */
/* (permite avançar, mas sinaliza).                                       */
/* ---------------------------------------------------------------------- */

function prerequisitesForStage(diagnosis, stageId) {
  switch (stageId) {
    case 5: {
      const stages1to4 = [1, 2, 3, 4].map((id) => computeStageProgress(diagnosis, id).percentage);
      const minProgress = Math.min(...stages1to4);
      if (minProgress < 40) {
        return {
          blocked: false,
          advisory: `As etapas 1 a 4 ainda estão pouco preenchidas (mínimo ${minProgress}%). A leitura integrada tende a ficar mais rica com mais informação registrada, mas você pode prosseguir.`,
        };
      }
      return { blocked: false, advisory: null };
    }
    case 6: {
      // A própria Etapa 6 é onde problemas são identificados (candidatos
      // automáticos e adição manual) — bloquear sua entrada seria
      // circular. O bloqueio real da cadeia acontece na Etapa 7, que exige
      // uma prioridade (e esta, por sua vez, exige um problema confirmado
      // aqui). Mantemos apenas um aviso quando nada foi identificado ainda.
      const hasAnyProblem = diagnosis.problems.length > 0;
      return {
        blocked: false,
        advisory: hasAnyProblem ? null : "Nenhum problema foi identificado automaticamente ainda a partir das etapas anteriores. Você pode adicionar um problema manualmente nesta etapa.",
      };
    }
    case 7: {
      const hasPriority = diagnosis.priorities.length > 0;
      return {
        blocked: !hasPriority,
        reason: "É necessário selecionar ao menos uma prioridade antes de construir o plano de ação.",
        advisory: null,
      };
    }
    case 8: {
      const hasAction = diagnosis.actionPlans.some((p) => (p.activities || []).length > 0);
      return {
        blocked: !hasAction,
        reason: "É necessário ter ao menos uma ação planejada (com atividade) antes de planejar a comunicação.",
        advisory: null,
      };
    }
    case 9: {
      const hasResult = diagnosis.actionPlans.some((p) => p.expectedResult && p.expectedResult.trim());
      return {
        blocked: !hasResult,
        reason: "É necessário ao menos uma ação com resultado esperado definido antes de criar indicadores.",
        advisory: null,
      };
    }
    case 10: {
      const essential = [0, 1, 2, 4, 6, 7];
      const low = essential.filter((id) => computeStageProgress(diagnosis, id).percentage < 50);
      if (low.length > 0) {
        const names = low.map((id) => STAGE_META[id].label).join(", ");
        return {
          blocked: false,
          advisory: `As etapas essenciais (${names}) ainda estão com preenchimento baixo. A síntese pode ficar mais completa se você revisá-las antes, mas você pode prosseguir.`,
        };
      }
      return { blocked: false, advisory: null };
    }
    default:
      return { blocked: false, advisory: null };
  }
}

/* ---------------------------------------------------------------------- */
/* Sinal interno de atenção do risco (nunca exposto como "risco técnico") */
/* Tabela qualitativa — não é soma numérica.                              */
/* ---------------------------------------------------------------------- */

const SIGNAL_TABLE = {
  "low|low": "low_signal", "low|medium": "low_signal", "low|high": "moderate_signal",
  "medium|low": "low_signal", "medium|medium": "moderate_signal", "medium|high": "high_signal",
  "high|low": "moderate_signal", "high|medium": "high_signal", "high|high": "high_signal",
};

function computeAttentionSignal(risk) {
  if (!risk.perceivedProbability || !risk.potentialSeverity) return null;
  let signal = SIGNAL_TABLE[`${risk.perceivedProbability}|${risk.potentialSeverity}`] || "moderate_signal";
  if (risk.responseCapacityAssessment === "good" && signal === "high_signal") signal = "moderate_signal";
  return signal;
}

/* ---------------------------------------------------------------------- */
/* Alertas                                                                */
/* ---------------------------------------------------------------------- */

function upsertAlert(diagnosis, ruleId, alertPartial) {
  const existing = diagnosis.alerts.find((a) => a.ruleId === ruleId);
  if (existing) {
    Object.assign(existing, alertPartial);
    return existing;
  }
  const alert = window.DataModel.createAlert({ ruleId, ...alertPartial });
  diagnosis.alerts.push(alert);
  return alert;
}

function removeAlert(diagnosis, ruleId) {
  diagnosis.alerts = diagnosis.alerts.filter((a) => a.ruleId !== ruleId);
}

function applyOrRemove(diagnosis, ruleId, condition, alertPartial) {
  if (condition) upsertAlert(diagnosis, ruleId, alertPartial);
  else removeAlert(diagnosis, ruleId);
}

/* ---------------------------------------------------------------------- */
/* Regras de coerência da Etapa 2 — Educação Ambiental (seção 25)         */
/* ---------------------------------------------------------------------- */

function runEACoherenceRules(diagnosis) {
  const ga = (id) => window.DataModel.getAnswer(diagnosis, id);

  // COH_EA_001: EA institucionalizada + projetos dependem do professor
  applyOrRemove(
    diagnosis,
    "COH_EA_001",
    ga("EA_INSTITUTIONAL_LEVEL") === "institutionalized_continuous" &&
      ga("EA_RECENT_CONTINUITY") === "depends_on_teacher",
    {
      type: "reflection",
      stage: 2,
      relatedFieldIds: ["EA_INSTITUTIONAL_LEVEL", "EA_RECENT_CONTINUITY"],
      message:
        "As respostas indicam Educação Ambiental institucionalizada, mas também apontam que a continuidade dos projetos depende da permanência de um(a) professor(a) específico(a). Vale refletir sobre o que sustenta essa institucionalização além das pessoas envolvidas hoje.",
    }
  );

  // COH_EA_002: interdisciplinaridade avançada + apenas um componente curricular
  const areas = ga("EA_CURRICULAR_AREAS") || [];
  applyOrRemove(
    diagnosis,
    "COH_EA_002",
    ["common_objectives", "collective_territorial_intervention", "joint_investigation"].includes(
      ga("EA_INTERDISCIPLINARITY_MODE")
    ) && areas.length <= 1,
    {
      type: "coherence",
      stage: 2,
      relatedFieldIds: ["EA_INTERDISCIPLINARITY_MODE", "EA_CURRICULAR_AREAS"],
      message:
        "Foi indicado um modo avançado de interdisciplinaridade, mas apenas uma área curricular foi registrada. Vale verificar se outras áreas envolvidas não foram assinaladas.",
    }
  );

  // COH_EA_003: EA institucionalizada + ausência no PPP
  applyOrRemove(
    diagnosis,
    "COH_EA_003",
    ga("EA_INSTITUTIONAL_LEVEL") === "institutionalized_continuous" &&
      ga("EA_PPP_STATUS") === "absent",
    {
      type: "reflection",
      stage: 2,
      relatedFieldIds: ["EA_INSTITUTIONAL_LEVEL", "EA_PPP_STATUS"],
      message:
        "A Educação Ambiental foi descrita como institucionalizada e contínua, mas ausente do PPP. Existem outros mecanismos institucionais (regimento, projetos permanentes, calendário fixo) que sustentam essa continuidade?",
    }
  );
}

/* Alerta reflexivo de participação (seção 20): apenas o cursista participou */
function runMethodologyAlerts(diagnosis) {
  const ga = (id) => window.DataModel.getAnswer(diagnosis, id);
  const participants = ga("MET_PARTICIPANTS") || [];
  applyOrRemove(
    diagnosis,
    "MET_PARTICIPATION_ALERT_RULE",
    participants.length === 1 && participants[0] === "only_respondent",
    {
      type: "reflection",
      stage: 0,
      relatedFieldIds: ["MET_PARTICIPANTS"],
      message:
        "Este diagnóstico foi respondido apenas pelo(a) cursista até o momento. Isso não invalida o processo, mas ampliar a escuta a outros sujeitos da comunidade escolar tende a enriquecer a leitura do território.",
    }
  );
}

/* ---------------------------------------------------------------------- */
/* Geração de candidatos — nunca conclusões automáticas (seções 22 e 38)  */
/* ---------------------------------------------------------------------- */

const FLOOD_TYPES = ["enchente", "inundacao", "alagamento", "enxurrada"];

function ensureCandidateProblem(diagnosis, candidateKey, partial) {
  const existing = diagnosis.problems.find((p) => p.candidateKey === candidateKey);
  if (existing) return existing;
  const problem = window.DataModel.createProblem({ candidateKey, confirmed: false, ...partial });
  diagnosis.problems.push(problem);
  return problem;
}

function generateProblemCandidates(diagnosis) {
  const ga = (id) => window.DataModel.getAnswer(diagnosis, id);

  // Cenário A: alagamento recorrente + ausência de procedimento de emergência
  const floodRisks = diagnosis.risks.filter((r) => FLOOD_TYPES.includes(r.riskType) && r.occurredBefore === "yes");
  const noProcedure = ga("NET_EMERGENCY_PROCEDURE") === "no";
  if (floodRisks.length > 0 && noProcedure) {
    ensureCandidateProblem(diagnosis, "CAND_FLOOD_NO_PROCEDURE", {
      title: "Ausência de procedimento de resposta a evento climático recorrente",
      description:
        "A comunidade escolar relata ocorrência recorrente de alagamentos/enchentes, mas não há procedimento de emergência identificado.",
      originDimensions: ["risks", "participation"],
      evidenceIds: floodRisks.flatMap((r) => r.evidenceIds),
    });
  } else {
    diagnosis.problems = diagnosis.problems.filter(
      (p) => !(p.candidateKey === "CAND_FLOOD_NO_PROCEDURE" && !p.confirmed)
    );
  }

  // Interrupção hídrica/estiagem recorrente (Cenário B) — candidato mais brando,
  // não conclui risco elevado automaticamente, apenas sugere leitura conjunta.
  const droughtRisks = diagnosis.risks.filter(
    (r) => ["estiagem", "seca", "falta_agua"].includes(r.riskType) && r.occurredBefore === "yes"
  );
  const waterInterruption = ga("WAT_INTERRUPTION") === "yes";
  if (droughtRisks.length > 0 && waterInterruption) {
    ensureCandidateProblem(diagnosis, "CAND_DROUGHT_WATER_SECURITY", {
      title: "Segurança hídrica da escola em períodos de estiagem",
      description:
        "Há relatos de estiagem/seca recorrente combinados com interrupções no abastecimento de água na escola.",
      originDimensions: ["risks", "territory"],
      evidenceIds: droughtRisks.flatMap((r) => r.evidenceIds),
    });
  } else {
    diagnosis.problems = diagnosis.problems.filter(
      (p) => !(p.candidateKey === "CAND_DROUGHT_WATER_SECURITY" && !p.confirmed)
    );
  }

  // Problemas territoriais de resíduos relatados
  if (ga("WST_TERRITORIAL_PROBLEMS") === "yes") {
    ensureCandidateProblem(diagnosis, "CAND_WASTE_TERRITORY", {
      title: "Problemas territoriais relacionados a resíduos",
      description: ga("WST_PROBLEM_DESCRIPTION") || "Foram relatados problemas territoriais associados a resíduos.",
      originDimensions: ["territory"],
    });
  } else {
    diagnosis.problems = diagnosis.problems.filter((p) => !(p.candidateKey === "CAND_WASTE_TERRITORY" && !p.confirmed));
  }
}

/* Sugestões de fortalecimento de rede/articulação a partir de riscos      */
/* selecionados e do nível de relação com atores relevantes (Cenário A)   */
function generateNetworkCapacitySuggestions(diagnosis) {
  const relevantCategories = ["defesa_civil", "saude", "assistencia_social"];
  const selectedRisks = window.DataModel.getSelectedRisks(diagnosis);
  if (selectedRisks.length === 0) return;

  const weakRelations = diagnosis.actors.filter(
    (a) =>
      relevantCategories.includes(a.category) &&
      a.existsInTerritory === "yes" &&
      ["knows_exists", "occasional_contact", "none"].includes(a.relationshipLevel)
  );

  weakRelations.forEach((actor) => {
    const swotKey = `CAND_SWOT_NETWORK_${actor.actorId}`;
    const already = diagnosis.swotItems.find((s) => s.systemSourceKey === swotKey);
    if (already) return;
    diagnosis.swotItems.push(
      window.DataModel.createSwotItem({
        category: "weakness",
        label: `Articulação com ${actor.name || "ator relevante"} ainda pouco consolidada`,
        description:
          "A escola registrou risco relevante e este ator existe no território, mas a relação ainda não é de parceria ou articulação permanente.",
        originDimension: "participation",
        systemSuggested: true,
        systemSourceKey: swotKey,
      })
    );
  });
}

/* ---------------------------------------------------------------------- */
/* Sugestões de FOFA a partir de dados já registrados (seção 36)          */
/* ---------------------------------------------------------------------- */

function generateSwotSuggestions(diagnosis) {
  // Ameaças a partir de riscos com sinal moderado/alto
  diagnosis.risks.forEach((risk) => {
    risk.attentionSignal = computeAttentionSignal(risk);
    if (!risk.selectedForPlanning) return;
    const key = `CAND_SWOT_THREAT_${risk.riskId}`;
    if (diagnosis.swotItems.some((s) => s.systemSourceKey === key)) return;
    diagnosis.swotItems.push(
      window.DataModel.createSwotItem({
        category: "threat",
        label: `Exposição a ${risk.riskType}`,
        description: risk.impactDescription || "",
        sourceQuestionIds: ["RISK_THREATS_SELECTED"],
        evidenceIds: risk.evidenceIds,
        originDimension: "risks",
        systemSuggested: true,
        systemSourceKey: key,
      })
    );
  });

  // Potencialidades a partir de atores com contribuições potenciais relevantes
  diagnosis.actors
    .filter((a) => (a.potentialContributions || []).length > 0)
    .forEach((actor) => {
      const key = `CAND_SWOT_OPP_${actor.actorId}`;
      if (diagnosis.swotItems.some((s) => s.systemSourceKey === key)) return;
      diagnosis.swotItems.push(
        window.DataModel.createSwotItem({
          category: "opportunity",
          label: `Potencial de parceria com ${actor.name}`,
          description: (actor.potentialContributions || []).join("; "),
          originDimension: "participation",
          systemSuggested: true,
          systemSourceKey: key,
        })
      );
    });

  generateNetworkCapacitySuggestions(diagnosis);
}

/* ---------------------------------------------------------------------- */
/* Alerta de meta percentual sem linha de base (seção 50)                 */
/* ---------------------------------------------------------------------- */

function runIndicatorAlerts(diagnosis) {
  diagnosis.alerts = diagnosis.alerts.filter((a) => !a.ruleId || !a.ruleId.startsWith("IND_BASELINE_"));
  diagnosis.indicators.forEach((ind) => {
    const hasPercentTarget = ind.target && /%/.test(ind.target);
    if (hasPercentTarget && ind.baselineUnknown) {
      upsertAlert(diagnosis, `IND_BASELINE_${ind.indicatorId}`, {
        type: "missing",
        stage: 9,
        relatedFieldIds: ["MON_BASELINE", "MON_TARGET"],
        message: `O indicador "${ind.name}" define uma meta percentual, mas a linha de base ainda é desconhecida. Não será possível interpretar o avanço até que a linha de base seja estabelecida.`,
      });
    }
  });
}

/* Lacunas de linha de base desconhecida (seção 50). Sincronizado aqui (e
   não dentro da renderização da Etapa 9) para evitar mutação do estado
   durante a própria renderização. */
function syncBaselineGaps(diagnosis) {
  diagnosis.knowledgeGaps = diagnosis.knowledgeGaps.filter((g) => !g.gapKey || diagnosis.indicators.some((i) => i.indicatorId === g.gapKey && i.baselineUnknown && i.name));
  diagnosis.indicators.forEach((ind) => {
    if (!ind.baselineUnknown || !ind.name) return;
    const exists = diagnosis.knowledgeGaps.some((g) => g.gapKey === ind.indicatorId);
    if (!exists) {
      diagnosis.knowledgeGaps.push(
        window.DataModel.createKnowledgeGap({
          dimension: "monitoring",
          gapKey: ind.indicatorId,
          description: `Linha de base desconhecida para o indicador "${ind.name}".`,
        })
      );
    }
  });
}

/* Educomunicação não é sinônimo de divulgação (seção 48): comunicação    */
/* somente unilateral (sem canal de escuta) gera reflexão, não erro.      */
function runCommunicationAlerts(diagnosis) {
  diagnosis.alerts = diagnosis.alerts.filter((a) => !a.ruleId || !a.ruleId.startsWith("COM_UNILATERAL_"));
  diagnosis.communicationStrategies.forEach((s) => {
    if ((s.media || []).length > 0 && (s.listeningChannels || []).length === 0) {
      upsertAlert(diagnosis, `COM_UNILATERAL_${s.communicationId}`, {
        type: "reflection",
        stage: 8,
        relatedFieldIds: ["COM_LISTENING_CHANNELS"],
        message: "Esta estratégia define meios de divulgação, mas nenhum canal de escuta. Educomunicação envolve diálogo, não apenas divulgação — vale considerar como a comunidade poderá responder.",
      });
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Orquestração — chamada após qualquer mutação relevante                 */
/* ---------------------------------------------------------------------- */

function runAllRules(diagnosis) {
  runMethodologyAlerts(diagnosis);
  runEACoherenceRules(diagnosis);
  generateProblemCandidates(diagnosis);
  generateSwotSuggestions(diagnosis);
  runIndicatorAlerts(diagnosis);
  syncBaselineGaps(diagnosis);
  runCommunicationAlerts(diagnosis);

  const overall = computeOverallProgress(diagnosis);
  diagnosis.metadata.completionPercentage = overall.percentage;
  if (diagnosis.metadata.status === "draft" && overall.percentage > 0) {
    diagnosis.metadata.status = "in_progress";
  }
}

window.Rules = {
  STAGE_META,
  computeStageProgress,
  computeOverallProgress,
  prerequisitesForStage,
  computeAttentionSignal,
  upsertAlert,
  removeAlert,
  runAllRules,
};
