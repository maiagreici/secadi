"use strict";
/**
 * tutor-report.js
 * Relatório do tutor (seção 72) — texto determinístico e pedagógico
 * (seções 73-74): nenhuma frase aqui é gerada por IA; cada sentença vem
 * de uma tabela fixa (valor do campo -> frase) ou é o texto literal já
 * escrito pelo tutor. Quando não há um valor/registro, o relatório diz
 * isso explicitamente — nunca inventa conteúdo.
 */

const VALUE_SENTENCES = {
  TUT_PARTICIPATION_ASSESSMENT: {
    predominantly_individual: "A leitura do tutor é de que a construção do diagnóstico foi predominantemente individual.",
    consultative: "A leitura do tutor é de que a construção do diagnóstico teve caráter consultivo.",
    participatory: "A leitura do tutor é de que a construção do diagnóstico foi participativa.",
    broadly_collective: "A leitura do tutor é de que a construção do diagnóstico foi amplamente coletiva.",
    cannot_assess: "O tutor não considerou possível avaliar o caráter participativo da construção do diagnóstico.",
  },
  TUT_SOURCE_DIVERSITY: {
    sufficient: "As fontes utilizadas na construção do diagnóstico foram consideradas suficientes.",
    mostly_sufficient: "As fontes utilizadas foram consideradas majoritariamente suficientes.",
    partial: "As fontes utilizadas foram consideradas parciais.",
    insufficient: "As fontes utilizadas foram consideradas insuficientes.",
    needs_deepening: "A diversidade de fontes precisa de aprofundamento.",
  },
  TUT_TERRITORY_CONTEXTUALIZATION: {
    isolated_school_view: "A leitura territorial ainda está isolada da escola, sem muitos vínculos com o entorno.",
    some_territorial_links: "A leitura territorial apresenta alguns vínculos com o entorno.",
    contextualized: "A leitura territorial está contextualizada.",
    integrated_territorial_reading: "A leitura territorial está integrada ao território de forma consistente.",
    cannot_assess: "Não foi possível avaliar a contextualização territorial.",
  },
  TUT_CAUSALITY_STATUS: {
    adequate: "As relações de causa e efeito apresentadas foram consideradas adequadas.",
    ambiguous: "Há ambiguidade em ao menos uma relação de causa e efeito apresentada.",
    needs_revision: "Ao menos uma relação de causa e efeito apresentada precisa de revisão — a existência de um elemento no território não comprova, por si só, um impacto.",
  },
  TUT_MAP_ASSESSMENT: {
    performed: "A cartografia foi realizada.",
    not_performed_justified: "A cartografia não foi realizada, mas há justificativa registrada — isso não compromete o diagnóstico.",
    not_performed_without_context: "A cartografia não foi realizada e não há contexto explicativo registrado sobre essa ausência.",
  },
  TUT_EA_CONTINUITY_COHERENCE: {
    needs_revision: "A coerência entre a institucionalização relatada da Educação Ambiental e sua continuidade prática precisa de revisão.",
    ambiguous: "Há ambiguidade entre a institucionalização relatada da Educação Ambiental e sua continuidade prática.",
  },
  TUT_STUDENT_PARTICIPATION_COHERENCE: {
    needs_revision: "A coerência entre o nível de participação estudantil relatado e as evidências apresentadas precisa de revisão.",
  },
  TUT_CAPACITY_BALANCE: {
    balanced: "O diagnóstico apresenta equilíbrio entre fragilidades e capacidades identificadas.",
    mostly_deficit_focused: "O diagnóstico está majoritariamente centrado em fragilidades — vale verificar se capacidades sociais, pedagógicas, territoriais ou comunitárias também precisam ser identificadas.",
    exclusively_deficit_focused: "O diagnóstico está exclusivamente centrado em fragilidades — vale verificar se capacidades também precisam ser identificadas.",
    cannot_assess: "Não foi possível avaliar o equilíbrio entre fragilidades e capacidades.",
  },
  TUT_PRIORITY_TRACEABILITY: {
    needs_revision: "A relação entre as prioridades selecionadas e as evidências do diagnóstico precisa ser explicitada com maior clareza.",
    insufficient_information: "Não há informação suficiente para avaliar a rastreabilidade de ao menos uma prioridade selecionada.",
  },
  TUT_ACTION_DIAGNOSTIC_LINK: {
    needs_revision: "O vínculo entre ao menos uma ação planejada e o diagnóstico precisa de revisão.",
  },
  TUT_ACTION_OBJECTIVE_QUALITY: {
    needs_revision: "A qualidade de ao menos um objetivo do plano de ação precisa de revisão.",
  },
  TUT_COM_LISTENING: {
    needs_revision: "O espaço de escuta previsto em ao menos uma estratégia de educomunicação precisa de revisão.",
  },
  TUT_MON_BASELINE: {
    needs_revision: "A definição da linha de base de ao menos um indicador precisa de revisão.",
  },
  TUT_SWOT_CLASSIFICATION: {
    needs_revision: "A classificação de ao menos um item da matriz FOFA precisa de revisão.",
  },
};

