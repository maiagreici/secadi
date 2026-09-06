"use strict";
/**
 * tutor-stages/stage7.js
 * Etapa 7 — Parecer formativo (seções 53-61).
 *
 * Esta é a única etapa em que a "camada do tutor" ocupa também a coluna
 * central: não há dado do cursista específico desta etapa a exibir (o
 * parecer é uma síntese autoral do tutor), então o formulário do parecer
 * fica no centro e a coluna direita mantém a rubrica transversal, o
 * histórico e as perguntas em aberto — mantendo a mesma lógica de que
 * tudo autorado pelo tutor aparece claramente identificado como tal.
 */

(function () {

window.TutorStages = window.TutorStages || {};

const FINAL_STATUS_OPTIONS = [
  { value: "adequate_to_continue", label: "Adequado para continuar" },
  { value: "adequate_with_minor_adjustments", label: "Adequado, com pequenos ajustes" },
  { value: "revision_required", label: "Revisão necessária" },
  { value: "significant_deepening_required", label: "Aprofundamento significativo necessário" },
];

const STAGES_WITH_DIAGNOSTIC_CONTENT = [
  { stage: 1, check: (d) => !!(d.methodology && Object.keys(d.methodology).length) },
  { stage: 2, check: (d) => !!(d.territory && Object.keys(d.territory).length) },
  { stage: 3, check: (d) => !!(d.environmentalEducation && Object.keys(d.environmentalEducation).length) },
  { stage: 4, check: (d) => (d.risks || []).length > 0 },
  { stage: 5, check: (d) => (d.swotItems || []).length > 0 || (d.priorities || []).length > 0 },
  { stage: 6, check: (d) => (d.actionPlans || []).length > 0 },
];

function findUnanalyzedCriticalStages(notebook, schoolId, version, diagnosis) {
  return STAGES_WITH_DIAGNOSTIC_CONTENT.filter(({ stage, check }) => {
    if (!check(diagnosis)) return false;
    const review = window.TutorDataModel.findStageReview(notebook, schoolId, stage, version);
    const hasStageFields = review && Object.keys(review.fields || {}).length > 0;
    const hasItemReviews = review && Object.keys(review.itemReviews || {}).length > 0;
    return !hasStageFields && !hasItemReviews;
  }).map((s) => s.stage);
}

function validateBlockers(ctx, fa, revisionRequested, pendingRevisions) {
  const blockers = [];
  if (!fa.TUT_FINAL_STATUS) blockers.push("A situação geral do parecer (TUT_FINAL_STATUS) ainda não foi definida.");
  if (!fa.TUT_FINAL_STRENGTHS || !fa.TUT_FINAL_STRENGTHS.trim()) blockers.push("Nenhuma potencialidade foi registrada (TUT_FINAL_STRENGTHS).");
  if (revisionRequested) {
    if (!fa.TUT_FINAL_DEEPENING || !fa.TUT_FINAL_DEEPENING.trim()) blockers.push("Ao solicitar revisão, é necessário indicar o ponto de aprofundamento (TUT_FINAL_DEEPENING).");
    if (!pendingRevisions.length) blockers.push("Ao solicitar revisão, é necessário indicar o que precisa ser revisto (pendingRevisions).");
  }
  if (ctx.diagnosis) {
    const unanalyzed = findUnanalyzedCriticalStages(ctx.notebook, ctx.schoolId, ctx.version, ctx.diagnosis);
    if (unanalyzed.length) {
      const names = unanalyzed.map((s) => window.TutorStages.STAGE_META[s].label).join(", ");
      blockers.push(`Há etapa(s) crítica(s) com conteúdo no diagnóstico ainda não analisadas pelo tutor: ${names}.`);
    }
  }
  return blockers;
}

function renderPendingRevisionsEditor(fa, ctx, container) {
  const { el } = window.TutorComponents;
  container.innerHTML = "";
  (fa.pendingRevisions || []).forEach((text, idx) => {
    container.appendChild(el("div", { class: "repeatable-group__item" }, [
      el("p", {}, text),
      ctx.locked ? null : el("button", {
        type: "button", class: "btn btn--ghost btn--small",
        onclick: () => { fa.pendingRevisions.splice(idx, 1); ctx.setFinalField("pendingRevisions", fa.pendingRevisions); },
      }, "Remover"),
    ]));
  });
}

function renderCenter(ctx) {
  const { el, TutorTextField } = window.TutorComponents;
  const wrap = el("div", { class: "stage-content" });
  if (!ctx.school) return el("p", { class: "muted" }, "Selecione uma escola no painel.");

  const fa = ctx.finalAssessment();
  const locked = ctx.locked || fa.locked;

  if (locked) {
    wrap.appendChild(el("div", { class: "tutor-alert tutor-alert--information" }, [
      el("p", {}, "O parecer desta versão já foi emitido e está encerrado (imutável). Para uma nova análise, importe uma nova versão do diagnóstico."),
    ]));
  }

  wrap.appendChild(el("h3", {}, "Parecer formativo"));

  const statusSelect = el("select", {
    class: "input input--select", disabled: locked,
    onchange: (e) => ctx.setFinalField("TUT_FINAL_STATUS", e.target.value || null),
  });
  statusSelect.appendChild(el("option", { value: "" }, "Selecione a situação geral..."));
  FINAL_STATUS_OPTIONS.forEach((o) => statusSelect.appendChild(el("option", { value: o.value, selected: fa.TUT_FINAL_STATUS === o.value }, o.label)));
  wrap.appendChild(el("div", { class: "tutor-field" }, [
    el("label", {}, "Situação geral (TUT_FINAL_STATUS)"),
    el("p", { class: "field__help" }, "Não exigir perfeição: lacunas reconhecidas e incertezas legítimas não impedem 'adequado para continuar'."),
    statusSelect,
  ]));

  wrap.appendChild(TutorTextField(
    { id: "TUT_FINAL_STRENGTHS", label: "O que está particularmente consistente neste diagnóstico? (TUT_FINAL_STRENGTHS)", rows: 3,
      help: "Campo obrigatório. Se não houver informação suficiente, registre: \"Não foi possível identificar potencialidades com segurança nesta etapa.\"" },
    fa.TUT_FINAL_STRENGTHS, (v) => ctx.setFinalField("TUT_FINAL_STRENGTHS", v)
  ));

  const revisionRequested = fa.TUT_FINAL_STATUS === "revision_required" || fa.TUT_FINAL_STATUS === "significant_deepening_required";

  wrap.appendChild(TutorTextField(
    { id: "TUT_FINAL_DEEPENING", label: `Pontos de aprofundamento (TUT_FINAL_DEEPENING)${revisionRequested ? " — obrigatório" : ""}`, rows: 3 },
    fa.TUT_FINAL_DEEPENING, (v) => ctx.setFinalField("TUT_FINAL_DEEPENING", v)
  ));

  wrap.appendChild(TutorTextField(
    { id: "TUT_FINAL_NEXT_STEP", label: "Próximo passo sugerido (TUT_FINAL_NEXT_STEP)", rows: 2 },
    fa.TUT_FINAL_NEXT_STEP, (v) => ctx.setFinalField("TUT_FINAL_NEXT_STEP", v)
  ));

  wrap.appendChild(el("h4", {}, "Pontos que precisam ser revistos (pendingRevisions)"));
  const list = el("div", { class: "repeatable-group" });
  renderPendingRevisionsEditor(fa, ctx, list);
  wrap.appendChild(list);
  if (!locked) {
    let draft = "";
    const input = el("input", { type: "text", class: "input", placeholder: "Descreva um ponto a ser revisto..." });
    input.addEventListener("input", (e) => (draft = e.target.value));
    wrap.appendChild(el("div", { class: "comment-thread__form" }, [
      input,
      el("button", {
        type: "button", class: "btn btn--secondary btn--small",
        onclick: () => {
          if (!draft.trim()) return;
          fa.pendingRevisions = fa.pendingRevisions || [];
          fa.pendingRevisions.push(draft);
          ctx.setFinalField("pendingRevisions", fa.pendingRevisions);
          input.value = "";
        },
      }, "+ Adicionar ponto a revisar"),
    ]));
  }

  wrap.appendChild(el("h4", {}, "Perguntas devolutivas em aberto"));
  const openQ = ctx.openQuestions();
  wrap.appendChild(el("ul", { class: "summary-card__list" },
    openQ.length ? openQ.map((q) => el("li", {}, q.text)) : [el("li", {}, "Nenhuma pergunta em aberto.")]
  ));

  if (!locked) {
    const blockers = validateBlockers(ctx, fa, revisionRequested, fa.pendingRevisions || []);
    const btnRow = el("div", { class: "stage-nav-buttons" });
    if (blockers.length) {
      wrap.appendChild(el("div", { class: "tutor-alert tutor-alert--revision" }, [
        el("p", { class: "tutor-alert__message" }, "Para emitir o parecer, resolva:"),
        el("ul", {}, blockers.map((b) => el("li", {}, b))),
      ]));
    }
    btnRow.appendChild(el("button", {
      class: "btn btn--primary", disabled: blockers.length > 0,
      onclick: () => {
        if (!confirm("Emitir o parecer encerra esta revisão de forma definitiva (imutável). Deseja continuar?")) return;
        ctx.emitFinalAssessment(fa.TUT_FINAL_STATUS, revisionRequested);
      },
    }, revisionRequested ? "Emitir parecer e solicitar revisão" : "Emitir parecer"));
    wrap.appendChild(btnRow);
  }

  return wrap;
}

function renderRight(ctx) {
  const { el, RubricPanel } = window.TutorComponents;
  const wrap = el("div", {});
  if (!ctx.school) return wrap;

  const fa = ctx.finalAssessment();
  const locked = ctx.locked || fa.locked;
  wrap.appendChild(RubricPanel(fa.rubric || (fa.rubric = window.TutorDataModel.createReviewRubric()), (axis, value) => ctx.setRubric(axis, value), locked));

  const history = window.TutorDataModel.getReviewHistoryForSchool(ctx.notebook, ctx.schoolId);
  wrap.appendChild(el("div", { class: "panel-card" }, [
    el("h4", {}, "Histórico de revisões"),
    history.length
      ? el("ul", { class: "summary-card__list" }, history.map((h) => el("li", {}, `v${h.diagnosisVersion} — ${h.status || "sem status"} — ${new Date(h.createdAt).toLocaleDateString("pt-BR")}${h.revisionRequested ? " (revisão solicitada)" : ""}`)))
      : el("p", { class: "muted" }, "Nenhuma revisão encerrada ainda."),
  ]));

  return wrap;
}

window.TutorStages[7] = {
  id: 7,
  title: "Parecer formativo",
  render(ctx) {
    return { center: renderCenter(ctx), right: renderRight(ctx) };
  },
};

})();
