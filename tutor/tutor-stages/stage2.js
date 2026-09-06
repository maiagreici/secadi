"use strict";
/**
 * tutor-stages/stage2.js
 * Etapa 2 — Leitura territorial e socioambiental (seções 18-20).
 */

(function () {

window.TutorStages = window.TutorStages || {};

const CONTEXTUALIZATION_OPTIONS = [
  { value: "isolated_school_view", label: "Leitura isolada da escola" },
  { value: "some_territorial_links", label: "Alguns vínculos territoriais" },
  { value: "contextualized", label: "Contextualizada" },
  { value: "integrated_territorial_reading", label: "Leitura territorial integrada" },
  { value: "cannot_assess", label: "Não é possível avaliar" },
];
const CAUSALITY_OPTIONS = [
  { value: "adequate", label: "Adequada" },
  { value: "ambiguous", label: "Ambígua" },
  { value: "needs_revision", label: "Precisa de revisão" },
  { value: "not_applicable", label: "Não se aplica" },
];
const MAP_ASSESSMENT_OPTIONS = [
  { value: "performed", label: "Realizada" },
  { value: "not_performed_justified", label: "Não realizada, com justificativa" },
  { value: "not_performed_without_context", label: "Não realizada, sem contexto explicativo" },
];
const COMPLETENESS_OPTIONS = window.TutorComponents ? window.TutorComponents.RUBRIC_OPTIONS : [];
const EVIDENCE_SUFFICIENCY_OPTIONS = [
  { value: "sufficient", label: "Suficiente" },
  { value: "mostly_sufficient", label: "Majoritariamente suficiente" },
  { value: "partial", label: "Parcial" },
  { value: "insufficient", label: "Insuficiente" },
  { value: "needs_deepening", label: "Precisa de aprofundamento" },
];

function renderCenter(ctx) {
  const { el, ReadOnlyField, ReadOnlyText, ReadOnlySection } = window.TutorComponents;
  const wrap = el("div", { class: "stage-content" });
  if (!ctx.diagnosis) return el("p", { class: "muted" }, "Nenhum diagnóstico importado.");

  wrap.appendChild(ReadOnlySection("Infraestrutura e condições térmicas", [
    ReadOnlyField("Condição térmica geral (INF_THERMAL_CONDITION)", ctx.read("INF_THERMAL_CONDITION")),
    ReadOnlyField("Problemas térmicos/estruturais (INF_THERMAL_PROBLEMS)", ctx.read("INF_THERMAL_PROBLEMS")),
  ]));
  wrap.appendChild(ReadOnlySection("Água e saneamento", [
    ReadOnlyField("Fonte de abastecimento (WAT_SOURCE)", ctx.read("WAT_SOURCE")),
    ReadOnlyField("Interrupções no abastecimento (WAT_INTERRUPTION)", ctx.read("WAT_INTERRUPTION")),
    ReadOnlyField("Destinação do esgoto (SAN_SEWAGE_DESTINATION)", ctx.read("SAN_SEWAGE_DESTINATION")),
    ReadOnlyField("Alagamentos (SAN_FLOOD_OCCURRENCE)", ctx.read("SAN_FLOOD_OCCURRENCE")),
  ]));
  wrap.appendChild(ReadOnlySection("Resíduos", [
    ReadOnlyField("Separação de resíduos (WST_SEPARATION)", ctx.read("WST_SEPARATION")),
    ReadOnlyField("Problemas territoriais de resíduos (WST_TERRITORIAL_PROBLEMS)", ctx.read("WST_TERRITORIAL_PROBLEMS")),
    ReadOnlyText("Descrição (WST_PROBLEM_DESCRIPTION)", ctx.read("WST_PROBLEM_DESCRIPTION").value),
  ]));
  wrap.appendChild(ReadOnlySection("Elementos territoriais e atividades econômicas", [
    ReadOnlyField("Elementos do território (TER_ELEMENTS)", ctx.read("TER_ELEMENTS")),
    ReadOnlyField("Atividades econômicas (TER_ECONOMIC_ACTIVITIES)", ctx.read("TER_ECONOMIC_ACTIVITIES")),
    ReadOnlyField("Impacto percebido dessas atividades (TER_ECON_IMPACT_EXISTS)", ctx.read("TER_ECON_IMPACT_EXISTS")),
  ]));
  wrap.appendChild(ReadOnlySection("Sazonalidade e memória climática", [
    ReadOnlyField("Eventos sazonais (TER_SEASONAL_EVENTS)", ctx.read("TER_SEASONAL_EVENTS")),
    ReadOnlyText("Impacto dos eventos sazonais (TER_SEASONAL_IMPACT)", ctx.read("TER_SEASONAL_IMPACT").value),
    ReadOnlyField("Histórico de eventos climáticos extremos (TER_CLIMATE_EVENT_HISTORY)", ctx.read("TER_CLIMATE_EVENT_HISTORY")),
    ReadOnlyText("Descrição do(s) evento(s) (TER_CLIMATE_EVENT_DESC)", ctx.read("TER_CLIMATE_EVENT_DESC").value),
    ReadOnlyText("Aprendizado registrado (TER_CLIMATE_LEARNING)", ctx.read("TER_CLIMATE_LEARNING").value),
  ]));
  wrap.appendChild(ReadOnlySection("Síntese territorial do cursista", [
    ReadOnlyText("Características-chave do território (TER_KEY_CHARACTERISTICS)", ctx.read("TER_KEY_CHARACTERISTICS").value),
    ReadOnlyText("Aspectos reconhecidos como não sabidos (TER_MISSING_ASPECT)", ctx.read("TER_MISSING_ASPECT").value),
  ]));

  const cartography = ctx.diagnosis.cartography;
  const mapSection = ReadOnlySection("Cartografia (seção 20)", []);
  if (!cartography) {
    mapSection.appendChild(el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Esta informação não está disponível na versão importada."));
  } else if (cartography.MAP_FILE) {
    mapSection.appendChild(el("p", { class: "ro-field__value" }, "Cartografia registrada (arquivo anexado pelo cursista)."));
    mapSection.appendChild(ReadOnlyField("Participantes (MAP_PARTICIPANTS)", { available: true, value: cartography.MAP_PARTICIPANTS }));
    mapSection.appendChild(ReadOnlyText("Novos achados (MAP_NEW_FINDINGS)", cartography.MAP_NEW_FINDINGS));
    mapSection.appendChild(ReadOnlyField("Diferenças de percepção (MAP_PERCEPTION_DIFFERENCES)", { available: true, value: cartography.MAP_PERCEPTION_DIFFERENCES }));
  } else {
    mapSection.appendChild(el("p", { class: "ro-field__value ro-field__value--empty" }, "Cartografia não realizada."));
    mapSection.appendChild(ReadOnlyText("Motivo informado (MAP_NOT_DONE_REASON)", cartography.MAP_NOT_DONE_REASON));
  }
  wrap.appendChild(mapSection);

  return wrap;
}

function renderRight(ctx) {
  const { el, TutorRatingField, TutorTextField, AlertList, CommentThread, alertHandlersFromCtx } = window.TutorComponents;
  const wrap = el("div", {});
  const F = (id) => ctx.getField(id);
  const set = (id) => (v) => ctx.setField(id, v);

  const card1 = el("div", { class: "panel-card" }, [el("h4", {}, "Leitura territorial (seção 18)")]);
  card1.appendChild(TutorRatingField(
    { id: "TUT_TERRITORY_COMPLETENESS", label: "Completude da leitura territorial (TUT_TERRITORY_COMPLETENESS)", options: COMPLETENESS_OPTIONS },
    F("TUT_TERRITORY_COMPLETENESS"), null, set("TUT_TERRITORY_COMPLETENESS"), null
  ));
  card1.appendChild(TutorRatingField(
    { id: "TUT_TERRITORY_CONTEXTUALIZATION", label: "Contextualização territorial (TUT_TERRITORY_CONTEXTUALIZATION)", options: CONTEXTUALIZATION_OPTIONS },
    F("TUT_TERRITORY_CONTEXTUALIZATION"), null, set("TUT_TERRITORY_CONTEXTUALIZATION"), null
  ));
  card1.appendChild(TutorRatingField(
    { id: "TUT_TERRITORY_EVIDENCE", label: "Suficiência da evidência territorial (TUT_TERRITORY_EVIDENCE)", options: EVIDENCE_SUFFICIENCY_OPTIONS, commentLabel: "Comentário (TUT_TERRITORY_COMMENT)" },
    F("TUT_TERRITORY_EVIDENCE"), F("TUT_TERRITORY_COMMENT"), set("TUT_TERRITORY_EVIDENCE"), set("TUT_TERRITORY_COMMENT")
  ));
  wrap.appendChild(card1);

  const card2 = el("div", { class: "panel-card" }, [
    el("h4", {}, "Causalidade (seção 19)"),
    el("p", { class: "field__help" }, "A existência de uma atividade econômica ou elemento territorial não comprova, por si só, um impacto ambiental. Verifique se afirmações de causa e efeito têm evidência correspondente."),
  ]);
  card2.appendChild(TutorRatingField(
    { id: "TUT_CAUSALITY_STATUS", label: "Situação da causalidade afirmada (TUT_CAUSALITY_STATUS)", options: CAUSALITY_OPTIONS },
    F("TUT_CAUSALITY_STATUS"), null, set("TUT_CAUSALITY_STATUS"), null
  ));
  card2.appendChild(TutorTextField(
    { id: "TUT_CAUSALITY_EXCERPT", label: "Trecho em questão (TUT_CAUSALITY_EXCERPT)" },
    F("TUT_CAUSALITY_EXCERPT"), set("TUT_CAUSALITY_EXCERPT")
  ));
  card2.appendChild(TutorTextField(
    { id: "TUT_CAUSALITY_QUESTION", label: "Pergunta ao cursista sobre esta relação de causa e efeito (TUT_CAUSALITY_QUESTION)" },
    F("TUT_CAUSALITY_QUESTION"), set("TUT_CAUSALITY_QUESTION")
  ));
  wrap.appendChild(card2);

  const card3 = el("div", { class: "panel-card" }, [el("h4", {}, "Cartografia (seção 20)")]);
  card3.appendChild(TutorRatingField(
    { id: "TUT_MAP_ASSESSMENT", label: "Avaliação da cartografia (TUT_MAP_ASSESSMENT)", options: MAP_ASSESSMENT_OPTIONS, commentLabel: "Comentário (TUT_MAP_COMMENT)",
      help: "A ausência da cartografia não é, por si só, um erro — quando justificada, é uma escolha legítima do processo." },
    F("TUT_MAP_ASSESSMENT"), F("TUT_MAP_COMMENT"), set("TUT_MAP_ASSESSMENT"), set("TUT_MAP_COMMENT")
  ));
  wrap.appendChild(card3);

  const alerts = ctx.alertsForStage();
  if (alerts.length) {
    wrap.appendChild(el("h4", {}, "Alertas"));
    wrap.appendChild(AlertList(alerts, alertHandlersFromCtx(ctx)));
  }

  wrap.appendChild(el("h4", {}, "Comentários e perguntas devolutivas"));
  wrap.appendChild(CommentThread({
    comments: ctx.commentsForStage(),
    questions: ctx.questionsFor("stage-2"),
    locked: ctx.locked,
    questionBank: ctx.questionBank,
    onAddComment: (c) => ctx.addComment(c, "stage", "stage-2"),
    onAddQuestion: (text) => ctx.addQuestion(text, "stage", "stage-2"),
    onResolveQuestion: ctx.resolveQuestion,
  }));

  return wrap;
}

window.TutorStages[2] = {
  id: 2,
  title: "Leitura territorial e socioambiental",
  render(ctx) {
    return { center: renderCenter(ctx), right: renderRight(ctx) };
  },
};

})();
