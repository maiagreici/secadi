/**
 * app.js
 * Bootstrap, roteamento entre etapas e orquestração geral. Mantém o único
 * estado vivo do diagnóstico em memória e delega renderização a cada
 * módulo de etapa registrado em window.Stages[stageId].
 */

(function () {
  let diagnosis = null;

  function getDiagnosis() {
    return diagnosis;
  }

  function persistAndReact() {
    window.Rules.runAllRules(diagnosis);
    window.Storage.scheduleAutosave(diagnosis);
    render();
  }

  function setField(fieldId, value) {
    window.DataModel.setAnswer(diagnosis, fieldId, value);
    persistAndReact();
  }

  function mutate(fn) {
    fn(diagnosis);
    diagnosis.metadata.updatedAt = window.DataModel.nowIso();
    persistAndReact();
  }

  function addEvidence(partial) {
    const evidence = window.DataModel.createEvidence(partial);
    diagnosis.evidence.push(evidence);
    return evidence;
  }

  function goToStage(stageId) {
    if (stageId !== diagnosis.metadata.currentStage) {
      const prereq = window.Rules.prerequisitesForStage(diagnosis, stageId);
      if (prereq.blocked) {
        alert(`Ainda não é possível avançar para esta etapa:\n\n${prereq.reason}`);
        return;
      }
    }
    diagnosis.metadata.currentStage = stageId;
    window.Storage.scheduleAutosave(diagnosis);
    render();
    const main = document.getElementById("main-content");
    if (main) main.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showReport() {
    diagnosis.metadata.currentStage = "report";
    render();
  }

  /* ---------------------------------------------------------------------- */
  /* Renderização                                                            */
  /* ---------------------------------------------------------------------- */

  function formatTime(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function renderHeader() {
    const { el } = window.Components;
    const header = document.getElementById("app-header");
    header.innerHTML = "";
    header.appendChild(
      el("div", { class: "header__brand" }, [
        el("span", { class: "header__mark", "aria-hidden": "true" }, "🌱"),
        el("div", {}, [
          el("p", { class: "header__title" }, "Diagnóstico Socioambiental, Climático e de Educação Ambiental"),
          el("p", { class: "header__school" }, diagnosis.school.SCH_NAME || "Escola ainda não identificada"),
        ]),
      ])
    );

    const savedAt = formatTime(diagnosis.metadata.lastSavedAt);
    const actions = el("div", { class: "header__actions" }, [
      el("span", { class: "header__saved", "aria-live": "polite" }, savedAt ? `Salvo automaticamente às ${savedAt}.` : "Ainda não salvo."),
      el("button", { class: "btn btn--outline btn--small", onclick: onExport }, "Exportar JSON"),
      el("label", { class: "btn btn--outline btn--small file-label" }, [
        "Importar JSON",
        el("input", { type: "file", accept: "application/json", class: "sr-only", onchange: onImport }),
      ]),
      el("button", { class: "btn btn--outline btn--small", onclick: showReport }, "Relatório"),
      el("button", { class: "btn btn--secondary btn--small", onclick: () => window.print() }, "Imprimir"),
    ]);
    header.appendChild(actions);
  }

  async function onExport() {
    try {
      await window.Storage.exportDiagnosisToFile(diagnosis);
    } catch (err) {
      alert(`Não foi possível exportar: ${err.message}`);
    }
  }

  async function onImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = await window.Storage.importDiagnosisFromFile(file);
      const confirmMsg =
        "Importar este arquivo substituirá o diagnóstico atual em edição neste dispositivo. Deseja continuar?";
      if (!confirm(confirmMsg)) return;
      diagnosis = imported;
      window.Storage.saveDiagnosisNow(diagnosis);
      persistAndReact();
    } catch (err) {
      alert(`Falha na importação: ${err.message}`);
    }
  }

  function renderNav() {
    const { el } = window.Components;
    const nav = document.getElementById("app-nav");
    nav.innerHTML = "";
    const overall = window.Rules.computeOverallProgress(diagnosis);

    nav.appendChild(
      el("div", { class: "nav__overall" }, [
        el("p", { class: "nav__overall-label" }, `Progresso geral: ${overall.percentage}%`),
        el("div", { class: "progress-bar" }, [el("div", { class: "progress-bar__fill", style: `width:${overall.percentage}%` })]),
      ])
    );

    const list = el("ol", { class: "nav__list" });
    window.Rules.STAGE_META.forEach((stage) => {
      const progress = overall.byStage[stage.id];
      const isCurrent = diagnosis.metadata.currentStage === stage.id;
      const isDone = progress.percentage >= 100;
      const item = el(
        "li",
        { class: "nav__item" },
        [
          el(
            "button",
            {
              type: "button",
              class: "nav__link" + (isCurrent ? " is-current" : "") + (isDone ? " is-done" : ""),
              "aria-current": isCurrent ? "step" : null,
              onclick: () => goToStage(stage.id),
            },
            [
              el("span", { class: "nav__step-number" }, isDone ? "✓" : String(stage.id)),
              el("span", { class: "nav__step-label" }, stage.label),
              el("span", { class: "nav__step-progress" }, `${progress.percentage}%`),
            ]
          ),
        ]
      );
      list.appendChild(item);
    });
    nav.appendChild(list);
  }

  function renderAlerts(stageId) {
    const { el, AlertCard } = window.Components;
    const alerts = window.DataModel.getAlertsByStage(diagnosis, stageId);
    if (alerts.length === 0) return null;
    const wrap = el("div", { class: "alerts-panel" });
    alerts.forEach((a) => wrap.appendChild(AlertCard(a)));
    return wrap;
  }

  function render() {
    renderHeader();
    renderNav();

    const main = document.getElementById("main-content");
    const side = document.getElementById("side-panel");
    main.innerHTML = "";
    side.innerHTML = "";

    if (diagnosis.metadata.currentStage === "report") {
      main.appendChild(window.Report.renderReportView(diagnosis, { onBack: () => goToStage(window._lastStageBeforeReport ?? 0) }));
      return;
    }

    const stageId = diagnosis.metadata.currentStage;
    window._lastStageBeforeReport = stageId;
    const stageModule = window.Stages[stageId];
    if (!stageModule) {
      main.appendChild(window.Components.el("p", {}, `Etapa ${stageId} não implementada.`));
      return;
    }

    const advisory = window.Rules.prerequisitesForStage(diagnosis, stageId).advisory;
    if (advisory) {
      main.appendChild(window.Components.el("div", { class: "alert-card alert-card--reflection" }, [
        window.Components.el("span", { class: "alert-card__badge" }, "Reflexão"),
        window.Components.el("p", {}, advisory),
      ]));
    }

    const alertsPanel = renderAlerts(stageId);
    if (alertsPanel) main.appendChild(alertsPanel);

    main.appendChild(window.Components.el("h2", { class: "stage-title", tabindex: "-1", id: "stage-heading" }, `${stageId}. ${stageModule.title}`));
    main.appendChild(stageModule.render(diagnosis));

    main.appendChild(renderStageNavButtons(stageId));

    if (typeof stageModule.memoryPanel === "function") {
      const panel = stageModule.memoryPanel(diagnosis);
      if (panel) {
        side.appendChild(window.Components.el("h3", {}, "Do seu diagnóstico"));
        side.appendChild(panel);
      }
    }
  }

  function renderStageNavButtons(stageId) {
    const { el } = window.Components;
    const wrap = el("div", { class: "stage-nav-buttons" });
    if (stageId > 0) {
      wrap.appendChild(el("button", { class: "btn btn--outline", onclick: () => goToStage(stageId - 1) }, "← Etapa anterior"));
    }
    if (stageId < 10) {
      wrap.appendChild(el("button", { class: "btn btn--primary", onclick: () => goToStage(stageId + 1) }, "Próxima etapa →"));
    }
    return wrap;
  }

  /* ---------------------------------------------------------------------- */
  /* Inicialização                                                           */
  /* ---------------------------------------------------------------------- */

  function init() {
    const saved = window.Storage.loadDiagnosis();
    diagnosis = saved || window.DataModel.createDiagnosis();
    window.Rules.runAllRules(diagnosis);
    window.Storage.setOnSaved(() => renderHeader());
    render();
  }

  window.App = {
    getDiagnosis,
    setField,
    mutate,
    addEvidence,
    goToStage,
    showReport,
  };

  document.addEventListener("DOMContentLoaded", init);
})();
