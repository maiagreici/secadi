/**
 * stage6.js — Etapa 6: Problemas e Prioridades
 * Candidatos automáticos exigem confirmação humana (nunca viram problema
 * sozinhos). Critérios de priorização organizam a análise, mas a escolha
 * final é humana — nunca soma mecânica (seção 42). Máximo de 3 prioridades.
 */

(function () {
  const { el, domId } = window.Components;
  const ga = (d, id) => window.DataModel.getAnswer(d, id);

  const SEVERITY_OPTIONS = [{ value: "low", label: "Baixa" }, { value: "medium", label: "Média" }, { value: "high", label: "Alta" }];
  const REACH_OPTIONS = [
    { value: "individual", label: "Individual" }, { value: "classroom", label: "Uma turma" },
    { value: "whole_school", label: "Toda a escola" }, { value: "community", label: "Comunidade" }, { value: "territory", label: "Território" },
  ];
  const ACTIONABILITY_OPTIONS = [
    { value: "school_can_act_alone", label: "A escola pode agir sozinha" }, { value: "needs_partnership", label: "Precisa de parceria" },
    { value: "beyond_school_reach", label: "Está fora do alcance da escola" }, { value: "dontknow", label: "Não sabe" },
  ];
  const AFFECTED_GROUPS_OPTIONS = [
    { value: "students", label: "Estudantes" }, { value: "teachers", label: "Professores(as)" }, { value: "staff", label: "Funcionários(as)" },
    { value: "families", label: "Famílias" }, { value: "community", label: "Comunidade" }, { value: "other", label: "Outro" },
  ];
  const DECISION_PARTICIPANTS_OPTIONS = [
    { value: "students", label: "Estudantes" }, { value: "teachers", label: "Professores(as)" }, { value: "management", label: "Gestão" },
    { value: "families", label: "Famílias" }, { value: "community", label: "Comunidade" }, { value: "school_council", label: "Conselho escolar" }, { value: "other", label: "Outro" },
  ];
  const SELECTION_METHOD_OPTIONS = [
    { value: "voting", label: "Votação" }, { value: "consensus", label: "Consenso" }, { value: "management_decision", label: "Decisão da gestão" },
    { value: "technical_criteria", label: "Critérios técnicos" }, { value: "collective_discussion", label: "Discussão coletiva" }, { value: "other", label: "Outro" },
  ];

  function multiCheckbox(options, selected, onToggle) {
    const group = el("div", { class: "choice-group" });
    options.forEach((o) => {
      const optId = domId("prc");
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

  function renderCandidates(diagnosis) {
    const candidates = diagnosis.problems.filter((p) => !p.confirmed);
    if (candidates.length === 0) return null;
    const wrap = el("div", { class: "problem-candidates" });
    wrap.appendChild(el("h3", {}, "Candidatos identificados a partir do diagnóstico (PRI_CANDIDATES)"));
    wrap.appendChild(el("p", { class: "field__help" }, "Estes candidatos foram propostos automaticamente por cruzarem informações de outras etapas. Eles só se tornam problemas do diagnóstico se você confirmar."));
    candidates.forEach((p) => {
      wrap.appendChild(el("div", { class: "problem-candidate" }, [
        el("h4", {}, p.title),
        el("p", {}, p.description),
        el("div", { class: "problem-candidate__actions" }, [
          el("button", { type: "button", class: "btn btn--secondary btn--small", onclick: () => window.App.mutate((d) => { d.problems.find((x) => x.problemId === p.problemId).confirmed = true; }) }, "Confirmar como problema"),
          el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => window.App.mutate((d) => { d.problems = d.problems.filter((x) => x.problemId !== p.problemId); }) }, "Descartar"),
        ]),
      ]));
    });
    return wrap;
  }

  function renderCustomProblemForm() {
    const wrap = el("div", { class: "custom-problem-form" });
    wrap.appendChild(el("h3", {}, "Adicionar problema (PRI_CUSTOM_PROBLEM)"));
    const titleInput = el("input", { type: "text", class: "input", placeholder: "Título do problema" });
    const descInput = el("textarea", { class: "input textarea", rows: 2, placeholder: "Descrição" });
    const addBtn = el("button", {
      type: "button", class: "btn btn--secondary btn--small",
      onclick: () => {
        if (!titleInput.value.trim()) { alert("Informe um título para o problema."); return; }
        window.App.mutate((d) => d.problems.push(window.DataModel.createProblem({ title: titleInput.value, description: descInput.value, confirmed: true, custom: true })));
        titleInput.value = ""; descInput.value = "";
      },
    }, "+ Adicionar problema");
    wrap.appendChild(el("div", { class: "custom-problem-form__row" }, [titleInput, descInput, addBtn]));
    return wrap;
  }

  function renderProblemScoring(diagnosis, problem) {
    const update = (patch) => window.App.mutate((d) => Object.assign(d.problems.find((p) => p.problemId === problem.problemId), patch));
    const card = el("div", { class: "problem-scoring-card" });
    card.appendChild(el("h4", {}, problem.title));
    if (problem.description) card.appendChild(el("p", { class: "muted" }, problem.description));

    const row = (label, control) => el("div", { class: "field field--compact" }, [el("label", {}, label), control]);

    card.appendChild(row("Gravidade (PRI_SEVERITY)", singleSelect(SEVERITY_OPTIONS, problem.severity, (v) => update({ severity: v }))));
    card.appendChild(row("Urgência (PRI_URGENCY)", singleSelect(SEVERITY_OPTIONS, problem.urgency, (v) => update({ urgency: v }))));
    card.appendChild(row("Abrangência (PRI_REACH)", singleSelect(REACH_OPTIONS, problem.reach, (v) => update({ reach: v }))));
    card.appendChild(row("A escola consegue agir? (PRI_ACTIONABILITY)", singleSelect(ACTIONABILITY_OPTIONS, problem.schoolActionability, (v) => update({ schoolActionability: v }))));
    card.appendChild(row("Grupos afetados (PRI_AFFECTED_GROUPS)", multiCheckbox(AFFECTED_GROUPS_OPTIONS, problem.affectedGroups || [], (v, checked) => {
      const set = new Set(problem.affectedGroups || []); checked ? set.add(v) : set.delete(v); update({ affectedGroups: [...set] });
    })));
    card.appendChild(row("Quem deveria participar da decisão sobre este problema? (PRI_DECISION_PARTICIPANTS)", multiCheckbox(DECISION_PARTICIPANTS_OPTIONS, problem.decisionParticipants || [], (v, checked) => {
      const set = new Set(problem.decisionParticipants || []); checked ? set.add(v) : set.delete(v); update({ decisionParticipants: [...set] });
    })));

    const evList = el("div", { class: "choice-group" });
    diagnosis.evidence.forEach((ev) => {
      const optId = domId("prev");
      evList.appendChild(el("label", { class: "choice-item choice-item--small", for: optId }, [
        el("input", { type: "checkbox", id: optId, checked: (problem.evidenceIds || []).includes(ev.evidenceId), onchange: (e) => {
          const set = new Set(problem.evidenceIds || []); e.target.checked ? set.add(ev.evidenceId) : set.delete(ev.evidenceId); update({ evidenceIds: [...set] });
        } }),
        el("span", {}, ev.description || ev.type),
      ]));
    });
    if (diagnosis.evidence.length === 0) evList.appendChild(el("p", { class: "muted" }, "Nenhuma evidência registrada ainda."));
    card.appendChild(row("Evidências (PRI_EVIDENCE)", evList));

    return card;
  }

  function renderPrioritySelection(diagnosis) {
    const confirmed = diagnosis.problems.filter((p) => p.confirmed);
    const wrap = el("div", { class: "priority-selection" });
    wrap.appendChild(el("h3", {}, "Selecione até 3 prioridades (PRI_TOP_PROBLEMS)"));
    wrap.appendChild(el("p", { class: "field__help" }, "As informações acima organizam a análise, mas a escolha final não é uma soma automática de critérios — é uma decisão da comunidade escolar."));

    confirmed.forEach((problem) => {
      const priority = diagnosis.priorities.find((p) => p.problemId === problem.problemId);
      const row = el("div", { class: "priority-selection__row" });
      row.appendChild(el("span", {}, problem.title));
      const toggleBtn = el("button", {
        type: "button", class: "btn btn--small " + (priority ? "btn--secondary" : "btn--outline"),
        disabled: !priority && diagnosis.priorities.length >= 3,
        onclick: () => {
          window.App.mutate((d) => {
            if (priority) {
              d.priorities = d.priorities.filter((p) => p.problemId !== problem.problemId);
              d.priorities.forEach((p, idx) => (p.order = idx + 1));
              d.problems.find((p) => p.problemId === problem.problemId).selectedAsPriority = false;
            } else {
              d.priorities.push(window.DataModel.createPriority({ problemId: problem.problemId, order: d.priorities.length + 1 }));
              d.problems.find((p) => p.problemId === problem.problemId).selectedAsPriority = true;
            }
          });
        },
      }, priority ? `Prioridade #${priority.order} — remover` : "Selecionar como prioridade");
      row.appendChild(toggleBtn);
      wrap.appendChild(row);

      if (priority) {
        const detail = el("div", { class: "priority-selection__detail" });
        const justArea = el("textarea", { class: "input textarea", rows: 2, placeholder: "Por que esta é uma prioridade agora? (PRI_JUSTIFICATION)" });
        justArea.value = priority.justification || "";
        justArea.addEventListener("input", (e) => window.App.mutate((d) => (d.priorities.find((p) => p.problemId === problem.problemId).justification = e.target.value)));
        detail.appendChild(justArea);

        const changeArea = el("textarea", { class: "input textarea", rows: 2, placeholder: "Que mudança se espera ao endereçar isso? (PRI_EXPECTED_CHANGE)" });
        changeArea.value = priority.expectedChange || "";
        changeArea.addEventListener("input", (e) => window.App.mutate((d) => (d.priorities.find((p) => p.problemId === problem.problemId).expectedChange = e.target.value)));
        detail.appendChild(changeArea);

        detail.appendChild(el("label", {}, "Participantes da decisão (PRI_SELECTION_PARTICIPANTS)"));
        detail.appendChild(multiCheckbox(DECISION_PARTICIPANTS_OPTIONS, priority.selectionParticipants || [], (v, checked) => {
          const set = new Set(priority.selectionParticipants || []); checked ? set.add(v) : set.delete(v);
          window.App.mutate((d) => (d.priorities.find((p) => p.problemId === problem.problemId).selectionParticipants = [...set]));
        }));

        detail.appendChild(el("label", {}, "Método de seleção (PRI_SELECTION_METHOD)"));
        detail.appendChild(singleSelect(SELECTION_METHOD_OPTIONS, priority.selectionMethod, (v) => window.App.mutate((d) => (d.priorities.find((p) => p.problemId === problem.problemId).selectionMethod = v))));
        if (priority.selectionMethod === "other") {
          const otherInput = el("input", { type: "text", class: "input", value: priority.selectionMethodOther || "", placeholder: "Especifique...", oninput: (e) => window.App.mutate((d) => (d.priorities.find((p) => p.problemId === problem.problemId).selectionMethodOther = e.target.value)) });
          detail.appendChild(otherInput);
        }
        wrap.appendChild(detail);
      }
    });

    return wrap;
  }

  function render(diagnosis) {
    const container = el("div", { class: "stage-form" });
    const candidatesSection = renderCandidates(diagnosis);
    if (candidatesSection) container.appendChild(candidatesSection);
    container.appendChild(renderCustomProblemForm());

    const confirmed = diagnosis.problems.filter((p) => p.confirmed);
    if (confirmed.length > 0) {
      container.appendChild(el("h3", {}, "Analise cada problema confirmado"));
      confirmed.forEach((p) => container.appendChild(renderProblemScoring(diagnosis, p)));
      container.appendChild(renderPrioritySelection(diagnosis));
    } else {
      container.appendChild(el("p", { class: "muted" }, "Nenhum problema confirmado ainda. Confirme um candidato ou adicione um problema manualmente."));
    }

    return container;
  }

  function extraRequiredChecks(diagnosis) {
    return [{ id: "AT_LEAST_ONE_PROBLEM", satisfied: diagnosis.problems.some((p) => p.confirmed) }];
  }

  window.Stages = window.Stages || {};
  window.Stages[6] = { id: 6, key: "priorities", title: "Problemas e Prioridades", fields: [], render, extraRequiredChecks };
})();
