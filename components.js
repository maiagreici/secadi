/**
 * components.js
 * Biblioteca de componentes de UI reutilizáveis (formulário genérico) e os
 * "cards" conceituais (RiskCard, ActorCard, EvidenceCard, SWOTCard,
 * PriorityCard, ActionPlanCard, IndicatorCard, KnowledgeGapCard, AlertCard).
 *
 * Componentes de formulário não guardam estado próprio: leem o valor atual
 * do `diagnosis` (via App.getDiagnosis / DataModel.getAnswer) e escrevem
 * mudanças de volta via App.setField / App.mutate, que cuidam de
 * salvar + reavaliar regras + re-renderizar.
 */

let fieldSeq = 0;
function domId(prefix) {
  fieldSeq += 1;
  return `${prefix}_${fieldSeq}`;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === false) return;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "checked" || key === "disabled" || key === "required") {
      node[key] = !!value;
      if (value) node.setAttribute(key, "");
    } else {
      node.setAttribute(key, value);
    }
  });
  (Array.isArray(children) ? children : [children]).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  });
  return node;
}

function isRequired(fieldDef, diagnosis) {
  if (typeof fieldDef.required === "function") return fieldDef.required(diagnosis);
  return !!fieldDef.required;
}

function isApplicable(fieldDef, diagnosis) {
  if (typeof fieldDef.condition === "function") return fieldDef.condition(diagnosis);
  return true;
}

/* ---------------------------------------------------------------------- */
/* Wrapper padrão de campo (label + ajuda + descrição de erro acessível)  */
/* ---------------------------------------------------------------------- */

function fieldWrapper(fieldDef, inputEl, opts = {}) {
  const inputId = opts.inputId || domId("f");
  const helpId = `${inputId}_help`;
  const wrapper = el("div", { class: "field" + (opts.compact ? " field--compact" : "") });

  if (fieldDef.label && !opts.noLabel) {
    const labelText = fieldDef.qNumber ? `${fieldDef.qNumber}. ${fieldDef.label}` : fieldDef.label;
    wrapper.appendChild(
      el("label", { class: "field__label", for: opts.forId || inputId }, [
        labelText,
        isRequired(fieldDef, opts.diagnosis) ? el("span", { class: "field__required", "aria-hidden": "true" }, " *") : null,
      ])
    );
  }
  if (fieldDef.help) {
    wrapper.appendChild(el("p", { class: "field__help", id: helpId }, fieldDef.help));
    if (inputEl && inputEl.setAttribute) inputEl.setAttribute("aria-describedby", helpId);
  }
  wrapper.appendChild(inputEl);
  return wrapper;
}

/* ---------------------------------------------------------------------- */
/* Campos simples                                                         */
/* ---------------------------------------------------------------------- */

function renderText(fieldDef, diagnosis, onChange, opts = {}) {
  const inputId = domId("text");
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id) || "";
  const input = el("input", {
    type: "text",
    id: inputId,
    class: "input",
    value,
    required: isRequired(fieldDef, diagnosis),
    oninput: (e) => onChange(fieldDef.id, e.target.value),
  });
  return fieldWrapper(fieldDef, input, { inputId, diagnosis, ...opts });
}

function renderNumber(fieldDef, diagnosis, onChange, opts = {}) {
  const inputId = domId("num");
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id);
  const input = el("input", {
    type: "number",
    id: inputId,
    class: "input input--number",
    value: value === undefined || value === null ? "" : value,
    min: fieldDef.min,
    max: fieldDef.max,
    required: isRequired(fieldDef, diagnosis),
    oninput: (e) => onChange(fieldDef.id, e.target.value === "" ? null : Number(e.target.value)),
  });
  return fieldWrapper(fieldDef, input, { inputId, diagnosis, ...opts });
}

