/**
 * stage5.js — Etapa 5: Leitura Integrada (FOFA)
 * A FOFA nasce semeada por sugestões do sistema a partir de dados já
 * registrados (nunca começa vazia — seção 36), mas todo item exige
 * confirmação humana antes de contar como definitivo.
 */

(function () {
  const { el, renderField, domId } = window.Components;
  const ga = (d, id) => window.DataModel.getAnswer(d, id);

  const CATEGORY_LABELS = { strength: "Força", weakness: "Fragilidade", opportunity: "Oportunidade", threat: "Ameaça" };
  const JUSTIFICATION_LABEL = {
    strength: "Por que essa força é relevante? (SWOT_STRENGTH_JUSTIFICATION)",
    weakness: "O que sustenta essa fragilidade?",
    opportunity: "Como essa oportunidade pode ser aproveitada? (SWOT_OPPORTUNITY_USE)",
    threat: "Quem é afetado por essa ameaça? (SWOT_THREAT_AFFECTED)",
  };

  const topFields = [
    { id: "SWOT_DIAGNOSIS_VALIDATION", type: "confirmation", label: "A leitura construída até aqui reflete bem a realidade da escola e do território?", qNumber: "Q5.1", required: true },
    { id: "SWOT_CONTEXT_NOTE", type: "textarea", label: "Algum contexto importante para interpretar esta leitura integrada?", qNumber: "Q5.2" },
  ];

  const finalFields = [
    { id: "SWOT_MAIN_CAPACITY", type: "text", label: "Qual a principal capacidade da escola/comunidade hoje?", qNumber: "Q5.3" },
    { id: "SWOT_MAIN_LIMITATION", type: "text", label: "Qual a principal limitação hoje?", qNumber: "Q5.4" },
    { id: "SWOT_UNDERUSED_OPPORTUNITY", type: "text", label: "Existe alguma oportunidade pouco aproveitada até agora?", qNumber: "Q5.5" },
  ];

  function renderSwotItem(diagnosis, item) {
    const update = (patch) => window.App.mutate((d) => Object.assign(d.swotItems.find((s) => s.swotItemId === item.swotItemId), patch));
    const card = el("div", { class: `swot-card swot-card--${item.category} swot-card--editable` });
    if (item.systemSuggested && !item.userConfirmed) {
      card.appendChild(el("span", { class: "swot-card__tag" }, "sugestão automática — confirme ou descarte"));
    }
    const labelInput = el("input", { type: "text", class: "input", value: item.label, placeholder: "Rótulo curto", oninput: (e) => update({ label: e.target.value }) });
    card.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, "Rótulo"), labelInput]));

    const descArea = el("textarea", { class: "input textarea", rows: 2 }); descArea.value = item.description || "";
    descArea.addEventListener("input", (e) => update({ description: e.target.value }));
    card.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, "Descrição"), descArea]));

    if (item.systemSuggested && !item.userConfirmed) {
      const confirmBtn = el("button", { type: "button", class: "btn btn--secondary btn--small", onclick: () => update({ userConfirmed: true }) }, "Confirmar sugestão");
      const discardBtn = el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => window.App.mutate((d) => { d.swotItems = d.swotItems.filter((s) => s.swotItemId !== item.swotItemId); }) }, "Descartar sugestão");
      card.appendChild(el("div", { class: "swot-card__actions" }, [confirmBtn, discardBtn]));
      return card;
    }

    const priorityCheckbox = el("input", { type: "checkbox", checked: item.priority, onchange: (e) => update({ priority: e.target.checked }) });
    card.appendChild(el("label", { class: "choice-item" }, [priorityCheckbox, el("span", {}, `Marcar como item prioritário (SWOT_TOP_${item.category.toUpperCase()}S)`)]));

    if (item.priority) {
      const justArea = el("textarea", { class: "input textarea", rows: 2 }); justArea.value = item.justification || "";
      justArea.addEventListener("input", (e) => update({ justification: e.target.value }));
      card.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, JUSTIFICATION_LABEL[item.category]), justArea]));

      if (item.category === "weakness" || item.category === "threat") {
        const evList = el("div", { class: "choice-group" });
        diagnosis.evidence.forEach((ev) => {
          const optId = domId("swev");
          evList.appendChild(el("label", { class: "choice-item choice-item--small", for: optId }, [
            el("input", { type: "checkbox", id: optId, checked: (item.evidenceIds || []).includes(ev.evidenceId), onchange: (e) => {
              const set = new Set(item.evidenceIds || []); e.target.checked ? set.add(ev.evidenceId) : set.delete(ev.evidenceId); update({ evidenceIds: [...set] });
            } }),
            el("span", {}, ev.description || ev.type),
          ]));
        });
        card.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, item.category === "weakness" ? "Evidências (SWOT_WEAKNESS_EVIDENCE)" : "Evidências (SWOT_THREAT_EVIDENCE)"), evList]));
      }
    }

    card.appendChild(el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => window.App.mutate((d) => { d.swotItems = d.swotItems.filter((s) => s.swotItemId !== item.swotItemId); }) }, "Remover"));
    return card;
  }

  function renderSwotCategory(diagnosis, category) {
    const wrap = el("div", { class: "swot-category" });
    wrap.appendChild(el("h3", {}, `${CATEGORY_LABELS[category]}s`));
    const items = diagnosis.swotItems.filter((i) => i.category === category);
    if (items.length === 0) wrap.appendChild(el("p", { class: "muted" }, "Nenhum item ainda."));
    items.forEach((item) => wrap.appendChild(renderSwotItem(diagnosis, item)));

    const newLabelInput = el("input", { type: "text", class: "input", placeholder: `Adicionar ${CATEGORY_LABELS[category].toLowerCase()}...` });
    const addBtn = el("button", {
      type: "button", class: "btn btn--secondary btn--small",
      onclick: () => {
        if (!newLabelInput.value.trim()) return;
        window.App.mutate((d) => d.swotItems.push(window.DataModel.createSwotItem({ category, label: newLabelInput.value, userConfirmed: true })));
        newLabelInput.value = "";
      },
    }, "+ Adicionar");
    wrap.appendChild(el("div", { class: "swot-category__add" }, [newLabelInput, addBtn]));
    return wrap;
  }

  const RELATION_CONFIG = [
    { type: "strength_threat", label: "Como uma força pode responder a uma ameaça? (SWOT_REL_STRENGTH_THREAT)", catA: "strength", catB: "threat" },
    { type: "opportunity_weakness", label: "Como uma oportunidade pode reduzir uma fragilidade? (SWOT_REL_OPPORTUNITY_WEAKNESS)", catA: "opportunity", catB: "weakness" },
    { type: "weakness_threat", label: "Como uma fragilidade agrava uma ameaça? (SWOT_REL_WEAKNESS_THREAT)", catA: "weakness", catB: "threat" },
  ];

  function itemLabelById(diagnosis, id) {
    const item = diagnosis.swotItems.find((i) => i.swotItemId === id);
    return item ? item.label : "(item removido)";
  }

  function renderRelations(diagnosis) {
    const wrap = el("div", { class: "strategic-relations" });
    wrap.appendChild(el("h3", {}, "Relações estratégicas"));

    RELATION_CONFIG.forEach((cfg) => {
      const section = el("div", { class: "strategic-relations__section" });
      section.appendChild(el("h4", {}, cfg.label));
      const relations = diagnosis.strategicRelations.filter((r) => r.relationType === cfg.type);
      relations.forEach((rel) => {
        section.appendChild(el("div", { class: "strategic-relations__item" }, [
          el("span", {}, `${itemLabelById(diagnosis, rel.elementAId)} → ${itemLabelById(diagnosis, rel.elementBId)}: ${rel.interpretation}`),
          el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => window.App.mutate((d) => { d.strategicRelations = d.strategicRelations.filter((r) => r.relationId !== rel.relationId); }) }, "Remover"),
        ]));
      });

      const itemsA = diagnosis.swotItems.filter((i) => i.category === cfg.catA && i.userConfirmed);
      const itemsB = diagnosis.swotItems.filter((i) => i.category === cfg.catB && i.userConfirmed);
      if (itemsA.length === 0 || itemsB.length === 0) {
        section.appendChild(el("p", { class: "muted" }, `Confirme itens de ${CATEGORY_LABELS[cfg.catA].toLowerCase()} e ${CATEGORY_LABELS[cfg.catB].toLowerCase()} para relacionar.`));
      } else {
        const selectA = el("select", { class: "input input--select" });
        itemsA.forEach((i) => selectA.appendChild(el("option", { value: i.swotItemId }, i.label)));
        const selectB = el("select", { class: "input input--select" });
        itemsB.forEach((i) => selectB.appendChild(el("option", { value: i.swotItemId }, i.label)));
        const interpretationInput = el("input", { type: "text", class: "input", placeholder: "Interpretação..." });
        const addBtn = el("button", {
          type: "button", class: "btn btn--secondary btn--small",
          onclick: () => {
            window.App.mutate((d) => d.strategicRelations.push(window.DataModel.createStrategicRelation({ relationType: cfg.type, elementAId: selectA.value, elementBId: selectB.value, interpretation: interpretationInput.value })));
            interpretationInput.value = "";
          },
        }, "+ Relacionar");
        section.appendChild(el("div", { class: "strategic-relations__add" }, [selectA, selectB, interpretationInput, addBtn]));
      }
      wrap.appendChild(section);
    });
    return wrap;
  }

  const CAPACITY_CATEGORIES = [
    { key: "pedagogical", label: "Pedagógicas (CAP_PEDAGOGICAL)", help: "Saberes e práticas de ensino já disponíveis na escola — ex.: professores com experiência em projetos interdisciplinares, metodologias ativas, uso do território como espaço de aprendizagem." },
    { key: "social", label: "Sociais (CAP_SOCIAL)", help: "Formas de organização e mobilização das pessoas — ex.: participação estudantil ativa, rede de apoio entre famílias, mutirões, associações comunitárias." },
    { key: "institutional", label: "Institucionais (CAP_INSTITUTIONAL)", help: "Estruturas, normas e gestão da própria escola — ex.: apoio da direção, PPP que sustenta continuidade, canais de decisão coletiva." },
    { key: "territorial", label: "Territoriais (CAP_TERRITORIAL)", help: "Recursos e conhecimentos do entorno — ex.: conhecimento tradicional sobre o clima local, parceiros no bairro, espaços públicos de apoio." },
    { key: "material", label: "Materiais (CAP_MATERIAL)", help: "Infraestrutura, equipamentos e recursos físicos — ex.: espaço para horta, materiais didáticos próprios, equipamentos disponíveis." },
  ];

  function renderCapacities(diagnosis) {
    const wrap = el("div", { class: "capacities" });
    wrap.appendChild(el("h3", {}, "Capacidades adaptativas"));
    wrap.appendChild(el("p", { class: "field__help" }, "São recursos, saberes e formas de organização que a escola e o território JÁ possuem e que ajudam a responder a desafios socioambientais e climáticos. Capacidades comunitárias não são tratadas como inferiores às institucionais — registre o que já existe, mesmo que informal."));

    CAPACITY_CATEGORIES.forEach((cat) => {
      const list = diagnosis.adaptiveCapacities[cat.key] || [];
      const section = el("div", { class: "capacities__category" });
      section.appendChild(el("h4", {}, cat.label));
      if (cat.help) section.appendChild(el("p", { class: "field__help" }, cat.help));
      const tagList = el("ul", { class: "tag-list" });
      list.forEach((text, idx) => {
        tagList.appendChild(el("li", {}, [
          el("span", {}, text),
          el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => window.App.mutate((d) => { d.adaptiveCapacities[cat.key] = d.adaptiveCapacities[cat.key].filter((_, i) => i !== idx); }) }, "×"),
        ]));
      });
      section.appendChild(tagList);
      const input = el("input", { type: "text", class: "input", placeholder: "Descreva uma capacidade..." });
      const addBtn = el("button", { type: "button", class: "btn btn--secondary btn--small", onclick: () => {
        if (!input.value.trim()) return;
        window.App.mutate((d) => d.adaptiveCapacities[cat.key] = [...(d.adaptiveCapacities[cat.key] || []), input.value]);
        input.value = "";
      }}, "+ Adicionar");
      section.appendChild(el("div", { class: "capacities__add" }, [input, addBtn]));
      wrap.appendChild(section);
    });

    const allCapacities = CAPACITY_CATEGORIES.flatMap((c) => diagnosis.adaptiveCapacities[c.key] || []);
    if (allCapacities.length > 0) {
      const priorityGroup = el("div", { class: "choice-group" });
      const currentPriority = diagnosis.adaptiveCapacities.CAP_PRIORITY_TO_STRENGTHEN || [];
      allCapacities.forEach((cap) => {
        const optId = domId("cappri");
        priorityGroup.appendChild(el("label", { class: "choice-item choice-item--small", for: optId }, [
          el("input", { type: "checkbox", id: optId, checked: currentPriority.includes(cap), onchange: (e) => {
            const set = new Set(currentPriority); e.target.checked ? set.add(cap) : set.delete(cap);
            window.App.mutate((d) => (d.adaptiveCapacities.CAP_PRIORITY_TO_STRENGTHEN = [...set]));
          } }),
          el("span", {}, cap),
        ]));
      });
      wrap.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, "Prioridade para fortalecimento (CAP_PRIORITY_TO_STRENGTHEN)"), priorityGroup]));

      const reasonArea = el("textarea", { class: "input textarea", rows: 2 }); reasonArea.value = diagnosis.adaptiveCapacities.CAP_PRIORITY_REASON || "";
      reasonArea.addEventListener("input", (e) => window.App.mutate((d) => (d.adaptiveCapacities.CAP_PRIORITY_REASON = e.target.value)));
      wrap.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, "Por quê? (CAP_PRIORITY_REASON)"), reasonArea]));
    }

    return wrap;
  }

  function render(diagnosis) {
    const container = el("div", { class: "stage-form" });
    topFields.forEach((f) => { const n = renderField(f, diagnosis, window.App.setField); if (n) container.appendChild(n); });

    const suggested = diagnosis.swotItems.filter((i) => i.systemSuggested && !i.userConfirmed);
    if (suggested.length > 0) {
      container.appendChild(el("p", { class: "stage-intro" }, `O sistema identificou ${suggested.length} sugestão(ões) de item de FOFA a partir de respostas já registradas. Revise, confirme ou descarte cada uma.`));
    }

    ["strength", "weakness", "opportunity", "threat"].forEach((cat) => container.appendChild(renderSwotCategory(diagnosis, cat)));
    container.appendChild(renderRelations(diagnosis));
    container.appendChild(renderCapacities(diagnosis));

    finalFields.forEach((f) => { const n = renderField(f, diagnosis, window.App.setField); if (n) container.appendChild(n); });
    return container;
  }

  window.Stages = window.Stages || {};
  window.Stages[5] = { id: 5, key: "integratedReading", title: "Leitura Integrada", fields: [...topFields, ...finalFields], render };
})();
