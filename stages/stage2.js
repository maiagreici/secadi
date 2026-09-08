/**
 * stage2.js — Etapa 2: Educação Ambiental
 * Institucionalização, práticas, formação, barreiras e participação estudantil.
 * Gera descritores interpretativos (nunca notas/índices) e aplica as regras
 * de coerência COH_EA_001..003 (via rules.js).
 */

(function () {
  const { el, renderField, renderEvidenceBuilder } = window.Components;
  const ga = (d, id) => window.DataModel.getAnswer(d, id);

  const YES_NO_DK = [
    { value: "yes", label: "Sim" },
    { value: "no", label: "Não" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const THEMES_OPTIONS = [
    { value: "water", label: "Água" },
    { value: "biodiversity", label: "Biodiversidade" },
    { value: "waste", label: "Resíduos" },
    { value: "climate_change", label: "Mudanças climáticas" },
    { value: "energy", label: "Energia" },
    { value: "food", label: "Alimentação" },
    { value: "consumption", label: "Consumo" },
    { value: "sanitation", label: "Saneamento" },
    { value: "health", label: "Saúde" },
    { value: "risks_disasters", label: "Riscos/desastres" },
    { value: "socioenvironmental_justice", label: "Justiça socioambiental" },
    { value: "territory", label: "Território" },
    { value: "conflicts", label: "Conflitos" },
    { value: "traditional_communities", label: "Povos e comunidades tradicionais" },
    { value: "other", label: "Outros" },
  ];

  const FREQ_OPTIONS = [
    { value: "never", label: "Nunca" },
    { value: "rarely", label: "Raramente" },
    { value: "sometimes", label: "Às vezes" },
    { value: "frequently", label: "Frequentemente" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const METHODS_OPTIONS = [
    { value: "lecture", label: "Aula expositiva" },
    { value: "project", label: "Projeto" },
    { value: "workshop", label: "Oficina" },
    { value: "field_trip", label: "Saída de campo" },
    { value: "garden_experimentation", label: "Horta/experimentação" },
    { value: "conversation_circle", label: "Rodas de conversa" },
    { value: "audiovisual_production", label: "Produção audiovisual" },
    { value: "mapping", label: "Cartografia" },
    { value: "other", label: "Outro" },
  ];

  const BARRIER_ROWS = [
    { value: "time", label: "Tempo" },
    { value: "overloaded_curriculum", label: "Currículo sobrecarregado" },
    { value: "training", label: "Formação" },
    { value: "materials", label: "Materiais" },
    { value: "financial_resources", label: "Recursos financeiros" },
    { value: "management_support", label: "Apoio da gestão" },
    { value: "collective_planning", label: "Planejamento coletivo" },
    { value: "interdisciplinarity", label: "Interdisciplinaridade" },
    { value: "territorial_info", label: "Informações territoriais" },
    { value: "discontinuity", label: "Descontinuidade" },
    { value: "staff_turnover", label: "Rotatividade de profissionais" },
    { value: "other", label: "Outras" },
  ];
  const INTENSITY_OPTIONS = [
    { value: "low", label: "Baixa" },
    { value: "medium", label: "Média" },
    { value: "high", label: "Alta" },
    { value: "not_applicable", label: "Não se aplica" },
  ];

  const fields = [
    { id: "EA_INSTITUTIONAL_SPACES", type: "multiChoice", label: "Onde a Educação Ambiental acontece hoje na escola", qNumber: "Q2.1", options: [
      { value: "regular_classes", label: "Aulas regulares" },
      { value: "interdisciplinary_projects", label: "Projetos interdisciplinares" },
      { value: "fairs_exhibitions", label: "Feiras/mostras" },
      { value: "civic_moments", label: "Momentos cívicos" },
      { value: "student_club", label: "Clube/grêmio estudantil" },
      { value: "student_initiatives", label: "Iniciativas de estudantes" },
      { value: "external_partnerships", label: "Parcerias externas" },
      { value: "other", label: "Outro" },
    ]},
    { id: "EA_INSTITUTIONAL_LEVEL", type: "singleChoice", label: "Como caracterizar a institucionalização da Educação Ambiental na escola?", qNumber: "Q2.2", required: true, options: [
      { value: "none", label: "Inexistente" },
      { value: "isolated_occasional", label: "Isolada/ocasional" },
      { value: "recurring_dependent", label: "Recorrente, dependente de algumas pessoas" },
      { value: "present_multiple", label: "Presente em diferentes componentes/projetos" },
      { value: "integrated_planning", label: "Integrada ao planejamento" },
      { value: "institutionalized_continuous", label: "Institucionalizada e contínua" },
      { value: "dontknow", label: "Não sabe" },
    ]},
    { id: "EA_PPP_STATUS", type: "singleChoice", label: "Situação da Educação Ambiental no Projeto Político-Pedagógico (PPP)", qNumber: "Q2.3", options: [
      { value: "present_detailed", label: "Presente e detalhada" },
      { value: "present_generic", label: "Presente de forma genérica" },
      { value: "absent", label: "Ausente" },
      { value: "dontknow", label: "Não sabe" },
    ]},
    { id: "EA_PPP_DESCRIPTION", type: "textarea", label: "Como a Educação Ambiental aparece no PPP?", qNumber: "Q2.4", condition: (d) => ["present_detailed", "present_generic"].includes(ga(d, "EA_PPP_STATUS")) },
    { id: "EA_PPP_TO_PRACTICE", type: "singleChoice", label: "O que está no PPP se traduz em prática?", qNumber: "Q2.5", options: [
      { value: "fully", label: "Totalmente" },
      { value: "partially", label: "Parcialmente" },
      { value: "little", label: "Pouco" },
      { value: "no", label: "Não" },
      { value: "dontknow", label: "Não sabe" },
    ], condition: (d) => ["present_detailed", "present_generic"].includes(ga(d, "EA_PPP_STATUS")) },

    { id: "EA_CURRICULAR_AREAS", type: "multiChoice", label: "Áreas curriculares que já trabalharam Educação Ambiental", qNumber: "Q2.6", options: [
      { value: "science", label: "Ciências" },
      { value: "geography", label: "Geografia" },
      { value: "history", label: "História" },
      { value: "portuguese", label: "Língua Portuguesa" },
      { value: "math", label: "Matemática" },
      { value: "arts", label: "Artes" },
      { value: "physical_education", label: "Educação Física" },
      { value: "other", label: "Outras" },
    ]},
    { id: "EA_INTERDISCIPLINARITY_MODE", type: "multiChoice", label: "Como ocorre a articulação entre áreas/disciplinas?", qNumber: "Q2.7", help: "Mais de uma forma de articulação pode coexistir — marque todas que se aplicam.", options: [
      { value: "separate_disciplines", label: "Disciplinas separadas" },
      { value: "same_theme_no_joint_planning", label: "Mesmo tema, sem planejamento conjunto" },
      { value: "some_joint_planning", label: "Algum planejamento conjunto" },
      { value: "joint_investigation", label: "Investigação conjunta" },
      { value: "common_objectives", label: "Objetivos comuns" },
      { value: "collective_territorial_intervention", label: "Intervenção territorial coletiva" },
      { value: "no_articulation", label: "Sem articulação" },
      { value: "dontknow", label: "Não sabe" },
    ]},
    { id: "EA_PRACTICE_FREQUENCY", type: "singleChoice", label: "Frequência das práticas de Educação Ambiental", qNumber: "Q2.8", options: [
      { value: "daily", label: "Diária" },
      { value: "weekly", label: "Semanal" },
      { value: "monthly", label: "Mensal" },
      { value: "sporadic", label: "Esporádica" },
      { value: "annual", label: "Anual" },
      { value: "none", label: "Não ocorre" },
      { value: "dontknow", label: "Não sabe" },
    ]},
    { id: "EA_PRACTICE_CONTEXTS", type: "multiChoice", label: "Em que contextos essas práticas costumam acontecer?", qNumber: "Q2.9", options: [
      { value: "classroom", label: "Sala de aula" },
      { value: "outdoor_area", label: "Pátio/área externa" },
      { value: "field_visit", label: "Visita de campo" },
      { value: "special_project", label: "Projeto especial" },
      { value: "fair", label: "Feira" },
      { value: "other", label: "Outro" },
    ]},

    { id: "EA_RECENT_ACTIVITY", type: "confirmation", label: "Houve alguma atividade concreta de Educação Ambiental nos últimos meses?", qNumber: "Q2.10", required: true, help: "Se não houve, tudo bem responder que não — não é necessário inventar uma prática." },
    { id: "EA_RECENT_ACTIVITY_DATE", type: "text", label: "Quando ocorreu?", qNumber: "Q2.11", condition: (d) => ga(d, "EA_RECENT_ACTIVITY") === "yes" },
    { id: "EA_RECENT_THEME", type: "text", label: "Qual foi o tema?", qNumber: "Q2.12", condition: (d) => ga(d, "EA_RECENT_ACTIVITY") === "yes" },
    { id: "EA_RECENT_MOTIVATION", type: "textarea", label: "O que motivou essa atividade?", qNumber: "Q2.13", condition: (d) => ga(d, "EA_RECENT_ACTIVITY") === "yes" },
    { id: "EA_RECENT_PLANNERS", type: "multiChoice", label: "Quem planejou essa atividade?", qNumber: "Q2.14", options: [
      { value: "individual_teacher", label: "Professor(a) individualmente" },
      { value: "teacher_group", label: "Grupo de professores(as)" },
      { value: "coordination", label: "Coordenação pedagógica" },
      { value: "students", label: "Estudantes" },
      { value: "community", label: "Comunidade" },
      { value: "other", label: "Outro" },
    ], condition: (d) => ga(d, "EA_RECENT_ACTIVITY") === "yes" },
    { id: "EA_RECENT_DURATION", type: "text", label: "Qual foi a duração?", qNumber: "Q2.15", condition: (d) => ga(d, "EA_RECENT_ACTIVITY") === "yes" },
    { id: "EA_RECENT_STUDENT_ROLE", type: "singleChoice", label: "Qual foi o papel dos estudantes?", qNumber: "Q2.16", options: [
      { value: "spectator", label: "Espectador" },
      { value: "occasional_participant", label: "Participante pontual" },
      { value: "protagonist", label: "Protagonista" },
      { value: "co_producer", label: "Coprodutor" },
      { value: "dontknow", label: "Não sabe" },
    ], condition: (d) => ga(d, "EA_RECENT_ACTIVITY") === "yes" },
    { id: "EA_RECENT_TERRITORY_LINK", type: "confirmation", label: "Essa atividade teve relação com o território?", qNumber: "Q2.17", condition: (d) => ga(d, "EA_RECENT_ACTIVITY") === "yes" },
    { id: "EA_RECENT_TERRITORY_PROBLEM", type: "textarea", label: "Que problema territorial foi abordado?", qNumber: "Q2.18", condition: (d) => ga(d, "EA_RECENT_ACTIVITY") === "yes" && ga(d, "EA_RECENT_TERRITORY_LINK") === "yes" },
    { id: "EA_RECENT_CONTINUITY", type: "singleChoice", label: "Essa atividade tem perspectiva de continuidade?", qNumber: "Q2.19", options: [
      { value: "depends_on_teacher", label: "Depende da permanência de professor(a) específico(a)" },
      { value: "institutional_continuity", label: "Tem continuidade institucional garantida" },
      { value: "uncertain", label: "Incerta" },
      { value: "dontknow", label: "Não sabe" },
    ], condition: (d) => ga(d, "EA_RECENT_ACTIVITY") === "yes" },
    { id: "EA_RECENT_CHANGE", type: "textarea", label: "O que essa atividade mudou ou gerou?", qNumber: "Q2.20", condition: (d) => ga(d, "EA_RECENT_ACTIVITY") === "yes" },

    { id: "EA_THEME_FREQUENCY", type: "matrix", label: "Com que frequência cada tema é trabalhado?", qNumber: "Q2.21", matrixRows: THEMES_OPTIONS, matrixCols: [{ value: "freq", label: "Frequência", options: FREQ_OPTIONS }] },
    {
      id: "EA_THEME_FREQUENCY_OTHER_DESC", type: "text", label: "Você marcou uma frequência para \"Outros\" temas acima — quais temas são esses?", qNumber: "Q2.21a",
      condition: (d) => !!(ga(d, "EA_THEME_FREQUENCY") || {}).other?.freq,
    },
    { id: "EA_DIFFICULT_THEMES", type: "multiChoice", label: "Quais temas são mais difíceis de trabalhar?", qNumber: "Q2.22", options: THEMES_OPTIONS },
    { id: "EA_DIFFICULTY_CAUSES", type: "multiChoice", label: "O que causa essa dificuldade?", qNumber: "Q2.23", options: [
      { value: "lack_of_training", label: "Falta de formação" },
      { value: "lack_of_material", label: "Falta de material" },
      { value: "sensitive_theme", label: "Tema sensível/delicado" },
      { value: "lack_of_time", label: "Falta de tempo" },
      { value: "curriculum", label: "Currículo" },
      { value: "other", label: "Outro" },
    ]},
    {
      id: "EA_METHODS_USED", type: "multiChoice", label: "Quais métodos/estratégias a escola já utilizou em práticas de Educação Ambiental?", qNumber: "Q2.24",
      options: METHODS_OPTIONS, help: "Marque todos os que já foram usados, mesmo que raramente.",
    },
    {
      id: "EA_MAIN_METHOD", type: "singleChoice", label: "Dentre os métodos marcados acima, qual é o mais utilizado no dia a dia?", qNumber: "Q2.25",
      help: "Esta pergunta pede apenas UM, o predominante — diferente da anterior, que pedia todos os já usados.",
      options: (d) => {
        const used = ga(d, "EA_METHODS_USED") || [];
        return METHODS_OPTIONS.filter((o) => used.includes(o.value));
      },
      condition: (d) => (ga(d, "EA_METHODS_USED") || []).length > 0,
    },
    { id: "EA_TERRITORY_USE_FREQ", type: "singleChoice", label: "Frequência de uso do território como espaço pedagógico", qNumber: "Q2.26", options: FREQ_OPTIONS, required: true },
    { id: "EA_LOCAL_PROBLEM_APPROACH", type: "confirmation", label: "Problemas locais/territoriais são abordados nas práticas de EA?", qNumber: "Q2.27" },

    { id: "EA_TRAINING_RECENT", type: "confirmation", label: "Houve formação recente em Educação Ambiental?", qNumber: "Q2.28" },
    { id: "EA_TRAINING_PROVIDER", type: "text", label: "Quem ofereceu a formação?", qNumber: "Q2.29", condition: (d) => ga(d, "EA_TRAINING_RECENT") === "yes" },
    { id: "EA_TRAINING_TOPICS", type: "text", label: "Quais temas foram abordados?", qNumber: "Q2.30", condition: (d) => ga(d, "EA_TRAINING_RECENT") === "yes" },
    { id: "EA_TRAINING_IMPACT", type: "singleChoice", label: "Qual o impacto dessa formação na prática?", qNumber: "Q2.31", options: [
      { value: "none", label: "Nenhum" },
      { value: "little", label: "Pouco" },
      { value: "moderate", label: "Moderado" },
      { value: "significant", label: "Significativo" },
      { value: "dontknow", label: "Não sabe" },
    ], condition: (d) => ga(d, "EA_TRAINING_RECENT") === "yes" },
    { id: "EA_TRAINING_IMPACT_EXAMPLE", type: "textarea", label: "Dê um exemplo desse impacto", qNumber: "Q2.32", condition: (d) => ga(d, "EA_TRAINING_RECENT") === "yes" },

    { id: "EA_TEACHER_CONFIDENCE", type: "scale", label: "Quão confiante você se sente para trabalhar Educação Ambiental hoje?", qNumber: "Q2.33", scaleMin: 1, scaleMax: 5, scaleLabels: { 1: "Pouco confiante", 5: "Muito confiante" } },
    { id: "EA_SUPPORT_NEEDS", type: "multiChoice", label: "Que tipo de apoio faria diferença?", qNumber: "Q2.34", options: [
      { value: "training", label: "Formação" },
      { value: "didactic_material", label: "Material didático" },
      { value: "planning_time", label: "Tempo de planejamento" },
      { value: "management_support", label: "Apoio da gestão" },
      { value: "partnerships", label: "Parcerias" },
      { value: "financial_resources", label: "Recursos financeiros" },
      { value: "other", label: "Outro" },
    ]},
    { id: "EA_BARRIERS_MATRIX", type: "matrix", label: "Intensidade de cada barreira percebida", qNumber: "Q2.35", matrixRows: BARRIER_ROWS, matrixCols: [{ value: "intensity", label: "Intensidade", options: INTENSITY_OPTIONS }] },
    {
      id: "EA_BARRIERS_OTHER_DESC", type: "text", label: "Você marcou uma intensidade para \"Outras\" barreiras acima — quais são elas?", qNumber: "Q2.35a",
      condition: (d) => !!(ga(d, "EA_BARRIERS_MATRIX") || {}).other?.intensity,
    },
    { id: "EA_MAIN_BARRIER", type: "singleChoice", label: "Principal barreira hoje", qNumber: "Q2.36", options: BARRIER_ROWS },
    { id: "EA_MATERIALS_USED", type: "multiChoice", label: "Materiais didáticos utilizados", qNumber: "Q2.37", options: [
      { value: "textbooks", label: "Livros didáticos" },
      { value: "videos", label: "Vídeos" },
      { value: "games", label: "Jogos" },
      { value: "science_kits", label: "Kits científicos" },
      { value: "school_produced", label: "Materiais produzidos pela escola" },
      { value: "digital_resources", label: "Recursos digitais" },
      { value: "other", label: "Outro" },
    ]},
    { id: "EA_MATERIAL_ACCESS", type: "singleChoice", label: "Facilidade de acesso a esses materiais", qNumber: "Q2.38", options: [
      { value: "easy", label: "Fácil" },
      { value: "moderate", label: "Moderado" },
      { value: "hard", label: "Difícil" },
      { value: "none", label: "Inexistente" },
      { value: "dontknow", label: "Não sabe" },
    ]},
    { id: "EA_MATERIAL_GAPS", type: "textarea", label: "Que materiais fazem falta?", qNumber: "Q2.39" },

    { id: "EA_STUDENT_PARTICIPATION_LEVEL", type: "singleChoice", label: "Como caracterizar, de modo geral, a participação dos estudantes nas ações de EA?", qNumber: "Q2.40", required: true, options: [
      { value: "spectators", label: "Espectadores" },
      { value: "occasional_collaborators", label: "Colaboradores pontuais" },
      { value: "protagonists_sometimes", label: "Protagonistas em alguns momentos" },
      { value: "protagonists_continuous", label: "Protagonistas contínuos" },
      { value: "dontknow", label: "Não sabe" },
    ]},
    { id: "EA_PROJECT_CONTINUITY", type: "singleChoice", label: "De modo geral, a continuidade dos projetos de EA está...", qNumber: "Q2.41", options: [
      { value: "institutionally_guaranteed", label: "Garantida institucionalmente" },
      { value: "people_dependent", label: "Dependente de pessoas específicas" },
      { value: "uncertain", label: "Incerta" },
      { value: "dontknow", label: "Não sabe" },
    ]},
  ];

  function computeDescriptors(diagnosis) {
    const level = ga(diagnosis, "EA_INSTITUTIONAL_LEVEL");
    const continuity = ga(diagnosis, "EA_RECENT_CONTINUITY");
    const LEVEL_TEXT = {
      none: "Não há registro de práticas de Educação Ambiental na escola até o momento.",
      isolated_occasional: "As respostas indicam ações de Educação Ambiental pontuais e ocasionais.",
      recurring_dependent: "As respostas indicam ações recorrentes, porém ainda dependentes de iniciativas individuais.",
      present_multiple: "As respostas indicam presença da Educação Ambiental em diferentes componentes ou projetos da escola.",
      integrated_planning: "As respostas indicam Educação Ambiental integrada ao planejamento pedagógico da escola.",
      institutionalized_continuous: "As respostas indicam Educação Ambiental institucionalizada e contínua na escola.",
    };
    let institutionalizationDescriptor = LEVEL_TEXT[level] || "Não há informação suficiente para caracterizar este aspecto.";
    if (continuity === "depends_on_teacher") {
      institutionalizationDescriptor += " Ainda assim, a continuidade dessas ações depende hoje da permanência de profissionais específicos.";
    }

    const territoryFreq = ga(diagnosis, "EA_TERRITORY_USE_FREQ");
    const localProblem = ga(diagnosis, "EA_LOCAL_PROBLEM_APPROACH");
    let territorializationDescriptor = "Não há informação suficiente para caracterizar este aspecto.";
    if (territoryFreq === "frequently" && localProblem === "yes") {
      territorializationDescriptor = "As práticas de Educação Ambiental utilizam o território com frequência e dialogam com problemas locais concretos.";
    } else if (territoryFreq === "sometimes") {
      territorializationDescriptor = "O território é utilizado às vezes como espaço pedagógico nas práticas de Educação Ambiental.";
    } else if (["rarely", "never"].includes(territoryFreq)) {
      territorializationDescriptor = "O território ainda é pouco utilizado como espaço pedagógico nas práticas de Educação Ambiental registradas.";
    }

    const studentLevel = ga(diagnosis, "EA_STUDENT_PARTICIPATION_LEVEL");
    const STUDENT_TEXT = {
      spectators: "Os estudantes são descritos majoritariamente como espectadores das ações de Educação Ambiental.",
      occasional_collaborators: "Os estudantes colaboram pontualmente nas ações de Educação Ambiental.",
      protagonists_sometimes: "Os estudantes assumem protagonismo em alguns momentos das ações de Educação Ambiental.",
      protagonists_continuous: "Os estudantes são descritos como protagonistas contínuos das ações de Educação Ambiental.",
    };
    const studentParticipationDescriptor = STUDENT_TEXT[studentLevel] || "Não há informação suficiente para caracterizar este aspecto.";

    return { institutionalizationDescriptor, territorializationDescriptor, studentParticipationDescriptor };
  }

  function render(diagnosis) {
    const container = el("div", { class: "stage-form" });
    fields.forEach((f) => {
      const node = renderField(f, diagnosis, window.App.setField);
      if (node) container.appendChild(node);
    });

    const descriptors = computeDescriptors(diagnosis);
    container.appendChild(
      window.Components.renderSummaryCard("Como o sistema está lendo suas respostas (revise e confirme)", [
        descriptors.institutionalizationDescriptor,
        descriptors.territorializationDescriptor,
        descriptors.studentParticipationDescriptor,
      ])
    );

    const validationField = { id: "EA_PROFILE_VALIDATION", type: "confirmation", label: "Essa leitura reflete a realidade da escola?", qNumber: "Q2.42" };
    container.appendChild(renderField(validationField, diagnosis, window.App.setField));

    const validation = ga(diagnosis, "EA_PROFILE_VALIDATION");
    if (validation && validation !== "yes") {
      const correctionField = { id: "EA_PROFILE_CORRECTION", type: "textarea", label: "O que precisa ser corrigido ou complementado?", qNumber: "Q2.43" };
      container.appendChild(renderField(correctionField, diagnosis, window.App.setField));
    }

    container.appendChild(renderEvidenceBuilder(diagnosis, { stage: 2, dimension: "environmentalEducation", title: "Evidências sobre Educação Ambiental" }));
    return container;
  }

  window.Stages = window.Stages || {};
  window.Stages[2] = {
    id: 2,
    key: "environmentalEducation",
    title: "Educação Ambiental",
    fields,
    render,
    computeDescriptors,
  };
})();