function renderTextarea(fieldDef, diagnosis, onChange, opts = {}) {
  const inputId = domId("ta");
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id) || "";
  const input = el("textarea", {
    id: inputId,
    class: "input textarea",
    rows: fieldDef.rows || 3,
    required: isRequired(fieldDef, diagnosis),
    oninput: (e) => onChange(fieldDef.id, e.target.value),
  });
  input.value = value;
  return fieldWrapper(fieldDef, input, { inputId, diagnosis, ...opts });
}

function optionOtherText(fieldDef, diagnosis, onChange, selectedValues) {
  if (!fieldDef.otherFieldId) return null;
  const isOtherSelected = Array.isArray(selectedValues)
    ? selectedValues.includes("other")
    : selectedValues === "other";
  if (!isOtherSelected) return null;
  const otherValue = window.DataModel.getAnswer(diagnosis, fieldDef.otherFieldId) || "";
  return el("input", {
    type: "text",
    class: "input input--other",
    placeholder: "Especifique...",
    value: otherValue,
    "aria-label": "Especifique outro",
    oninput: (e) => onChange(fieldDef.otherFieldId, e.target.value),
  });
}

function renderSingleChoice(fieldDef, diagnosis, onChange, opts = {}) {
  const groupName = domId("radio");
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id);
  const group = el("div", { class: "choice-group", role: "radiogroup" });
  (fieldDef.options || []).forEach((opt) => {
    const optId = domId("opt");
    const wrap = el("label", { class: "choice-item", for: optId }, [
      el("input", {
        type: "radio",
        id: optId,
        name: groupName,
        value: opt.value,
        checked: value === opt.value,
        onchange: () => onChange(fieldDef.id, opt.value),
      }),
      el("span", {}, opt.label),
    ]);
    group.appendChild(wrap);
  });
  const other = optionOtherText(fieldDef, diagnosis, onChange, value);
  if (other) group.appendChild(other);
  return fieldWrapper(fieldDef, group, { noLabel: false, diagnosis, ...opts });
}

function renderMultiChoice(fieldDef, diagnosis, onChange, opts = {}) {
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id) || [];
  const group = el("div", { class: "choice-group" });
  (fieldDef.options || []).forEach((opt) => {
    const optId = domId("opt");
    const checked = value.includes(opt.value);
    const wrap = el("label", { class: "choice-item", for: optId }, [
      el("input", {
        type: "checkbox",
        id: optId,
        value: opt.value,
        checked,
        onchange: (e) => {
          const set = new Set(value);
          if (e.target.checked) set.add(opt.value);
          else set.delete(opt.value);
          onChange(fieldDef.id, [...set]);
        },
      }),
      el("span", {}, opt.label),
    ]);
    group.appendChild(wrap);
  });
  const other = optionOtherText(fieldDef, diagnosis, onChange, value);
  if (other) group.appendChild(other);
  return fieldWrapper(fieldDef, group, { diagnosis, ...opts });
}

function renderScale(fieldDef, diagnosis, onChange, opts = {}) {
  const min = fieldDef.scaleMin ?? 1;
  const max = fieldDef.scaleMax ?? 5;
  const labels = fieldDef.scaleLabels || {};
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id);
  const group = el("div", { class: "scale-group", role: "radiogroup" });
  for (let i = min; i <= max; i += 1) {
    const optId = domId("scale");
    group.appendChild(
      el("label", { class: "scale-item", for: optId, title: labels[i] || "" }, [
        el("input", {
          type: "radio",
          id: optId,
          name: domId("scale_group"),
          value: i,
          checked: value === i,
          onchange: () => onChange(fieldDef.id, i),
        }),
        el("span", {}, String(i)),
      ])
    );
  }
  const wrapper = fieldWrapper(fieldDef, group, { diagnosis, ...opts });
  if (labels[min] || labels[max]) {
    wrapper.appendChild(
      el("div", { class: "scale-endpoints" }, [
        el("span", {}, labels[min] || ""),
        el("span", {}, labels[max] || ""),
      ])
    );
  }
  return wrapper;
}

