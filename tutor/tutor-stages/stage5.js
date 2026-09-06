"use strict";
/**
 * tutor-stages/stage5.js
 * Etapa 5 — Leitura integrada e priorização (seções 30-33).
 * Mesma adaptação de layout da Etapa 4: cards combinam leitura + avaliação
 * por item (FOFA e prioridades), pois cada item tem sua própria avaliação.
 */

(function () {

window.TutorStages = window.TutorStages || {};

const SWOT_JUDGMENT_OPTIONS = [
  { value: "consistent", label: "Consistente" },
  { value: "mostly_consistent", label: "Majoritariamente consistente" },
  { value: "needs_revision", label: "Precisa de revisão" },
  { value: "insufficient_information", label: "Informação insuficiente" },
];
const CATEGORY_LABEL = { strength: "Força", weakness: "Fraqueza", opportunity: "Oportunidade", threat: "Ameaça" };
const COHERENCE_OPTIONS = [
  { value: "adequate", label: "Adequada" },
  { value: "ambiguous", label: "Ambígua" },
  { value: "needs_revision", label: "Precisa de revisão" },
  { value: "not_applicable", label: "Não se aplica" },
];
const GOVERNABILITY_OPTIONS = [
  { value: "within_school_governability", label: "Sob governabilidade da escola" },
  { value: "partially_within_governability", label: "Parcialmente sob governabilidade da escola" },
  { value: "outside_school_governability", label: "Fora da governabilidade da escola" },
  { value: "cannot_assess", label: "Não é possível avaliar" },
];

function TutorSwotCard(item, ctx) {
  const { el, EvidenceList, TutorRatingField } = window.TutorComponents;
  const review = ctx.getItemReview(item.swotItemId);
  const card = el("div", { class: `swot-card swot-card--${item.category} tutor-item-card` });
  card.appendChild(el("h5", {}, `${CATEGORY_LABEL[item.category] || item.category}: ${item.label || "(sem rótulo)"}`));
  card.appendChild(el("div", { class: "tutor-item-card__source" }, [
    item.description ? el("p", {}, item.description) : null,
    el("p", { class: "muted" }, `Origem: ${item.originDimension || "não informada"}${item.systemSuggested ? " — sugestão do sistema" : ""}${item.userConfirmed ? " — confirmado pela escola" : ""}`),
    EvidenceList(ctx.diagnosis, item.evidenceIds),
  ]));
  const evalWrap = el("div", { class: "tutor-item-card__evaluation" });
  evalWrap.appendChild(TutorRatingField(
    { id: "TUT_SWOT_CLASSIFICATION", focusKey: `${item.swotItemId}::TUT_SWOT_CLASSIFICATION`, label: "Classificação (TUT_SWOT_CLASSIFICATION)", options: SWOT_JUDGMENT_OPTIONS,
      help: "Se uma fraqueza parecer externa ou uma oportunidade parecer interna, verifique se o elemento depende predominantemente da escola ou do contexto — a decisão é da escola/tutor, o sistema nunca reclassifica sozinho." },
    review.TUT_SWOT_CLASSIFICATION, null, (v) => ctx.setItemField(item.swotItemId, "TUT_SWOT_CLASSIFICATION", v), null
  ));
  evalWrap.appendChild(TutorRatingField(
    { id: "TUT_SWOT_TRACEABILITY", focusKey: `${item.swotItemId}::TUT_SWOT_TRACEABILITY`, label: "Rastreabilidade (TUT_SWOT_TRACEABILITY)", options: SWOT_JUDGMENT_OPTIONS, commentLabel: "Comentário (TUT_SWOT_COMMENT)" },
    review.TUT_SWOT_TRACEABILITY, review.TUT_SWOT_COMMENT,
    (v) => ctx.setItemField(item.swotItemId, "TUT_SWOT_TRACEABILITY", v),
    (v) => ctx.setItemField(item.swotItemId, "TUT_SWOT_COMMENT", v)
  ));
  card.appendChild(evalWrap);
  const itemComments = window.TutorComponents.ItemCommentBlock(ctx, "swot", item.swotItemId);
  if (itemComments) card.appendChild(itemComments);
  return card;
}

function TutorPriorityCard(priority, problem, ctx) {
  const { el, EvidenceList, TutorRatingField, TutorTextField } = window.TutorComponents;
  const review = ctx.getItemReview(priority.priorityId);
  const card = el("div", { class: "priority-card tutor-item-card" });
  card.appendChild(el("h5", {}, `#${priority.order || "?"} ${problem ? problem.title : "(problema não encontrado)"}`));
  card.appendChild(el("div", { class: "tutor-item-card__source" }, [
    problem ? el("p", {}, problem.description || "") : el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Problema de origem não encontrado no diagnóstico."),
    el("p", {}, `Severidade: ${problem?.severity || "—"} · Urgência: ${problem?.urgency || "—"} · Alcance: ${problem?.reach || "—"} · Governabilidade da escola: ${problem?.schoolActionability || "—"}`),
    el("p", {}, `Justificativa da escola: ${priority.justification || "(não informada)"}`),
    el("p", {}, `Mudança esperada: ${priority.expectedChange || "(não informada)"}`),
    el("p", { class: "ro-field__label" }, "Evidências do problema de origem"),
    EvidenceList(ctx.diagnosis, problem?.evidenceIds),
  ]));
  const evalWrap = el("div", { class: "tutor-item-card__evaluation" });
  evalWrap.appendChild(TutorRatingField(
    { id: "TUT_PRIORITY_TRACEABILITY", focusKey: `${priority.priorityId}::TUT_PRIORITY_TRACEABILITY`, label: "A prioridade decorre do diagnóstico? (TUT_PRIORITY_TRACEABILITY)", options: SWOT_JUDGMENT_OPTIONS },
    review.TUT_PRIORITY_TRACEABILITY, null, (v) => ctx.setItemField(priority.priorityId, "TUT_PRIORITY_TRACEABILITY", v), null
  ));
  evalWrap.appendChild(TutorRatingField(
    { id: "TUT_PRIORITY_JUSTIFICATION", focusKey: `${priority.priorityId}::TUT_PRIORITY_JUSTIFICATION`, label: "Qualidade da justificativa (TUT_PRIORITY_JUSTIFICATION)", options: COHERENCE_OPTIONS },
    review.TUT_PRIORITY_JUSTIFICATION, null, (v) => ctx.setItemField(priority.priorityId, "TUT_PRIORITY_JUSTIFICATION", v), null
  ));
  evalWrap.appendChild(TutorRatingField(
    { id: "TUT_PRIORITY_GOVERNABILITY", focusKey: `${priority.priorityId}::TUT_PRIORITY_GOVERNABILITY`, label: "Governabilidade (TUT_PRIORITY_GOVERNABILITY)", options: GOVERNABILITY_OPTIONS },
    review.TUT_PRIORITY_GOVERNABILITY, null, (v) => ctx.setItemField(priority.priorityId, "TUT_PRIORITY_GOVERNABILITY", v), null
  ));
  evalWrap.appendChild(TutorTextField(
    { id: "TUT_PRIORITY_COMMENT", focusKey: `${priority.priorityId}::TUT_PRIORITY_COMMENT`, label: "Comentário (TUT_PRIORITY_COMMENT)" },
    review.TUT_PRIORITY_COMMENT, (v) => ctx.setItemField(priority.priorityId, "TUT_PRIORITY_COMMENT", v)
  ));
  card.appendChild(evalWrap);
  const itemComments = window.TutorComponents.ItemCommentBlock(ctx, "priority", priority.priorityId);
  if (itemComments) card.appendChild(itemComments);
  return card;
}

function renderCenter(ctx) {
  const { el } = window.TutorComponents;
  const wrap = el("div", { class: "stage-content" });
  if (!ctx.diagnosis) return el("p", { class: "muted" }, "Nenhum diagnóstico importado.");

  wrap.appendChild(el("h3", {}, "Matriz FOFA"));
  const swot = ctx.readCollection("swotItems");
  if (!swot.available) wrap.appendChild(el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Esta informação não está disponível na versão importada."));
  else if (swot.items.length === 0) wrap.appendChild(el("p", { class: "muted" }, "Nenhum item registrado."));
  else swot.items.forEach((item) => wrap.appendChild(TutorSwotCard(item, ctx)));

  wrap.appendChild(el("h3", {}, "Prioridades"));
  const priorities = ctx.readCollection("priorities");
  if (!priorities.available) wrap.appendChild(el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Esta informação não está disponível na versão importada."));
  else if (priorities.items.length === 0) wrap.appendChild(el("p", { class: "muted" }, "Nenhuma prioridade registrada."));
  else {
    priorities.items
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach((p) => {
        const problem = (ctx.diagnosis.problems || []).find((pr) => pr.problemId === p.problemId);
        wrap.appendChild(TutorPriorityCard(p, problem, ctx));
      });
  }
  return wrap;
}

function renderRight(ctx) {
  const { el, AlertList, CommentThread, alertHandlersFromCtx } = window.TutorComponents;
  const wrap = el("div", {});
  wrap.appendChild(el("p", { class: "field__help panel-card" }, "Pergunta central desta etapa: a prioridade escolhida decorre do diagnóstico? Problemas sem evidência vinculada aparecem sinalizados abaixo, mas nunca são excluídos automaticamente."));

  const alerts = ctx.alertsForStage();
  if (alerts.length) {
    wrap.appendChild(el("h4", {}, "Alertas"));
    wrap.appendChild(AlertList(alerts, alertHandlersFromCtx(ctx)));
  }

  wrap.appendChild(el("h4", {}, "Comentários e perguntas devolutivas"));
  wrap.appendChild(CommentThread({
    comments: ctx.commentsForStage(),
    questions: ctx.questionsFor("stage-5"),
    locked: ctx.locked,
    questionBank: ctx.questionBank,
    onAddComment: (c) => ctx.addComment(c, "stage", "stage-5"),
    onAddQuestion: (text) => ctx.addQuestion(text, "stage", "stage-5"),
    onResolveQuestion: ctx.resolveQuestion,
  }));

  return wrap;
}

window.TutorStages[5] = {
  id: 5,
  title: "Leitura integrada e priorização",
  render(ctx) {
    return { center: renderCenter(ctx), right: renderRight(ctx) };
  },
};

})();
