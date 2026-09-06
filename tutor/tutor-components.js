"use strict";
/**
 * tutor-components.js
 * Biblioteca de componentes de UI do Caderno do Tutor.
 *
 * Convenção de autoria (seção 3): todo componente que exibe dado do
 * diagnóstico do cursista é somente leitura (ReadOnlyField e afins nunca
 * recebem `onChange`). Todo componente que grava algo grava exclusivamente
 * em `tutorNotebook` via as funções de window.TutorDataModel.
 */

/**
 * Preservação de foco (correção arquitetural): toda a árvore é reconstruída
 * a cada mutação (ver tutor-app.js#render — innerHTML="" seguido de nova
 * renderização), o que por padrão destruiria o elemento focado a cada
 * tecla digitada em qualquer campo de texto, perdendo o foco após o
 * primeiro caractere. Campos de texto/textarea/select relevantes recebem
 * um atributo `data-focus-key` estável; capturamos o foco (e a posição do
 * cursor) antes de recriar o DOM e o restauramos depois.
 */
function captureFocus() {
  const active = document.activeElement;
  if (!active || !active.getAttribute) return null;
  const key = active.getAttribute("data-focus-key");
  if (!key) return null;
  return {
    key,
    selectionStart: typeof active.selectionStart === "number" ? active.selectionStart : null,
    selectionEnd: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
  };
}

function restoreFocus(snapshot) {
  if (!snapshot) return;
  let target = null;
  try {
    target = document.querySelector(`[data-focus-key="${CSS.escape(snapshot.key)}"]`);
  } catch (err) {
    target = null;
  }
  if (!target) return;
  target.focus();
  if (snapshot.selectionStart !== null && typeof target.setSelectionRange === "function") {
    try {
      target.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
    } catch (err) {
      /* alguns tipos de input não suportam seleção — ignora silenciosamente */
    }
  }
}