function renderConfirmation(fieldDef, diagnosis, onChange, opts = {}) {
  const options = fieldDef.options || [
    { value: "yes", label: "Sim" },
    { value: "no", label: "Não" },
    { value: "dontknow", label: "Não sabemos" },
  ];
  return renderSingleChoice({ ...fieldDef, options }, diagnosis, onChange, opts);
}

function renderMonthSelector(fieldDef, diagnosis, onChange, opts = {}) {
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id) || [];
  const group = el("div", { class: "month-selector" });
  months.forEach((m, idx) => {
    const monthNum = idx + 1;
    const checked = value.includes(monthNum);
    const optId = domId("month");
    group.appendChild(
      el("label", { class: "month-item" + (checked ? " is-selected" : ""), for: optId }, [
        el("input", {
          type: "checkbox",
          id: optId,
          checked,
          onchange: (e) => {
            const set = new Set(value);
            if (e.target.checked) set.add(monthNum);
            else set.delete(monthNum);
            onChange(fieldDef.id, [...set].sort((a, b) => a - b));
          },
        }),
        el("span", {}, m),
      ])
    );
  });
  return fieldWrapper(fieldDef, group, { diagnosis, ...opts });
}

/* Matriz: linhas x colunas, cada célula é uma escala curta ou select     */
function renderMatrix(fieldDef, diagnosis, onChange, opts = {}) {
  const rows = fieldDef.matrixRows || [];
  const cols = fieldDef.matrixCols || [];
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id) || {};

  const container = el("div", { class: "matrix" });
  const table = el("table", { class: "matrix__table" });
  const thead = el("thead", {}, [
    el("tr", {}, [
      el("th", { scope: "col" }, ""),
      ...cols.map((c) => el("th", { scope: "col" }, c.label)),
    ]),
  ]);
  table.appendChild(thead);
  const tbody = el("tbody");
  rows.forEach((row) => {
    const tr = el("tr", {}, [el("th", { scope: "row" }, row.label)]);
    cols.forEach((col) => {
      const cellValue = (value[row.value] || {})[col.value] || "";
      const select = el("select", {
        class: "input input--select",
        "aria-label": `${row.label} — ${col.label}`,
        onchange: (e) => {
          const next = { ...value, [row.value]: { ...(value[row.value] || {}), [col.value]: e.target.value } };
          onChange(fieldDef.id, next);
        },
      });
      select.appendChild(el("option", { value: "" }, "—"));
      (col.options || fieldDef.cellOptions || []).forEach((o) => {
        select.appendChild(el("option", { value: o.value, selected: cellValue === o.value }, o.label));
      });
      tr.appendChild(el("td", {}, select));
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  // versão em cards para telas pequenas (mesmos controles, layout vertical)
  const cardsView = el("div", { class: "matrix__cards" });
  rows.forEach((row) => {
    const card = el("div", { class: "matrix-card" }, [el("h4", {}, row.label)]);
    cols.forEach((col) => {
      const cellValue = (value[row.value] || {})[col.value] || "";
      const select = el("select", {
        class: "input input--select",
        "aria-label": `${row.label} — ${col.label}`,
        onchange: (e) => {
          const next = { ...value, [row.value]: { ...(value[row.value] || {}), [col.value]: e.target.value } };
          onChange(fieldDef.id, next);
        },
      });
      select.appendChild(el("option", { value: "" }, "—"));
      (col.options || fieldDef.cellOptions || []).forEach((o) => {
        select.appendChild(el("option", { value: o.value, selected: cellValue === o.value }, o.label));
      });
      card.appendChild(el("div", { class: "matrix-card__row" }, [el("label", {}, col.label), select]));
    });
    cardsView.appendChild(card);
  });
  container.appendChild(cardsView);

  return fieldWrapper(fieldDef, container, { diagnosis, ...opts });
}

/* Tabela dinâmica: linhas livres com colunas fixas (ex.: impacto econômico)*/
function renderDynamicTable(fieldDef, diagnosis, onChange, opts = {}) {
  const columns = fieldDef.columns || [];
  const rows = window.DataModel.getAnswer(diagnosis, fieldDef.id) || [];
  const container = el("div", { class: "dynamic-table" });

  rows.forEach((row, rowIdx) => {
    const rowEl = el("div", { class: "dynamic-table__row" });
    columns.forEach((col) => {
      const cellId = domId("dt");
      let input;
      if (col.type === "select") {
        input = el("select", {
          class: "input input--select",
          id: cellId,
          onchange: (e) => {
            const next = rows.map((r, i) => (i === rowIdx ? { ...r, [col.key]: e.target.value } : r));
            onChange(fieldDef.id, next);
          },
        });
        input.appendChild(el("option", { value: "" }, "—"));
        (col.options || []).forEach((o) =>
          input.appendChild(el("option", { value: o.value, selected: row[col.key] === o.value }, o.label))
        );
      } else {
        input = el("input", {
          type: "text",
          id: cellId,
          class: "input",
          value: row[col.key] || "",
          placeholder: col.label,
          oninput: (e) => {
            const next = rows.map((r, i) => (i === rowIdx ? { ...r, [col.key]: e.target.value } : r));
            onChange(fieldDef.id, next);
          },
        });
      }
      rowEl.appendChild(el("div", { class: "dynamic-table__cell" }, [el("label", { for: cellId }, col.label), input]));
    });
    rowEl.appendChild(
      el("button", {
        type: "button",
        class: "btn btn--ghost btn--small",
        "aria-label": "Remover linha",
        onclick: () => onChange(fieldDef.id, rows.filter((_, i) => i !== rowIdx)),
      }, "Remover")
    );
    container.appendChild(rowEl);
  });

  container.appendChild(
    el("button", {
      type: "button",
      class: "btn btn--secondary btn--small",
      onclick: () => {
        const blank = {};
        columns.forEach((c) => (blank[c.key] = ""));
        onChange(fieldDef.id, [...rows, blank]);
      },
    }, `+ Adicionar ${fieldDef.itemLabel || "linha"}`)
  );

  return fieldWrapper(fieldDef, container, { diagnosis, ...opts });
}

/* Grupo repetível genérico: lista de objetos com sub-campos definidos    */
function renderRepeatableGroup(fieldDef, diagnosis, onChange, opts = {}) {
  const items = window.DataModel.getAnswer(diagnosis, fieldDef.id) || [];
  const container = el("div", { class: "repeatable-group" });

  items.forEach((item, idx) => {
    const card = el("div", { class: "repeatable-group__item" });
    (fieldDef.subFields || []).forEach((sub) => {
      const subId = domId("rg");
      let input;
      if (sub.type === "select") {
        input = el("select", {
          id: subId,
          class: "input input--select",
          onchange: (e) => {
            const next = items.map((it, i) => (i === idx ? { ...it, [sub.key]: e.target.value } : it));
            onChange(fieldDef.id, next);
          },
        });
        input.appendChild(el("option", { value: "" }, "—"));
        (sub.options || []).forEach((o) =>
          input.appendChild(el("option", { value: o.value, selected: item[sub.key] === o.value }, o.label))
        );
      } else if (sub.type === "textarea") {
        input = el("textarea", {
          id: subId,
          class: "input textarea",
          rows: 2,
          oninput: (e) => {
            const next = items.map((it, i) => (i === idx ? { ...it, [sub.key]: e.target.value } : it));
            onChange(fieldDef.id, next);
          },
        });
        input.value = item[sub.key] || "";
      } else {
        input = el("input", {
          type: "text",
          id: subId,
          class: "input",
          value: item[sub.key] || "",
          oninput: (e) => {
            const next = items.map((it, i) => (i === idx ? { ...it, [sub.key]: e.target.value } : it));
            onChange(fieldDef.id, next);
          },
        });
      }
      card.appendChild(el("div", { class: "field field--compact" }, [el("label", { for: subId }, sub.label), input]));
    });
    card.appendChild(
      el("button", {
        type: "button",
        class: "btn btn--ghost btn--small",
        onclick: () => onChange(fieldDef.id, items.filter((_, i) => i !== idx)),
      }, `Remover ${fieldDef.itemLabel || "item"}`)
    );
    container.appendChild(card);
  });

  container.appendChild(
    el("button", {
      type: "button",
      class: "btn btn--secondary btn--small",
      onclick: () => {
        const blank = {};
        (fieldDef.subFields || []).forEach((s) => (blank[s.key] = ""));
        onChange(fieldDef.id, [...items, blank]);
      },
    }, `+ Adicionar ${fieldDef.itemLabel || "item"}`)
  );

  return fieldWrapper(fieldDef, container, { diagnosis, ...opts });
}

/* Upload de arquivo (fotos, cartografia) via attachmentService            */
function renderFileUpload(fieldDef, diagnosis, onChange, opts = {}) {
  const currentId = window.DataModel.getAnswer(diagnosis, fieldDef.id);
  const container = el("div", { class: "file-upload" });
  const status = el("div", { class: "file-upload__status" });

  function renderPreview() {
    status.innerHTML = "";
    if (!currentId) {
      status.appendChild(el("span", { class: "muted" }, "Nenhum arquivo selecionado."));
      return;
    }
    window.attachmentService.getFile(currentId).then((record) => {
      status.innerHTML = "";
      if (!record) return;
      if (record.type && record.type.startsWith("image/")) {
        status.appendChild(el("img", { src: record.dataUrl, alt: `Prévia de ${record.name}`, class: "file-upload__preview" }));
      }
      status.appendChild(el("span", {}, record.name));
      status.appendChild(
        el("button", {
          type: "button",
          class: "btn btn--ghost btn--small",
          onclick: () => onChange(fieldDef.id, null),
        }, "Remover")
      );
    });
  }

  const input = el("input", {
    type: "file",
    accept: fieldDef.accept || "image/jpeg,image/png",
    class: "input input--file",
    onchange: async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const id = await window.attachmentService.saveFile(file);
        onChange(fieldDef.id, id);
      } catch (err) {
        alert(err.message);
      }
    },
  });

  container.appendChild(input);
  container.appendChild(status);
  renderPreview();

  return fieldWrapper(fieldDef, container, { diagnosis, ...opts });
}

/* Seletor de evidências existentes (+ atalho para criar nova)             */
function renderEvidenceSelector(fieldDef, diagnosis, onChange, opts = {}) {
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id) || [];
  const container = el("div", { class: "evidence-selector" });
  if (diagnosis.evidence.length === 0) {
    container.appendChild(el("p", { class: "muted" }, "Nenhuma evidência registrada ainda."));
  }
  diagnosis.evidence.forEach((ev) => {
    const optId = domId("evid");
    container.appendChild(
      el("label", { class: "choice-item", for: optId }, [
        el("input", {
          type: "checkbox",
          id: optId,
          checked: value.includes(ev.evidenceId),
          onchange: (e) => {
            const set = new Set(value);
            if (e.target.checked) set.add(ev.evidenceId);
            else set.delete(ev.evidenceId);
            onChange(fieldDef.id, [...set]);
          },
        }),
        el("span", {}, `${ev.description || "(sem descrição)"} — ${ev.type || ""}`),
      ])
    );
  });
  return fieldWrapper(fieldDef, container, { diagnosis, ...opts });
}

