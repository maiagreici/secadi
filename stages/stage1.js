/**
 * stage1.js — Etapa 1: Escola e Território
 * Infraestrutura, água, saneamento, resíduos e leitura do território.
 */

(function () {
  const { el, renderField, renderEvidenceBuilder } = window.Components;
  const ga = (d, id) => window.DataModel.getAnswer(d, id);

  const STATE_OPTIONS = [
    { value: "inexistente", label: "Inexistente" },
    { value: "inadequado", label: "Inadequado" },
    { value: "regular", label: "Regular" },
    { value: "bom", label: "Bom" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const INFRA_ROWS = [
    { value: "biblioteca", label: "Biblioteca / espaço de leitura" },
    { value: "lab_ciencias", label: "Laboratório de Ciências" },
    { value: "lab_informatica", label: "Laboratório de informática" },
    { value: "internet", label: "Internet" },
    { value: "patio", label: "Pátio" },
    { value: "espacos_esportivos", label: "Espaços esportivos" },
    { value: "areas_verdes", label: "Áreas verdes" },
    { value: "horta", label: "Horta" },
    { value: "pomar", label: "Pomar" },
    { value: "sombreamento", label: "Sombreamento" },
    { value: "espacos_externos", label: "Espaços externos para atividades" },
  ];

  // A condição térmica costuma variar por estação (ex.: RS — muito fria no
  // inverno e muito quente no verão), por isso é multiescolha, não uma
  // condição única fixa.
  const THERMAL_CONDITION_OPTIONS = [
    { value: "very_hot_summer", label: "Muito quente no verão" },
    { value: "cold_winter", label: "Muito fria no inverno" },
    { value: "adequate_most_of_year", label: "Adequada na maior parte do ano" },
    { value: "variable", label: "Muito variável, sem padrão sazonal claro" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const THERMAL_PROBLEMS_OPTIONS = [
    { value: "mold", label: "Mofo" },
    { value: "leaks", label: "Infiltração" },
    { value: "excess_heat", label: "Calor excessivo" },
    { value: "excess_cold", label: "Frio excessivo" },
    { value: "poor_ventilation", label: "Falta de ventilação" },
    { value: "other", label: "Outro" },
  ];

  const WATER_SOURCE_OPTIONS = [
    { value: "public_network", label: "Rede pública" },
    { value: "well", label: "Poço" },
    { value: "spring", label: "Nascente" },
    { value: "cistern", label: "Cisterna" },
    { value: "other", label: "Outra" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const WATER_INFRA_OPTIONS = [
    { value: "reservoir", label: "Reservatório / caixa d'água" },
    { value: "filter", label: "Filtro / purificador" },
    { value: "drinking_fountains", label: "Bebedouros" },
    { value: "internal_piping", label: "Rede encanada interna" },
    { value: "other", label: "Outro" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const SEWAGE_DESTINATION_OPTIONS = [
    { value: "collection_network", label: "Rede coletora" },
    { value: "septic_tank", label: "Fossa séptica" },
    { value: "rudimentary_pit", label: "Fossa rudimentar" },
    { value: "open_air", label: "Céu aberto" },
    { value: "other", label: "Outro" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const FLOOD_IMPACTS_OPTIONS = [
    { value: "class_interruption", label: "Interrupção de aulas" },
    { value: "structural_damage", label: "Danos à estrutura" },
    { value: "contamination", label: "Contaminação" },
    { value: "access_interruption", label: "Acesso interrompido" },
    { value: "low_attendance", label: "Baixa adesão dos estudantes (aulas mantidas, mas poucos conseguem frequentar)" },
    { value: "other", label: "Outro" },
  ];

  const WASTE_DESTINATION_OPTIONS = [
    { value: "public_collection", label: "Coleta pública" },
    { value: "selective_collection", label: "Coleta seletiva" },
    { value: "cooperative", label: "Cooperativa" },
    { value: "composting", label: "Compostagem" },
    { value: "reuse", label: "Reutilização" },
    { value: "burning", label: "Queima" },
    { value: "burial", label: "Enterramento" },
    { value: "other", label: "Outro" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const WASTE_TERRITORIAL_PROBLEMS_OPTIONS = [
    { value: "landfill_sanitary", label: "Aterro sanitário" },
    { value: "open_dump", label: "Lixão" },
    { value: "waste_burning", label: "Queima de resíduos" },
    { value: "waste_accumulation", label: "Acúmulo de resíduos no entorno" },
    { value: "other", label: "Outro" },
    { value: "none", label: "Nenhum" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const TERRITORY_ELEMENTS_OPTIONS = [
    { value: "rivers_streams", label: "Rios/córregos" },
    { value: "lakes_reservoirs", label: "Lagoas/lagos/reservatórios" },
    { value: "vegetation", label: "Vegetação" },
    { value: "parks", label: "Parques" },
    { value: "hillsides", label: "Encostas" },
    { value: "agriculture", label: "Agricultura" },
    { value: "industry", label: "Indústria" },
    { value: "mining", label: "Mineração" },
    { value: "landfill", label: "Aterro/lixão" },
    { value: "burned_areas", label: "Áreas queimadas" },
    { value: "flood_prone_areas", label: "Áreas inundáveis" },
    { value: "degraded_areas", label: "Áreas degradadas" },
    { value: "other", label: "Outros" },
  ];

  const ELEMENT_RELATION_OPTIONS = [
    { value: "environment", label: "Ambiente" },
    { value: "culture", label: "Cultura" },
    { value: "community_use", label: "Uso comunitário" },
    { value: "income", label: "Renda" },
    { value: "risk", label: "Risco" },
    { value: "degradation", label: "Degradação" },
    { value: "conflict", label: "Conflito" },
    { value: "other", label: "Outra" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const ECONOMIC_ACTIVITIES_OPTIONS = [
    { value: "agriculture", label: "Agricultura" },
    { value: "livestock", label: "Pecuária" },
    { value: "commerce", label: "Comércio" },
    { value: "industry", label: "Indústria" },
    { value: "tourism", label: "Turismo" },
    { value: "fishing", label: "Pesca" },
    { value: "extractivism", label: "Extrativismo" },
    { value: "other", label: "Outro" },
  ];

  const fields = [
    { id: "INF_STRUCTURES", type: "matrix", label: "Infraestrutura da escola — estado de cada espaço, quando pertinente", qNumber: "Q1.1", matrixRows: INFRA_ROWS, matrixCols: [{ value: "estado", label: "Estado", options: STATE_OPTIONS }], required: true },
    { id: "INF_OTHER_STRUCTURE", type: "text", label: "Outra estrutura relevante não listada (se houver)", qNumber: "Q1.2" },
    { id: "INF_THERMAL_CONDITION", type: "multiChoice", label: "Condição térmica das salas de aula", qNumber: "Q1.3", options: THERMAL_CONDITION_OPTIONS, help: "A condição térmica costuma variar ao longo do ano — marque todas as situações que se aplicam (ex.: pode ser muito quente no verão E muito fria no inverno)." },
    { id: "INF_THERMAL_PROBLEMS", type: "multiChoice", label: "Problemas relacionados às condições térmicas/estruturais", qNumber: "Q1.4", options: THERMAL_PROBLEMS_OPTIONS, otherFieldId: "INF_THERMAL_OTHER" },

    { id: "WAT_SOURCE", type: "singleChoice", label: "Fonte de abastecimento de água", qNumber: "Q1.5", options: WATER_SOURCE_OPTIONS, required: true },
    { id: "WAT_INTERRUPTION", type: "confirmation", label: "Há interrupções no abastecimento de água?", qNumber: "Q1.6" },
    { id: "WAT_INTERRUPTION_PERIOD", type: "text", label: "Em que período(s) isso costuma ocorrer?", qNumber: "Q1.7", condition: (d) => ga(d, "WAT_INTERRUPTION") === "yes" },
    { id: "WAT_QUALITY_MONITORING", type: "confirmation", label: "Existe monitoramento da qualidade da água?", qNumber: "Q1.8" },
    { id: "WAT_MONITORING_RESPONSIBLE", type: "text", label: "Quem é responsável por esse monitoramento?", qNumber: "Q1.9", condition: (d) => ga(d, "WAT_QUALITY_MONITORING") === "yes" },
    { id: "WAT_MONITORING_RECORDS", type: "confirmation", label: "Existem registros desse monitoramento?", qNumber: "Q1.10", condition: (d) => ga(d, "WAT_QUALITY_MONITORING") === "yes" },
    { id: "WAT_INFRASTRUCTURE", type: "multiChoice", label: "Infraestrutura hídrica disponível", qNumber: "Q1.11", options: WATER_INFRA_OPTIONS },

    { id: "SAN_SEWAGE_DESTINATION", type: "singleChoice", label: "Destinação do esgoto", qNumber: "Q1.12", options: SEWAGE_DESTINATION_OPTIONS },
    { id: "SAN_OPEN_SEWAGE", type: "confirmation", label: "Há esgoto a céu aberto no entorno da escola?", qNumber: "Q1.13" },
    { id: "SAN_FLOOD_OCCURRENCE", type: "confirmation", label: "Ocorrem alagamentos na escola ou no entorno?", qNumber: "Q1.14", required: true },
    { id: "SAN_FLOOD_LOCATION", type: "text", label: "Onde costumam ocorrer?", qNumber: "Q1.15", condition: (d) => ga(d, "SAN_FLOOD_OCCURRENCE") === "yes" },
    { id: "SAN_FLOOD_IMPACTS", type: "multiChoice", label: "Impactos observados nesses episódios", qNumber: "Q1.16", options: FLOOD_IMPACTS_OPTIONS, condition: (d) => ga(d, "SAN_FLOOD_OCCURRENCE") === "yes" },

    { id: "WST_SEPARATION", type: "confirmation", label: "Há separação de resíduos na escola?", qNumber: "Q1.17" },
    { id: "WST_DESTINATION", type: "multiChoice", label: "Destinação dos resíduos", qNumber: "Q1.18", options: WASTE_DESTINATION_OPTIONS },
    {
      id: "WST_TERRITORIAL_PROBLEMS", type: "multiChoice",
      label: "Existem problemas relacionados a resíduos no entorno da escola?",
      qNumber: "Q1.19", options: WASTE_TERRITORIAL_PROBLEMS_OPTIONS, otherFieldId: "WST_TERRITORIAL_PROBLEMS_OTHER",
      help: "Considere a área imediatamente ao redor da escola, não o município inteiro.",
    },
    {
      id: "WST_PROBLEM_DESCRIPTION", type: "textarea", label: "Descreva esses problemas", qNumber: "Q1.20",
      condition: (d) => (ga(d, "WST_TERRITORIAL_PROBLEMS") || []).some((v) => !["none", "dontknow"].includes(v)),
    },

    {
      id: "TER_ELEMENTS", type: "multiChoice", label: "Elementos presentes no território ao redor da escola", qNumber: "Q1.21",
      options: TERRITORY_ELEMENTS_OPTIONS, required: true,
      help: "Considere o território mais imediato da escola — em geral o bairro ou a região do entorno em que a comunidade escolar circula, não o município inteiro. A existência de um elemento não significa, por si só, risco ou impacto — isso será explorado a seguir.",
    },
    {
      id: "TER_ELEMENT_RELATION",
      type: "relationalChoice",
      label: "Para cada elemento selecionado, qual sua relação com a escola/comunidade?",
      qNumber: "Q1.22",
      options: ELEMENT_RELATION_OPTIONS,
      emptyMessage: "Selecione elementos do território acima para caracterizar a relação de cada um.",
      help: "Nota para tutoria: um mesmo elemento pode ter mais de uma relação ao mesmo tempo (ex.: um rio pode ser, simultaneamente, ambiente e cultura, ou risco e uso comunitário) — marque quantas se aplicarem.",
      sourceItems: (d) => (ga(d, "TER_ELEMENTS") || []).map((v) => TERRITORY_ELEMENTS_OPTIONS.find((o) => o.value === v) || { value: v, label: v }),
    },

    { id: "TER_ECONOMIC_ACTIVITIES", type: "multiChoice", label: "Principais atividades econômicas do território", qNumber: "Q1.23", options: ECONOMIC_ACTIVITIES_OPTIONS, otherFieldId: "TER_ECONOMIC_ACTIVITIES_OTHER" },
    { id: "TER_ECON_IMPACT_EXISTS", type: "confirmation", label: "Essas atividades têm impacto percebido no ambiente ou na comunidade?", qNumber: "Q1.24", condition: (d) => (ga(d, "TER_ECONOMIC_ACTIVITIES") || []).length > 0 },
    {
      id: "TER_ECON_IMPACT_TABLE",
      type: "dynamicTable",
      label: "Descreva os impactos percebidos por atividade",
      qNumber: "Q1.25",
      itemLabel: "impacto",
      columns: [{ key: "activity", label: "Atividade" }, { key: "impact", label: "Impacto percebido" }],
      condition: (d) => ga(d, "TER_ECON_IMPACT_EXISTS") === "yes",
    },

    { id: "TER_SEASONAL_EVENTS", type: "confirmation", label: "Há eventos sazonais que afetam a escola/comunidade (safras, secas, chuvas, festas, etc.)?", qNumber: "Q1.26" },
    { id: "TER_SEASONAL_EVENT_DESCRIPTION", type: "textarea", label: "Qual é esse evento? Descreva-o.", qNumber: "Q1.27", condition: (d) => ga(d, "TER_SEASONAL_EVENTS") === "yes" },
    { id: "TER_SEASONAL_MONTHS", type: "monthSelector", label: "Em quais meses ele costuma ocorrer?", qNumber: "Q1.28", condition: (d) => ga(d, "TER_SEASONAL_EVENTS") === "yes" },
    { id: "TER_SEASONAL_IMPACT", type: "textarea", label: "Qual o impacto desse evento na escola?", qNumber: "Q1.29", condition: (d) => ga(d, "TER_SEASONAL_EVENTS") === "yes" },

    { id: "TER_CLIMATE_EVENT_HISTORY", type: "confirmation", label: "Há histórico de eventos climáticos extremos que afetaram a escola/comunidade?", qNumber: "Q1.30", required: true },
    { id: "TER_CLIMATE_EVENT_DESC", type: "textarea", label: "Descreva o(s) evento(s)", qNumber: "Q1.31", condition: (d) => ga(d, "TER_CLIMATE_EVENT_HISTORY") === "yes" },
    { id: "TER_CLIMATE_EVENT_PERIOD", type: "text", label: "Quando ocorreu(ram)?", qNumber: "Q1.32", condition: (d) => ga(d, "TER_CLIMATE_EVENT_HISTORY") === "yes" },
    { id: "TER_CLIMATE_EVENT_IMPACTS", type: "multiChoice", label: "Impactos observados", qNumber: "Q1.33", options: [
      { value: "class_interruption", label: "Interrupção de aulas" },
      { value: "material_damage", label: "Danos materiais" },
      { value: "displacement", label: "Deslocamento de pessoas" },
      { value: "losses", label: "Perdas" },
      { value: "emotional_impact", label: "Impacto emocional" },
      { value: "other", label: "Outro" },
    ], condition: (d) => ga(d, "TER_CLIMATE_EVENT_HISTORY") === "yes" },
    { id: "TER_CLIMATE_LEARNING", type: "textarea", label: "O que a escola/comunidade aprendeu com esse evento?", qNumber: "Q1.34", condition: (d) => ga(d, "TER_CLIMATE_EVENT_HISTORY") === "yes" },

    {
      id: "TER_KEY_CHARACTERISTICS", type: "textarea", label: "Quais são as características-chave deste território, na sua leitura?", qNumber: "Q1.35",
      help: "Pense, por exemplo, em: relação com a água (rios, córregos, abastecimento), vegetação e áreas verdes, uso do solo predominante, memória e cultura local, riscos já percebidos e atividades econômicas mais presentes.",
    },
    { id: "TER_MISSING_ASPECT", type: "textarea", label: "Há algum aspecto do território que vocês reconhecem não saber ainda?", qNumber: "Q1.36", help: "'Não sabemos' é uma resposta válida — isso vira uma lacuna de conhecimento registrada." },
  ];

  function render(diagnosis) {
    const container = el("div", { class: "stage-form" });
    fields.forEach((f) => {
      const node = renderField(f, diagnosis, window.App.setField);
      if (node) container.appendChild(node);
    });

    // Registro de lacuna a partir de TER_MISSING_ASPECT
    container.appendChild(
      el("button", {
        type: "button",
        class: "btn btn--outline btn--small",
        onclick: () => {
          const desc = ga(diagnosis, "TER_MISSING_ASPECT");
          if (!desc || !desc.trim()) {
            alert("Descreva no campo acima o aspecto do território que ainda não sabem, antes de registrar como lacuna.");
            return;
          }
          window.App.mutate((d) => {
            d.knowledgeGaps.push(
              window.DataModel.createKnowledgeGap({
                sourceQuestionId: "TER_MISSING_ASPECT",
                dimension: "territory",
                description: desc,
              })
            );
          });
          alert("Lacuna registrada.");
        },
      }, "Registrar como lacuna de conhecimento")
    );

    container.appendChild(renderEvidenceBuilder(diagnosis, { stage: 1, dimension: "territory", title: "Evidências sobre a escola e o território" }));
    return container;
  }

  function memoryPanel(diagnosis) {
    const flood = ga(diagnosis, "SAN_FLOOD_OCCURRENCE");
    const climateHistory = ga(diagnosis, "TER_CLIMATE_EVENT_HISTORY");
    if (!flood && !climateHistory) return null;
    return window.Components.renderSummaryCard("Registrado até aqui", [
      flood ? `Alagamentos: ${flood === "yes" ? "ocorrem" : flood === "no" ? "não ocorrem" : "não sabe"}` : null,
      climateHistory ? `Evento climático extremo no histórico: ${climateHistory === "yes" ? "sim" : climateHistory === "no" ? "não" : "não sabe"}` : null,
    ].filter(Boolean));
  }

  window.Stages = window.Stages || {};
  window.Stages[1] = {
    id: 1,
    key: "territory",
    title: "Escola e Território",
    fields,
    render,
    memoryPanel,
  };
})();
