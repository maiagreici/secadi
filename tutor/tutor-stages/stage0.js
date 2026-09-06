"use strict";
/**
 * tutor-stages/stage0.js
 * Etapa 0 — Identificação e acompanhamento (seção 15 da especificação).
 */

(function () {

window.TutorStages = window.TutorStages || {};

window.TutorStages.STAGE_META = [
  { id: 0, label: "Identificação e acompanhamento" },
  { id: 1, label: "Qualidade da construção do diagnóstico" },
  { id: 2, label: "Leitura territorial e socioambiental" },
  { id: 3, label: "Educação Ambiental, participação e redes" },
  { id: 4, label: "Vulnerabilidades, riscos e capacidades" },
  { id: 5, label: "Leitura integrada e priorização" },
  { id: 6, label: "Plano de ação, educomunicação e monitoramento" },
  { id: 7, label: "Parecer formativo" },
];

const REVIEW_STATUS_OPTIONS = [
  { value: "waiting_student", label: "Aguardando cursista" },
  { value: "ready_for_review", label: "Pronto para revisão" },
  { value: "under_review", label: "Em revisão" },
  { value: "revision_requested", label: "Revisão solicitada" },
  { value: "reviewed", label: "Revisado" },
  { value: "completed", label: "Concluído" },
];

function renderIdentificationCenter(ctx) {
  const { el, ReadOnlyField, ReadOnlySection } = window.TutorComponents;
  const wrap = el("div", { class: "stage-content" });

  wrap.appendChild(ReadOnlySection("Tutoria", [
    el("div", { class: "ro-field" }, [
      el("p", { class: "ro-field__label" }, "Tutor(a) / Turma"),
      el("p", { class: "ro-field__value" }, `${ctx.notebook.tutor.TUT_NAME || "(não identificado)"} — ${ctx.notebook.tutor.TUT_CLASS || "(turma não informada)"}`),
    ]),
  ]));

  if (!ctx.diagnosis) {
    wrap.appendChild(el("p", { class: "muted" }, "Nenhum diagnóstico importado para esta escola."));
    return wrap;
  }

  wrap.appendChild(ReadOnlySection("Escola", [
    ReadOnlyField("Nome da escola (SCH_NAME)", ctx.read("SCH_NAME")),
    ReadOnlyField("Município (SCH_CITY)", ctx.read("SCH_CITY")),
    ReadOnlyField("UF (SCH_STATE)", ctx.read("SCH_STATE")),
  ]));

  wrap.appendChild(ReadOnlySection("Cursista", [
    ReadOnlyField("Nome (RESP_NAME)", ctx.read("RESP_NAME")),
    ReadOnlyField("Função na escola (RESP_ROLE)", ctx.read("RESP_ROLE")),
  ]));

  const completion = ctx.diagnosis.metadata.completionPercentage;
  wrap.appendChild(ReadOnlySection("Diagnóstico", [
    el("div", { class: "ro-field" }, [
      el("p", { class: "ro-field__label" }, "Versão analisada (numeração local da tutoria)"),
      el("p", { class: "ro-field__value" }, ctx.version),
    ]),
    el("div", { class: "ro-field" }, [
      el("p", { class: "ro-field__label" }, "Progresso de preenchimento do diagnóstico"),
      el("div", { class: "progress-bar" }, [el("div", { class: "progress-bar__fill", style: `width:${completion || 0}%` })]),
      el("p", { class: "muted" }, `${completion || 0}% — percentual de preenchimento, não uma nota de qualidade.`),
    ]),
    el("div", { class: "ro-field" }, [
      el("p", { class: "ro-field__label" }, "Última atualização pelo cursista"),
      el("p", { class: "ro-field__value" }, ctx.diagnosis.metadata.updatedAt ? new Date(ctx.diagnosis.metadata.updatedAt).toLocaleString("pt-BR") : "—"),
    ]),
  ]));

  return wrap;
}

function renderIdentificationRight(ctx) {
  const { el, AlertList, CommentThread } = window.TutorComponents;
  const wrap = el("div", {});

  wrap.appendChild(el("div", { class: "panel-card" }, [
    el("h4", {}, "Status da tutoria (TUT_REVIEW_STATUS)"),
    el("p", { class: "field__help" }, "Fluxo principal: aguardando cursista → pronto para revisão → em revisão → revisado. Com revisão: em revisão → revisão solicitada → aguardando cursista."),
    (() => {
      const select = el("select", {
        class: "input input--select", disabled: !ctx.school,
        onchange: (e) => ctx.setReviewStatus(e.target.value),
      });
      REVIEW_STATUS_OPTIONS.forEach((o) => select.appendChild(el("option", { value: o.value, selected: ctx.school && ctx.school.reviewStatus === o.value }, o.label)));
      return select;
    })(),
    ctx.school && ctx.school.reviewStatus === "reviewed"
      ? el("button", {
          class: "btn btn--secondary btn--small", style: "margin-top:.5rem",
          onclick: () => ctx.setReviewStatus("completed"),
        }, "Concluir acompanhamento desta versão")
      : null,
  ]));

  const alerts = ctx.alertsForStage();
  if (alerts.length) {
    wrap.appendChild(el("h4", {}, "Alertas"));
    wrap.appendChild(AlertList(alerts, window.TutorComponents.alertHandlersFromCtx(ctx)));
  }

  wrap.appendChild(el("h4", {}, "Comentários e perguntas — geral"));
  wrap.appendChild(CommentThread({
    comments: ctx.commentsForStage(),
    questions: [],
    locked: ctx.locked,
    onAddComment: (c) => ctx.addComment(c, "stage", "stage-0"),
    onAddQuestion: null,
  }));

  return wrap;
}

window.TutorStages[0] = {
  id: 0,
  title: "Identificação e acompanhamento",
  render(ctx) {
    return { center: renderIdentificationCenter(ctx), right: renderIdentificationRight(ctx) };
  },
};

})();