/* Seletor de atores já cadastrados                                       */
function renderActorSelector(fieldDef, diagnosis, onChange, opts = {}) {
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id) || [];
  const container = el("div", { class: "actor-selector" });
  if (diagnosis.actors.length === 0) {
    container.appendChild(el("p", { class: "muted" }, "Nenhum ator cadastrado ainda (etapa Participação e Redes)."));
  }
  diagnosis.actors.forEach((actor) => {
    const optId = domId("actor");
    container.appendChild(
      el("label", { class: "choice-item", for: optId }, [
        el("input", {
          type: "checkbox",
          id: optId,
          checked: value.includes(actor.actorId),
          onchange: (e) => {
            const set = new Set(value);
            if (e.target.checked) set.add(actor.actorId);
            else set.delete(actor.actorId);
            onChange(fieldDef.id, [...set]);
          },
        }),
        el("span", {}, actor.name || "(ator sem nome)"),
      ])
    );
  });
  return fieldWrapper(fieldDef, container, { diagnosis, ...opts });
}

/* Escolha ordenada (ranking) de até N itens de uma lista                  */
function renderRankedChoice(fieldDef, diagnosis, onChange, opts = {}) {
  const items = fieldDef.items || [];
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id) || [];
  const max = fieldDef.maxItems || 3;
  const container = el("div", { class: "ranked-choice" });

  items.forEach((item) => {
    const order = value.indexOf(item.value) + 1;
    const row = el("div", { class: "ranked-choice__item" + (order ? " is-ranked" : "") });
    row.appendChild(el("span", { class: "ranked-choice__label" }, item.label));
    row.appendChild(
      el("button", {
        type: "button",
        class: "btn btn--small " + (order ? "btn--secondary" : "btn--outline"),
        disabled: !order && value.length >= max,
        onclick: () => {
          let next;
          if (order) next = value.filter((v) => v !== item.value);
          else next = [...value, item.value];
          onChange(fieldDef.id, next);
        },
      }, order ? `#${order} — remover` : "Selecionar")
    );
    container.appendChild(row);
  });
  return fieldWrapper(fieldDef, container, { diagnosis, ...opts });
}

