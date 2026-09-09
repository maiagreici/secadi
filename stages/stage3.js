/**
 * stage3.js — Etapa 3: Participação e Redes
 * Participação estudantil/familiar no processo pedagógico, mapeamento de
 * atores do território (com distinção existência/contato/parceria/
 * articulação permanente — seção 27) e preparação para emergências.
 */

(function () {
  const { el, renderField, renderEvidenceBuilder } = window.Components;
  const ga = (d, id) => window.DataModel.getAnswer(d, id);

  const ACTOR_CATEGORY_GROUPS = [
    { group: "Poder público", options: [
      { value: "secretaria_educacao", label: "Secretaria de Educação" },
      { value: "secretaria_meio_ambiente", label: "Secretaria de Meio Ambiente" },
      { value: "defesa_civil", label: "Defesa Civil" },
      { value: "saude", label: "Secretaria de Saúde" },
      { value: "assistencia_social", label: "Assistência Social" },
      { value: "obras", label: "Obras" },
      { value: "bombeiros", label: "Bombeiros" },
      { value: "ubs", label: "UBS" },
      { value: "vigilancia", label: "Vigilância" },
      { value: "other_public", label: "Outro (poder público)" },
    ]},
    { group: "Educação e ciência", options: [
      { value: "universidade", label: "Universidade" },
      { value: "instituto_federal", label: "Instituto Federal" },
      { value: "escola_tecnica", label: "Escola técnica" },
      { value: "centro_pesquisa", label: "Centro de pesquisa" },
      { value: "museu", label: "Museu" },
      { value: "jardim_botanico", label: "Jardim botânico" },
      { value: "other_education", label: "Outro (educação/ciência)" },
    ]},
    { group: "Sociedade civil", options: [
      { value: "associacao_moradores", label: "Associação de moradores" },
      { value: "ong", label: "ONG" },
      { value: "cooperativa", label: "Cooperativa" },
      { value: "catadores", label: "Catadores" },
      { value: "movimentos_sociais", label: "Movimentos sociais" },
      { value: "coletivos", label: "Coletivos" },
      { value: "grupos_culturais", label: "Grupos culturais" },
      { value: "organizacoes_comunitarias_religiosas", label: "Organizações comunitárias/religiosas" },
      { value: "other_civil", label: "Outro (sociedade civil)" },
    ]},
    { group: "Comunidades e conhecimentos", options: [
      { value: "povos_indigenas", label: "Povos indígenas" },
      { value: "quilombolas", label: "Quilombolas" },
      { value: "agricultores_familiares", label: "Agricultores familiares" },
      { value: "pescadores", label: "Pescadores" },
      { value: "comunidades_tradicionais", label: "Comunidades tradicionais" },
      { value: "liderancas", label: "Lideranças" },
      { value: "detentores_conhecimentos_locais", label: "Detentores de conhecimentos locais" },
      { value: "other_community", label: "Outro (comunidades e conhecimentos)" },
    ]},
  ];

  const RELATIONSHIP_OPTIONS = [
    { value: "none", label: "Não existe relação — não é parceiro(a)" },
    { value: "knows_exists", label: "Sabe que existe, mas nunca houve contato — não é parceiro(a)" },
    { value: "occasional_contact", label: "Já houve contato pontual, sem combinação formal — ainda não é parceiro(a)" },
    { value: "partnership", label: "Parceria — já colaboram em ações combinadas" },
    { value: "permanent_articulation", label: "Articulação permanente — parceria contínua e estruturada" },
  ];

  const CONTRIBUTION_OPTIONS = [
    { value: "resources", label: "Recursos" },
    { value: "training", label: "Formação" },
    { value: "institutional_articulation", label: "Articulação institucional" },
    { value: "technical_support", label: "Apoio técnico" },
    { value: "community_mobilization", label: "Mobilização comunitária" },
    { value: "traditional_knowledge", label: "Conhecimentos tradicionais/locais" },
    { value: "other", label: "Outro" },
  ];

  const fields = [
    { id: "PAR_EA_PARTICIPANTS", type: "multiChoice", label: "Quem participa das ações de Educação Ambiental hoje?", qNumber: "Q3.1", otherFieldId: "PAR_EA_PARTICIPANTS_OTHER", options: [
      { value: "students", label: "Estudantes" }, { value: "teachers", label: "Professores(as)" },
      { value: "management", label: "Gestão" }, { value: "staff", label: "Funcionários(as)" },
      { value: "families", label: "Famílias" }, { value: "community", label: "Comunidade" }, { value: "other", label: "Outros" },
    ]},
    { id: "PAR_PARTICIPATION_MODE", type: "singleChoice", label: "Como essa participação costuma acontecer?", qNumber: "Q3.2", options: [
      { value: "informative", label: "Informativa (recebem informação)" },
      { value: "consultative", label: "Consultiva (são ouvidos)" },
      { value: "collaborative", label: "Colaborativa (constroem junto)" },
      { value: "protagonist", label: "Protagonista (decidem e conduzem)" },
      { value: "dontknow", label: "Não sabe" },
    ], help: "Participação não é sinônimo de presença — o que importa é o nível de envolvimento na decisão." },
    { id: "PAR_STUDENT_SPACES", type: "multiChoice", label: "Espaços de participação estudantil existentes", qNumber: "Q3.3", otherFieldId: "PAR_STUDENT_SPACES_OTHER", options: [
      { value: "student_council", label: "Grêmio estudantil" }, { value: "assemblies", label: "Assembleias" },
      { value: "student_projects", label: "Projetos protagonizados por estudantes" }, { value: "councils", label: "Conselhos" },
      { value: "none", label: "Nenhum" }, { value: "other", label: "Outro" },
    ]},
    { id: "PAR_STUDENT_PRACTICES", type: "textarea", label: "Descreva práticas concretas de participação estudantil (se houver)", qNumber: "Q3.4" },
    { id: "PAR_STUDENT_LEVEL_CONFIRM", type: "confirmation", label: "O nível de participação estudantil descrito na Etapa 2 continua condizente?", qNumber: "Q3.5" },
    { id: "PAR_FAMILY_LEVEL", type: "singleChoice", label: "Nível de envolvimento das famílias com a escola", qNumber: "Q3.6", options: [
      { value: "absent", label: "Ausente" }, { value: "sporadic", label: "Esporádico" },
      { value: "regular", label: "Regular" }, { value: "active", label: "Ativo/protagonista" }, { value: "dontknow", label: "Não sabe" },
    ]},
    { id: "PAR_FAMILY_BARRIERS", type: "multiChoice", label: "Barreiras à participação das famílias", qNumber: "Q3.7", otherFieldId: "PAR_FAMILY_BARRIERS_OTHER", options: [
      { value: "work_schedule", label: "Horário de trabalho" }, { value: "distance", label: "Distância" },
      { value: "communication", label: "Comunicação inadequada" }, { value: "lack_of_invitation", label: "Falta de convite/convocação" },
      { value: "other", label: "Outra" },
    ]},

    { id: "NET_TERRITORY_ACTIVITY_FREQ", type: "singleChoice", label: "Frequência de atividades da escola com o território/comunidade", qNumber: "Q3.8", options: [
      { value: "never", label: "Nunca" }, { value: "rarely", label: "Raramente" }, { value: "sometimes", label: "Às vezes" }, { value: "frequently", label: "Frequentemente" }, { value: "dontknow", label: "Não sabe" },
    ]},
    { id: "NET_TERRITORY_ACTIVITIES", type: "textarea", label: "Quais atividades com o território/comunidade já ocorreram?", qNumber: "Q3.9" },
    { id: "NET_COMMUNITY_LISTENING", type: "confirmation", label: "A escola tem mecanismos de escuta da comunidade?", qNumber: "Q3.10" },

    { id: "NET_EMERGENCY_CONTACT_KNOWLEDGE", type: "confirmation", label: "A escola sabe a quem contatar em uma emergência climática?", qNumber: "Q3.11", required: true },
    { id: "NET_EMERGENCY_CONTACTS", type: "textarea", label: "Quais são esses contatos?", qNumber: "Q3.12", condition: (d) => ga(d, "NET_EMERGENCY_CONTACT_KNOWLEDGE") === "yes" },
    { id: "NET_EMERGENCY_PROCEDURE", type: "confirmation", label: "Existe um procedimento de emergência definido para eventos climáticos?", qNumber: "Q3.13", required: true },
    { id: "NET_EMERGENCY_DOCUMENT", type: "confirmation", label: "Esse procedimento está documentado/formalizado?", qNumber: "Q3.14", condition: (d) => ga(d, "NET_EMERGENCY_PROCEDURE") === "yes" },
    { id: "NET_PREPAREDNESS_ACTIONS", type: "textarea", label: "Que ações de preparação já foram feitas (simulados, sinalização, etc.)?", qNumber: "Q3.15" },

    { id: "NET_COMM_CHANNELS", type: "multiChoice", label: "Canais de comunicação da escola com a comunidade", qNumber: "Q3.16", otherFieldId: "NET_COMM_CHANNELS_OTHER", options: [
      { value: "whatsapp", label: "WhatsApp" }, { value: "printed_notices", label: "Comunicados impressos" },
      { value: "school_meetings", label: "Reuniões" }, { value: "social_media", label: "Redes sociais" },
      { value: "loudspeaker_local_radio", label: "Alto-falante/rádio local" }, { value: "other", label: "Outro" },
    ]},
    { id: "NET_EMERGENCY_COMM_SUFFICIENCY", type: "singleChoice", label: "Esses canais seriam suficientes numa emergência?", qNumber: "Q3.17", options: [
      { value: "yes", label: "Sim" }, { value: "partially", label: "Parcialmente" }, { value: "no", label: "Não" }, { value: "dontknow", label: "Não sabe" },
    ]},
    { id: "NET_COMM_EXCLUDED_GROUPS", type: "textarea", label: "Algum grupo fica de fora desses canais de comunicação?", qNumber: "Q3.18" },

    { id: "NET_COMMUNITY_CAPACITIES", type: "textarea", label: "Que capacidades/conhecimentos a comunidade já possui e podem ser mobilizados?", qNumber: "Q3.19", help: "Ex.: conhecimento tradicional sobre o clima local, organização comunitária, mutirões, saberes de manejo." },
    { id: "NET_PRIORITY_CAPACITIES", type: "textarea", label: "Quais dessas capacidades parecem mais estratégicas de fortalecer?", qNumber: "Q3.20" },
    { id: "NET_ARTICULATION_BARRIERS", type: "multiChoice", label: "Barreiras para articular com atores do território", qNumber: "Q3.21", otherFieldId: "NET_ARTICULATION_BARRIERS_OTHER", options: [
      { value: "no_contact", label: "Falta de contato" }, { value: "bureaucracy", label: "Burocracia" },
      { value: "distrust", label: "Desconfiança/histórico de relação" }, { value: "time", label: "Falta de tempo" }, { value: "other", label: "Outra" },
    ]},

    { id: "NET_CASE_DESCRIPTION", type: "textarea", label: "Descreva um caso concreto de articulação (bem ou malsucedida) com a comunidade/rede", qNumber: "Q3.22" },
    { id: "NET_CASE_PARTICIPANTS", type: "text", label: "Quem participou desse caso?", qNumber: "Q3.23", condition: (d) => !!ga(d, "NET_CASE_DESCRIPTION") },
    { id: "NET_CASE_STRENGTHS", type: "textarea", label: "O que funcionou bem?", qNumber: "Q3.24", condition: (d) => !!ga(d, "NET_CASE_DESCRIPTION") },
    { id: "NET_CASE_DIFFICULTIES", type: "textarea", label: "Quais foram as dificuldades?", qNumber: "Q3.25", condition: (d) => !!ga(d, "NET_CASE_DESCRIPTION") },
    { id: "NET_CASE_LEARNING", type: "textarea", label: "O que essa experiência ensinou?", qNumber: "Q3.26", condition: (d) => !!ga(d, "NET_CASE_DESCRIPTION") },

    { id: "NET_PRIORITY_RELATION", type: "text", label: "Se houvesse uma relação prioritária para fortalecer agora, qual seria?", qNumber: "Q3.27" },
    { id: "NET_PRIORITY_RELATION_REASON", type: "textarea", label: "Por quê?", qNumber: "Q3.28", condition: (d) => !!ga(d, "NET_PRIORITY_RELATION") },
  ];

  function renderActorEditor(diagnosis) {
    const wrap = el("div", { class: "actor-editor" });
    wrap.appendChild(el("h3", {}, "Atores do território (NET_ACTORS)"));
    wrap.appendChild(el("p", { class: "field__help" }, "Existência, contato, parceria e articulação permanente são níveis diferentes — não confunda um com o outro. Só marque \"Parceria\" ou \"Articulação permanente\" se a escola já colabora de fato com esse ator; se ele apenas existe no território ou já houve um contato pontual, isso ainda NÃO é parceria."));

    diagnosis.actors.forEach((actor) => {
      const card = el("div", { class: "actor-card actor-card--editable" });
      card.appendChild(el("h4", {}, actor.name || "(sem nome)"));

      const nameInput = el("input", {
        type: "text", class: "input", value: actor.name, placeholder: "Nome/identificação do ator",
        oninput: (e) => window.App.mutate((d) => { d.actors.find((a) => a.actorId === actor.actorId).name = e.target.value; }),
      });
      card.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, "Nome"), nameInput]));

      const existsSelect = el("select", { class: "input input--select" });
      [["", "—"], ["yes", "Sim"], ["no", "Não"], ["dontknow", "Não sabe"]].forEach(([v, l]) =>
        existsSelect.appendChild(el("option", { value: v, selected: actor.existsInTerritory === v }, l))
      );
      existsSelect.addEventListener("change", (e) => window.App.mutate((d) => { d.actors.find((a) => a.actorId === actor.actorId).existsInTerritory = e.target.value; }));
      card.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, "Existe no território?"), existsSelect]));

      const relSelect = el("select", { class: "input input--select", "aria-label": "NET_ACTOR_RELATIONSHIP" });
      relSelect.appendChild(el("option", { value: "" }, "—"));
      RELATIONSHIP_OPTIONS.forEach((o) => relSelect.appendChild(el("option", { value: o.value, selected: actor.relationshipLevel === o.value }, o.label)));
      relSelect.addEventListener("change", (e) => window.App.mutate((d) => { d.actors.find((a) => a.actorId === actor.actorId).relationshipLevel = e.target.value; }));
      card.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, "Nível de relação"), relSelect]));

      const contribGroup = el("div", { class: "choice-group", "aria-label": "NET_ACTOR_CONTRIBUTIONS (atuais)" });
      CONTRIBUTION_OPTIONS.forEach((o) => {
        const optId = window.Components.domId("contrib");
        contribGroup.appendChild(el("label", { class: "choice-item choice-item--small", for: optId }, [
          el("input", { type: "checkbox", id: optId, checked: (actor.currentContributions || []).includes(o.value), onchange: (e) => window.App.mutate((d) => {
            const a = d.actors.find((x) => x.actorId === actor.actorId);
            const set = new Set(a.currentContributions || []);
            if (e.target.checked) set.add(o.value); else set.delete(o.value);
            a.currentContributions = [...set];
          }) }),
          el("span", {}, o.label),
        ]));
      });
      const contribOther = window.Components.renderOtherInline(
        (actor.currentContributions || []).includes("other"), actor.currentContributionsOther,
        (v) => window.App.mutate((d) => { d.actors.find((a) => a.actorId === actor.actorId).currentContributionsOther = v; }),
        "Especifique a contribuição atual..."
      );
      if (contribOther) contribGroup.appendChild(contribOther);
      card.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, "Contribuições atuais"), contribGroup]));

      const potGroup = el("div", { class: "choice-group", "aria-label": "NET_ACTOR_POTENTIAL" });
      CONTRIBUTION_OPTIONS.forEach((o) => {
        const optId = window.Components.domId("pot");
        potGroup.appendChild(el("label", { class: "choice-item choice-item--small", for: optId }, [
          el("input", { type: "checkbox", id: optId, checked: (actor.potentialContributions || []).includes(o.value), onchange: (e) => window.App.mutate((d) => {
            const a = d.actors.find((x) => x.actorId === actor.actorId);
            const set = new Set(a.potentialContributions || []);
            if (e.target.checked) set.add(o.value); else set.delete(o.value);
            a.potentialContributions = [...set];
          }) }),
          el("span", {}, o.label),
        ]));
      });
      const potOther = window.Components.renderOtherInline(
        (actor.potentialContributions || []).includes("other"), actor.potentialContributionsOther,
        (v) => window.App.mutate((d) => { d.actors.find((a) => a.actorId === actor.actorId).potentialContributionsOther = v; }),
        "Especifique a contribuição potencial..."
      );
      if (potOther) potGroup.appendChild(potOther);
      card.appendChild(el("div", { class: "field field--compact" }, [el("label", {}, "Contribuições potenciais"), potGroup]));

      const priorityCheckbox = el("input", { type: "checkbox", checked: actor.priorityForStrengthening, onchange: (e) => window.App.mutate((d) => { d.actors.find((a) => a.actorId === actor.actorId).priorityForStrengthening = e.target.checked; }) });
      card.appendChild(el("label", { class: "choice-item" }, [priorityCheckbox, el("span", {}, "Prioridade para fortalecimento (NET_PRIORITY_ACTORS)")]));
      if (actor.priorityForStrengthening) {
        const reasonInput = el("textarea", { class: "input textarea", rows: 2, placeholder: "Por quê?" });
        reasonInput.value = actor.priorityReason || "";
        reasonInput.addEventListener("input", (e) => window.App.mutate((d) => { d.actors.find((a) => a.actorId === actor.actorId).priorityReason = e.target.value; }));
        card.appendChild(reasonInput);
      }

      card.appendChild(el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => window.App.mutate((d) => { d.actors = d.actors.filter((a) => a.actorId !== actor.actorId); }) }, "Remover ator"));
      wrap.appendChild(card);
    });

    const catSelect = el("select", { class: "input input--select" });
    catSelect.appendChild(el("option", { value: "" }, "Categoria do novo ator..."));
    ACTOR_CATEGORY_GROUPS.forEach((group) => {
      const optgroup = el("optgroup", { label: group.group });
      group.options.forEach((o) => optgroup.appendChild(el("option", { value: o.value }, o.label)));
      catSelect.appendChild(optgroup);
    });
    const nameNewInput = el("input", { type: "text", class: "input", placeholder: "Nome do ator (ex.: UBS Vila Nova)" });
    const addBtn = el("button", {
      type: "button", class: "btn btn--secondary btn--small",
      onclick: () => {
        if (!catSelect.value) { alert("Selecione a categoria do ator."); return; }
        window.App.mutate((d) => d.actors.push(window.DataModel.createActor({ category: catSelect.value, name: nameNewInput.value || "" })));
        catSelect.value = "";
        nameNewInput.value = "";
      },
    }, "+ Adicionar ator");
    wrap.appendChild(el("div", { class: "actor-editor__add" }, [catSelect, nameNewInput, addBtn]));

    return wrap;
  }

  function render(diagnosis) {
    const container = el("div", { class: "stage-form" });
    fields.slice(0, 10).forEach((f) => { const n = renderField(f, diagnosis, window.App.setField); if (n) container.appendChild(n); });
    container.appendChild(renderActorEditor(diagnosis));
    fields.slice(10).forEach((f) => { const n = renderField(f, diagnosis, window.App.setField); if (n) container.appendChild(n); });
    container.appendChild(renderEvidenceBuilder(diagnosis, { stage: 3, dimension: "participation", title: "Evidências sobre participação e redes" }));
    return container;
  }

  function memoryPanel(diagnosis) {
    const defesaCivil = diagnosis.actors.find((a) => a.category === "defesa_civil");
    const procedure = ga(diagnosis, "NET_EMERGENCY_PROCEDURE");
    if (!defesaCivil && !procedure) return null;
    return window.Components.renderSummaryCard("Do seu diagnóstico", [
      defesaCivil ? `Defesa Civil: existe, relação — ${RELATIONSHIP_OPTIONS.find((o) => o.value === defesaCivil.relationshipLevel)?.label || "não informado"}` : null,
      procedure ? `Procedimento de emergência: ${procedure === "yes" ? "identificado" : procedure === "no" ? "não identificado" : "não sabe"}` : null,
    ].filter(Boolean));
  }

  window.Stages = window.Stages || {};
  window.Stages[3] = { id: 3, key: "participation", title: "Participação e Redes", fields, render, memoryPanel };
})();