let tutorFieldSeq = 0;
function tdomId(prefix) {
  tutorFieldSeq += 1;
  return `t${prefix}_${tutorFieldSeq}`;
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

/* ---------------------------------------------------------------------- */
/* Leitura do diagnóstico do cursista — sempre somente leitura            */
/* ---------------------------------------------------------------------- */

function formatValue(value, labelMap) {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.map((v) => (labelMap && labelMap[v]) || v).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return (labelMap && labelMap[value]) || String(value);
}

/** Campo somente-leitura de uma resposta do cursista. Distingue "não
 * respondido" (legítimo — inclusive "não sabemos") de "não disponível
 * nesta versão importada" (seção do instrumento ausente — seção 70). */
function ReadOnlyField(label, fieldReadResult, opts = {}) {
  const wrap = el("div", { class: "ro-field" });
  wrap.appendChild(el("p", { class: "ro-field__label" }, label));
  const { available, value } = fieldReadResult;
  let display;
  if (!available) {
    display = el("p", { class: "ro-field__value ro-field__value--unavailable" }, "Esta informação não está disponível na versão importada.");
  } else {
    const formatted = formatValue(value, opts.labelMap);
    display = formatted
      ? el("p", { class: "ro-field__value" }, formatted)
      : el("p", { class: "ro-field__value ro-field__value--empty" }, "Não respondido.");
  }
  wrap.appendChild(display);
  return wrap;
}

function ReadOnlyText(label, text) {
  const wrap = el("div", { class: "ro-field" });
  wrap.appendChild(el("p", { class: "ro-field__label" }, label));
  wrap.appendChild(
    text && String(text).trim()
      ? el("p", { class: "ro-field__value" }, text)
      : el("p", { class: "ro-field__value ro-field__value--empty" }, "Não respondido.")
  );
  return wrap;
}

function ReadOnlySection(title, children) {
  const section = el("section", { class: "ro-section" }, [el("h4", { class: "ro-section__title" }, title)]);
  (Array.isArray(children) ? children : [children]).forEach((c) => c && section.appendChild(c));
  return section;
}

function EvidenceBadge(evidence) {
  if (!evidence) return el("span", { class: "evidence-badge evidence-badge--missing" }, "evidência não encontrada");
  return el("span", { class: "evidence-badge", title: evidence.description || "" }, [
    el("span", { class: "evidence-badge__type" }, evidence.type || "evidência"),
    el("span", {}, evidence.description ? ` — ${evidence.description.slice(0, 60)}${evidence.description.length > 60 ? "…" : ""}` : ""),
  ]);
}

/** @param ctx opcional — quando fornecido, cada evidência ganha um bloco
 * de comentário próprio (relatedObjectType "evidence"), permitindo ao
 * tutor perguntar/comentar diretamente sobre uma evidência específica
 * (seção 75: comentários devem poder apontar para "evidence"). */
function EvidenceList(diagnosis, evidenceIds, ctx) {
  const ids = evidenceIds || [];
  if (ids.length === 0) {
    return el("p", { class: "muted" }, "Nenhuma evidência vinculada.");
  }
  const wrap = el("div", { class: "evidence-list" });
  ids.forEach((id) => {
    const ev = (diagnosis.evidence || []).find((e) => e.evidenceId === id);
    if (!ctx) {
      wrap.appendChild(EvidenceBadge(ev));
      return;
    }
    const item = el("span", { class: "evidence-list__item" }, [EvidenceBadge(ev)]);
    const commentBlock = ItemCommentBlock(ctx, "evidence", id, { compact: true });
    if (commentBlock) item.appendChild(commentBlock);
    wrap.appendChild(item);
  });
  return wrap;
}

/* ---------------------------------------------------------------------- */
/* Campo de avaliação do tutor — select de enum fechado + comentário      */
/* ---------------------------------------------------------------------- */

/**
 * @param def {id, label, help, options:[{value,label}], commentLabel}
 * @param currentValue string|undefined
 * @param currentComment string|undefined
 * @param onChangeValue (value) => void
 * @param onChangeComment (text) => void
 */
function TutorRatingField(def, currentValue, currentComment, onChangeValue, onChangeComment) {
  const selectId = tdomId("rating");
  const baseKey = def.focusKey || def.id;
  const wrap = el("div", { class: "tutor-field" });
  wrap.appendChild(el("label", { class: "tutor-field__label", for: selectId }, def.label));
  if (def.help) wrap.appendChild(el("p", { class: "field__help" }, def.help));

  const select = el("select", {
    id: selectId,
    class: "input input--select",
    "data-focus-key": `${baseKey}::select`,
    onchange: (e) => onChangeValue(e.target.value || null),
  });
  select.appendChild(el("option", { value: "" }, "Selecione..."));
  def.options.forEach((opt) => {
    select.appendChild(el("option", { value: opt.value, selected: currentValue === opt.value }, opt.label));
  });
  wrap.appendChild(select);

  if (onChangeComment) {
    const taId = tdomId("comment");
    const ta = el("textarea", {
      id: taId,
      class: "input textarea",
      rows: 2,
      placeholder: def.commentLabel || "Comentário (opcional)",
      "data-focus-key": `${baseKey}::comment`,
      oninput: (e) => onChangeComment(e.target.value),
    });
    ta.value = currentComment || "";
    wrap.appendChild(el("label", { for: taId, class: "field__help" }, def.commentLabel || "Comentário"));
    wrap.appendChild(ta);
  }
  return wrap;
}

function TutorTextField(def, currentValue, onChange) {
  const id = tdomId("text");
  const wrap = el("div", { class: "tutor-field" });
  wrap.appendChild(el("label", { class: "tutor-field__label", for: id }, def.label));
  if (def.help) wrap.appendChild(el("p", { class: "field__help" }, def.help));
  const ta = el("textarea", {
    id, class: "input textarea", rows: def.rows || 3,
    "data-focus-key": def.focusKey || def.id,
    oninput: (e) => onChange(e.target.value),
  });
  ta.value = currentValue || "";
  wrap.appendChild(ta);
  return wrap;
}

/* ---------------------------------------------------------------------- */
/* Alertas — banner com controle de status (nunca conclusão automática)   */
/* ---------------------------------------------------------------------- */

const ALERT_TYPE_LABEL = { information: "Informação", reflection: "Reflexão", attention: "Atenção", revision: "Revisão", critical: "Crítico" };
const ALERT_STATUS_LABEL = { open: "Em aberto", acknowledged: "Reconhecido", resolved: "Resolvido", not_relevant: "Não pertinente" };

function AlertBanner(alert, { onStatusChange, onCommentChange, locked }) {
  const banner = el("div", { class: `tutor-alert tutor-alert--${alert.type} is-${alert.status}`, role: alert.type === "critical" ? "alert" : "status" });
  banner.appendChild(el("div", { class: "tutor-alert__head" }, [
    el("span", { class: "tutor-alert__badge" }, ALERT_TYPE_LABEL[alert.type] || alert.type),
    el("span", { class: "tutor-alert__status" }, ALERT_STATUS_LABEL[alert.status] || alert.status),
  ]));
  banner.appendChild(el("p", { class: "tutor-alert__message" }, alert.message));
  banner.appendChild(el("p", { class: "tutor-alert__hint" }, "Este alerta apenas indica um ponto a observar — a interpretação pedagógica é sua."));

  if (!locked) {
    const controls = el("div", { class: "tutor-alert__controls" });
    ["acknowledged", "resolved", "not_relevant"].forEach((status) => {
      controls.appendChild(
        el("button", {
          type: "button",
          class: "btn btn--small " + (alert.status === status ? "btn--secondary" : "btn--outline"),
          onclick: () => onStatusChange(status),
        }, ALERT_STATUS_LABEL[status])
      );
    });
    if (alert.status !== "open") {
      controls.appendChild(
        el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => onStatusChange("open") }, "Reabrir")
      );
    }
    banner.appendChild(controls);

    const commentId = tdomId("alertcomment");
    const ta = el("textarea", {
      id: commentId, class: "input textarea", rows: 2, placeholder: "Registre aqui o significado pedagógico deste alerta...",
      "data-focus-key": `alert::${alert.alertId}::comment`,
      oninput: (e) => onCommentChange(e.target.value),
    });
    ta.value = alert.tutorComment || "";
    banner.appendChild(el("label", { for: commentId, class: "field__help" }, "Seu registro sobre este alerta"));
    banner.appendChild(ta);
  } else if (alert.tutorComment) {
    banner.appendChild(el("p", { class: "tutor-alert__locked-comment" }, `Registro do tutor: ${alert.tutorComment}`));
  }
  return banner;
}