/* Escolha relacional: para cada item selecionado alhures, define um tipo
   de relação (ex.: TER_ELEMENT_RELATION, NET_ACTOR_RELATIONSHIP)         */
function renderRelationalChoice(fieldDef, diagnosis, onChange, opts = {}) {
  const sourceItems = fieldDef.sourceItems ? fieldDef.sourceItems(diagnosis) : [];
  const value = window.DataModel.getAnswer(diagnosis, fieldDef.id) || {};
  const container = el("div", { class: "relational-choice" });
  if (sourceItems.length === 0) {
    container.appendChild(el("p", { class: "muted" }, fieldDef.emptyMessage || "Nada selecionado ainda."));
  }
  sourceItems.forEach((item) => {
    const row = el("div", { class: "relational-choice__row" }, [el("span", { class: "relational-choice__item" }, item.label)]);
    const group = el("div", { class: "choice-group choice-group--inline" });
    (fieldDef.options || []).forEach((opt) => {
      const optId = domId("rel");
      group.appendChild(
        el("label", { class: "choice-item choice-item--small", for: optId }, [
          el("input", {
            type: "radio",
            id: optId,
            name: domId(`rel_${item.value}`),
            checked: value[item.value] === opt.value,
            onchange: () => onChange(fieldDef.id, { ...value, [item.value]: opt.value }),
          }),
          el("span", {}, opt.label),
        ])
      );
    });
    row.appendChild(group);
    container.appendChild(row);
  });
  return fieldWrapper(fieldDef, container, { diagnosis, ...opts });
}

