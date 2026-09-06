/**
 * stage4.js — Etapa 4: Riscos Climáticos
 * Preserva a distinção entre ameaça, exposição, vulnerabilidade, impacto e
 * capacidade de resposta (seção 30). Percepção nunca vira comprovação
 * técnica (seção 31); vulnerabilidade é tratada relacionalmente (seção 32).
 * Inclui cartografia participativa (seção 34).
 */

(function () {
  const { el, renderField, renderEvidenceBuilder, domId } = window.Components;
  const ga = (d, id) => window.DataModel.getAnswer(d, id);

  const THREAT_OPTIONS = [
    { value: "enchente", label: "Enchente" }, { value: "inundacao", label: "Inundação" },
    { value: "alagamento", label: "Alagamento" }, { value: "enxurrada", label: "Enxurrada" },
    { value: "deslizamento", label: "Deslizamento" }, { value: "erosao", label: "Erosão" },
    { value: "estiagem", label: "Estiagem/seca" }, { value: "falta_agua", label: "Falta de água" },
    { value: "onda_calor", label: "Onda de calor" }, { value: "frio_intenso", label: "Frio intenso" },
    { value: "tempestades", label: "Tempestades" }, { value: "vendavais", label: "Vendavais" },
    { value: "granizo", label: "Granizo" }, { value: "ciclones", label: "Ciclones" },
    { value: "queimadas", label: "Queimadas" }, { value: "incendios", label: "Incêndios" },
    { value: "fumaca_poluicao", label: "Fumaça/poluição atmosférica" },
    { value: "contaminacao_agua", label: "Contaminação da água" },
    { value: "problemas_residuos", label: "Problemas relacionados a resíduos" },
    { value: "other", label: "Outros" },
  ];

  const FREQ_OPTIONS = [
    { value: "rare", label: "Raro (já ocorreu uma vez)" }, { value: "occasional", label: "Ocasional" },
    { value: "frequent", label: "Frequente" }, { value: "very_frequent", label: "Muito frequente/recorrente" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const IMPACT_OPTIONS = [
    { value: "class_interruption", label: "Interrupção de aulas" }, { value: "structural_damage", label: "Danos à estrutura" },
    { value: "access_interruption", label: "Acesso interrompido" }, { value: "material_loss", label: "Perda de materiais" },
    { value: "health_impact", label: "Impacto na saúde" }, { value: "emotional_impact", label: "Impacto emocional" }, { value: "other", label: "Outro" },
  ];

  const EXPOSED_ASSETS_OPTIONS = [
    { value: "school_building", label: "Prédio escolar" }, { value: "library", label: "Biblioteca" },
    { value: "sports_court", label: "Quadra" }, { value: "garden", label: "Horta" },
    { value: "equipment", label: "Equipamentos" }, { value: "documents", label: "Arquivos/documentos" }, { value: "other", label: "Outro" },
  ];

  const EXPOSED_GROUPS_OPTIONS = [
    { value: "students", label: "Estudantes" }, { value: "teachers", label: "Professores(as)" },
    { value: "staff", label: "Funcionários(as)" }, { value: "families", label: "Famílias" },
    { value: "people_with_disabilities", label: "Pessoas com deficiência" }, { value: "young_children", label: "Crianças pequenas" },
    { value: "elderly", label: "Idosos" }, { value: "other", label: "Outro" },
  ];

  // Formuladas relacionalmente (seção 32): condições que podem ampliar
  // dificuldades de proteção, nunca "características" dos grupos.
  const VULNERABILITY_CONDITIONS_OPTIONS = [
    { value: "limited_evacuation_routes", label: "Acessibilidade limitada nas rotas de saída" },
    { value: "no_signage", label: "Ausência de sinalização de emergência" },
    { value: "fragile_structure", label: "Estrutura física fragilizada" },
    { value: "inaccessible_communication", label: "Ausência de comunicação acessível (Libras/Braile/linguagem simples)" },
    { value: "no_adapted_evacuation_plan", label: "Ausência de plano de evacuação adaptado" },
    { value: "distance_from_support", label: "Distância de pontos de apoio/socorro" },
    { value: "other", label: "Outra condição" },
  ];

  const RESPONSE_CAPACITY_OPTIONS = [
    { value: "trained_team", label: "Brigada/equipe treinada" }, { value: "evacuation_plan", label: "Plano de evacuação" },
    { value: "alert_communication", label: "Comunicação de alerta" }, { value: "external_network_support", label: "Apoio de rede externa" },
    { value: "emergency_kit", label: "Kit de emergência" }, { value: "none_identified", label: "Nenhuma identificada" }, { value: "other", label: "Outra" },
  ];

  const LOW_MED_HIGH = [
    { value: "low", label: "Baixa" }, { value: "medium", label: "Média" }, { value: "high", label: "Alta" }, { value: "dontknow", label: "Não sabe" },
  ];

  const generalFields = [
    { id: "RISK_THREATS_SELECTED", type: "multiChoice", label: "Quais ameaças/eventos climáticos já afetaram (ou podem afetar) a escola/comunidade?", qNumber: "Q4.1", options: THREAT_OPTIONS, required: true },
    { id: "RISK_PERCEIVED_CLIMATE_CHANGE", type: "confirmation", label: "A comunidade percebe mudanças no padrão climático local ao longo dos anos?", qNumber: "Q4.2" },
    { id: "RISK_PERCEIVED_CHANGES", type: "textarea", label: "Que mudanças são percebidas?", qNumber: "Q4.3", condition: (d) => ga(d, "RISK_PERCEIVED_CLIMATE_CHANGE") === "yes", help: "Registre como percepção da comunidade — o relatório final não converterá isso em dado técnico comprovado." },
    { id: "RISK_PERCEPTION_SOURCES", type: "multiChoice", label: "Com base em quê essa percepção se formou?", qNumber: "Q4.4", options: [
      { value: "long_term_observation", label: "Observação ao longo dos anos" }, { value: "elder_accounts", label: "Relatos de moradores antigos" },
      { value: "record_comparison", label: "Comparação com registros" }, { value: "news", label: "Notícias" }, { value: "dontknow", label: "Não sabe" },
    ], condition: (d) => ga(d, "RISK_PERCEIVED_CLIMATE_CHANGE") === "yes" },
    { id: "RISK_INFORMATION_SOURCES", type: "multiChoice", label: "Existem fontes técnicas de informação sobre riscos consultadas pela escola?", qNumber: "Q4.5", options: [
      { value: "defesa_civil", label: "Defesa Civil" }, { value: "meteorological_data", label: "Dados meteorológicos (ex.: INMET)" },
      { value: "university", label: "Universidade" }, { value: "ngo", label: "ONG" }, { value: "traditional_knowledge", label: "Conhecimento tradicional" },
      { value: "none", label: "Não há fonte consultada" }, { value: "other", label: "Outra" },
    ]},
    { id: "RISK_TECH_SUPPORT_NEEDED", type: "confirmation", label: "Seria necessário apoio técnico para avaliar melhor esses riscos?", qNumber: "Q4.6" },
    { id: "RISK_TECH_SUPPORT_TARGET", type: "text", label: "Apoio técnico para quê, especificamente?", qNumber: "Q4.7", condition: (d) => ga(d, "RISK_TECH_SUPPORT_NEEDED") === "yes" },
    { id: "RISK_TECH_SUPPORT_ACTOR", type: "actorSelector", label: "Algum ator já mapeado poderia oferecer esse apoio?", qNumber: "Q4.8", condition: (d) => ga(d, "RISK_TECH_SUPPORT_NEEDED") === "yes" },
  ];

  function riskAutoSuggestions(diagnosis) {
    const suggestions = [];
    if (ga(diagnosis, "SAN_FLOOD_OCCURRENCE") === "yes") suggestions.push({ type: "alagamento", reason: "relatado na Etapa 1 (saneamento/entorno)" });
    if (ga(diagnosis, "TER_CLIMATE_EVENT_HISTORY") === "yes") suggestions.push({ type: null, reason: "histórico de evento climático extremo relatado na Etapa 1" });
    if (ga(diagnosis, "WAT_INTERRUPTION") === "yes") suggestions.push({ type: "falta_agua", reason: "interrupções no abastecimento relatadas na Etapa 1" });
    const selected = ga(diagnosis, "RISK_THREATS_SELECTED") || [];
    return suggestions.filter((s) => !s.type || !selected.includes(s.type));
  }

  function riskFieldRow(label, controlEl) {
    return el("div", { class: "field field--compact" }, [el("label", {}, label), controlEl]);
  }

  function multiCheckboxGroup(options, selected, onToggle, ariaLabel) {
    const group = el("div", { class: "choice-group", "aria-label": ariaLabel });
    options.forEach((o) => {
      const optId = domId("rk");
      group.appendChild(el("label", { class: "choice-item choice-item--small", for: optId }, [
        el("input", { type: "checkbox", id: optId, checked: selected.includes(o.value), onchange: (e) => onToggle(o.value, e.target.checked) }),
        el("span", {}, o.label),
      ]));
    });
    return group;
  }

  function singleSelect(options, current, onChange, ariaLabel) {
    const select = el("select", { class: "input input--select", "aria-label": ariaLabel });
    select.appendChild(el("option", { value: "" }, "—"));
    options.forEach((o) => select.appendChild(el("option", { value: o.value, selected: current === o.value }, o.label)));
    select.addEventListener("change", (e) => onChange(e.target.value));
    return select;
  }

  function renderRiskEditor(diagnosis, risk) {
    const update = (patch) => window.App.mutate((d) => Object.assign(d.risks.find((r) => r.riskId === risk.riskId), patch));
    const card = el("div", { class: "risk-card risk-card--editable" });
    const label = THREAT_OPTIONS.find((t) => t.value === risk.riskType)?.label || risk.riskType;
    card.appendChild(el("h4", {}, label));
    if (risk.attentionSignal) {
      card.appendChild(el("span", { class: `signal signal--${risk.attentionSignal}` }, "sinal interno — apoio à reflexão, não é avaliação técnica"));
    }

    card.appendChild(riskFieldRow("Já ocorreu antes?", singleSelect([{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }, { value: "dontknow", label: "Não sabe" }], risk.occurredBefore, (v) => update({ occurredBefore: v }), "occurredBefore")));
    card.appendChild(riskFieldRow("Afetou a escola, a comunidade, ou ambos?", singleSelect([{ value: "school", label: "Escola" }, { value: "community", label: "Comunidade" }, { value: "both", label: "Ambos" }, { value: "neither", label: "Nenhum" }, { value: "dontknow", label: "Não sabe" }], risk.affectedSchoolOrCommunity, (v) => update({ affectedSchoolOrCommunity: v }), "affected")));
    card.appendChild(riskFieldRow("Frequência", singleSelect(FREQ_OPTIONS, risk.frequency, (v) => update({ frequency: v }), "frequency")));

    const yearInput = el("input", { type: "number", class: "input input--number", value: risk.lastOccurrenceYear || "", oninput: (e) => update({ lastOccurrenceYear: e.target.value ? Number(e.target.value) : null }) });
    card.appendChild(riskFieldRow("Ano da última ocorrência", yearInput));
    const periodInput = el("input", { type: "text", class: "input", value: risk.lastOccurrencePeriod || "", oninput: (e) => update({ lastOccurrencePeriod: e.target.value }) });
    card.appendChild(riskFieldRow("Período do ano em que costuma ocorrer", periodInput));

    card.appendChild(riskFieldRow("Impactos observados", multiCheckboxGroup(IMPACT_OPTIONS, risk.observedImpacts || [], (v, checked) => {
      const set = new Set(risk.observedImpacts || []); checked ? set.add(v) : set.delete(v); update({ observedImpacts: [...set] });
    }, "observedImpacts")));
    const impactDesc = el("textarea", { class: "input textarea", rows: 2 }); impactDesc.value = risk.impactDescription || "";
    impactDesc.addEventListener("input", (e) => update({ impactDescription: e.target.value }));
    card.appendChild(riskFieldRow("Descreva os impactos", impactDesc));

    card.appendChild(riskFieldRow("Ativos/estruturas expostos", multiCheckboxGroup(EXPOSED_ASSETS_OPTIONS, risk.exposedAssets || [], (v, checked) => {
      const set = new Set(risk.exposedAssets || []); checked ? set.add(v) : set.delete(v); update({ exposedAssets: [...set] });
    }, "exposedAssets")));
    card.appendChild(riskFieldRow("Grupos expostos", multiCheckboxGroup(EXPOSED_GROUPS_OPTIONS, risk.exposedGroups || [], (v, checked) => {
      const set = new Set(risk.exposedGroups || []); checked ? set.add(v) : set.delete(v); update({ exposedGroups: [...set] });
    }, "exposedGroups")));
    card.appendChild(riskFieldRow("Condições que podem ampliar dificuldades de proteção (não são características das pessoas — são condições do ambiente/organização)", multiCheckboxGroup(VULNERABILITY_CONDITIONS_OPTIONS, risk.vulnerabilityConditions || [], (v, checked) => {
      const set = new Set(risk.vulnerabilityConditions || []); checked ? set.add(v) : set.delete(v); update({ vulnerabilityConditions: [...set] });
    }, "vulnerabilityConditions")));

    card.appendChild(riskFieldRow("Capacidades de resposta já existentes", multiCheckboxGroup(RESPONSE_CAPACITY_OPTIONS, risk.responseCapacities || [], (v, checked) => {
      const set = new Set(risk.responseCapacities || []); checked ? set.add(v) : set.delete(v); update({ responseCapacities: [...set] });
    }, "responseCapacities")));
    card.appendChild(riskFieldRow("Avaliação geral da capacidade de resposta", singleSelect([{ value: "good", label: "Boa" }, { value: "regular", label: "Regular" }, { value: "weak", label: "Fraca" }, { value: "none", label: "Inexistente" }, { value: "dontknow", label: "Não sabe" }], risk.responseCapacityAssessment, (v) => update({ responseCapacityAssessment: v }), "responseCapacityAssessment")));

    card.appendChild(riskFieldRow("Probabilidade percebida (não é medição técnica)", singleSelect(LOW_MED_HIGH, risk.perceivedProbability, (v) => update({ perceivedProbability: v }), "perceivedProbability")));
    card.appendChild(riskFieldRow("Gravidade potencial percebida", singleSelect(LOW_MED_HIGH, risk.potentialSeverity, (v) => update({ potentialSeverity: v }), "potentialSeverity")));
    const sevJust = el("textarea", { class: "input textarea", rows: 2 }); sevJust.value = risk.severityJustification || "";
    sevJust.addEventListener("input", (e) => update({ severityJustification: e.target.value }));
    card.appendChild(riskFieldRow("Justificativa da gravidade percebida", sevJust));

    const attentionScale = el("input", { type: "range", min: 1, max: 5, value: risk.communityAttentionLevel || 3, oninput: (e) => update({ communityAttentionLevel: Number(e.target.value) }) });
    card.appendChild(riskFieldRow(`Prioridade que a comunidade dá a este risco (${risk.communityAttentionLevel || 3}/5)`, attentionScale));

    const evidenceIds = risk.evidenceIds || [];
    const evList = el("div", { class: "choice-group" });
    diagnosis.evidence.forEach((ev) => {
      const optId = domId("ev");
      evList.appendChild(el("label", { class: "choice-item choice-item--small", for: optId }, [
        el("input", { type: "checkbox", id: optId, checked: evidenceIds.includes(ev.evidenceId), onchange: (e) => {
          const set = new Set(evidenceIds); e.target.checked ? set.add(ev.evidenceId) : set.delete(ev.evidenceId); update({ evidenceIds: [...set] });
        } }),
        el("span", {}, ev.description || ev.type),
      ]));
    });
    if (diagnosis.evidence.length === 0) evList.appendChild(el("p", { class: "muted" }, "Nenhuma evidência registrada ainda nesta etapa."));
    card.appendChild(riskFieldRow("Evidências associadas", evList));

    const gapCheckbox = el("input", { type: "checkbox", checked: risk.knowledgeGap, onchange: (e) => {
      update({ knowledgeGap: e.target.checked });
      if (e.target.checked) {
        window.App.mutate((d) => d.knowledgeGaps.push(window.DataModel.createKnowledgeGap({ dimension: "risks", relatedRiskId: risk.riskId, description: `Não sabemos avaliar com segurança o risco: ${label}.` })));
      }
    } });
    card.appendChild(el("label", { class: "choice-item" }, [gapCheckbox, el("span", {}, "Não sabemos avaliar isso com segurança (gera lacuna de conhecimento)")]));

    const techCheckbox = el("input", { type: "checkbox", checked: risk.requiresTechnicalAssessment, onchange: (e) => update({ requiresTechnicalAssessment: e.target.checked }) });
    card.appendChild(el("label", { class: "choice-item" }, [techCheckbox, el("span", {}, "Requer avaliação técnica externa")]));

    const planCheckbox = el("input", { type: "checkbox", checked: risk.selectedForPlanning, onchange: (e) => update({ selectedForPlanning: e.target.checked }) });
    card.appendChild(el("label", { class: "choice-item" }, [planCheckbox, el("span", {}, "Selecionar este risco para a Leitura Integrada e planejamento (RISK_SELECTED_FOR_PLANNING)")]));

    card.appendChild(el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => window.App.mutate((d) => { d.risks = d.risks.filter((r) => r.riskId !== risk.riskId); }) }, "Remover este risco"));

    return card;
  }

  function renderCartography(diagnosis) {
    const wrap = el("div", { class: "cartography" });
    wrap.appendChild(el("h3", {}, "Cartografia participativa (MAP_*)"));
    wrap.appendChild(el("p", { class: "field__help" }, "A cartografia pode registrar zonas de risco, de insegurança, de afeto, recursos/pontos de apoio, lugares de memória e áreas de cuidado/preservação."));

    const mapFields = [
      { id: "MAP_PARTICIPANTS", type: "multiChoice", label: "Quem participou da cartografia?", options: [
        { value: "students", label: "Estudantes" }, { value: "teachers", label: "Professores(as)" }, { value: "community", label: "Comunidade" }, { value: "other", label: "Outros" },
      ]},
      { id: "MAP_NEW_FINDINGS", type: "textarea", label: "O que a cartografia revelou de novo?" },
      { id: "MAP_PERCEPTION_DIFFERENCES", type: "confirmation", label: "Houve diferenças de percepção entre participantes?" },
      { id: "MAP_DIFFERENCES_DESCRIPTION", type: "textarea", label: "Descreva essas diferenças", condition: () => ga(diagnosis, "MAP_PERCEPTION_DIFFERENCES") === "yes" },
      { id: "MAP_NOT_DONE_REASON", type: "textarea", label: "Se a cartografia ainda não foi feita, por quê?" },
    ];
    mapFields.forEach((f) => {
      const applicable = !f.condition || f.condition(diagnosis);
      if (!applicable) return;
      const inputId = domId("map");
      let control;
      if (f.type === "multiChoice") {
        const value = diagnosis.cartography[f.id] || [];
        control = multiCheckboxGroup(f.options, value, (v, checked) => window.App.mutate((d) => {
          const set = new Set(d.cartography[f.id] || []); checked ? set.add(v) : set.delete(v); d.cartography[f.id] = [...set];
        }), f.id);
      } else if (f.type === "confirmation") {
        control = singleSelect([{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }, { value: "dontknow", label: "Não sabe" }], diagnosis.cartography[f.id], (v) => window.App.mutate((d) => (d.cartography[f.id] = v)), f.id);
      } else {
        control = el("textarea", { id: inputId, class: "input textarea", rows: 2 });
        control.value = diagnosis.cartography[f.id] || "";
        control.addEventListener("input", (e) => window.App.mutate((d) => (d.cartography[f.id] = e.target.value)));
      }
      wrap.appendChild(el("div", { class: "field field--compact" }, [el("label", { for: inputId }, f.label), control]));
    });

    const fileInput = el("input", { type: "file", accept: "image/jpeg,image/png", class: "input input--file", onchange: async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { const id = await window.attachmentService.saveFile(file); window.App.mutate((d) => (d.cartography.MAP_FILE = id)); } catch (err) { alert(err.message); }
    }});
    wrap.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, "Anexar imagem da cartografia (MAP_FILE)"), fileInput]));
    if (diagnosis.cartography.MAP_FILE) {
      window.attachmentService.getFile(diagnosis.cartography.MAP_FILE).then((rec) => {
        if (rec) wrap.appendChild(el("img", { src: rec.dataUrl, alt: "Cartografia participativa", class: "file-upload__preview" }));
      });
    }
    return wrap;
  }

  function render(diagnosis) {
    const container = el("div", { class: "stage-form" });
    generalFields.forEach((f) => { const n = renderField(f, diagnosis, window.App.setField); if (n) container.appendChild(n); });

    const suggestions = riskAutoSuggestions(diagnosis);
    if (suggestions.length > 0) {
      container.appendChild(window.Components.renderSummaryCard("Sugestões automáticas a partir de respostas anteriores (RISK_AUTO_SUGGESTIONS) — confirme se fazem sentido", suggestions.map((s) => s.reason)));
    }

    // Sincroniza diagnosis.risks com os tipos selecionados em RISK_THREATS_SELECTED
    const selectedTypes = ga(diagnosis, "RISK_THREATS_SELECTED") || [];
    const existingTypes = diagnosis.risks.map((r) => r.riskType);
    const missing = selectedTypes.filter((t) => !existingTypes.includes(t));
    if (missing.length > 0) {
      container.appendChild(el("button", {
        type: "button", class: "btn btn--secondary",
        onclick: () => window.App.mutate((d) => missing.forEach((t) => d.risks.push(window.DataModel.createRisk({ riskType: t })))),
      }, `Criar ficha detalhada para ${missing.length} ameaça(s) selecionada(s)`));
    }

    diagnosis.risks.forEach((risk) => container.appendChild(renderRiskEditor(diagnosis, risk)));

    container.appendChild(renderCartography(diagnosis));
    container.appendChild(renderEvidenceBuilder(diagnosis, { stage: 4, dimension: "risks", title: "Evidências sobre riscos" }));
    return container;
  }

  function memoryPanel(diagnosis) {
    const selected = window.DataModel.getSelectedRisks(diagnosis);
    if (selected.length === 0 && diagnosis.risks.length === 0) return null;
    return window.Components.renderSummaryCard("Riscos registrados", diagnosis.risks.map((r) => {
      const label = THREAT_OPTIONS.find((t) => t.value === r.riskType)?.label || r.riskType;
      return `${label}: ${r.occurredBefore === "yes" ? "já ocorreu" : r.occurredBefore === "no" ? "nunca ocorreu" : "não sabe"}`;
    }));
  }

  window.Stages = window.Stages || {};
  window.Stages[4] = { id: 4, key: "risks", title: "Riscos Climáticos", fields: generalFields, render, memoryPanel, THREAT_OPTIONS };
})();
