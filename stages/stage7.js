/**
 * stage7.js — Etapa 7: Plano de Ação
 * Trava de completude (seção 46): evidência + problema + objetivo +
 * atividade + resultado esperado. Trilha de coerência visual (seção 47)
 * com confirmação humana — sem IA decidindo coerência.
 */

(function () {
  const { el, domId } = window.Components;

  const RESPONSE_TYPES_OPTIONS = [
    { value: "structural", label: "Ação estrutural" }, { value: "pedagogical", label: "Ação pedagógica" },
    { value: "institutional_articulation", label: "Articulação institucional" }, { value: "communication", label: "Comunicação" },
    { value: "community_mobilization", label: "Mobilização comunitária" }, { value: "monitoring", label: "Monitoramento" }, { value: "other", label: "Outro" },
  ];
  const AUDIENCES_OPTIONS = [
    { value: "students", label: "Estudantes" }, { value: "teachers", label: "Professores(as)" }, { value: "families", label: "Famílias" },
    { value: "community", label: "Comunidade" }, { value: "management", label: "Gestão" }, { value: "other", label: "Outro" },
  ];
  const VIABILITY_OPTIONS = [{ value: "high", label: "Alta" }, { value: "medium", label: "Média" }, { value: "low", label: "Baixa" }, { value: "uncertain", label: "Incerta" }];
  const DEPENDENCIES_OPTIONS = [
    { value: "management_approval", label: "Aprovação da gestão" }, { value: "financial_resources", label: "Recursos financeiros" },
    { value: "external_partnership", label: "Parceria externa" }, { value: "prior_training", label: "Formação prévia" },
    { value: "none", label: "Nenhuma" }, { value: "other", label: "Outra" },
  ];
  const EXECUTION_EVIDENCE_OPTIONS = [
    { value: "photos", label: "Fotos" }, { value: "attendance_list", label: "Lista de presença" }, { value: "student_production", label: "Produção dos estudantes" },
    { value: "meeting_minutes", label: "Registro em ata" }, { value: "testimonies", label: "Depoimentos" }, { value: "other", label: "Outro" },
  ];
  const IMPLEMENTATION_BARRIERS_OPTIONS = [
    { value: "time", label: "Tempo" }, { value: "resources", label: "Recursos" }, { value: "articulation", label: "Articulação" },
    { value: "weather", label: "Clima" }, { value: "engagement", label: "Adesão" }, { value: "other", label: "Outra" },
  ];
  const STUDENT_ROLE_OPTIONS = [
    { value: "spectator", label: "Espectador" }, { value: "participant", label: "Participante" }, { value: "protagonist", label: "Protagonista" }, { value: "co_producer", label: "Coprodutor" },
  ];

  function row(label, control) {
    return el("div", { class: "field field--compact" }, [el("label", {}, label), control]);
  }
  function multiCheckbox(options, selected, onToggle) {
    const group = el("div", { class: "choice-group" });
    options.forEach((o) => {
      const optId = domId("act");
      group.appendChild(el("label", { class: "choice-item choice-item--small", for: optId }, [
        el("input", { type: "checkbox", id: optId, checked: selected.includes(o.value), onchange: (e) => onToggle(o.value, e.target.checked) }),
        el("span", {}, o.label),
      ]));
    });
    return group;
  }
  function singleSelect(options, current, onChange) {
    const select = el("select", { class: "input input--select" });
    select.appendChild(el("option", { value: "" }, "—"));
    options.forEach((o) => select.appendChild(el("option", { value: o.value, selected: current === o.value }, o.label)));
    select.addEventListener("change", (e) => onChange(e.target.value));
    return select;
  }
  function textInput(value, onInput, placeholder) {
    const input = el("input", { type: "text", class: "input", value: value || "", placeholder: placeholder || "", oninput: (e) => onInput(e.target.value) });
    return input;
  }
  function textareaInput(value, onInput, placeholder) {
    const t = el("textarea", { class: "input textarea", rows: 2, placeholder: placeholder || "" });
    t.value = value || "";
    t.addEventListener("input", (e) => onInput(e.target.value));
    return t;
  }

  function multiFieldWithOther(object, key, options, update, placeholder) {
    const selected = object[key] || [];
    const group = multiCheckbox(options, selected, (v, checked) => {
      const set = new Set(selected); checked ? set.add(v) : set.delete(v); update({ [key]: [...set] });
    });
    const otherKey = `${key}Other`;
    const otherInput = window.Components.renderOtherInline(selected.includes("other"), object[otherKey], (v) => update({ [otherKey]: v }), placeholder);
    if (otherInput) group.appendChild(otherInput);
    return group;
  }

  function isPlanComplete(plan) {
    return !!(plan.priorityId && (plan.evidenceIds || []).length >= 1 && plan.problemStatement && plan.problemStatement.trim() && plan.objective && plan.objective.trim() && (plan.activities || []).length >= 1 && plan.expectedResult && plan.expectedResult.trim());
  }

  function renderActivities(diagnosis, plan) {
    const wrap = el("div", { class: "activities" });
    wrap.appendChild(el("h4", {}, "Atividades (ACT_ACTIVITIES)"));
    (plan.activities || []).forEach((activity) => {
      const update = (patch) => window.App.mutate((d) => {
        const p = d.actionPlans.find((x) => x.actionPlanId === plan.actionPlanId);
        Object.assign(p.activities.find((a) => a.activityId === activity.activityId), patch);
      });
      const card = el("div", { class: "activity-card" });
      card.appendChild(row("Descrição", textareaInput(activity.description, (v) => update({ description: v }))));
      card.appendChild(row("Como será implementada", textInput(activity.implementationMethod, (v) => update({ implementationMethod: v }))));
      card.appendChild(row("Responsável", textInput(activity.responsible, (v) => update({ responsible: v }))));
      card.appendChild(row("Início previsto", textInput(activity.expectedStart, (v) => update({ expectedStart: v }))));
      card.appendChild(row("Término previsto", textInput(activity.expectedEnd, (v) => update({ expectedEnd: v }))));
      card.appendChild(row("Status", singleSelect([
        { value: "planned", label: "Planejada" }, { value: "in_progress", label: "Em andamento" }, { value: "completed", label: "Concluída" }, { value: "not_completed", label: "Não realizada" },
      ], activity.status, (v) => update({ status: v }))));
      card.appendChild(el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => window.App.mutate((d) => { const p = d.actionPlans.find((x) => x.actionPlanId === plan.actionPlanId); p.activities = p.activities.filter((a) => a.activityId !== activity.activityId); }) }, "Remover atividade"));
      wrap.appendChild(card);
    });
    wrap.appendChild(el("button", { type: "button", class: "btn btn--secondary btn--small", onclick: () => window.App.mutate((d) => { const p = d.actionPlans.find((x) => x.actionPlanId === plan.actionPlanId); p.activities.push(window.DataModel.createActivity({ actionPlanId: plan.actionPlanId })); }) }, "+ Adicionar atividade"));
    return wrap;
  }

  function renderCoherenceTrail(diagnosis, plan) {
    const wrap = el("div", { class: "coherence-trail" });
    wrap.appendChild(el("h4", {}, "Trilha de coerência"));
    const evidenceLabels = (plan.evidenceIds || []).map((id) => window.DataModel.getEvidenceById(diagnosis, id)?.description).filter(Boolean);
    const steps = [
      ["Evidência", evidenceLabels.join("; ") || "(nenhuma evidência vinculada ainda)"],
      ["Problema", plan.problemStatement || "(não definido)"],
      ["Objetivo", plan.objective || "(não definido)"],
      ["Ação", (plan.activities || []).map((a) => a.description).filter(Boolean).join("; ") || "(nenhuma atividade ainda)"],
      ["Resultado esperado", plan.expectedResult || "(não definido)"],
    ];
    const list = el("ol", { class: "coherence-trail__list" });
    steps.forEach(([label, value]) => list.appendChild(el("li", {}, [el("strong", {}, `${label}: `), value])));
    wrap.appendChild(list);

    const update = (patch) => window.App.mutate((d) => Object.assign(d.actionPlans.find((x) => x.actionPlanId === plan.actionPlanId), patch));
    wrap.appendChild(row("Esta cadeia é coerente? (ACT_COHERENCE_CONFIRMATION)", singleSelect([
      { value: "coherent", label: "Coerente" }, { value: "partially_coherent", label: "Parcialmente coerente" }, { value: "not_sure", label: "Não tenho certeza" },
    ], plan.coherenceValidation, (v) => update({ coherenceValidation: v }))));
    if (plan.coherenceValidation && plan.coherenceValidation !== "coherent") {
      wrap.appendChild(row("O que precisa ser ajustado? (ACT_COHERENCE_NOTE)", textareaInput(plan.coherenceNote, (v) => update({ coherenceNote: v }))));
    }
    return wrap;
  }

  function renderPlanEditor(diagnosis, plan) {
    const priority = diagnosis.priorities.find((p) => p.priorityId === plan.priorityId);
    const problem = priority ? window.DataModel.getProblemById(diagnosis, priority.problemId) : null;
    const update = (patch) => window.App.mutate((d) => Object.assign(d.actionPlans.find((x) => x.actionPlanId === plan.actionPlanId), patch));

    const card = el("div", { class: "action-plan-editor" });
    card.appendChild(el("h3", {}, `Plano para: ${problem ? problem.title : "(prioridade removida)"}`));
    card.appendChild(el("span", { class: "badge " + (isPlanComplete(plan) ? "badge--complete" : "badge--pending") }, isPlanComplete(plan) ? "Plano completo" : "Pendente: evidência, problema, objetivo, atividade e resultado esperado são obrigatórios"));

    card.appendChild(row("Enunciado do problema (ACT_PROBLEM_STATEMENT)", textareaInput(plan.problemStatement, (v) => update({ problemStatement: v }))));

    const evList = el("div", { class: "choice-group" });
    diagnosis.evidence.forEach((ev) => {
      const optId = domId("planev");
      evList.appendChild(el("label", { class: "choice-item choice-item--small", for: optId }, [
        el("input", { type: "checkbox", id: optId, checked: (plan.evidenceIds || []).includes(ev.evidenceId), onchange: (e) => {
          const set = new Set(plan.evidenceIds || []); e.target.checked ? set.add(ev.evidenceId) : set.delete(ev.evidenceId); update({ evidenceIds: [...set] });
        } }),
        el("span", {}, ev.description || ev.type),
      ]));
    });
    if (diagnosis.evidence.length === 0) evList.appendChild(el("p", { class: "muted" }, "Nenhuma evidência registrada. Volte a etapas anteriores para registrar evidências."));
    card.appendChild(row("Evidências que sustentam este plano (ACT_EVIDENCE) — obrigatório", evList));

    card.appendChild(row("Mudança desejada (ACT_DESIRED_CHANGE)", textareaInput(plan.desiredChange, (v) => update({ desiredChange: v }))));
    card.appendChild(row("Objetivo (ACT_OBJECTIVE) — obrigatório", textareaInput(plan.objective, (v) => update({ objective: v }))));
    card.appendChild(row("Tipos de resposta (ACT_RESPONSE_TYPES)", multiFieldWithOther(plan, "responseTypes", RESPONSE_TYPES_OPTIONS, update, "Especifique o tipo de resposta...")));

    card.appendChild(renderActivities(diagnosis, plan));

    card.appendChild(row("Públicos envolvidos (ACT_AUDIENCES)", multiFieldWithOther(plan, "audiences", AUDIENCES_OPTIONS, update, "Especifique o público...")));
    card.appendChild(row("Papel dos estudantes (ACT_STUDENT_ROLE)", singleSelect(STUDENT_ROLE_OPTIONS, plan.studentParticipation, (v) => update({ studentParticipation: v }))));
    card.appendChild(row("Coordenador(a) (ACT_COORDINATOR)", textInput(plan.coordinator, (v) => update({ coordinator: v }))));
    card.appendChild(row("Outros participantes (ACT_OTHER_PARTICIPANTS)", textInput(plan.otherParticipants, (v) => update({ otherParticipants: v }))));

    const partnersGroup = el("div", { class: "choice-group" });
    diagnosis.actors.forEach((actor) => {
      const optId = domId("planact");
      partnersGroup.appendChild(el("label", { class: "choice-item choice-item--small", for: optId }, [
        el("input", { type: "checkbox", id: optId, checked: (plan.partnerActorIds || []).includes(actor.actorId), onchange: (e) => { const s = new Set(plan.partnerActorIds || []); e.target.checked ? s.add(actor.actorId) : s.delete(actor.actorId); update({ partnerActorIds: [...s] }); } }),
        el("span", {}, actor.name),
      ]));
    });
    card.appendChild(row("Parceiros (ACT_PARTNERS)", partnersGroup));
    card.appendChild(row("Contribuição dos parceiros (ACT_PARTNER_CONTRIBUTION)", textareaInput(plan.partnerContribution, (v) => update({ partnerContribution: v }))));
    card.appendChild(row("Recursos necessários (ACT_RESOURCES)", textareaInput(plan.resources, (v) => update({ resources: v }))));
    card.appendChild(row("Viabilidade (ACT_VIABILITY)", singleSelect(VIABILITY_OPTIONS, plan.viability, (v) => update({ viability: v }))));
    card.appendChild(row("Início (ACT_START)", textInput(plan.start, (v) => update({ start: v }))));
    card.appendChild(row("Duração (ACT_DURATION)", textInput(plan.duration, (v) => update({ duration: v }))));
    card.appendChild(row("Dependências (ACT_DEPENDENCIES)", multiCheckbox(DEPENDENCIES_OPTIONS, plan.dependencies || [], (v, c) => { const s = new Set(plan.dependencies || []); c ? s.add(v) : s.delete(v); update({ dependencies: [...s] }); })));
    if ((plan.dependencies || []).some((d) => d !== "none")) {
      card.appendChild(row("Detalhe das dependências (ACT_DEPENDENCY_DETAIL)", textareaInput(plan.dependencyDetail, (v) => update({ dependencyDetail: v }))));
    }
    card.appendChild(row("Resultado esperado (ACT_EXPECTED_RESULT) — obrigatório", textareaInput(plan.expectedResult, (v) => update({ expectedResult: v }))));
    card.appendChild(row("Como o resultado será evidenciado (ACT_EXECUTION_EVIDENCE)", multiFieldWithOther(plan, "executionEvidenceTypes", EXECUTION_EVIDENCE_OPTIONS, update, "Especifique como...")));
    card.appendChild(row("Possíveis dificuldades de implementação (ACT_IMPLEMENTATION_BARRIERS)", multiFieldWithOther(plan, "implementationRisks", IMPLEMENTATION_BARRIERS_OPTIONS, update, "Especifique a dificuldade...")));
    card.appendChild(row("Como mitigar? (ACT_MITIGATION)", textareaInput(plan.mitigation, (v) => update({ mitigation: v }))));

    card.appendChild(renderCoherenceTrail(diagnosis, plan));

    return card;
  }

  function render(diagnosis) {
    const container = el("div", { class: "stage-form" });
    if (diagnosis.priorities.length === 0) {
      container.appendChild(el("p", { class: "muted" }, "Nenhuma prioridade selecionada ainda. Volte à etapa anterior."));
      return container;
    }
    diagnosis.priorities.forEach((priority) => {
      const plan = window.DataModel.getActionPlanForPriority(diagnosis, priority.priorityId);
      if (!plan) {
        const problem = window.DataModel.getProblemById(diagnosis, priority.problemId);
        container.appendChild(el("div", { class: "action-plan-editor" }, [
          el("h3", {}, `Prioridade #${priority.order}: ${problem ? problem.title : ""}`),
          el("button", { type: "button", class: "btn btn--secondary", onclick: () => window.App.mutate((d) => d.actionPlans.push(window.DataModel.createActionPlan({ priorityId: priority.priorityId, problemStatement: problem ? problem.description || problem.title : "" }))) }, "Criar plano de ação (ACT_PRIORITY)"),
        ]));
      } else {
        container.appendChild(renderPlanEditor(diagnosis, plan));
      }
    });
    return container;
  }

  function extraRequiredChecks(diagnosis) {
    return [{ id: "AT_LEAST_ONE_ACTIVITY", satisfied: diagnosis.actionPlans.some((p) => (p.activities || []).length > 0) }];
  }

  window.Stages = window.Stages || {};
  window.Stages[7] = { id: 7, key: "actionPlan", title: "Plano de Ação", fields: [], render, extraRequiredChecks, isPlanComplete };
})();
