/**
 * stage9.js — Etapa 9: Monitoramento
 * Indicadores sempre vinculados a uma ação (seção 49). Linha de base
 * desconhecida vira lacuna explícita, nunca é assumida como zero (seção 50).
 */

(function () {
  const { el } = window.Components;

  const TYPE_OPTIONS = [{ value: "process", label: "Processo" }, { value: "participation", label: "Participação" }, { value: "result", label: "Resultado" }];
  const PERIODICITY_OPTIONS = [
    { value: "monthly", label: "Mensal" }, { value: "bimonthly", label: "Bimestral" }, { value: "quarterly", label: "Trimestral" },
    { value: "semiannual", label: "Semestral" }, { value: "annual", label: "Anual" }, { value: "per_event", label: "Por evento" },
  ];

  function row(label, control) { return el("div", { class: "field field--compact" }, [el("label", {}, label), control]); }
  function textInput(value, onInput) { return el("input", { type: "text", class: "input", value: value || "", oninput: (e) => onInput(e.target.value) }); }
  function textareaInput(value, onInput) { const t = el("textarea", { class: "input textarea", rows: 2 }); t.value = value || ""; t.addEventListener("input", (e) => onInput(e.target.value)); return t; }
  function singleSelect(options, current, onChange) {
    const select = el("select", { class: "input input--select" });
    select.appendChild(el("option", { value: "" }, "—"));
    options.forEach((o) => select.appendChild(el("option", { value: o.value, selected: current === o.value }, o.label)));
    select.addEventListener("change", (e) => onChange(e.target.value));
    return select;
  }

  function renderIndicatorEditor(diagnosis, indicator) {
    const update = (patch) => window.App.mutate((d) => Object.assign(d.indicators.find((i) => i.indicatorId === indicator.indicatorId), patch));
    const card = el("div", { class: "indicator-editor" });

    card.appendChild(row("Nome do indicador (MON_INDICATOR_NAME)", textInput(indicator.name, (v) => update({ name: v }))));
    card.appendChild(row("Tipo (MON_INDICATOR_TYPE)", singleSelect(TYPE_OPTIONS, indicator.type, (v) => update({ type: v }))));
    card.appendChild(row("Como será medido (MON_MEASUREMENT)", textareaInput(indicator.measurementDescription, (v) => update({ measurementDescription: v }))));

    const baselineKnownCheckbox = el("input", { type: "checkbox", checked: !indicator.baselineUnknown, onchange: (e) => update({ baselineUnknown: !e.target.checked }) });
    card.appendChild(el("label", { class: "choice-item" }, [baselineKnownCheckbox, el("span", {}, "Sabemos a linha de base atual")]));
    if (!indicator.baselineUnknown) {
      card.appendChild(row("Linha de base (MON_BASELINE)", textInput(indicator.baseline, (v) => update({ baseline: v }))));
    } else {
      card.appendChild(el("div", { class: "alert-card alert-card--missing" }, [
        el("span", { class: "alert-card__badge" }, "Pendência"),
        el("p", {}, "Antes da implementação será necessário estabelecer a linha de base. Isso foi registrado como lacuna de conhecimento."),
      ]));
    }

    card.appendChild(row("Meta (MON_TARGET)", textInput(indicator.target, (v) => update({ target: v }))));
    card.appendChild(row("Fonte de verificação (MON_SOURCE)", textInput(indicator.verificationSource, (v) => update({ verificationSource: v }))));
    card.appendChild(row("Periodicidade (MON_PERIODICITY)", singleSelect(PERIODICITY_OPTIONS, indicator.periodicity, (v) => update({ periodicity: v }))));
    card.appendChild(row("Responsável (MON_RESPONSIBLE)", textInput(indicator.responsible, (v) => update({ responsible: v }))));
    card.appendChild(row("Mudança qualitativa observada até agora (MON_QUALITATIVE_CHANGE)", textareaInput(indicator.qualitativeChange, (v) => update({ qualitativeChange: v }))));
    card.appendChild(row("Como reconheceremos essa mudança? (MON_QUALITATIVE_RECOGNITION)", textareaInput(indicator.qualitativeRecognition, (v) => update({ qualitativeRecognition: v }))));

    card.appendChild(el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => window.App.mutate((d) => {
      d.indicators = d.indicators.filter((i) => i.indicatorId !== indicator.indicatorId);
    }) }, "Remover indicador"));

    return card;
  }

  function render(diagnosis) {
    const container = el("div", { class: "stage-form" });
    if (diagnosis.actionPlans.length === 0) {
      container.appendChild(el("p", { class: "muted" }, "Nenhum plano de ação ainda. Volte à etapa anterior."));
      return container;
    }
    diagnosis.actionPlans.forEach((plan) => {
      const priority = diagnosis.priorities.find((p) => p.priorityId === plan.priorityId);
      const problem = priority ? window.DataModel.getProblemById(diagnosis, priority.problemId) : null;
      container.appendChild(el("h3", {}, `Ação: ${plan.objective || (problem ? problem.title : "sem objetivo definido")}`));
      container.appendChild(el("p", { class: "muted" }, `Resultado esperado (MON_EXPECTED_RESULT_REF): ${plan.expectedResult || "(não definido)"}`));

      const indicators = window.DataModel.getIndicatorsForAction(diagnosis, plan.actionPlanId);
      indicators.forEach((ind) => {
        container.appendChild(renderIndicatorEditor(diagnosis, ind));
      });

      container.appendChild(el("button", {
        type: "button", class: "btn btn--secondary btn--small",
        onclick: () => window.App.mutate((d) => d.indicators.push(window.DataModel.createIndicator({ actionPlanId: plan.actionPlanId }))),
      }, "+ Adicionar indicador (MON_ACTION_LINK)"));
    });
    return container;
  }

  function extraRequiredChecks(diagnosis) {
    return [{ id: "AT_LEAST_ONE_ACTION_WITH_RESULT", satisfied: diagnosis.actionPlans.some((p) => p.expectedResult && p.expectedResult.trim()) }];
  }

  window.Stages = window.Stages || {};
  window.Stages[9] = { id: 9, key: "monitoring", title: "Monitoramento", fields: [], render, extraRequiredChecks };
})();