/* ---------------------------------------------------------------------- */
/* Construtor de evidências, reutilizável em qualquer etapa (seção 13)    */
/* ---------------------------------------------------------------------- */

const EVIDENCE_TYPE_OPTIONS = [
  { value: "observation", label: "Observação direta" },
  { value: "document", label: "Documento" },
  { value: "photo", label: "Foto" },
  { value: "testimony", label: "Depoimento" },
  { value: "record", label: "Registro histórico" },
  { value: "other", label: "Outra" },
];

function renderEvidenceBuilder(diagnosis, opts) {
  const { stage, dimension, title } = opts;
  const wrap = el("div", { class: "evidence-builder" });
  wrap.appendChild(el("h3", { class: "evidence-builder__title" }, title || "Evidências desta etapa"));
  wrap.appendChild(
    el("p", { class: "field__help" }, "Evidências sustentam análises futuras (problemas, prioridades, plano de ação). Registrar não é obrigatório para todo campo, mas fortalece a rastreabilidade do diagnóstico.")
  );

  const existing = diagnosis.evidence.filter((e) => e.stage === stage && (!dimension || e.dimension === dimension));
  if (existing.length > 0) {
    const list = el("div", { class: "evidence-builder__list" });
    existing.forEach((ev) => {
      const card = EvidenceCard(ev);
      card.appendChild(
        el("button", {
          type: "button",
          class: "btn btn--ghost btn--small",
          onclick: () => window.App.mutate((d) => {
            d.evidence = d.evidence.filter((e) => e.evidenceId !== ev.evidenceId);
          }),
        }, "Remover")
      );
      list.appendChild(card);
    });
    wrap.appendChild(list);
  }

  let draft = { type: "", description: "" };
  const typeSelect = el("select", { class: "input input--select", "aria-label": "Tipo de evidência" });
  typeSelect.appendChild(el("option", { value: "" }, "Tipo de evidência..."));
  EVIDENCE_TYPE_OPTIONS.forEach((o) => typeSelect.appendChild(el("option", { value: o.value }, o.label)));
  typeSelect.addEventListener("change", (e) => (draft.type = e.target.value));

  const descInput = el("textarea", { class: "input textarea", rows: 2, placeholder: "Descreva a evidência..." });
  descInput.addEventListener("input", (e) => (draft.description = e.target.value));

  let pendingFileId = null;
  const fileInput = el("input", {
    type: "file",
    accept: "image/jpeg,image/png,.pdf,.doc,.docx,.txt",
    class: "input input--file",
    onchange: async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        pendingFileId = await window.attachmentService.saveFile(file);
      } catch (err) {
        alert(err.message);
      }
    },
  });

  const addBtn = el("button", {
    type: "button",
    class: "btn btn--secondary btn--small",
    onclick: () => {
      if (!draft.type && !draft.description) {
        alert("Informe ao menos o tipo ou a descrição da evidência.");
        return;
      }
      window.App.mutate((d) => {
        d.evidence.push(
          window.DataModel.createEvidence({
            stage,
            dimension,
            type: draft.type || "other",
            description: draft.description,
            file: pendingFileId,
          })
        );
      });
    },
  }, "+ Adicionar evidência");

  wrap.appendChild(el("div", { class: "evidence-builder__form" }, [typeSelect, descInput, fileInput, addBtn]));
  return wrap;
}

