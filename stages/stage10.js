/**
 * stage10.js — Etapa 10: Síntese
 * Pergunta final: "Nossa escola será mais resiliente quando..."
 */

(function () {
  const { el, renderField } = window.Components;

  const fields = [
    { id: "SYN_REALITY_VALIDATION", type: "confirmation", label: "Este diagnóstico, no conjunto, reflete a realidade da escola e do território?", qNumber: "Q10.1", required: true },
    { id: "SYN_REVISION_NOTE", type: "textarea", label: "Há algo que precisa ser revisado antes de considerar este diagnóstico concluído?", qNumber: "Q10.2", condition: (d) => window.DataModel.getAnswer(d, "SYN_REALITY_VALIDATION") && window.DataModel.getAnswer(d, "SYN_REALITY_VALIDATION") !== "yes" },
    { id: "SYN_MAIN_CHALLENGE", type: "textarea", label: "Qual o principal desafio revelado por este diagnóstico?", qNumber: "Q10.3" },
    { id: "SYN_MAIN_CAPACITY", type: "textarea", label: "Qual a principal capacidade/potencialidade revelada?", qNumber: "Q10.4" },
    { id: "SYN_PRIORITY_PARTNERSHIP", type: "textarea", label: "Qual parceria é mais prioritária para os próximos passos?", qNumber: "Q10.5" },
    { id: "SYN_EXPECTED_TRANSFORMATION", type: "textarea", label: "Que transformação a escola espera alcançar com os planos construídos?", qNumber: "Q10.6" },
    { id: "SYN_RESILIENT_SCHOOL_SENTENCE", type: "textarea", label: "Nossa escola será mais resiliente quando...", qNumber: "Q10.7", required: true, help: "Complete a frase com suas próprias palavras — ela encerra este diagnóstico." },
  ];

  function render(diagnosis) {
    const container = el("div", { class: "stage-form" });
    container.appendChild(el("p", { class: "stage-intro" }, "Esta etapa não substitui a leitura já construída — ela organiza uma síntese final a partir do que foi registrado."));
    fields.forEach((f) => { const n = renderField(f, diagnosis, window.App.setField); if (n) container.appendChild(n); });

    const overall = window.Rules.computeOverallProgress(diagnosis);
    container.appendChild(window.Components.renderSummaryCard("Progresso geral do diagnóstico", [`${overall.percentage}% dos campos obrigatórios aplicáveis foram respondidos.`]));

    if (diagnosis.metadata.status !== "completed") {
      container.appendChild(el("button", {
        type: "button", class: "btn btn--primary",
        onclick: () => {
          if (!confirm("Marcar este diagnóstico como concluído? Você ainda poderá editá-lo depois.")) return;
          window.App.mutate((d) => { d.metadata.status = "completed"; });
        },
      }, "Marcar diagnóstico como concluído"));
    } else {
      container.appendChild(el("p", { class: "muted" }, "Este diagnóstico já foi marcado como concluído."));
    }

    container.appendChild(el("button", { type: "button", class: "btn btn--outline", onclick: () => window.App.showReport() }, "Ver relatório completo"));
    return container;
  }

  window.Stages = window.Stages || {};
  window.Stages[10] = { id: 10, key: "synthesis", title: "Síntese", fields, render };
})();