/** Fábrica padrão de handlers para AlertList a partir de um ctx de etapa
 * (ver tutor-app.js#buildCtx) — evita repetir a assinatura (alertId,valor)
 * em cada arquivo de etapa. */
function alertHandlersFromCtx(ctx) {
  return {
    locked: ctx.locked,
    onStatusChange: (alertId, status) => ctx.setAlertStatus(alertId, status),
    onCommentChange: (alertId, text) => ctx.setAlertComment(alertId, text),
  };
}

function AlertList(alerts, handlers) {
  if (alerts.length === 0) return null;
  const wrap = el("div", { class: "tutor-alert-list" });
  alerts.forEach((a) => wrap.appendChild(AlertBanner(a, {
    locked: handlers.locked,
    onStatusChange: (status) => handlers.onStatusChange(a.alertId, status),
    onCommentChange: (text) => handlers.onCommentChange(a.alertId, text),
  })));
  return wrap;
}

/* ---------------------------------------------------------------------- */
/* Cadeia de rastreabilidade (seção 34)                                   */
/* ---------------------------------------------------------------------- */

function TutorTraceabilityChain(steps) {
  const wrap = el("div", { class: "traceability-chain" });
  steps.forEach((step, idx) => {
    wrap.appendChild(el("div", { class: "traceability-chain__node" + (step.missing ? " is-missing" : "") }, [
      el("span", { class: "traceability-chain__label" }, step.label),
      el("span", { class: "traceability-chain__value" }, step.value || (step.missing ? "não encontrado" : "—")),
    ]));
    if (idx < steps.length - 1) wrap.appendChild(el("span", { class: "traceability-chain__arrow", "aria-hidden": "true" }, "↓"));
  });
  return wrap;
}