function renderSummaryCard(title, lines, opts = {}) {
  const card = el("div", { class: "summary-card" + (opts.tone ? ` summary-card--${opts.tone}` : "") });
  card.appendChild(el("h4", {}, title));
  const list = el("ul", { class: "summary-card__list" });
  lines.forEach((line) => list.appendChild(el("li", {}, line)));
  card.appendChild(list);
  return card;
}

/* ---------------------------------------------------------------------- */
/* Despachante genérico                                                   */
/* ---------------------------------------------------------------------- */

const FIELD_RENDERERS = {
  text: renderText,
  number: renderNumber,
  textarea: renderTextarea,
  singleChoice: renderSingleChoice,
  multiChoice: renderMultiChoice,
  scale: renderScale,
  confirmation: renderConfirmation,
  monthSelector: renderMonthSelector,
  matrix: renderMatrix,
  dynamicTable: renderDynamicTable,
  repeatableGroup: renderRepeatableGroup,
  fileUpload: renderFileUpload,
  evidenceSelector: renderEvidenceSelector,
  actorSelector: renderActorSelector,
  rankedChoice: renderRankedChoice,
  relationalChoice: renderRelationalChoice,
};

function renderField(fieldDef, diagnosis, onChange) {
  if (!isApplicable(fieldDef, diagnosis)) return null;
  const renderer = FIELD_RENDERERS[fieldDef.type];
  if (!renderer) {
    console.warn(`Tipo de campo não implementado: ${fieldDef.type} (${fieldDef.id})`);
    return null;
  }
  const node = renderer(fieldDef, diagnosis, onChange);
  node.dataset.fieldId = fieldDef.id;
  return node;
}

