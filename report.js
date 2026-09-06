/**
 * report.js
 * Geração do relatório final (13 seções) com templates determinísticos —
 * sem IA, sem invenção. Toda afirmação é derivável de dados registrados;
 * quando não há informação suficiente, o relatório diz isso explicitamente
 * (seção 54). Também serve como view de impressão.
 */

(function () {
  const { el } = window.Components;
  const ga = (d, id) => window.DataModel.getAnswer(d, id);
  const NO_INFO = "Não há informação suficiente para caracterizar este aspecto.";

  function humanize(v) {
    if (v === null || v === undefined || v === "") return null;
    if (Array.isArray(v)) return v.length ? v.map(humanize).filter(Boolean).join(", ") : null;
    if (typeof v !== "string") return String(v);
    const MAP = { yes: "sim", no: "não", dontknow: "não sabe" };
    if (MAP[v]) return MAP[v];
    return v.replace(/_/g, " ");
  }

  function P(text) {
    return el("p", {}, text);
  }

  function sectionEl(number, title, children) {
    const section = el("section", { class: "report-section" });
    section.appendChild(el("h2", {}, `${number}. ${title}`));
    (children || []).forEach((c) => c && section.appendChild(c));
    return section;
  }

  function listOrNone(items, render) {
    if (!items || items.length === 0) return P(NO_INFO);
    const ul = el("ul");
    items.forEach((it) => ul.appendChild(el("li", {}, render(it))));
    return ul;
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 1 — Identificação                                                */
  /* ---------------------------------------------------------------------- */
  function sectionIdentification(d) {
    const sch = d.school;
    const schoolLine = [
      sch.SCH_NAME || "(escola não identificada)",
      sch.SCH_CITY && sch.SCH_STATE ? `${sch.SCH_CITY}/${sch.SCH_STATE}` : null,
      sch.SCH_NETWORK ? `rede ${humanize(sch.SCH_NETWORK)}` : null,
    ].filter(Boolean).join(" — ");
    const nodes = [P(schoolLine)];
    if (sch.SCH_EDUCATION_LEVELS) nodes.push(P(`Etapas/modalidades ofertadas: ${humanize(sch.SCH_EDUCATION_LEVELS)}.`));
    if (sch.SCH_LOCATION) nodes.push(P(`Localização: ${humanize(sch.SCH_LOCATION)}.`));
    if (sch.SCH_TERRITORIAL_CONTEXT) nodes.push(P(`Contextos territoriais: ${humanize(sch.SCH_TERRITORIAL_CONTEXT)}.`));
    if (sch.SCH_STUDENT_COUNT || sch.SCH_STAFF_COUNT) {
      nodes.push(P(`Aproximadamente ${sch.SCH_STUDENT_COUNT ?? "?"} estudantes e ${sch.SCH_STAFF_COUNT ?? "?"} profissionais.`));
    }

    const resp = d.respondent;
    if (resp.RESP_NAME) nodes.push(P(`Respondente: ${resp.RESP_NAME}${resp.RESP_ROLE ? `, ${humanize(resp.RESP_ROLE)}` : ""}.`));

    const met = d.methodology;
    if (met.MET_PARTICIPANTS) nodes.push(P(`Participaram da construção deste diagnóstico: ${humanize(met.MET_PARTICIPANTS)}.`));
    if (met.MET_SOURCES) nodes.push(P(`Fontes de informação utilizadas: ${humanize(met.MET_SOURCES)}.`));
    if (met.MET_PROCESS_DESCRIPTION) nodes.push(P(met.MET_PROCESS_DESCRIPTION));
    return sectionEl(1, "Identificação", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 2 — Caracterização socioambiental                                */
  /* ---------------------------------------------------------------------- */
  function sectionSocioenvironmental(d) {
    const ter = d.territory;
    const nodes = [];

    if (ter.INF_STRUCTURES) {
      const rows = Object.entries(ter.INF_STRUCTURES);
      const attention = rows.filter(([, v]) => v.estado === "inexistente" || v.estado === "inadequado").map(([k]) => k);
      const good = rows.filter(([, v]) => v.estado === "bom").map(([k]) => k);
      if (attention.length) nodes.push(P(`Estruturas com estado inexistente ou inadequado: ${humanize(attention)}.`));
      if (good.length) nodes.push(P(`Estruturas em bom estado: ${humanize(good)}.`));
    }
    if (ter.INF_THERMAL_CONDITION) nodes.push(P(`Condição térmica geral das salas: ${humanize(ter.INF_THERMAL_CONDITION)}.`));

    if (ter.WAT_SOURCE) {
      let waterLine = `Abastecimento de água: ${humanize(ter.WAT_SOURCE)}.`;
      if (ter.WAT_INTERRUPTION === "yes") waterLine += ` Há interrupções${ter.WAT_INTERRUPTION_PERIOD ? ` (${ter.WAT_INTERRUPTION_PERIOD})` : ""}.`;
      nodes.push(P(waterLine));
    }
    if (ter.SAN_SEWAGE_DESTINATION) nodes.push(P(`Destinação do esgoto: ${humanize(ter.SAN_SEWAGE_DESTINATION)}.`));
    if (ter.SAN_FLOOD_OCCURRENCE === "yes") {
      nodes.push(P(`A escola relata ocorrência de alagamentos${ter.SAN_FLOOD_LOCATION ? ` em: ${ter.SAN_FLOOD_LOCATION}` : ""}. Impactos observados: ${humanize(ter.SAN_FLOOD_IMPACTS) || "não especificados"}.`));
    }
    if (ter.WST_DESTINATION) nodes.push(P(`Destinação de resíduos: ${humanize(ter.WST_DESTINATION)}.`));
    if (ter.WST_TERRITORIAL_PROBLEMS === "yes") nodes.push(P(`Problemas territoriais relacionados a resíduos: ${ter.WST_PROBLEM_DESCRIPTION || "relatados, sem descrição detalhada."}`));

    if (ter.TER_ELEMENTS) {
      nodes.push(P(`Elementos territoriais identificados: ${humanize(ter.TER_ELEMENTS)}.`));
      if (ter.TER_ELEMENT_RELATION) {
        const rel = Object.entries(ter.TER_ELEMENT_RELATION).map(([k, v]) => `${humanize(k)} (${humanize(v)})`);
        nodes.push(P(`Relação de cada elemento com a escola/comunidade: ${rel.join("; ")}.`));
      }
    }
    if (ter.TER_CLIMATE_EVENT_HISTORY === "yes") {
      nodes.push(P(`Histórico de evento climático extremo relatado${ter.TER_CLIMATE_EVENT_PERIOD ? ` (${ter.TER_CLIMATE_EVENT_PERIOD})` : ""}: ${ter.TER_CLIMATE_EVENT_DESC || "sem descrição detalhada."}`));
      if (ter.TER_CLIMATE_LEARNING) nodes.push(P(`Aprendizado registrado: ${ter.TER_CLIMATE_LEARNING}`));
    }
    if (ter.TER_KEY_CHARACTERISTICS) nodes.push(P(`Características-chave do território, na leitura da escola: ${ter.TER_KEY_CHARACTERISTICS}`));

    if (nodes.length === 0) nodes.push(P(NO_INFO));
    return sectionEl(2, "Caracterização Socioambiental", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 3 — Educação Ambiental                                           */
  /* ---------------------------------------------------------------------- */
  function sectionEA(d) {
    const nodes = [];
    if (window.Stages[2] && typeof window.Stages[2].computeDescriptors === "function") {
      const desc = window.Stages[2].computeDescriptors(d);
      nodes.push(P(desc.institutionalizationDescriptor));
      nodes.push(P(desc.territorializationDescriptor));
      nodes.push(P(desc.studentParticipationDescriptor));
    }
    const ea = d.environmentalEducation;
    if (ea.EA_RECENT_ACTIVITY === "yes") {
      nodes.push(P(`Atividade recente registrada: ${ea.EA_RECENT_THEME || "(tema não informado)"}${ea.EA_RECENT_ACTIVITY_DATE ? `, em ${ea.EA_RECENT_ACTIVITY_DATE}` : ""}. Papel dos estudantes: ${humanize(ea.EA_RECENT_STUDENT_ROLE) || "não informado"}.`));
    } else if (ea.EA_RECENT_ACTIVITY === "no") {
      nodes.push(P("Não houve atividade concreta de Educação Ambiental registrada nos últimos meses."));
    }
    if (ea.EA_MAIN_BARRIER) nodes.push(P(`Principal barreira percebida: ${humanize(ea.EA_MAIN_BARRIER)}.`));
    if (ea.EA_MATERIAL_GAPS) nodes.push(P(`Lacunas de material relatadas: ${ea.EA_MATERIAL_GAPS}`));
    if (nodes.length === 0) nodes.push(P(NO_INFO));
    return sectionEl(3, "Educação Ambiental", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 4 — Participação e rede territorial                              */
  /* ---------------------------------------------------------------------- */
  function sectionParticipation(d) {
    const nodes = [];
    const par = d.participation;
    if (par.PAR_PARTICIPATION_MODE) nodes.push(P(`Modo predominante de participação registrado: ${humanize(par.PAR_PARTICIPATION_MODE)}.`));
    if (par.NET_EMERGENCY_PROCEDURE) nodes.push(P(`Procedimento de emergência: ${humanize(par.NET_EMERGENCY_PROCEDURE)}.`));
    if (par.NET_COMMUNITY_CAPACITIES) nodes.push(P(`Capacidades comunitárias relatadas: ${par.NET_COMMUNITY_CAPACITIES}`));

    nodes.push(el("h3", {}, "Atores do território"));
    nodes.push(listOrNone(d.actors, (a) => `${a.name || "(sem nome)"} — relação: ${humanize(a.relationshipLevel) || "não informado"}${a.priorityForStrengthening ? " (prioridade para fortalecimento)" : ""}`));

    return sectionEl(4, "Participação e Rede Territorial", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 5 — Vulnerabilidades e riscos                                    */
  /* ---------------------------------------------------------------------- */
  function sectionRisks(d) {
    const nodes = [];
    const ctx = d.riskContext;
    if (ctx.RISK_PERCEIVED_CLIMATE_CHANGE === "yes" && ctx.RISK_PERCEIVED_CHANGES) {
      nodes.push(P(`A comunidade relata percepção de mudança no padrão climático local: "${ctx.RISK_PERCEIVED_CHANGES}"`));
    }
    nodes.push(el("h3", {}, "Riscos analisados"));
    nodes.push(listOrNone(d.risks, (r) => {
      const label = (window.Stages[4] && window.Stages[4].THREAT_OPTIONS.find((t) => t.value === r.riskType)?.label) || r.riskType;
      const parts = [`${label}: relatos indicam ocorrência ${humanize(r.occurredBefore) || "não informada"}`];
      if (r.frequency) parts.push(`frequência relatada ${humanize(r.frequency)}`);
      if (r.impactDescription) parts.push(`impactos relatados: ${r.impactDescription}`);
      if (r.vulnerabilityConditions && r.vulnerabilityConditions.length) parts.push(`condições que podem ampliar dificuldades de proteção: ${humanize(r.vulnerabilityConditions)}`);
      if (r.responseCapacities && r.responseCapacities.length) parts.push(`capacidades de resposta já existentes: ${humanize(r.responseCapacities)}`);
      if (r.attentionSignal) parts.push(`sinal interno de atenção (apoio à reflexão, não avaliação técnica): ${humanize(r.attentionSignal)}`);
      if (r.knowledgeGap) parts.push("a equipe reconhece não saber avaliar este risco com segurança");
      return parts.join(". ") + ".";
    }));
    return sectionEl(5, "Vulnerabilidades e Riscos", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 6 — Cartografia participativa                                    */
  /* ---------------------------------------------------------------------- */
  function sectionCartography(d) {
    const map = d.cartography;
    const nodes = [];
    if (map.MAP_NEW_FINDINGS) nodes.push(P(`Achados da cartografia participativa: ${map.MAP_NEW_FINDINGS}`));
    if (map.MAP_PERCEPTION_DIFFERENCES === "yes" && map.MAP_DIFFERENCES_DESCRIPTION) {
      nodes.push(P(`Diferenças de percepção entre participantes: ${map.MAP_DIFFERENCES_DESCRIPTION}`));
    }
    if (map.MAP_NOT_DONE_REASON) nodes.push(P(`A cartografia participativa ainda não foi realizada. Motivo relatado: ${map.MAP_NOT_DONE_REASON}`));
    if (nodes.length === 0) nodes.push(P(NO_INFO));
    return sectionEl(6, "Cartografia Participativa", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 7 — Leitura integrada / FOFA                                     */
  /* ---------------------------------------------------------------------- */
  function sectionSwot(d) {
    const nodes = [];
    const CATS = [["strength", "Forças"], ["weakness", "Fragilidades"], ["opportunity", "Oportunidades"], ["threat", "Ameaças"]];
    CATS.forEach(([cat, label]) => {
      const items = d.swotItems.filter((i) => i.category === cat && i.userConfirmed);
      nodes.push(el("h3", {}, label));
      nodes.push(listOrNone(items, (i) => `${i.label}${i.priority ? " (prioritário)" : ""}${i.justification ? ` — ${i.justification}` : ""}`));
    });
    if (d.strategicRelations.length > 0) {
      nodes.push(el("h3", {}, "Relações estratégicas"));
      nodes.push(listOrNone(d.strategicRelations, (r) => {
        const a = d.swotItems.find((i) => i.swotItemId === r.elementAId);
        const b = d.swotItems.find((i) => i.swotItemId === r.elementBId);
        return `${a ? a.label : "?"} → ${b ? b.label : "?"}: ${r.interpretation || "(sem interpretação registrada)"}`;
      }));
    }
    const allCaps = ["pedagogical", "social", "institutional", "territorial", "material"].flatMap((k) => d.adaptiveCapacities[k] || []);
    if (allCaps.length > 0) {
      nodes.push(el("h3", {}, "Capacidades adaptativas"));
      nodes.push(el("p", {}, allCaps.join("; ")));
    }
    return sectionEl(7, "Leitura Integrada (FOFA)", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 8 — Problemas e prioridades                                      */
  /* ---------------------------------------------------------------------- */
  function sectionProblems(d) {
    const nodes = [];
    const confirmed = d.problems.filter((p) => p.confirmed);
    nodes.push(el("h3", {}, "Problemas confirmados"));
    nodes.push(listOrNone(confirmed, (p) => `${p.title}${p.severity ? ` — gravidade: ${humanize(p.severity)}` : ""}${p.urgency ? `, urgência: ${humanize(p.urgency)}` : ""}${p.selectedAsPriority ? " (selecionado como prioridade)" : ""}`));

    nodes.push(el("h3", {}, "Prioridades selecionadas"));
    const prioritized = window.DataModel.getPrioritizedProblems(d);
    nodes.push(listOrNone(prioritized, ({ priority, problem }) => `#${priority.order} ${problem ? problem.title : "(problema removido)"} — ${priority.justification || "sem justificativa registrada"}. Mudança esperada: ${priority.expectedChange || NO_INFO}`));

    return sectionEl(8, "Problemas e Prioridades", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 9 — Plano de Ação                                                */
  /* ---------------------------------------------------------------------- */
  function sectionActionPlans(d) {
    const nodes = [];
    nodes.push(listOrNone(d.actionPlans, (plan) => {
      const complete = window.Stages[7] && window.Stages[7].isPlanComplete(plan);
      const evidenceDescs = (plan.evidenceIds || []).map((id) => window.DataModel.getEvidenceById(d, id)?.description).filter(Boolean);
      return `Objetivo: ${plan.objective || "(não definido)"}. Problema: ${plan.problemStatement || "(não definido)"}. Evidências: ${evidenceDescs.join("; ") || "nenhuma"}. Atividades: ${(plan.activities || []).map((a) => a.description).filter(Boolean).join("; ") || "nenhuma"}. Resultado esperado: ${plan.expectedResult || "(não definido)"}. Status: ${complete ? "completo" : "pendente"}. Validação de coerência: ${humanize(plan.coherenceValidation) || "não avaliada"}.`;
    }));
    return sectionEl(9, "Plano de Ação", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 10 — Educomunicação                                              */
  /* ---------------------------------------------------------------------- */
  function sectionCommunication(d) {
    const nodes = [];
    nodes.push(listOrNone(d.communicationStrategies, (s) => `Finalidades: ${humanize(s.purposes) || "não informadas"}. Públicos: ${humanize(s.audiences) || "não informados"}. Mensagem central: ${s.centralMessage || "não definida"}. Canais de escuta: ${humanize(s.listeningChannels) || "nenhum definido"}.`));
    return sectionEl(10, "Educomunicação", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 11 — Indicadores e monitoramento                                 */
  /* ---------------------------------------------------------------------- */
  function sectionMonitoring(d) {
    const nodes = [];
    nodes.push(listOrNone(d.indicators, (ind) => `${ind.name || "(indicador sem nome)"} (${humanize(ind.type) || "tipo não informado"}). Linha de base: ${ind.baselineUnknown ? "desconhecida — a estabelecer" : ind.baseline || "não informada"}. Meta: ${ind.target || "não definida"}. Periodicidade: ${humanize(ind.periodicity) || "não definida"}.`));
    return sectionEl(11, "Indicadores e Monitoramento", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 12 — Lacunas de conhecimento                                     */
  /* ---------------------------------------------------------------------- */
  function sectionGaps(d) {
    const nodes = [];
    nodes.push(P("Registrar 'não sabemos' é uma resposta válida. As lacunas abaixo indicam pontos que merecem investigação futura, não falhas do diagnóstico."));
    nodes.push(listOrNone(d.knowledgeGaps, (g) => `${g.description} (dimensão: ${humanize(g.dimension) || "não informada"}, status: ${humanize(g.status)})`));
    return sectionEl(12, "Lacunas de Conhecimento", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Seção 13 — Síntese final                                               */
  /* ---------------------------------------------------------------------- */
  function sectionSynthesis(d) {
    const syn = d.finalSynthesis;
    const nodes = [];
    if (syn.SYN_MAIN_CHALLENGE) nodes.push(P(`Principal desafio revelado: ${syn.SYN_MAIN_CHALLENGE}`));
    if (syn.SYN_MAIN_CAPACITY) nodes.push(P(`Principal capacidade revelada: ${syn.SYN_MAIN_CAPACITY}`));
    if (syn.SYN_PRIORITY_PARTNERSHIP) nodes.push(P(`Parceria prioritária para os próximos passos: ${syn.SYN_PRIORITY_PARTNERSHIP}`));
    if (syn.SYN_EXPECTED_TRANSFORMATION) nodes.push(P(`Transformação esperada: ${syn.SYN_EXPECTED_TRANSFORMATION}`));
    if (syn.SYN_RESILIENT_SCHOOL_SENTENCE) {
      nodes.push(el("blockquote", { class: "report-quote" }, `"Nossa escola será mais resiliente quando ${syn.SYN_RESILIENT_SCHOOL_SENTENCE}"`));
    } else {
      nodes.push(P(NO_INFO));
    }
    return sectionEl(13, "Síntese Final", nodes);
  }

  /* ---------------------------------------------------------------------- */
  /* Montagem completa                                                      */
  /* ---------------------------------------------------------------------- */

  function buildReportBody(diagnosis) {
    const wrap = el("div", { class: "report", id: "report-root" });
    wrap.appendChild(el("h1", {}, "Diagnóstico Socioambiental, Climático e de Educação Ambiental"));
    wrap.appendChild(el("p", { class: "report-meta" }, `${diagnosis.school.SCH_NAME || "Escola não identificada"} — gerado em ${new Date().toLocaleDateString("pt-BR")} — versão do instrumento ${diagnosis.metadata.instrumentVersion}`));

    const activeAlerts = window.DataModel.getActiveAlerts(diagnosis);
    if (activeAlerts.length > 0) {
      const alertsSection = el("section", { class: "report-section" }, [el("h2", {}, "Alertas ativos")]);
      activeAlerts.forEach((a) => alertsSection.appendChild(window.Components.AlertCard(a)));
      wrap.appendChild(alertsSection);
    }

    [
      sectionIdentification, sectionSocioenvironmental, sectionEA, sectionParticipation,
      sectionRisks, sectionCartography, sectionSwot, sectionProblems, sectionActionPlans,
      sectionCommunication, sectionMonitoring, sectionGaps, sectionSynthesis,
    ].forEach((fn) => wrap.appendChild(fn(diagnosis)));

    return wrap;
  }

  function renderReportView(diagnosis, opts) {
    const container = el("div", { class: "report-view" });
    container.appendChild(el("div", { class: "report-toolbar no-print" }, [
      el("button", { type: "button", class: "btn btn--outline", onclick: opts.onBack }, "← Voltar ao diagnóstico"),
      el("button", { type: "button", class: "btn btn--primary", onclick: () => window.print() }, "Imprimir / salvar PDF"),
    ]));
    container.appendChild(buildReportBody(diagnosis));
    return container;
  }

  window.Report = { renderReportView, buildReportBody, humanize };
})();
