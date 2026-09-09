/**
 * stage8.js — Etapa 8: Educomunicação
 * Educomunicação não é sinônimo de divulgação (seção 48) — comunicação
 * apenas unilateral gera reflexão, não erro (ver rules.js).
 */

(function () {
  const { el, domId } = window.Components;

  const PURPOSE_OPTIONS = [
    { value: "inform", label: "Informar" }, { value: "raise_awareness", label: "Sensibilizar" }, { value: "mobilize", label: "Mobilizar" },
    { value: "accountability", label: "Prestar contas" }, { value: "give_voice", label: "Dar voz à comunidade" }, { value: "other", label: "Outro" },
  ];
  const AUDIENCE_OPTIONS = [
    { value: "students", label: "Estudantes" }, { value: "teachers", label: "Professores(as)" }, { value: "families", label: "Famílias" },
    { value: "community", label: "Comunidade" }, { value: "public_power", label: "Poder público" }, { value: "other", label: "Outro" },
  ];
  const LISTENING_CHANNELS_OPTIONS = [
    { value: "suggestion_box", label: "Caixa de sugestões" }, { value: "conversation_circle", label: "Roda de conversa" },
    { value: "form", label: "Formulário" }, { value: "social_media", label: "Redes sociais" }, { value: "meeting", label: "Reunião" }, { value: "other", label: "Outro" },
  ];
  const MEDIA_OPTIONS = [
    { value: "poster", label: "Cartaz" }, { value: "school_radio", label: "Rádio escolar" }, { value: "video", label: "Vídeo" },
    { value: "social_media", label: "Redes sociais" }, { value: "wall_newspaper", label: "Jornal mural" }, { value: "theater", label: "Teatro" }, { value: "podcast", label: "Podcast" }, { value: "other", label: "Outro" },
  ];
  const ACCESS_BARRIERS_OPTIONS = [
    { value: "language", label: "Idioma/linguagem técnica" }, { value: "disability_access", label: "Acessibilidade para pessoas com deficiência" },
    { value: "connectivity", label: "Falta de conectividade" }, { value: "literacy", label: "Alfabetização" }, { value: "other", label: "Outra" },
  ];
  const PRODUCERS_OPTIONS = [
    { value: "students", label: "Estudantes" }, { value: "teachers", label: "Professores(as)" }, { value: "school_communication", label: "Comunicação escolar" }, { value: "external_partners", label: "Parceiros externos" }, { value: "other", label: "Outro" },
  ];
  const STUDENT_DECISION_OPTIONS = [
    { value: "none", label: "Nenhuma" }, { value: "consulted", label: "São consultados" },
    { value: "collaborate_production", label: "Colaboram na produção" }, { value: "decide_content", label: "Decidem conteúdo/formato" },
  ];

  function row(label, control) { return el("div", { class: "field field--compact" }, [el("label", {}, label), control]); }
  function multiCheckbox(options, selected, onToggle) {
    const group = el("div", { class: "choice-group" });
    options.forEach((o) => {
      const optId = domId("com");
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
  function textareaInput(value, onInput) {
    const t = el("textarea", { class: "input textarea", rows: 2 }); t.value = value || ""; t.addEventListener("input", (e) => onInput(e.target.value)); return t;
  }
  function textInput(value, onInput) {
    return el("input", { type: "text", class: "input", value: value || "", oninput: (e) => onInput(e.target.value) });
  }

  function renderStrategyEditor(diagnosis, strategy) {
    const update = (patch) => window.App.mutate((d) => Object.assign(d.communicationStrategies.find((s) => s.communicationId === strategy.communicationId), patch));
    const card = el("div", { class: "communication-editor" });

    function multiFieldWithOther(key, options, placeholder) {
      const selected = strategy[key] || [];
      const group = multiCheckbox(options, selected, (v, c) => { const s = new Set(selected); c ? s.add(v) : s.delete(v); update({ [key]: [...s] }); });
      const otherKey = `${key}Other`;
      const otherInput = window.Components.renderOtherInline(selected.includes("other"), strategy[otherKey], (v) => update({ [otherKey]: v }), placeholder);
      if (otherInput) group.appendChild(otherInput);
      return group;
    }

    if (!(strategy.listeningChannels || []).length) {
      card.appendChild(el("div", { class: "alert-card alert-card--reflection" }, [
        el("span", { class: "alert-card__badge" }, "Reflexão"),
        el("p", {}, "Nenhum canal de escuta foi definido ainda. Educomunicação não é sinônimo de divulgação unilateral — vale considerar como a comunidade poderá responder, e não só receber informação."),
      ]));
    }

    card.appendChild(row("Finalidades (COM_PURPOSE)", multiFieldWithOther("purposes", PURPOSE_OPTIONS, "Especifique a finalidade...")));
    card.appendChild(row("Públicos (COM_AUDIENCE)", multiFieldWithOther("audiences", AUDIENCE_OPTIONS, "Especifique o público...")));
    card.appendChild(row("Mensagem central (COM_CENTRAL_MESSAGE)", textareaInput(strategy.centralMessage, (v) => update({ centralMessage: v }))));
    card.appendChild(row("Canais de escuta (COM_LISTENING_CHANNELS)", multiFieldWithOther("listeningChannels", LISTENING_CHANNELS_OPTIONS, "Especifique o canal...")));
    card.appendChild(row("Mídias/formatos (COM_MEDIA)", multiFieldWithOther("media", MEDIA_OPTIONS, "Especifique a mídia/formato...")));
    card.appendChild(row("Barreiras de acesso (COM_ACCESS_BARRIERS)", multiFieldWithOther("accessBarriers", ACCESS_BARRIERS_OPTIONS, "Especifique a barreira...")));
    card.appendChild(row("Necessidades de acessibilidade (COM_ACCESS_NEEDS)", textareaInput((strategy.accessibilityNeeds || []).join("; "), (v) => update({ accessibilityNeeds: v ? v.split(";").map((x) => x.trim()).filter(Boolean) : [] }))));
    card.appendChild(row("Estratégias de acessibilidade (COM_ACCESS_STRATEGIES)", textareaInput(strategy.accessibilityStrategies, (v) => update({ accessibilityStrategies: v }))));
    card.appendChild(row("Quem produz (COM_PRODUCERS)", multiFieldWithOther("producers", PRODUCERS_OPTIONS, "Especifique quem produz...")));
    card.appendChild(row("Nível de decisão dos estudantes (COM_STUDENT_DECISION)", singleSelect(STUDENT_DECISION_OPTIONS, strategy.studentDecisionLevel, (v) => update({ studentDecisionLevel: v }))));
    card.appendChild(row("Momento em relação à ação (COM_TIMING)", textInput(strategy.timing, (v) => update({ timing: v }))));

    card.appendChild(el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => window.App.mutate((d) => { d.communicationStrategies = d.communicationStrategies.filter((s) => s.communicationId !== strategy.communicationId); }) }, "Remover estratégia"));
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

      const strategies = diagnosis.communicationStrategies.filter((s) => s.actionPlanId === plan.actionPlanId);
      strategies.forEach((s) => container.appendChild(renderStrategyEditor(diagnosis, s)));

      container.appendChild(el("button", {
        type: "button", class: "btn btn--secondary btn--small",
        onclick: () => window.App.mutate((d) => d.communicationStrategies.push(window.DataModel.createCommunicationStrategy({ actionPlanId: plan.actionPlanId }))),
      }, "+ Adicionar estratégia de comunicação (COM_ACTION_LINK)"));
    });
    return container;
  }

  function extraRequiredChecks(diagnosis) {
    // Nada aplicável ainda se não há plano de ação para comunicar.
    if (diagnosis.actionPlans.length === 0) return [];
    return diagnosis.actionPlans.map((plan) => ({
      id: `COM_STRATEGY_FOR_${plan.actionPlanId}`,
      satisfied: diagnosis.communicationStrategies.some(
        (s) => s.actionPlanId === plan.actionPlanId && (s.centralMessage || (s.purposes || []).length > 0)
      ),
    }));
  }

  window.Stages = window.Stages || {};
  window.Stages[8] = { id: 8, key: "communication", title: "Educomunicação", fields: [], render, extraRequiredChecks };
})();
