"use strict";
/**
 * tutor-stages/stage4.js
 * Etapa 4 — Vulnerabilidades, riscos e capacidades (seções 25-29).
 *
 * Adaptação de layout deliberada: o componente TutorRiskCard (seção 25)
 * combina, num único card, a exibição somente-leitura do risco e os
 * campos de avaliação do tutor referentes àquele risco específico — as
 * duas partes ficam claramente separadas dentro do card (rótulos "do
 * diagnóstico" vs. "leitura do tutor"), mas juntas fisicamente, porque
 * repeti-las em colunas distantes (ver seção 65) prejudicaria a leitura
 * de um item para o qual existem vários registros no diagnóstico. A
 * avaliação transversal (equilíbrio de capacidades) permanece na coluna
 * direita, junto dos alertas e comentários da etapa.
 */

(function () {

window.TutorStages = window.TutorStages || {};

const RISK_FOUNDATION_OPTIONS = [
  { value: "well_founded", label: "Bem fundamentado" },
  { value: "partially_founded", label: "Parcialmente fundamentado" },
  { value: "needs_deepening", label: "Precisa de aprofundamento" },
  { value: "insufficient_information", label: "Informação insuficiente" },
];
const EVIDENCE_STATUS_OPTIONS = [
  { value: "sufficient", label: "Suficiente" },
  { value: "mostly_sufficient", label: "Majoritariamente suficiente" },
  { value: "partial", label: "Parcial" },
  { value: "insufficient", label: "Insuficiente" },
  { value: "needs_deepening", label: "Precisa de aprofundamento" },
];
const UNCERTAINTY_STATUS_OPTIONS = [
  { value: "accepted", label: "Incerteza aceitável, pode permanecer registrada" },
  { value: "needs_investigation", label: "Precisa de investigação antes de decisões" },
  { value: "resolved", label: "Já foi resolvida" },
  { value: "not_applicable", label: "Não se aplica" },
];
const PERCEPTION_TECHNICAL_OPTIONS = [
  { value: "adequately_distinguished", label: "Adequadamente distinguida" },
  { value: "some_ambiguity", label: "Alguma ambiguidade" },
  { value: "needs_revision", label: "Precisa de revisão" },
  { value: "not_applicable", label: "Não se aplica" },
];
const VULNERABILITY_LANGUAGE_OPTIONS = [
  { value: "adequate", label: "Adequada" },
  { value: "needs_revision", label: "Precisa de revisão" },
  { value: "not_applicable", label: "Não se aplica" },
];
const CAPACITY_BALANCE_OPTIONS = [
  { value: "balanced", label: "Equilibrado" },
  { value: "mostly_deficit_focused", label: "Majoritariamente focado em fragilidades" },
  { value: "exclusively_deficit_focused", label: "Exclusivamente focado em fragilidades" },
  { value: "cannot_assess", label: "Não é possível avaliar" },
];

function TutorRiskCard(risk, ctx) {
  const { el, EvidenceList, TutorRatingField } = window.TutorComponents;
  const review = ctx.getItemReview(risk.riskId);
  const card = el("div", { class: "risk-card tutor-risk-card" });

  card.appendChild(el("h4", {}, risk.riskType || "(tipo de risco não informado)"));
  const readonly = el("div", { class: "tutor-risk-card__source" }, [
    el("p", { class: "ro-field__label" }, "Do diagnóstico do cursista"),
    el("p", {}, `Já ocorreu antes: ${risk.occurredBefore || "não informado"} — Frequência: ${risk.frequency || "não informada"}`),
    risk.impactDescription ? el("p", {}, `Impactos: ${risk.impactDescription}`) : null,
    (risk.exposedAssets || []).length || (risk.exposedGroups || []).length
      ? el("p", {}, `Exposição — bens: ${(risk.exposedAssets || []).join(", ") || "—"}; grupos: ${(risk.exposedGroups || []).join(", ") || "—"}`)
      : null,
    (risk.vulnerabilityConditions || []).length ? el("p", {}, `Vulnerabilidades relatadas: ${risk.vulnerabilityConditions.join(", ")}`) : null,
    (risk.responseCapacities || []).length ? el("p", {}, `Capacidades de resposta relatadas: ${risk.responseCapacities.join(", ")}`) : null,
    el("p", {}, `Probabilidade percebida: ${risk.perceivedProbability || "não informada"} — Severidade potencial: ${risk.potentialSeverity || "não informada"}`),
    el("p", {}, `Nível de atenção da comunidade: ${risk.communityAttentionLevel || "não informado"}`),
    risk.knowledgeGap ? el("p", { class: "tag" }, "Registrado como lacuna de conhecimento (\"não sabemos\")") : null,
    el("p", { class: "ro-field__label" }, "Evidências vinculadas"),
    EvidenceList(ctx.diagnosis, risk.evidenceIds, ctx),
  ]);
  card.appendChild(readonly);

  const tutorPart = el("div", { class: "tutor-risk-card__evaluation" }, [el("p", { class: "ro-field__label" }, "Leitura do tutor")]);
  tutorPart.appendChild(TutorRatingField(
    { id: "TUT_RISK_FOUNDATION", focusKey: `${risk.riskId}::TUT_RISK_FOUNDATION`, label: "Fundamentação do risco (TUT_RISK_FOUNDATION)", options: RISK_FOUNDATION_OPTIONS, commentLabel: "Comentário (TUT_RISK_COMMENT)",
      help: "Prefira \"a fundamentação precisa ser aprofundada\" a \"o risco está errado\"." },
    review.TUT_RISK_FOUNDATION, review.TUT_RISK_COMMENT,
    (v) => ctx.setItemField(risk.riskId, "TUT_RISK_FOUNDATION", v),
    (v) => ctx.setItemField(risk.riskId, "TUT_RISK_COMMENT", v)
  ));
  tutorPart.appendChild(TutorRatingField(
    { id: "TUT_RISK_EVIDENCE_STATUS", focusKey: `${risk.riskId}::TUT_RISK_EVIDENCE_STATUS`, label: "Situação da evidência (TUT_RISK_EVIDENCE_STATUS)", options: EVIDENCE_STATUS_OPTIONS },
    review.TUT_RISK_EVIDENCE_STATUS, null, (v) => ctx.setItemField(risk.riskId, "TUT_RISK_EVIDENCE_STATUS", v), null
  ));
  tutorPart.appendChild(TutorRatingField(
    { id: "TUT_RISK_UNCERTAINTY_STATUS", focusKey: `${risk.riskId}::TUT_RISK_UNCERTAINTY_STATUS`, label: "Situação da incerteza (TUT_RISK_UNCERTAINTY_STATUS)", options: UNCERTAINTY_STATUS_OPTIONS },
    review.TUT_RISK_UNCERTAINTY_STATUS, null, (v) => ctx.setItemField(risk.riskId, "TUT_RISK_UNCERTAINTY_STATUS", v), null
  ));
  tutorPart.appendChild(TutorRatingField(
    { id: "TUT_PERCEPTION_TECHNICAL_DISTINCTION", focusKey: `${risk.riskId}::TUT_PERCEPTION_TECHNICAL_DISTINCTION`, label: "Percepção x dado técnico (TUT_PERCEPTION_TECHNICAL_DISTINCTION)", options: PERCEPTION_TECHNICAL_OPTIONS,
      help: "Ex.: \"moradores relatam percepção de aumento do calor\" é adequado; \"a temperatura aumentou significativamente\" sem dado técnico não é." },
    review.TUT_PERCEPTION_TECHNICAL_DISTINCTION, null, (v) => ctx.setItemField(risk.riskId, "TUT_PERCEPTION_TECHNICAL_DISTINCTION", v), null
  ));
  tutorPart.appendChild(TutorRatingField(
    { id: "TUT_VULNERABILITY_LANGUAGE", focusKey: `${risk.riskId}::TUT_VULNERABILITY_LANGUAGE`, label: "Linguagem sobre vulnerabilidade (TUT_VULNERABILITY_LANGUAGE)", options: VULNERABILITY_LANGUAGE_OPTIONS,
      help: "Evite formulações essencialistas (ex.: \"pessoas com deficiência são vulneráveis\")." },
    review.TUT_VULNERABILITY_LANGUAGE, null, (v) => ctx.setItemField(risk.riskId, "TUT_VULNERABILITY_LANGUAGE", v), null
  ));
  card.appendChild(tutorPart);

  const itemComments = window.TutorComponents.ItemCommentBlock(ctx, "risk", risk.riskId);
  if (itemComments) card.appendChild(itemComments);

  return card;
}

function renderCenter(ctx) {
  const { el, ReadOnlySection, ReadOnlyField, ReadOnlyText } = window.TutorComponents;
  const wrap = el("div", { class: "stage-content" });
  if (!ctx.diagnosis) return el("p", { class: "muted" }, "Nenhum diagnóstico importado.");

  const risksResult = ctx.readCollection("risks");
  wrap.appendChild(el("h3", {}, "Riscos"));
  if (!risksResult.available) {
    wrap.appendChild(el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Esta informação não está disponível na versão importada."));
  } else if (risksResult.items.length === 0) {
    wrap.appendChild(el("p", { class: "muted" }, "Nenhum risco registrado."));
  } else {
    risksResult.items.forEach((risk) => wrap.appendChild(TutorRiskCard(risk, ctx)));
  }

  const cap = ctx.diagnosis.adaptiveCapacities;
  const capSection = ReadOnlySection("Capacidades adaptativas relatadas", []);
  if (!cap) {
    capSection.appendChild(el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Esta informação não está disponível na versão importada."));
  } else {
    ["pedagogical", "social", "institutional", "territorial", "material"].forEach((key) => {
      const label = { pedagogical: "Pedagógicas", social: "Sociais", institutional: "Institucionais", territorial: "Territoriais", material: "Materiais" }[key];
      capSection.appendChild(ReadOnlyField(`Capacidades ${label}`, { available: true, value: cap[key] }));
    });
    capSection.appendChild(ReadOnlyField("Prioridade para fortalecimento (CAP_PRIORITY_TO_STRENGTHEN)", { available: true, value: cap.CAP_PRIORITY_TO_STRENGTHEN }));
    capSection.appendChild(ReadOnlyText("Justificativa (CAP_PRIORITY_REASON)", cap.CAP_PRIORITY_REASON));
  }
  wrap.appendChild(capSection);

  return wrap;
}

function renderRight(ctx) {
  const { el, TutorRatingField, AlertList, CommentThread, KnowledgeGapPanel, alertHandlersFromCtx } = window.TutorComponents;
  const wrap = el("div", {});
  const F = (id) => ctx.getField(id);
  const set = (id) => (v) => ctx.setField(id, v);

  const card = el("div", { class: "panel-card" }, [
    el("h4", {}, "Equilíbrio diagnóstico (seção 29)"),
    el("p", { class: "field__help" }, "Se o diagnóstico estiver fortemente centrado em fragilidades, verifique se capacidades também precisam ser identificadas — sem inventar capacidades que não foram relatadas."),
  ]);
  card.appendChild(TutorRatingField(
    { id: "TUT_CAPACITY_BALANCE", label: "Equilíbrio entre fragilidades e capacidades (TUT_CAPACITY_BALANCE)", options: CAPACITY_BALANCE_OPTIONS, commentLabel: "Comentário (TUT_CAPACITY_COMMENT)" },
    F("TUT_CAPACITY_BALANCE"), F("TUT_CAPACITY_COMMENT"), set("TUT_CAPACITY_BALANCE"), set("TUT_CAPACITY_COMMENT")
  ));
  wrap.appendChild(card);

  if (ctx.diagnosis) {
    const gaps = (ctx.diagnosis.knowledgeGaps || []).filter((g) => g.dimension === "risks");
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
    questions: ctx.questionsFor("stage-4"),
    locked: ctx.locked,
    questionBank: ctx.questionBank,
    onAddComment: (c) => ctx.addComment(c, "stage", "stage-4"),
    onAddQuestion: (text) => ctx.addQuestion(text, "stage", "stage-4"),
    onResolveQuestion: ctx.resolveQuestion,
  }));

  return wrap;
}

window.TutorStages[4] = {
  id: 4,
  title: "Vulnerabilidades, riscos e capacidades",
  render(ctx) {
    return { center: renderCenter(ctx), right: renderRight(ctx) };
  },
};

})();
