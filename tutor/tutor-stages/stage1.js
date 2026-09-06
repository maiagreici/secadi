"use strict";
/**
 * tutor-stages/stage1.js
 * Etapa 1 — Qualidade da construção do diagnóstico (seções 16-17).
 */

(function () {

window.TutorStages = window.TutorStages || {};

const MET_PARTICIPANTS_LABELS = {
  students: "Estudantes", teachers: "Professores(as)", management: "Gestão", pedagogical_coordination: "Coordenação pedagógica",
  staff: "Funcionários(as)", families: "Famílias", school_council: "Conselho escolar", community: "Comunidade",
  leaderships: "Lideranças", partners: "Parceiros", other: "Outros", only_respondent: "Somente o(a) cursista",
};
const MET_SOURCES_LABELS = {
  direct_observation: "Observação direta", talk_students: "Conversa com estudantes", talk_teachers: "Conversa com professores(as)",
  families_community: "Famílias/comunidade", collective_meeting: "Reunião coletiva", ppp: "PPP", school_documents: "Documentos escolares",
  public_data: "Dados públicos", participatory_mapping: "Cartografia participativa", historical_records: "Registros históricos", other: "Outras",
};

const PARTICIPATION_OPTIONS = [
  { value: "predominantly_individual", label: "Predominantemente individual" },
  { value: "consultative", label: "Consultiva" },
  { value: "participatory", label: "Participativa" },
  { value: "broadly_collective", label: "Amplamente coletiva" },
  { value: "cannot_assess", label: "Não é possível avaliar" },
];
const SOURCE_DIVERSITY_OPTIONS = [
  { value: "sufficient", label: "Suficiente" },
  { value: "mostly_sufficient", label: "Majoritariamente suficiente" },
  { value: "partial", label: "Parcial" },
  { value: "insufficient", label: "Insuficiente" },
  { value: "needs_deepening", label: "Precisa de aprofundamento" },
];
const EVIDENCE_QUALITY_OPTIONS = window.TutorComponents ? window.TutorComponents.RUBRIC_OPTIONS : [];

function renderCenter(ctx) {
  const { el, ReadOnlyField, ReadOnlyText, ReadOnlySection } = window.TutorComponents;
  const wrap = el("div", { class: "stage-content" });
  if (!ctx.diagnosis) return el("p", { class: "muted" }, "Nenhum diagnóstico importado.");

  wrap.appendChild(ReadOnlySection("Como o diagnóstico foi construído (respostas do cursista)", [
    ReadOnlyField("Quem participou (MET_PARTICIPANTS)", ctx.read("MET_PARTICIPANTS"), { labelMap: MET_PARTICIPANTS_LABELS }),
    ReadOnlyField("Fontes utilizadas (MET_SOURCES)", ctx.read("MET_SOURCES"), { labelMap: MET_SOURCES_LABELS }),
    ReadOnlyText("Descrição do processo (MET_PROCESS_DESCRIPTION)", ctx.read("MET_PROCESS_DESCRIPTION").value),
  ]));
  return wrap;
}

function renderRight(ctx) {
  const { el, TutorRatingField, TutorTextField, AlertList, CommentThread, alertHandlersFromCtx } = window.TutorComponents;
  const wrap = el("div", {});
  const F = (id) => ctx.getField(id);
  const set = (id) => (v) => ctx.setField(id, v);

  const card = el("div", { class: "panel-card" });
  card.appendChild(el("h4", {}, "Leitura do tutor sobre a construção do diagnóstico"));

  card.appendChild(TutorTextField(
    { id: "TUT_CONSTRUCTION_PARTICIPANTS", label: "Registro sobre os participantes (TUT_CONSTRUCTION_PARTICIPANTS)" },
    F("TUT_CONSTRUCTION_PARTICIPANTS"), set("TUT_CONSTRUCTION_PARTICIPANTS")
  ));
  card.appendChild(TutorTextField(
    { id: "TUT_CONSTRUCTION_SOURCES", label: "Registro sobre as fontes (TUT_CONSTRUCTION_SOURCES)" },
    F("TUT_CONSTRUCTION_SOURCES"), set("TUT_CONSTRUCTION_SOURCES")
  ));

  card.appendChild(TutorRatingField(
    { id: "TUT_PARTICIPATION_ASSESSMENT", label: "Como caracterizar a participação na construção deste diagnóstico? (TUT_PARTICIPATION_ASSESSMENT)", options: PARTICIPATION_OPTIONS, commentLabel: "Comentário (TUT_PARTICIPATION_COMMENT)" },
    F("TUT_PARTICIPATION_ASSESSMENT"), F("TUT_PARTICIPATION_COMMENT"),
    set("TUT_PARTICIPATION_ASSESSMENT"), set("TUT_PARTICIPATION_COMMENT")
  ));

  card.appendChild(TutorRatingField(
    { id: "TUT_SOURCE_DIVERSITY", label: "Diversidade/suficiência das fontes (TUT_SOURCE_DIVERSITY)", options: SOURCE_DIVERSITY_OPTIONS, commentLabel: "Comentário (TUT_SOURCE_COMMENT)" },
    F("TUT_SOURCE_DIVERSITY"), F("TUT_SOURCE_COMMENT"),
    set("TUT_SOURCE_DIVERSITY"), set("TUT_SOURCE_COMMENT")
  ));

  card.appendChild(TutorTextField(
    { id: "TUT_SOURCE_GAP", label: "Lacunas de fontes identificadas (TUT_SOURCE_GAP)" },
    F("TUT_SOURCE_GAP"), set("TUT_SOURCE_GAP")
  ));

  card.appendChild(TutorRatingField(
    { id: "TUT_EVIDENCE_QUALITY", label: "Qualidade geral da evidência apresentada nesta etapa (TUT_EVIDENCE_QUALITY)", options: EVIDENCE_QUALITY_OPTIONS },
    F("TUT_EVIDENCE_QUALITY"), null, set("TUT_EVIDENCE_QUALITY"), null
  ));

  wrap.appendChild(card);

  const alerts = ctx.alertsForStage();
  if (alerts.length) {
    wrap.appendChild(el("h4", {}, "Alertas"));
    wrap.appendChild(AlertList(alerts, alertHandlersFromCtx(ctx)));
  }

  wrap.appendChild(el("h4", {}, "Comentários e perguntas devolutivas"));
  wrap.appendChild(CommentThread({
    comments: ctx.commentsForStage(),
    questions: ctx.questionsFor("stage-1"),
    locked: ctx.locked,
    questionBank: ctx.questionBank,
    onAddComment: (c) => ctx.addComment(c, "stage", "stage-1"),
    onAddQuestion: (text) => ctx.addQuestion(text, "stage", "stage-1"),
    onResolveQuestion: ctx.resolveQuestion,
  }));

  return wrap;
}

window.TutorStages[1] = {
  id: 1,
  title: "Qualidade da construção do diagnóstico",
  render(ctx) {
    return { center: renderCenter(ctx), right: renderRight(ctx) };
  },
};

})();