const STAGE_LABELS = window.TutorStages ? null : null; // preenchido em tempo de renderização (stages já carregados)

function sentencesFor(fieldId, value) {
  if (!value) return null;
  const table = VALUE_SENTENCES[fieldId];
  return table ? table[value] || null : null;
}

function collectStageSentences(notebook, schoolId, version, stage) {
  const review = window.TutorDataModel.findStageReview(notebook, schoolId, stage, version);
  const sentences = [];
  const freeText = [];
  if (!review) return { sentences, freeText };

  Object.entries(review.fields || {}).forEach(([fieldId, value]) => {
    const s = sentencesFor(fieldId, value);
    if (s) sentences.push(s);
    if (typeof value === "string" && value.trim() && /_(COMMENT|GAP|EXCERPT|QUESTION|NOTE)$/.test(fieldId)) {
      freeText.push(value.trim());
    }
  });
  Object.values(review.itemReviews || {}).forEach((itemFields) => {
    Object.entries(itemFields).forEach(([fieldId, value]) => {
      const s = sentencesFor(fieldId, value);
      if (s && !sentences.includes(s)) sentences.push(s);
      if (typeof value === "string" && value.trim() && /_(COMMENT|GAP|EXCERPT|QUESTION|NOTE)$/.test(fieldId)) {
        freeText.push(value.trim());
      }
    });
  });
  return { sentences, freeText };
}

function statusSentence(status) {
  return {
    adequate_to_continue: "O diagnóstico é considerado adequado para que a escola continue o processo.",
    adequate_with_minor_adjustments: "O diagnóstico é considerado adequado, com pequenos ajustes recomendados.",
    revision_required: "O diagnóstico requer revisão antes de prosseguir com segurança.",
    significant_deepening_required: "O diagnóstico ainda requer aprofundamento significativo antes de sustentar decisões.",
  }[status] || "Situação ainda não definida pelo tutor.";
}

function buildReportSections(notebook, diagnosesStore, schoolId, version) {
  const TD = window.TutorDataModel;
  const school = TD.getSchool(notebook, schoolId);
  const diagnosis = diagnosesStore[schoolId];
  const fa = TD.getFinalAssessment(notebook, schoolId, version) || TD.createFinalAssessment({ schoolId, diagnosisVersion: version });
  const questions = notebook.feedbackQuestions.filter((q) => q.schoolId === schoolId && q.diagnosisVersion === version);
  const alertsAnalyzed = TD.getAlertsForSchool(notebook, schoolId, version).filter((a) => a.status !== "open");
  const history = TD.getReviewHistoryForSchool(notebook, schoolId);

  const stageMeta = window.TutorStages.STAGE_META;
  const stageNarratives = [];
  for (let stage = 0; stage <= 6; stage += 1) {
    const { sentences, freeText } = collectStageSentences(notebook, schoolId, version, stage);
    const comments = TD.getCommentsForStage(notebook, schoolId, version, stage);
    if (sentences.length || freeText.length || comments.length) {
      stageNarratives.push({
        stage,
        label: stageMeta[stage].label,
        sentences,
        freeText,
        comments: comments.map((c) => c.text),
      });
    }
  }

  return {
    identification: {
      tutorName: notebook.tutor.TUT_NAME || "(não identificado)",
      tutorClass: notebook.tutor.TUT_CLASS || "(não informada)",
      schoolName: school ? school.schoolName : "(escola não encontrada)",
      schoolCity: school ? school.schoolCity : "",
      schoolState: school ? school.schoolState : "",
      studentName: school ? school.studentName : "",
      studentRole: school ? school.studentRole : "",
    },
    version,
    diagnosisStatus: diagnosis ? diagnosis.metadata.status : null,
    finalStatusSentence: statusSentence(fa.TUT_FINAL_STATUS),
    strengths: fa.TUT_FINAL_STRENGTHS || "Não foi possível identificar potencialidades com segurança nesta etapa.",
    deepening: fa.TUT_FINAL_DEEPENING || null,
    nextStep: fa.TUT_FINAL_NEXT_STEP || null,
    pendingRevisions: fa.pendingRevisions || [],
    stageNarratives,
    questions,
    alertsAnalyzed,
    history,
  };
}