/* ---------------------------------------------------------------------- */
/* Comentários e perguntas devolutivas (seções 51-52)                     */
/* ---------------------------------------------------------------------- */

const COMMENT_TYPE_LABEL = { recognition: "Reconhecimento", question: "Pergunta", suggestion: "Sugestão", revision_request: "Pedido de revisão", attention: "Atenção" };

function CommentThread({ comments, questions, locked, onAddComment, onAddQuestion, onResolveQuestion, questionBank }) {
  const wrap = el("div", { class: "comment-thread" });

  if (comments.length > 0 || questions.length > 0) {
    const list = el("div", { class: "comment-thread__list" });
    comments.forEach((c) => {
      list.appendChild(el("div", { class: `comment-item comment-item--${c.type}` }, [
        el("span", { class: "comment-item__badge" }, COMMENT_TYPE_LABEL[c.type] || c.type),
        el("span", { class: "comment-item__visibility" }, c.visibility === "tutor_only" ? "(apenas tutor)" : "(visível ao cursista)"),
        el("p", {}, c.text),
      ]));
    });
    questions.forEach((q) => {
      list.appendChild(el("div", { class: "comment-item comment-item--question" }, [
        el("span", { class: "comment-item__badge" }, "Pergunta devolutiva"),
        el("span", { class: "comment-item__status" }, q.status === "resolved" ? "Resolvida" : q.status === "answered" ? "Respondida" : "Em aberto"),
        el("p", {}, q.text),
        !locked && q.status !== "resolved"
          ? el("button", { type: "button", class: "btn btn--ghost btn--small", onclick: () => onResolveQuestion(q.questionId) }, "Marcar como resolvida")
          : null,
      ]));
    });
    wrap.appendChild(list);
  }

  if (locked) {
    wrap.appendChild(el("p", { class: "muted" }, "Esta revisão está encerrada. Comentários e perguntas ficam preservados no histórico."));
    return wrap;
  }

  let draftComment = { type: "suggestion", text: "", visibility: "student_visible" };
  const typeSelect = el("select", { class: "input input--select", "aria-label": "Tipo de comentário" });
  Object.entries(COMMENT_TYPE_LABEL).forEach(([value, label]) => typeSelect.appendChild(el("option", { value, selected: value === "suggestion" }, label)));
  typeSelect.addEventListener("change", (e) => (draftComment.type = e.target.value));

  const visSelect = el("select", { class: "input input--select", "aria-label": "Visibilidade" }, [
    el("option", { value: "student_visible" }, "Visível ao cursista"),
    el("option", { value: "tutor_only" }, "Apenas para o tutor"),
  ]);
  visSelect.addEventListener("change", (e) => (draftComment.visibility = e.target.value));

  const textArea = el("textarea", { class: "input textarea", rows: 2, placeholder: "Escreva um comentário..." });
  textArea.addEventListener("input", (e) => (draftComment.text = e.target.value));

  const addCommentBtn = el("button", {
    type: "button", class: "btn btn--secondary btn--small",
    onclick: () => {
      if (!draftComment.text.trim()) return;
      onAddComment({ ...draftComment });
      textArea.value = "";
      draftComment = { ...draftComment, text: "" };
    },
  }, "+ Adicionar comentário");

  wrap.appendChild(el("div", { class: "comment-thread__form" }, [typeSelect, visSelect, textArea, addCommentBtn]));

  if (onAddQuestion) {
    let selectedBank = "";
    let customText = "";
    const bankSelect = el("select", { class: "input input--select", "aria-label": "Banco de perguntas devolutivas" });
    bankSelect.appendChild(el("option", { value: "" }, "Escolher do banco de perguntas (editável)..."));
    (questionBank || []).forEach((q) => bankSelect.appendChild(el("option", { value: q }, q)));
    const qText = el("textarea", { class: "input textarea", rows: 2, placeholder: "Pergunta devolutiva (edite livremente antes de salvar)" });
    bankSelect.addEventListener("change", (e) => {
      selectedBank = e.target.value;
      if (selectedBank) {
        qText.value = selectedBank;
        customText = selectedBank;
      }
    });
    qText.addEventListener("input", (e) => (customText = e.target.value));
    const addQBtn = el("button", {
      type: "button", class: "btn btn--outline btn--small",
      onclick: () => {
        if (!customText.trim()) return;
        onAddQuestion(customText);
        qText.value = "";
        customText = "";
        bankSelect.value = "";
      },
    }, "+ Registrar pergunta devolutiva");
    wrap.appendChild(el("div", { class: "comment-thread__form comment-thread__form--question" }, [bankSelect, qText, addQBtn]));
  }

  return wrap;
}

