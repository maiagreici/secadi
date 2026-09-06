"use strict";
/**
 * tutor-stages/stage3.js
 * Etapa 3 — Educação Ambiental, participação e redes (seções 21-24).
 */

(function () {

window.TutorStages = window.TutorStages || {};

const INTERDISCIPLINARITY_OPTIONS = [
  { value: "disciplinary", label: "Disciplinar" },
  { value: "parallel_theme", label: "Tema paralelo entre disciplinas" },
  { value: "joint_planning", label: "Planejamento conjunto" },
  { value: "integrated_investigation", label: "Investigação integrada" },
  { value: "collective_intervention", label: "Intervenção coletiva" },
  { value: "insufficient_information", label: "Informação insuficiente" },
];
const STUDENT_PARTICIPATION_GRADIENT = [
  { value: "receives", label: "Recebe" },
  { value: "participates", label: "Participa" },
  { value: "consulted", label: "É consultado(a)" },
  { value: "plans", label: "Planeja" },
  { value: "decides", label: "Decide" },
  { value: "leads", label: "Lidera" },
  { value: "cannot_assess", label: "Não é possível avaliar" },
];
const COHERENCE_OPTIONS = [
  { value: "adequate", label: "Adequada" },
  { value: "ambiguous", label: "Ambígua" },
  { value: "needs_revision", label: "Precisa de revisão" },
  { value: "not_applicable", label: "Não se aplica" },
];
const QUALITY_OPTIONS = window.TutorComponents ? window.TutorComponents.RUBRIC_OPTIONS : [];

const RELATIONSHIP_LABELS = {
  none: "Não existe relação", knows_exists: "Sabe que existe", occasional_contact: "Contato ocasional",
  partnership: "Parceria", permanent_articulation: "Articulação permanente",
};

function ActorReadOnlyCard(actor) {
  const { el } = window.TutorComponents;
  return el("div", { class: "actor-card" }, [
    el("h5", {}, actor.name || "(sem nome)"),
    el("p", { class: "muted" }, actor.category || ""),
    el("p", {}, `Relação atual: ${RELATIONSHIP_LABELS[actor.relationshipLevel] || "não informado"}`),
    (actor.currentContributions || []).length ? el("p", {}, `Contribuições atuais: ${actor.currentContributions.join(", ")}`) : null,
    (actor.potentialContributions || []).length ? el("p", {}, `Contribuições potenciais: ${actor.potentialContributions.join(", ")}`) : null,
    actor.priorityForStrengthening ? el("span", { class: "tag" }, "Prioridade para fortalecimento") : null,
  ]);
}

function renderCenter(ctx) {
  const { el, ReadOnlyField, ReadOnlyText, ReadOnlySection } = window.TutorComponents;
  const wrap = el("div", { class: "stage-content" });
  if (!ctx.diagnosis) return el("p", { class: "muted" }, "Nenhum diagnóstico importado.");

  wrap.appendChild(ReadOnlySection("Institucionalização e continuidade da Educação Ambiental", [
    ReadOnlyField("Nível de institucionalização (EA_INSTITUTIONAL_LEVEL)", ctx.read("EA_INSTITUTIONAL_LEVEL")),
    ReadOnlyField("Continuidade dos projetos (EA_PROJECT_CONTINUITY)", ctx.read("EA_PROJECT_CONTINUITY")),
    ReadOnlyField("Principal barreira (EA_MAIN_BARRIER)", ctx.read("EA_MAIN_BARRIER")),
    ReadOnlyField("Temas mais difíceis (EA_DIFFICULT_THEMES)", ctx.read("EA_DIFFICULT_THEMES")),
    ReadOnlyField("Apoios que fariam diferença (EA_SUPPORT_NEEDS)", ctx.read("EA_SUPPORT_NEEDS")),
  ]));

  wrap.appendChild(ReadOnlySection("Territorialização e uso pedagógico do território", [
    ReadOnlyField("Frequência de uso do território (EA_TERRITORY_USE_FREQ)", ctx.read("EA_TERRITORY_USE_FREQ")),
    ReadOnlyField("Abordagem de problemas locais (EA_LOCAL_PROBLEM_APPROACH)", ctx.read("EA_LOCAL_PROBLEM_APPROACH")),
    ReadOnlyField("Áreas curriculares envolvidas (EA_CURRICULAR_AREAS)", ctx.read("EA_CURRICULAR_AREAS")),
    ReadOnlyField("Modo de articulação entre áreas (EA_INTERDISCIPLINARITY_MODE)", ctx.read("EA_INTERDISCIPLINARITY_MODE")),
  ]));

  wrap.appendChild(ReadOnlySection("Participação estudantil", [
    ReadOnlyField("Nível geral de participação (EA_STUDENT_PARTICIPATION_LEVEL)", ctx.read("EA_STUDENT_PARTICIPATION_LEVEL")),
    ReadOnlyField("Espaços de participação estudantil (PAR_STUDENT_SPACES)", ctx.read("PAR_STUDENT_SPACES")),
    ReadOnlyText("Práticas concretas de participação (PAR_STUDENT_PRACTICES)", ctx.read("PAR_STUDENT_PRACTICES").value),
  ]));

  const actorsResult = ctx.readCollection("actors");
  const actorSection = ReadOnlySection("Rede territorial (atores)", []);
  if (!actorsResult.available) {
    actorSection.appendChild(el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Esta informação não está disponível na versão importada."));
  } else if (actorsResult.items.length === 0) {
    actorSection.appendChild(el("p", { class: "ro-field__value ro-field__value--empty" }, "Nenhum ator registrado."));
  } else {
    const grid = el("div", { class: "actor-grid" });
    actorsResult.items.forEach((a) => grid.appendChild(ActorReadOnlyCard(a)));
    actorSection.appendChild(grid);
  }
  wrap.appendChild(actorSection);

  return wrap;
}

function renderRight(ctx) {
  const { el, TutorRatingField, AlertList, CommentThread, alertHandlersFromCtx } = window.TutorComponents;
  const wrap = el("div", {});
  const F = (id) => ctx.getField(id);
  const set = (id) => (v) => ctx.setField(id, v);

  const card1 = el("div", { class: "panel-card" }, [el("h4", {}, "Educação Ambiental (seção 21)")]);
  card1.appendChild(TutorRatingField(
    { id: "TUT_EA_INSTITUTIONAL_QUALITY", label: "Qualidade da institucionalização (TUT_EA_INSTITUTIONAL_QUALITY)", options: QUALITY_OPTIONS },
    F("TUT_EA_INSTITUTIONAL_QUALITY"), null, set("TUT_EA_INSTITUTIONAL_QUALITY"), null
  ));
  card1.appendChild(TutorRatingField(
    { id: "TUT_EA_CONTINUITY_COHERENCE", label: "Coerência da continuidade relatada (TUT_EA_CONTINUITY_COHERENCE)", options: COHERENCE_OPTIONS, commentLabel: "Comentário (TUT_EA_COMMENT)" },
    F("TUT_EA_CONTINUITY_COHERENCE"), F("TUT_EA_COMMENT"), set("TUT_EA_CONTINUITY_COHERENCE"), set("TUT_EA_COMMENT")
  ));
  card1.appendChild(TutorRatingField(
    { id: "TUT_INTERDISCIPLINARITY_ASSESSMENT", label: "Avaliação da interdisciplinaridade (TUT_INTERDISCIPLINARITY_ASSESSMENT)", options: INTERDISCIPLINARITY_OPTIONS,
      help: "Várias disciplinas trabalharem o mesmo tema não significa, por si só, interdisciplinaridade." },
    F("TUT_INTERDISCIPLINARITY_ASSESSMENT"), null, set("TUT_INTERDISCIPLINARITY_ASSESSMENT"), null
  ));
  wrap.appendChild(card1);

  const card2 = el("div", { class: "panel-card" }, [el("h4", {}, "Participação estudantil (seção 23)")]);
  card2.appendChild(TutorRatingField(
    { id: "TUT_STUDENT_PARTICIPATION_REVIEW", label: "Leitura do tutor sobre o gradiente de participação (TUT_STUDENT_PARTICIPATION_REVIEW)", options: STUDENT_PARTICIPATION_GRADIENT,
      help: "Participação não é sinônimo de protagonismo — o gradiente vai de 'recebe' a 'lidera'." },
    F("TUT_STUDENT_PARTICIPATION_REVIEW"), null, set("TUT_STUDENT_PARTICIPATION_REVIEW"), null
  ));
  card2.appendChild(TutorRatingField(
    { id: "TUT_STUDENT_PARTICIPATION_COHERENCE", label: "Coerência entre o nível relatado e as evidências (TUT_STUDENT_PARTICIPATION_COHERENCE)", options: COHERENCE_OPTIONS, commentLabel: "Comentário (TUT_STUDENT_PARTICIPATION_COMMENT)" },
    F("TUT_STUDENT_PARTICIPATION_COHERENCE"), F("TUT_STUDENT_PARTICIPATION_COMMENT"), set("TUT_STUDENT_PARTICIPATION_COHERENCE"), set("TUT_STUDENT_PARTICIPATION_COMMENT")
  ));
  wrap.appendChild(card2);

  const card3 = el("div", { class: "panel-card" }, [el("h4", {}, "Rede territorial (seção 24)")]);
  card3.appendChild(TutorRatingField(
    { id: "TUT_NETWORK_QUALITY", label: "Qualidade geral da rede territorial (TUT_NETWORK_QUALITY)", options: QUALITY_OPTIONS,
      help: "Presença de um ator no território não equivale a parceria — observe o nível de relação de cada ator, exibido ao lado." },
    F("TUT_NETWORK_QUALITY"), null, set("TUT_NETWORK_QUALITY"), null
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
    questions: ctx.questionsFor("stage-3"),
    locked: ctx.locked,
    questionBank: ctx.questionBank,
    onAddComment: (c) => ctx.addComment(c, "stage", "stage-3"),
    onAddQuestion: (text) => ctx.addQuestion(text, "stage", "stage-3"),
    onResolveQuestion: ctx.resolveQuestion,
  }));

  return wrap;
}

window.TutorStages[3] = {
  id: 3,
  title: "Educação Ambiental, participação e redes",
  render(ctx) {
    return { center: renderCenter(ctx), right: renderRight(ctx) };
  },
};

})();