function renderReportView(notebook, diagnosesStore, ctx, { onBack }) {
  const { el } = window.TutorComponents;
  const data = buildReportSections(notebook, diagnosesStore, ctx.schoolId, ctx.version);
  const wrap = el("article", { class: "tutor-report" });

  wrap.appendChild(el("div", { class: "no-print" }, [
    el("button", { class: "btn btn--outline btn--small", onclick: onBack }, "← Voltar"),
    el("button", { class: "btn btn--outline btn--small", onclick: () => window.print() }, "Imprimir"),
    el("button", {
      class: "btn btn--outline btn--small",
      onclick: () => {
        const fa = window.TutorDataModel.getFinalAssessment(notebook, ctx.schoolId, ctx.version) || window.TutorDataModel.createFinalAssessment({ schoolId: ctx.schoolId, diagnosisVersion: ctx.version });
        window.TutorStorage.exportFinalAssessmentToFile(fa, ctx.school);
      },
    }, "Exportar parecer (JSON)"),
  ]));

  wrap.appendChild(el("h2", {}, "Relatório do tutor"));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "1. Identificação"),
    el("p", {}, `Tutor(a): ${data.identification.tutorName} — Turma: ${data.identification.tutorClass}`),
    el("p", {}, `Escola: ${data.identification.schoolName}${data.identification.schoolCity ? ` — ${data.identification.schoolCity}/${data.identification.schoolState}` : ""}`),
    el("p", {}, `Cursista: ${data.identification.studentName} (${data.identification.studentRole || "função não informada"})`),
  ]));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "2. Versão analisada"),
    el("p", {}, `Versão ${data.version} do diagnóstico (numeração local da tutoria).`),
  ]));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "3. Situação do diagnóstico"),
    el("p", {}, data.finalStatusSentence),
  ]));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "4. Potencialidades"),
    el("p", {}, data.strengths),
  ]));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "5. Pontos de aprofundamento"),
    el("p", {}, data.deepening || "Não indicados nesta versão."),
  ]));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "6. Comentários por etapa"),
    ...(data.stageNarratives.length
      ? data.stageNarratives.map((s) => el("div", { class: "report-stage" }, [
          el("h4", {}, `Etapa ${s.stage} — ${s.label}`),
          s.sentences.length ? el("ul", {}, s.sentences.map((t) => el("li", {}, t))) : null,
          s.freeText.length ? el("p", {}, s.freeText.join(" ")) : null,
          s.comments.length ? el("ul", { class: "muted" }, s.comments.map((t) => el("li", {}, `Comentário: ${t}`))) : null,
        ]))
      : [el("p", { class: "muted" }, "Nenhum registro do tutor por etapa nesta versão.")]),
  ]));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "7. Perguntas devolutivas"),
    data.questions.length
      ? el("ul", {}, data.questions.map((q) => el("li", {}, `${q.text} (${q.status === "resolved" ? "resolvida" : q.status === "answered" ? "respondida" : "em aberto"})`)))
      : el("p", { class: "muted" }, "Nenhuma pergunta devolutiva registrada nesta versão."),
  ]));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "8. Revisões solicitadas"),
    data.pendingRevisions.length
      ? el("ul", {}, data.pendingRevisions.map((r) => el("li", {}, r)))
      : el("p", { class: "muted" }, "Nenhuma revisão solicitada nesta versão."),
  ]));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "9. Alertas analisados"),
    data.alertsAnalyzed.length
      ? el("ul", {}, data.alertsAnalyzed.map((a) => el("li", {}, `${a.message} — status: ${a.status}${a.tutorComment ? `; registro do tutor: ${a.tutorComment}` : ""}`)))
      : el("p", { class: "muted" }, "Nenhum alerta foi tratado (reconhecido/resolvido/não pertinente) até o momento."),
  ]));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "10. Próximo passo"),
    el("p", {}, data.nextStep || "Não indicado nesta versão."),
  ]));

  wrap.appendChild(el("section", {}, [
    el("h3", {}, "11. Histórico"),
    data.history.length
      ? el("ul", {}, data.history.map((h) => el("li", {}, `v${h.diagnosisVersion} — ${statusSentence(h.status)} (${new Date(h.createdAt).toLocaleDateString("pt-BR")})`)))
      : el("p", { class: "muted" }, "Nenhuma revisão encerrada ainda para esta escola."),
  ]));

  return wrap;
}

window.TutorReport = { renderReportView, buildReportSections };
