"use strict";
/**
 * tutor-stages/stage6.js
 * Etapa 6 — Plano de ação, educomunicação e monitoramento (seções 34-44).
 */

(function () {

window.TutorStages = window.TutorStages || {};

const CONSISTENCY_SCALE = [
  { value: "consistent", label: "Consistente" },
  { value: "partially_consistent", label: "Parcialmente consistente" },
  { value: "needs_revision", label: "Precisa de revisão" },
  { value: "cannot_assess", label: "Não é possível avaliar" },
];

const CHANGE_VERBS = /reduzir|aumentar|melhorar|fortalecer|ampliar|diminuir|garantir|consolidar|assegurar|promover/i;

function relationshipLabel(level) {
  return { none: "sem relação", knows_exists: "sabe que existe", occasional_contact: "contato ocasional", partnership: "parceria", permanent_articulation: "articulação permanente" }[level] || "não informado";
}

function TraceabilityForPlan(plan, ctx) {
  const { TutorTraceabilityChain } = window.TutorComponents;
  const priority = (ctx.diagnosis.priorities || []).find((p) => p.priorityId === plan.priorityId);
  const problem = priority ? (ctx.diagnosis.problems || []).find((p) => p.problemId === priority.problemId) : null;
  const evidenceIds = problem ? problem.evidenceIds || [] : [];
  const indicators = (ctx.diagnosis.indicators || []).filter((i) => i.actionPlanId === plan.actionPlanId);

  return TutorTraceabilityChain([
    { label: "EVIDÊNCIA", value: evidenceIds.length ? `${evidenceIds.length} evidência(s) vinculada(s)` : null, missing: evidenceIds.length === 0 },
    { label: "PROBLEMA", value: problem ? problem.title : null, missing: !problem },
    { label: "PRIORIDADE", value: priority ? `#${priority.order || "?"}` : null, missing: !priority },
    { label: "OBJETIVO", value: plan.objective || null, missing: !plan.objective },
    { label: "AÇÃO", value: (plan.activities || []).length ? `${plan.activities.length} atividade(s)` : null, missing: !(plan.activities || []).length },
    { label: "RESULTADO", value: plan.expectedResult || null, missing: !plan.expectedResult },
    { label: "INDICADOR", value: indicators.length ? `${indicators.length} indicador(es)` : null, missing: indicators.length === 0 },
  ]);
}

function TutorActionPlanCard(plan, ctx) {
  const { el, TutorRatingField, TutorTextField } = window.TutorComponents;
  const review = ctx.getItemReview(plan.actionPlanId);
  const actorsById = {};
  (ctx.diagnosis.actors || []).forEach((a) => (actorsById[a.actorId] = a));
  const partners = (plan.partnerActorIds || []).map((id) => actorsById[id]).filter(Boolean);

  const card = el("div", { class: "action-plan-card tutor-item-card" });
  card.appendChild(el("h5", {}, plan.objective || "(objetivo não definido)"));
  if (!CHANGE_VERBS.test(plan.objective || "")) {
    card.appendChild(el("p", { class: "tutor-alert tutor-alert--reflection" }, "Este objetivo pode estar formulado como uma atividade. Que mudança se espera produzir por meio dela?"));
  }
  card.appendChild(TraceabilityForPlan(plan, ctx));
  card.appendChild(el("div", { class: "tutor-item-card__source" }, [
    el("p", {}, `Situação-problema descrita: ${plan.problemStatement || "(não informada)"}`),
    el("p", {}, `Público(s): ${(plan.audiences || []).join(", ") || "—"} · Participação estudantil: ${plan.studentParticipation || "—"}`),
    el("p", {}, `Parceiros envolvidos: ${partners.length ? partners.map((a) => `${a.name} (${relationshipLabel(a.relationshipLevel)})`).join("; ") : "nenhum registrado"}`),
    el("p", {}, `Resultado esperado: ${plan.expectedResult || "(não informado)"}`),
  ]));

  const evalWrap = el("div", { class: "tutor-item-card__evaluation" });
  [
    ["TUT_ACTION_DIAGNOSTIC_LINK", "Vínculo com o diagnóstico (TUT_ACTION_DIAGNOSTIC_LINK)"],
    ["TUT_ACTION_OBJECTIVE_QUALITY", "Qualidade do objetivo (TUT_ACTION_OBJECTIVE_QUALITY)"],
    ["TUT_ACTION_VIABILITY", "Viabilidade (TUT_ACTION_VIABILITY)"],
    ["TUT_ACTION_PARTICIPATION", "Participação prevista (TUT_ACTION_PARTICIPATION)"],
    ["TUT_ACTION_PARTNERS", "Adequação das parcerias (TUT_ACTION_PARTNERS)"],
    ["TUT_ACTION_RESULT_COHERENCE", "Coerência do resultado esperado (TUT_ACTION_RESULT_COHERENCE)"],
  ].forEach(([id, label]) => {
    evalWrap.appendChild(TutorRatingField(
      { id, focusKey: `${plan.actionPlanId}::${id}`, label, options: CONSISTENCY_SCALE },
      review[id], null, (v) => ctx.setItemField(plan.actionPlanId, id, v), null
    ));
  });
  evalWrap.appendChild(TutorTextField(
    { id: "TUT_ACTION_COMMENT", focusKey: `${plan.actionPlanId}::TUT_ACTION_COMMENT`, label: "Comentário (TUT_ACTION_COMMENT)" },
    review.TUT_ACTION_COMMENT, (v) => ctx.setItemField(plan.actionPlanId, "TUT_ACTION_COMMENT", v)
  ));
  card.appendChild(evalWrap);
  const itemComments = window.TutorComponents.ItemCommentBlock(ctx, "action", plan.actionPlanId);
  if (itemComments) card.appendChild(itemComments);
  return card;
}

function TutorCommunicationCard(strategy, ctx) {
  const { el, TutorRatingField, TutorTextField } = window.TutorComponents;
  const review = ctx.getItemReview(strategy.communicationId);
  const card = el("div", { class: "tutor-item-card" });
  card.appendChild(el("h5", {}, "Estratégia de educomunicação"));
  card.appendChild(el("div", { class: "tutor-item-card__source" }, [
    el("p", {}, `Finalidades: ${(strategy.purposes || []).join(", ") || "—"}`),
    el("p", {}, `Canais de escuta: ${(strategy.listeningChannels || []).length ? strategy.listeningChannels.join(", ") : "nenhum registrado"}`),
    el("p", {}, `Mídias/formatos: ${(strategy.media || []).join(", ") || "—"}`),
    el("p", { class: "field__help" }, "Podcast, mural, rádio, rede social ou Com-Vida não são, por si só, indicadores de qualidade — o meio não substitui a avaliação do processo."),
  ]));
  const evalWrap = el("div", { class: "tutor-item-card__evaluation" });
  [
    ["TUT_COM_PURPOSE", "Clareza de finalidade (TUT_COM_PURPOSE)"],
    ["TUT_COM_LISTENING", "Espaço de escuta (TUT_COM_LISTENING)"],
    ["TUT_COM_STUDENT_ROLE", "Papel dos estudantes (TUT_COM_STUDENT_ROLE)"],
    ["TUT_COM_ACCESSIBILITY", "Acessibilidade (TUT_COM_ACCESSIBILITY)"],
  ].forEach(([id, label]) => {
    evalWrap.appendChild(TutorRatingField(
      { id, focusKey: `${strategy.communicationId}::${id}`, label, options: CONSISTENCY_SCALE },
      review[id], null, (v) => ctx.setItemField(strategy.communicationId, id, v), null
    ));
  });
  evalWrap.appendChild(TutorTextField(
    { id: "TUT_COM_COMMENT", focusKey: `${strategy.communicationId}::TUT_COM_COMMENT`, label: "Comentário (TUT_COM_COMMENT)" },
    review.TUT_COM_COMMENT, (v) => ctx.setItemField(strategy.communicationId, "TUT_COM_COMMENT", v)
  ));
  card.appendChild(evalWrap);
  const itemComments = window.TutorComponents.ItemCommentBlock(ctx, "communication", strategy.communicationId);
  if (itemComments) card.appendChild(itemComments);
  return card;
}

function TutorIndicatorCard(indicator, ctx) {
  const { el, TutorRatingField, TutorTextField } = window.TutorComponents;
  const review = ctx.getItemReview(indicator.indicatorId);
  const card = el("div", { class: "indicator-card tutor-item-card" });
  card.appendChild(el("h5", {}, indicator.name || "(indicador sem nome)"));
  card.appendChild(el("div", { class: "tutor-item-card__source" }, [
    el("p", {}, `Linha de base: ${indicator.baselineUnknown ? "desconhecida" : indicator.baseline || "—"}`),
    el("p", {}, `Meta: ${indicator.target || "—"}`),
    el("p", {}, `Fonte de verificação: ${indicator.verificationSource || "—"}`),
    el("p", {}, `Periodicidade: ${indicator.periodicity || "—"}`),
    indicator.target && /%/.test(indicator.target) && indicator.baselineUnknown
      ? el("p", { class: "tutor-alert tutor-alert--critical" }, "Não há linha de base para interpretar a meta percentual.")
      : null,
  ]));
  const evalWrap = el("div", { class: "tutor-item-card__evaluation" });
  [
    ["TUT_MON_LINK", "Vínculo com o resultado esperado (TUT_MON_LINK)"],
    ["TUT_MON_BASELINE", "Linha de base (TUT_MON_BASELINE)"],
    ["TUT_MON_TARGET", "Meta (TUT_MON_TARGET)"],
    ["TUT_MON_SOURCE", "Fonte de verificação (TUT_MON_SOURCE)"],
    ["TUT_MON_PERIODICITY", "Periodicidade (TUT_MON_PERIODICITY)"],
  ].forEach(([id, label]) => {
    evalWrap.appendChild(TutorRatingField(
      { id, focusKey: `${indicator.indicatorId}::${id}`, label, options: CONSISTENCY_SCALE },
      review[id], null, (v) => ctx.setItemField(indicator.indicatorId, id, v), null
    ));
  });
  evalWrap.appendChild(TutorTextField(
    { id: "TUT_MON_COMMENT", focusKey: `${indicator.indicatorId}::TUT_MON_COMMENT`, label: "Comentário (TUT_MON_COMMENT)" },
    review.TUT_MON_COMMENT, (v) => ctx.setItemField(indicator.indicatorId, "TUT_MON_COMMENT", v)
  ));
  card.appendChild(evalWrap);
  const itemComments = window.TutorComponents.ItemCommentBlock(ctx, "indicator", indicator.indicatorId);
  if (itemComments) card.appendChild(itemComments);
  return card;
}

function renderCenter(ctx) {
  const { el } = window.TutorComponents;
  const wrap = el("div", { class: "stage-content" });
  if (!ctx.diagnosis) return el("p", { class: "muted" }, "Nenhum diagnóstico importado.");

  wrap.appendChild(el("h3", {}, "Planos de ação"));
  const plans = ctx.readCollection("actionPlans");
  if (!plans.available) wrap.appendChild(el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Esta informação não está disponível na versão importada."));
  else if (plans.items.length === 0) wrap.appendChild(el("p", { class: "muted" }, "Nenhum plano de ação registrado."));
  else plans.items.forEach((p) => wrap.appendChild(TutorActionPlanCard(p, ctx)));

  wrap.appendChild(el("h3", {}, "Educomunicação"));
  const comm = ctx.readCollection("communicationStrategies");
  if (!comm.available) wrap.appendChild(el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Esta informação não está disponível na versão importada."));
  else if (comm.items.length === 0) wrap.appendChild(el("p", { class: "muted" }, "Nenhuma estratégia registrada."));
  else comm.items.forEach((s) => wrap.appendChild(TutorCommunicationCard(s, ctx)));

  wrap.appendChild(el("h3", {}, "Monitoramento e indicadores"));
  const indicators = ctx.readCollection("indicators");
  if (!indicators.available) wrap.appendChild(el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Esta informação não está disponível na versão importada."));
  else if (indicators.items.length === 0) wrap.appendChild(el("p", { class: "muted" }, "Nenhum indicador registrado."));
  else indicators.items.forEach((i) => wrap.appendChild(TutorIndicatorCard(i, ctx)));

  return wrap;
}

function renderRight(ctx) {
  const { el, AlertList, CommentThread, KnowledgeGapPanel, alertHandlersFromCtx } = window.TutorComponents;
  const wrap = el("div", {});

  if (ctx.diagnosis) {
    const gaps = (ctx.diagnosis.knowledgeGaps || []).filter((g) => g.dimension === "monitoring");
    const panel = KnowledgeGapPanel(gaps, ctx);
    if (panel) wrap.appendChild(panel);
  }

  const alerts = ctx.alertsForStage();
  if (alerts.length) {
    wrap.appendChild(el("h4", {}, "Alertas"));
    wrap.appendChild(AlertList(alerts, alertHandlersFromCtx(ctx)));
  }

  wrap.appendChild(el("h4", {}, "Comentários e perguntas devolutivas"));
  wrap.appendChild(CommentThread({
    comments: ctx.commentsForStage(),
    questions: ctx.questionsFor("stage-6"),
    locked: ctx.locked,
    questionBank: ctx.questionBank,
    onAddComment: (c) => ctx.addComment(c, "stage", "stage-6"),
    onAddQuestion: (text) => ctx.addQuestion(text, "stage", "stage-6"),
    onResolveQuestion: ctx.resolveQuestion,
  }));

  return wrap;
}

window.TutorStages[6] = {
  id: 6,
  title: "Plano de ação, educomunicação e monitoramento",
  render(ctx) {
    return { center: renderCenter(ctx), right: renderRight(ctx) };
  },
};

})();