/**
 * Bloco compacto de comentários/perguntas ligado a um item específico do
 * diagnóstico (um risco, uma prioridade, uma ação...) — seção 75:
 * "todo comentário deve poder apontar para" um objeto de origem, não
 * apenas para a etapa como um todo. `relatedObjectType` é um dos valores
 * de reviewReference.sourceType (question|answer|evidence|risk|problem|
 * priority|action|indicator|stage), estendido aqui com "swot" e
 * "communication" para cobrir objetos do diagnóstico não antecipados
 * nominalmente na especificação (decisão técnica, sem impacto pedagógico).
 */
function ItemCommentBlock(ctx, relatedObjectType, itemId, opts = {}) {
  const comments = ctx.commentsFor(itemId);
  const questions = ctx.questionsFor(itemId);
  if (ctx.locked && comments.length === 0 && questions.length === 0) return null;
  const details = el("details", { class: "item-comment-block" + (opts.compact ? " item-comment-block--compact" : "") });
  const count = comments.length + questions.length;
  const label = opts.label || (opts.compact ? "Comentar" : "Comentários e perguntas deste item");
  details.appendChild(el("summary", {}, count ? `${label} (${count})` : label));
  details.appendChild(CommentThread({
    comments,
    questions,
    locked: ctx.locked,
    questionBank: opts.questionBank !== false ? ctx.questionBank : null,
    onAddComment: (c) => ctx.addComment(c, relatedObjectType, itemId),
    onAddQuestion: (text) => ctx.addQuestion(text, relatedObjectType, itemId),
    onResolveQuestion: ctx.resolveQuestion,
  }));
  return details;
}

/* ---------------------------------------------------------------------- */
/* Lacunas de conhecimento (seção 44) — o tutor classifica, nunca resolve  */
/* a lacuna por conta própria nem a remove do registro.                   */
/* ---------------------------------------------------------------------- */

const GAP_STATUS_OPTIONS = [
  { value: "accepted", label: "Pode permanecer registrada" },
  { value: "needs_investigation", label: "Necessária antes da definição da ação" },
  { value: "resolved", label: "Já foi resolvida" },
];

function KnowledgeGapPanel(gaps, ctx) {
  if (!gaps || gaps.length === 0) return null;
  const wrap = el("div", { class: "panel-card" });
  wrap.appendChild(el("h4", {}, "Lacunas de conhecimento"));
  wrap.appendChild(el("p", { class: "field__help" }, "\"Não sabemos\" é uma resposta válida. Classificar aqui não apaga a lacuna do diagnóstico."));
  gaps.forEach((gap) => {
    const current = ctx.getItemReview(gap.gapId);
    const card = el("div", { class: "gap-card" });
    card.appendChild(el("p", {}, gap.description || "(sem descrição)"));
    const select = el("select", {
      class: "input input--select", disabled: ctx.locked,
      onchange: (e) => ctx.setItemField(gap.gapId, "TUT_GAP_STATUS", e.target.value),
    });
    select.appendChild(el("option", { value: "" }, "Classificar..."));
    GAP_STATUS_OPTIONS.forEach((o) => select.appendChild(el("option", { value: o.value, selected: current.TUT_GAP_STATUS === o.value }, o.label)));
    card.appendChild(select);
    const note = el("textarea", {
      class: "input textarea", rows: 2, placeholder: "Nota do tutor sobre esta lacuna (TUT_GAP_NOTE)", disabled: ctx.locked,
      "data-focus-key": `gap::${gap.gapId}::note`,
      oninput: (e) => ctx.setItemField(gap.gapId, "TUT_GAP_NOTE", e.target.value),
    });
    note.value = current.TUT_GAP_NOTE || "";
    card.appendChild(note);
    wrap.appendChild(card);
  });
  return wrap;
}