/* ---------------------------------------------------------------------- */
/* Cards conceituais (resumo visual, com tom por criticidade quando cabe) */
/* ---------------------------------------------------------------------- */

function AlertCard(alert) {
  return el("div", { class: `alert-card alert-card--${alert.type}`, role: alert.type === "critical" ? "alert" : "status" }, [
    el("span", { class: "alert-card__badge" }, alertTypeLabel(alert.type)),
    el("p", {}, alert.message),
  ]);
}

function alertTypeLabel(type) {
  return { info: "Informação", reflection: "Reflexão", missing: "Pendência", coherence: "Coerência", critical: "Atenção" }[type] || type;
}

function KnowledgeGapCard(gap) {
  return el("div", { class: "gap-card" }, [
    el("span", { class: "gap-card__badge" }, "Não sabemos"),
    el("p", {}, gap.description),
    gap.suggestedSources && gap.suggestedSources.length
      ? el("p", { class: "muted" }, `Fontes sugeridas: ${gap.suggestedSources.join(", ")}`)
      : null,
  ]);
}

function EvidenceCard(evidence) {
  return el("div", { class: "evidence-card" }, [
    el("span", { class: "evidence-card__type" }, evidence.type || "evidência"),
    el("p", {}, evidence.description || "(sem descrição)"),
  ]);
}

function RiskCard(risk) {
  return el("div", { class: "risk-card" }, [
    el("h4", {}, risk.riskType || "Ameaça"),
    el("p", {}, `Já ocorreu: ${risk.occurredBefore || "não informado"}`),
    risk.attentionSignal
      ? el("span", { class: `signal signal--${risk.attentionSignal}` }, signalLabel(risk.attentionSignal))
      : null,
  ]);
}

function signalLabel(signal) {
  return { low_signal: "sinal baixo", moderate_signal: "sinal moderado", high_signal: "sinal alto" }[signal] || signal;
}

function ActorCard(actor) {
  return el("div", { class: "actor-card" }, [
    el("h4", {}, actor.name || "(sem nome)"),
    el("p", {}, `Relação: ${actor.relationshipLevel || "não informado"}`),
  ]);
}

function SWOTCard(item) {
  return el("div", { class: `swot-card swot-card--${item.category}` }, [
    el("p", {}, item.label),
    item.systemSuggested && !item.userConfirmed ? el("span", { class: "swot-card__tag" }, "sugestão — confirmar") : null,
  ]);
}

function PriorityCard(priority, problem) {
  return el("div", { class: "priority-card" }, [
    el("h4", {}, `#${priority.order} ${problem ? problem.title : ""}`),
    el("p", {}, priority.justification || ""),
  ]);
}

function ActionPlanCard(plan) {
  return el("div", { class: "action-plan-card" }, [
    el("h4", {}, plan.objective || "(objetivo não definido)"),
    el("p", {}, plan.problemStatement || ""),
  ]);
}

function IndicatorCard(indicator) {
  return el("div", { class: "indicator-card" }, [
    el("h4", {}, indicator.name || "(indicador sem nome)"),
    el("p", {}, `Linha de base: ${indicator.baselineUnknown ? "desconhecida" : indicator.baseline || "—"}`),
  ]);
}

window.Components = {
  el,
  domId,
  renderField,
  renderSummaryCard,
  renderEvidenceBuilder,
  isApplicable,
  isRequired,
  AlertCard,
  KnowledgeGapCard,
  EvidenceCard,
  RiskCard,
  ActorCard,
  SWOTCard,
  PriorityCard,
  ActionPlanCard,
  IndicatorCard,
};
