"use strict";
/**
 * tutor-app.js
 * Bootstrap, roteamento e orquestração do Caderno do Tutor.
 *
 * Estado vivo em memória: `notebook` (camada do tutor, mutável) e
 * `diagnosesStore` (diagnósticos importados, sempre congelados/READ ONLY).
 * Cada etapa (tutor-stages/stageN.js) recebe um `ctx` que expõe leitura do
 * diagnóstico e gravação exclusivamente no notebook — nunca o contrário.
 */

(function () {
  let notebook = null;
  let diagnosesStore = {};
  let view = "dashboard"; // dashboard | school | report
  let currentStage = 0;

  const TD = () => window.TutorDataModel;
  const DI = () => window.DiagnosisImporter;
  const C = () => window.TutorComponents;

  function persistAndReact() {
    if (notebook.classInsights === undefined) notebook.classInsights = null;
    notebook.classInsights = window.TutorRules.computeClassInsights(notebook, diagnosesStore);
    window.TutorStorage.scheduleTutorAutosave(notebook, diagnosesStore);
    render();
  }

  function currentSchool() {
    return notebook.currentSchoolId ? TD().getSchool(notebook, notebook.currentSchoolId) : null;
  }

  function currentDiagnosis() {
    const school = currentSchool();
    return school ? diagnosesStore[school.schoolId] || null : null;
  }

  /* ---------------------------------------------------------------------- */
  /* Construção do contexto passado a cada etapa                            */
  /* ---------------------------------------------------------------------- */

  function buildCtx(stageId) {
    const school = currentSchool();
    const diagnosis = currentDiagnosis();
    const version = school ? school.diagnosisVersion : null;
    const schoolId = school ? school.schoolId : null;
    const locked = schoolId ? TD().isVersionLocked(notebook, schoolId, version) : false;

    function bumpUnderReview() {
      if (school && school.reviewStatus === "ready_for_review") {
        school.reviewStatus = "under_review";
      }
    }

    return {
      notebook,
      diagnosis,
      school,
      schoolId,
      version,
      locked,
      stage: stageId,
      read: (fieldId) => DI().readField(diagnosis, fieldId),
      readCollection: (key) => DI().readCollection(diagnosis, key),
      getField: (fieldId) => TD().getStageField(notebook, schoolId, stageId, version, fieldId),
      setField: (fieldId, value) => {
        bumpUnderReview();
        TD().setStageField(notebook, schoolId, stageId, version, fieldId, value);
        persistAndReact();
      },
      getItemReview: (itemId) => TD().getItemReview(notebook, schoolId, stageId, version, itemId),
      setItemField: (itemId, fieldId, value) => {
        bumpUnderReview();
        TD().setItemReviewField(notebook, schoolId, stageId, version, itemId, fieldId, value);
        persistAndReact();
      },
      alertsForStage: () => (schoolId ? TD().getAlertsForStage(notebook, schoolId, version, stageId) : []),
      setAlertStatus: (alertId, status) => {
        TD().setAlertStatus(notebook, alertId, status);
        persistAndReact();
      },
      setAlertComment: (alertId, comment) => {
        TD().setAlertStatus(notebook, alertId, undefined, comment);
        persistAndReact();
      },
      commentsForStage: () => (schoolId ? TD().getCommentsForStage(notebook, schoolId, version, stageId) : []),
      commentsFor: (objectId) => (schoolId ? TD().getCommentsFor(notebook, schoolId, version, objectId) : []),
      questionsFor: (objectId) => (schoolId ? TD().getFeedbackQuestionsFor(notebook, schoolId, version, objectId) : []),
      addComment: (partial, relatedObjectType, relatedObjectId) => {
        bumpUnderReview();
        TD().addComment(notebook, { schoolId, diagnosisVersion: version, stage: stageId, relatedObjectType, relatedObjectId, ...partial });
        persistAndReact();
      },
      addQuestion: (text, relatedObjectType, relatedObjectId) => {
        bumpUnderReview();
        TD().addFeedbackQuestion(notebook, { schoolId, diagnosisVersion: version, stage: stageId, relatedObjectType, relatedObjectId, text });
        persistAndReact();
      },
      resolveQuestion: (questionId) => {
        const q = notebook.feedbackQuestions.find((x) => x.questionId === questionId);
        if (q) q.status = "resolved";
        persistAndReact();
      },
      setReviewStatus: (status) => {
        if (school) school.reviewStatus = status;
        persistAndReact();
      },
      rubric: () => {
        const fa = TD().ensureFinalAssessment(notebook, schoolId, version);
        return fa.rubric || (fa.rubric = TD().createReviewRubric());
      },
      setRubric: (axis, value) => {
        const fa = TD().ensureFinalAssessment(notebook, schoolId, version);
        if (!fa.rubric) fa.rubric = TD().createReviewRubric();
        fa.rubric[axis] = value;
        persistAndReact();
      },
      finalAssessment: () => TD().ensureFinalAssessment(notebook, schoolId, version),
      setFinalField: (fieldId, value) => {
        TD().setFinalAssessmentField(notebook, schoolId, version, fieldId, value);
        persistAndReact();
      },
      openQuestions: () => TD().getOpenFeedbackQuestions(notebook, schoolId, version),
      questionBank: TD().FEEDBACK_QUESTION_BANK,
      emitFinalAssessment: (status, revisionRequested) => {
        const item = TD().lockReview(notebook, { schoolId, diagnosisVersion: version, stage: 7, status, revisionRequested, rubric: TD().ensureFinalAssessment(notebook, schoolId, version).rubric });
        const fa = TD().ensureFinalAssessment(notebook, schoolId, version);
        fa.locked = true;
        if (revisionRequested) {
          school.reviewStatus = "revision_requested";
        } else {
          school.reviewStatus = "reviewed";
        }
        persistAndReact();
        return item;
      },
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Importação / navegação                                                 */
  /* ---------------------------------------------------------------------- */

  async function onImportDiagnosis(file) {
    try {
      const payload = await window.TutorStorage.importDiagnosisFile(file);
      const result = DI().importDiagnosis(notebook, diagnosesStore, payload);
      window.TutorRules.runAllTutorRules(notebook, result.schoolEntry.schoolId, result.schoolEntry.diagnosisVersion, result.diagnosis);
      notebook.currentSchoolId = result.schoolEntry.schoolId;
      view = "school";
      currentStage = result.schoolEntry.currentStage || 0;
      if (result.warnings.length) {
        console.info("Importação com pendências estruturais:", result.warnings);
      }
      window.TutorStorage.saveTutorStateNow(notebook, diagnosesStore);
      persistAndReact();
    } catch (err) {
      alert(`Falha na importação: ${err.message}`);
    }
  }

  function goToSchool(schoolId) {
    notebook.currentSchoolId = schoolId;
    const school = TD().getSchool(notebook, schoolId);
    view = "school";
    currentStage = (school && school.currentStage) || 0;
    render();
  }

  function goToStage(stageId) {
    currentStage = stageId;
    const school = currentSchool();
    if (school) school.currentStage = stageId;
    window.TutorStorage.scheduleTutorAutosave(notebook, diagnosesStore);
    render();
    const main = document.getElementById("tutor-main");
    if (main) main.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToDashboard() {
    view = "dashboard";
    notebook.currentSchoolId = null;
    render();
  }

  function goToReport() {
    view = "report";
    render();
  }

  /* ---------------------------------------------------------------------- */
  /* Renderização — cabeçalho                                                */
  /* ---------------------------------------------------------------------- */

  function formatTime(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function renderHeader() {
    const { el } = C();
    const header = document.getElementById("tutor-header");
    header.innerHTML = "";
    header.appendChild(
      el("div", { class: "header__brand" }, [
        el("span", { class: "header__mark", "aria-hidden": "true" }, "📘"),
        el("div", {}, [
          el("p", { class: "header__title" }, "Caderno de Diagnóstico Escolar e Territorial para Tutores"),
          el("p", { class: "header__subtitle" }, "Acompanhamento pedagógico — SECADI-UFPEL"),
        ]),
      ])
    );
    const savedAt = formatTime(notebook.metadata.lastSavedAt);
    const actions = el("div", { class: "header__actions" }, [
      el("span", { class: "header__saved", "aria-live": "polite" }, savedAt ? `Salvo às ${savedAt}.` : "Ainda não salvo."),
      el("button", { class: "btn btn--outline btn--small", onclick: goToDashboard }, "Painel"),
      view === "school"
        ? el("button", { class: "btn btn--outline btn--small", onclick: goToReport }, "Relatório")
        : null,
      el("button", { class: "btn btn--outline btn--small", onclick: () => window.TutorStorage.exportTutorNotebookToFile(notebook, diagnosesStore) }, "Exportar Caderno"),
      el("button", { class: "btn btn--secondary btn--small", onclick: () => window.print() }, "Imprimir"),
    ]);
    header.appendChild(actions);
  }

  /* ---------------------------------------------------------------------- */
  /* Renderização — dashboard                                                */
  /* ---------------------------------------------------------------------- */

  function renderTutorIdentityForm() {
    const { el } = C();
    const card = el("div", { class: "panel-card" }, [el("h3", {}, "Identificação do tutor")]);
    const row = el("div", { class: "form-row" });
    [
      { key: "TUT_ID", label: "Identificação (matrícula/e-mail)" },
      { key: "TUT_NAME", label: "Nome do tutor" },
      { key: "TUT_CLASS", label: "Turma" },
    ].forEach((f) => {
      const id = C().tdomId("id");
      const input = el("input", {
        type: "text", id, class: "input", value: notebook.tutor[f.key] || "",
        "data-focus-key": `tutor-identity::${f.key}`,
        oninput: (e) => { notebook.tutor[f.key] = e.target.value; persistAndReact(); },
      });
      row.appendChild(el("div", { class: "field field--compact" }, [el("label", { for: id }, f.label), input]));
    });
    card.appendChild(row);
    return card;
  }

  function renderRuleConfigForm() {
    const { el } = C();
    const id = C().tdomId("rc");
    return el("div", { class: "panel-card" }, [
      el("h3", {}, "Configuração de regras"),
      el("p", { class: "field__help" }, "Limiares usados pelos alertas automáticos. Nunca fixos no código — ajustáveis por quem acompanha a turma (seção 48 da especificação)."),
      el("div", { class: "field field--compact" }, [
        el("label", { for: id }, "Nº de lacunas na mesma dimensão para gerar alerta (TUT_ALERT_003)"),
        el("input", {
          type: "number", id, class: "input input--number", min: 1, value: notebook.ruleConfig.manyGapsThreshold,
          "data-focus-key": "rule-config::manyGapsThreshold",
          oninput: (e) => { notebook.ruleConfig.manyGapsThreshold = Number(e.target.value) || 1; persistAndReact(); },
        }),
      ]),
    ]);
  }

  function statusLabel(status) {
    return {
      waiting_student: "Aguardando cursista", ready_for_review: "Pronto para revisão", under_review: "Em revisão",
      revision_requested: "Revisão solicitada", reviewed: "Revisado", completed: "Concluído",
    }[status] || status;
  }

  function renderDashboardTable() {
    const { el } = C();
    const card = el("div", { class: "panel-card" });
    card.appendChild(el("h3", {}, "Escolas acompanhadas"));
    if (notebook.schools.length === 0) {
      card.appendChild(el("p", { class: "muted" }, "Nenhum diagnóstico importado ainda."));
    } else {
      const table = el("table", { class: "dashboard-table" });
      table.appendChild(el("thead", {}, [el("tr", {}, [
        "Escola", "Status", "Versão", "Última atualização", "Perguntas abertas", "Alertas em aberto", "Etapa atual", "",
      ].map((h) => el("th", { scope: "col" }, h)))]));
      const tbody = el("tbody");
      notebook.schools.forEach((school) => {
        const openQ = TD().getOpenFeedbackQuestions(notebook, school.schoolId, school.diagnosisVersion).length;
        const openAlerts = TD().getAlertsForSchool(notebook, school.schoolId, school.diagnosisVersion).filter((a) => a.status === "open").length;
        tbody.appendChild(el("tr", {}, [
          el("td", {}, `${school.schoolName}${school.schoolCity ? ` — ${school.schoolCity}/${school.schoolState}` : ""}`),
          el("td", {}, el("span", { class: `status-badge status-badge--${school.reviewStatus}` }, statusLabel(school.reviewStatus))),
          el("td", {}, school.diagnosisVersion),
          el("td", {}, formatTime(school.lastKnownUpdatedAt) || "—"),
          el("td", {}, String(openQ)),
          el("td", {}, String(openAlerts)),
          el("td", {}, String(school.currentStage)),
          el("td", {}, el("button", { class: "btn btn--outline btn--small", onclick: () => goToSchool(school.schoolId) }, "Abrir")),
        ]));
      });
      table.appendChild(tbody);
      card.appendChild(el("div", { class: "table-scroll" }, table));
    }
    return card;
  }

  function renderClassInsights() {
    const { el } = C();
    const insights = notebook.classInsights || window.TutorRules.computeClassInsights(notebook, diagnosesStore);
    const card = el("div", { class: "panel-card" });
    card.appendChild(el("h3", {}, "Inteligência pedagógica da turma"));
    card.appendChild(el("p", { class: "field__help" }, "Agregações para apoiar a formação — nunca uma comparação de desempenho entre escolas."));
    const lines = [];
    insights.commonKnowledgeGaps.forEach((g) => lines.push(`${g.count} lacuna(s) de conhecimento na dimensão "${g.dimensionLabel}" entre as escolas acompanhadas.`));
    if (insights.commonRiskAnalysisDifficulties.length) lines.push(`${insights.commonRiskAnalysisDifficulties.length} escola(s) com riscos selecionados para planejamento sem evidência vinculada.`);
    if (insights.commonEAIssues.length) lines.push(`${insights.commonEAIssues.length} escola(s) com Educação Ambiental institucionalizada, mas dependente de indivíduos.`);
    if (insights.commonPlanningIssues.length) lines.push(`${insights.commonPlanningIssues.length} escola(s) com fragilidades de rastreabilidade entre problema, prioridade e ação.`);
    if (insights.commonMonitoringIssues.length) lines.push(`${insights.commonMonitoringIssues.length} escola(s) com metas percentuais sem linha de base definida.`);
    if (insights.schoolsNeedingSupport.length) lines.push(`${insights.schoolsNeedingSupport.length} escola(s) com múltiplos alertas críticos/de revisão ainda em aberto — podem precisar de apoio prioritário do tutor.`);
    card.appendChild(C().SummaryCard("Panorama da turma", lines));
    return card;
  }

  function renderGeneralNotes() {
    const { el } = C();
    const card = el("div", { class: "panel-card" });
    card.appendChild(el("h3", {}, "Registros gerais"));
    const list = el("ul", { class: "summary-card__list" });
    notebook.generalNotes.slice().reverse().forEach((n) => {
      const school = TD().getSchool(notebook, n.schoolId);
      list.appendChild(el("li", {}, `[${n.type}] ${school ? school.schoolName : "(geral)"} — ${n.text}`));
    });
    card.appendChild(notebook.generalNotes.length ? list : el("p", { class: "muted" }, "Nenhum registro ainda."));

    if (notebook.currentSchoolId || notebook.schools.length) {
      let draftType = "meeting";
      let draftText = "";
      let draftSchool = notebook.currentSchoolId || (notebook.schools[0] && notebook.schools[0].schoolId) || "";
      const schoolSelect = el("select", { class: "input input--select" });
      notebook.schools.forEach((s) => schoolSelect.appendChild(el("option", { value: s.schoolId, selected: s.schoolId === draftSchool }, s.schoolName)));
      schoolSelect.addEventListener("change", (e) => (draftSchool = e.target.value));
      const typeSelect = el("select", { class: "input input--select" }, [
        "meeting", "guidance", "agreement", "follow_up", "internal_note", "other",
      ].map((t) => el("option", { value: t }, t)));
      typeSelect.addEventListener("change", (e) => (draftType = e.target.value));
      const ta = el("textarea", { class: "input textarea", rows: 2, placeholder: "Descreva o registro..." });
      ta.addEventListener("input", (e) => (draftText = e.target.value));
      const btn = el("button", {
        class: "btn btn--secondary btn--small",
        onclick: () => {
          if (!draftText.trim() || !draftSchool) return;
          TD().addGeneralNote(notebook, { schoolId: draftSchool, type: draftType, text: draftText });
          ta.value = "";
          persistAndReact();
        },
      }, "+ Adicionar registro");
      card.appendChild(el("div", { class: "comment-thread__form" }, [schoolSelect, typeSelect, ta, btn]));
    }
    return card;
  }

  function renderImportPanel() {
    const { el } = C();
    return el("div", { class: "panel-card panel-card--import" }, [
      el("h3", {}, "Importar diagnóstico do cursista"),
      el("p", { class: "field__help" }, "Aceita o arquivo JSON exportado pelo sistema do cursista. O conteúdo é carregado em modo somente leitura."),
      el("label", { class: "btn btn--primary file-label" }, [
        "Selecionar arquivo JSON",
        el("input", {
          type: "file", accept: "application/json", class: "sr-only",
          onchange: (e) => { const f = e.target.files[0]; if (f) onImportDiagnosis(f); },
        }),
      ]),
    ]);
  }

  function renderDashboard() {
    const { el } = C();
    const main = document.getElementById("tutor-main");
    main.appendChild(el("h2", { class: "stage-title" }, "Painel do tutor"));
    main.appendChild(renderImportPanel());
    main.appendChild(renderDashboardTable());
    main.appendChild(renderClassInsights());
    main.appendChild(renderTutorIdentityForm());
    main.appendChild(renderRuleConfigForm());
    main.appendChild(renderGeneralNotes());
  }

  /* ---------------------------------------------------------------------- */
  /* Renderização — navegação de etapas dentro de uma escola                */
  /* ---------------------------------------------------------------------- */

  function renderStageNav(school) {
    const { el } = C();
    const nav = document.getElementById("tutor-nav");
    nav.appendChild(el("button", { class: "btn btn--ghost btn--small", onclick: goToDashboard }, "← Painel"));
    nav.appendChild(el("h3", { class: "nav__school-name" }, school.schoolName));
    nav.appendChild(el("span", { class: `status-badge status-badge--${school.reviewStatus}` }, statusLabel(school.reviewStatus)));
    nav.appendChild(el("p", { class: "muted nav__version" }, `Versão ${school.diagnosisVersion}`));

    const list = el("ol", { class: "nav__list" });
    window.TutorStages.STAGE_META.forEach((meta) => {
      const isCurrent = currentStage === meta.id;
      list.appendChild(el("li", { class: "nav__item" }, [
        el("button", {
          type: "button", class: "nav__link" + (isCurrent ? " is-current" : ""),
          "aria-current": isCurrent ? "step" : null,
          onclick: () => goToStage(meta.id),
        }, [
          el("span", { class: "nav__step-number" }, String(meta.id)),
          el("span", { class: "nav__step-label" }, meta.label),
        ]),
      ]));
    });
    nav.appendChild(list);
  }

  function renderSchoolView() {
    const school = currentSchool();
    if (!school) { goToDashboard(); return; }
    renderStageNav(school);

    const main = document.getElementById("tutor-main");
    const side = document.getElementById("tutor-side");
    const ctx = buildCtx(currentStage);
    const stageModule = window.TutorStages[currentStage];
    if (!stageModule) {
      main.appendChild(C().el("p", {}, `Etapa ${currentStage} não implementada.`));
      return;
    }
    main.appendChild(C().el("h2", { class: "stage-title", tabindex: "-1" }, `${currentStage}. ${stageModule.title}`));
    const { center, right } = stageModule.render(ctx);
    if (center) main.appendChild(center);

    side.appendChild(C().el("h3", {}, "Camada do tutor"));
    if (right) side.appendChild(right);
  }

  function renderReportView() {
    const school = currentSchool();
    if (!school) { goToDashboard(); return; }
    const ctx = buildCtx(7);
    const main = document.getElementById("tutor-main");
    main.appendChild(window.TutorReport.renderReportView(notebook, diagnosesStore, ctx, { onBack: () => { view = "school"; render(); } }));
  }

  /* ---------------------------------------------------------------------- */
  /* Render raiz                                                             */
  /* ---------------------------------------------------------------------- */

  function render() {
    const focusSnapshot = C().captureFocus();
    renderHeader();
    // Limpeza centralizada das três colunas: cada renderXxx() só faz
    // append. Sem isto, navegar entre etapas acumula conteúdo antigo
    // (alertas, comentários, listeners) na coluna direita indefinidamente.
    document.getElementById("tutor-main").innerHTML = "";
    document.getElementById("tutor-nav").innerHTML = "";
    document.getElementById("tutor-side").innerHTML = "";
    if (view === "dashboard") renderDashboard();
    else if (view === "report") renderReportView();
    else renderSchoolView();
    C().restoreFocus(focusSnapshot);
  }

  /* ---------------------------------------------------------------------- */
  /* Inicialização                                                           */
  /* ---------------------------------------------------------------------- */

  function init() {
    const saved = window.TutorStorage.loadTutorState();
    if (saved) {
      notebook = saved.notebook;
      diagnosesStore = saved.diagnosesStore;
    } else {
      notebook = TD().createTutorNotebook();
      diagnosesStore = {};
    }
    window.TutorStorage.setTutorOnSaved(() => renderHeader());
    render();
  }

  window.TutorApp = {
    getNotebook: () => notebook,
    getDiagnosesStore: () => diagnosesStore,
    goToDashboard,
    goToSchool,
    goToStage,
  };

  document.addEventListener("DOMContentLoaded", init);
})();