/* ---------------------------------------------------------------------- */
/* Rubrica transversal (seção 49) — nunca convertida em nota               */
/* ---------------------------------------------------------------------- */

const RUBRIC_AXES = [
  { key: "completeness", label: "Completude" },
  { key: "evidence", label: "Evidência" },
  { key: "coherence", label: "Coerência" },
  { key: "participation", label: "Participação" },
  { key: "traceability", label: "Rastreabilidade" },
];
const RUBRIC_OPTIONS = [
  { value: "consistent", label: "Consistente" },
  { value: "partially_consistent", label: "Parcialmente consistente" },
  { value: "needs_deepening", label: "Precisa de aprofundamento" },
  { value: "not_applicable", label: "Não se aplica / não avaliado" },
];

function RubricPanel(rubric, onChange, locked) {
  const wrap = el("div", { class: "rubric-panel" });
  wrap.appendChild(el("h3", {}, "Rubrica transversal"));
  wrap.appendChild(el("p", { class: "field__help" }, "Um retrato qualitativo do processo — nunca uma nota, índice ou pontuação."));
  RUBRIC_AXES.forEach((axis) => {
    const id = tdomId("rubric");
    const wrapAxis = el("div", { class: "rubric-panel__axis" });
    wrapAxis.appendChild(el("label", { for: id }, axis.label));
    const select = el("select", {
      id, class: "input input--select", disabled: !!locked,
      onchange: (e) => onChange(axis.key, e.target.value),
    });
    RUBRIC_OPTIONS.forEach((opt) => select.appendChild(el("option", { value: opt.value, selected: rubric[axis.key] === opt.value }, opt.label)));
    wrapAxis.appendChild(select);
    wrap.appendChild(wrapAxis);
  });
  return wrap;
}

/* ---------------------------------------------------------------------- */
/* Painel de três colunas — colapsa em blocos verticais (seção 65)        */
/* ---------------------------------------------------------------------- */

function ReviewPanelLayout({ left, center, right }) {
  return el("div", { class: "review-panel" }, [
    el("div", { class: "review-panel__col review-panel__col--left" }, left),
    el("div", { class: "review-panel__col review-panel__col--center" }, center),
    el("div", { class: "review-panel__col review-panel__col--right" }, right),
  ]);
}

function SummaryCard(title, lines, tone) {
  const card = el("div", { class: "summary-card" + (tone ? ` summary-card--${tone}` : "") });
  card.appendChild(el("h4", {}, title));
  const list = el("ul", { class: "summary-card__list" });
  (lines.length ? lines : ["Nenhum registro."]).forEach((line) => list.appendChild(el("li", {}, line)));
  card.appendChild(list);
  return card;
}

window.TutorComponents = {
  el,
  tdomId,
  captureFocus,
  restoreFocus,
  formatValue,
  ReadOnlyField,
  ReadOnlyText,
  ReadOnlySection,
  EvidenceBadge,
  EvidenceList,
  TutorRatingField,
  TutorTextField,
  AlertBanner,
  AlertList,
  alertHandlersFromCtx,
  TutorTraceabilityChain,
  CommentThread,
  ItemCommentBlock,
  RubricPanel,
  RUBRIC_AXES,
  RUBRIC_OPTIONS,
  KnowledgeGapPanel,
  GAP_STATUS_OPTIONS,
  ReviewPanelLayout,
  SummaryCard,
};
