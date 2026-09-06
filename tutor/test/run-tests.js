"use strict";
/**
 * tutor/test/run-tests.js
 * Harness de testes (seções 76-77 da especificação) executável via Node,
 * sem navegador: carrega os módulos de dados/regras num `window` simulado
 * (global === window) e valida os cenários obrigatórios A, B, C e os seis
 * casos adicionais, além de invariantes de arquitetura (read-only,
 * imutabilidade de revisão encerrada, versionamento).
 *
 * Execução: node tutor/test/run-tests.js
 */

global.window = global;
require("../../data-model.js");
require("../tutor-data-model.js");
require("../diagnosis-importer.js");
require("../tutor-rules.js");

const DM = window.DataModel;
const TD = window.TutorDataModel;
const DI = window.DiagnosisImporter;
const Rules = window.TutorRules;

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(message);
    console.error(`FALHOU: ${message}`);
  }
}

function freshNotebook() {
  return TD.createTutorNotebook({ tutor: { TUT_ID: "t1", TUT_NAME: "Tutora Teste", TUT_CLASS: "Turma 1" } });
}

function alertsByRulePrefix(notebook, prefix) {
  return notebook.alerts.filter((a) => a.ruleId.startsWith(prefix));
}

/* ---------------------------------------------------------------------- */
/* CENÁRIO A — Diagnóstico consistente                                    */
/* ---------------------------------------------------------------------- */

function scenarioA() {
  console.log("\n== Cenário A — diagnóstico consistente ==");
  const d = DM.createDiagnosis();
  d.metadata.schoolId = "school-a";
  d.school = { SCH_NAME: "Escola A", SCH_CITY: "Pelotas", SCH_STATE: "RS" };
  d.respondent = { RESP_NAME: "Cursista A", RESP_ROLE: "teacher" };
  d.methodology = { MET_PARTICIPANTS: ["teachers", "students", "families"], MET_SOURCES: ["collective_meeting", "direct_observation"] };
  d.environmentalEducation = { EA_INSTITUTIONAL_LEVEL: "integrated_planning", EA_PROJECT_CONTINUITY: "institutionally_guaranteed" };

  const ev1 = DM.createEvidence({ description: "Registro fotográfico do entorno", type: "photo" });
  d.evidence.push(ev1);

  const actorPartner = DM.createActor({ name: "Defesa Civil", category: "defesa_civil", relationshipLevel: "partnership" });
  d.actors.push(actorPartner);

  const risk = DM.createRisk({ riskType: "enchente", occurredBefore: "yes", selectedForPlanning: true, evidenceIds: [ev1.evidenceId] });
  d.risks.push(risk);

  const problem = DM.createProblem({ title: "Falta de plano de emergência", evidenceIds: [ev1.evidenceId] });
  d.problems.push(problem);
  const priority = DM.createPriority({ problemId: problem.problemId, order: 1, justification: "Risco recorrente com evidência" });
  d.priorities.push(priority);

  const plan = DM.createActionPlan({ priorityId: priority.priorityId, objective: "Reduzir a exposição da comunidade escolar a alagamentos", partnerActorIds: [actorPartner.actorId], expectedResult: "Procedimento de emergência formalizado" });
  d.actionPlans.push(plan);

  const indicator = DM.createIndicator({ actionPlanId: plan.actionPlanId, name: "Procedimento formalizado", target: "documento aprovado", baseline: "inexistente", baselineUnknown: false });
  d.indicators.push(indicator);

  const comm = DM.createCommunicationStrategy({ actionPlanId: plan.actionPlanId, purposes: ["give_voice", "mobilize"], listeningChannels: ["assembly"] });
  d.communicationStrategies.push(comm);

  d.swotItems.push(DM.createSwotItem({ category: "weakness", label: "Falta de procedimento formalizado", originDimension: "participation" }));

  const notebook = freshNotebook();
  Rules.runAllTutorRules(notebook, d.metadata.diagnosisId, "1.0", d);

  assert(notebook.alerts.length === 0, `Cenário A deveria gerar 0 alertas, gerou ${notebook.alerts.length}: ${notebook.alerts.map((a) => a.ruleId).join(", ")}`);
  return d;
}

/* ---------------------------------------------------------------------- */
/* CENÁRIO B — Diagnóstico com problemas de coerência                     */
/* ---------------------------------------------------------------------- */

function scenarioB() {
  console.log("\n== Cenário B — problemas de coerência ==");
  const d = DM.createDiagnosis();
  d.environmentalEducation = { EA_INSTITUTIONAL_LEVEL: "institutionalized_continuous", EA_PROJECT_CONTINUITY: "people_dependent" };

  const problem = DM.createProblem({ title: "Erosão na entrada da escola", evidenceIds: [] }); // sem evidência
  d.problems.push(problem);
  const priority = DM.createPriority({ problemId: problem.problemId, order: 1 });
  d.priorities.push(priority);

  const looseActor = DM.createActor({ name: "ONG local", category: "ong", relationshipLevel: "none" });
  d.actors.push(looseActor);
  const plan = DM.createActionPlan({ priorityId: priority.priorityId, objective: "Fazer uma palestra sobre erosão", partnerActorIds: [looseActor.actorId] });
  d.actionPlans.push(plan);

  const notebook = freshNotebook();
  Rules.runAllTutorRules(notebook, d.metadata.diagnosisId, "1.0", d);

  assert(alertsByRulePrefix(notebook, "TUT_ALERT_004").length === 1, "Cenário B deveria gerar TUT_ALERT_004 (EA institucionalizada dependente de indivíduos)");
  assert(alertsByRulePrefix(notebook, "TUT_ALERT_006").length === 1, "Cenário B deveria gerar TUT_ALERT_006 (problema sem evidência)");
  assert(alertsByRulePrefix(notebook, "TUT_ALERT_005").length === 1, "Cenário B deveria gerar TUT_ALERT_005 (ator sem relação usado no plano)");
  assert(d.problems[0].evidenceIds.length === 0, "O sistema não deve corrigir/excluir automaticamente o problema sem evidência");
  assert(notebook.alerts.every((a) => a.status === "open"), "Nenhum alerta deve nascer com status diferente de 'open' (decisão é do tutor)");
  return d;
}

/* ---------------------------------------------------------------------- */
/* CENÁRIO C — Muitas lacunas legítimas                                    */
/* ---------------------------------------------------------------------- */

function scenarioC() {
  console.log("\n== Cenário C — muitas lacunas legítimas ==");
  const d = DM.createDiagnosis();
  for (let i = 0; i < 4; i += 1) {
    d.knowledgeGaps.push(DM.createKnowledgeGap({ dimension: "territory", description: `Não sabemos ainda sobre o aspecto ${i}` }));
  }
  const beforeCount = d.knowledgeGaps.length;

  const notebook = freshNotebook();
  Rules.runAllTutorRules(notebook, d.metadata.diagnosisId, "1.0", d);

  const gapAlerts = alertsByRulePrefix(notebook, "TUT_ALERT_003");
  assert(gapAlerts.length === 1, "Cenário C deveria gerar exatamente 1 alerta TUT_ALERT_003 (dimensão territory)");
  assert(gapAlerts[0] && gapAlerts[0].sourceIds.length === 4, "O alerta deve referenciar as 4 lacunas");
  assert(d.knowledgeGaps.length === beforeCount, "As regras nunca devem remover lacunas do diagnóstico");

  // O tutor pode aceitar as lacunas sem bloquear nada.
  d.knowledgeGaps.forEach((g) => TD.setItemReviewField(notebook, d.metadata.diagnosisId, 4, "1.0", g.gapId, "TUT_GAP_STATUS", "accepted"));
  const allAccepted = d.knowledgeGaps.every((g) => TD.getItemReview(notebook, d.metadata.diagnosisId, 4, "1.0", g.gapId).TUT_GAP_STATUS === "accepted");
  assert(allAccepted, "O tutor deve poder aceitar todas as lacunas sem que o sistema bloqueie a ação");
  return d;
}

/* ---------------------------------------------------------------------- */
/* Casos adicionais (seção 77)                                            */
/* ---------------------------------------------------------------------- */

function additionalCases() {
  console.log("\n== Casos adicionais ==");

  // Caso 1 — Podcast sem canal de escuta
  {
    const d = DM.createDiagnosis();
    d.communicationStrategies.push(DM.createCommunicationStrategy({ purposes: ["inform"], media: ["podcast"], listeningChannels: [] }));
    const nb = freshNotebook();
    Rules.runAllTutorRules(nb, d.metadata.diagnosisId, "1.0", d);
    assert(alertsByRulePrefix(nb, "TUT_ALERT_009").length === 1, "Caso 1: podcast sem canal de escuta deveria gerar TUT_ALERT_009");
  }

  // Caso 2 — Meta de +20% sem linha de base
  {
    const d = DM.createDiagnosis();
    d.indicators.push(DM.createIndicator({ name: "Redução de resíduos", target: "+20%", baselineUnknown: true }));
    const nb = freshNotebook();
    Rules.runAllTutorRules(nb, d.metadata.diagnosisId, "1.0", d);
    assert(alertsByRulePrefix(nb, "TUT_ALERT_008").length === 1, "Caso 2: meta percentual sem linha de base deveria gerar TUT_ALERT_008 (obrigatório)");
  }

  // Caso 3 — Ator sem relação usado no plano
  {
    const d = DM.createDiagnosis();
    const actor = DM.createActor({ name: "Associação de Moradores", relationshipLevel: "none" });
    d.actors.push(actor);
    d.actionPlans.push(DM.createActionPlan({ partnerActorIds: [actor.actorId] }));
    const nb = freshNotebook();
    Rules.runAllTutorRules(nb, d.metadata.diagnosisId, "1.0", d);
    assert(alertsByRulePrefix(nb, "TUT_ALERT_005").length === 1, "Caso 3: ator sem relação usado no plano deveria gerar TUT_ALERT_005 (viabilidade)");
  }

  // Caso 4 — Problema sem evidência
  {
    const d = DM.createDiagnosis();
    d.problems.push(DM.createProblem({ title: "Falta de arborização", evidenceIds: [] }));
    const nb = freshNotebook();
    Rules.runAllTutorRules(nb, d.metadata.diagnosisId, "1.0", d);
    assert(alertsByRulePrefix(nb, "TUT_ALERT_006").length === 1, "Caso 4: problema sem evidência deveria gerar TUT_ALERT_006 (rastreabilidade)");
  }

  // Caso 5 — Percepção apresentada como dado técnico (campo manual do tutor,
  // não uma regra automática — testamos que o campo de revisão existe e é
  // gravável por item, conforme seção 27).
  {
    const d = DM.createDiagnosis();
    const risk = DM.createRisk({ riskType: "onda de calor" });
    d.risks.push(risk);
    const nb = freshNotebook();
    TD.setItemReviewField(nb, d.metadata.diagnosisId, 4, "1.0", risk.riskId, "TUT_PERCEPTION_TECHNICAL_DISTINCTION", "needs_revision");
    const stored = TD.getItemReview(nb, d.metadata.diagnosisId, 4, "1.0", risk.riskId).TUT_PERCEPTION_TECHNICAL_DISTINCTION;
    assert(stored === "needs_revision", "Caso 5: o campo TUT_PERCEPTION_TECHNICAL_DISTINCTION deve ser gravável por risco, como campo de revisão metodológica");
  }

  // Caso 6 — Fraqueza FOFA aparentemente externa: pergunta reflexiva, sem autocorreção
  {
    const d = DM.createDiagnosis();
    const item = DM.createSwotItem({ category: "weakness", label: "Poluição do rio próximo", originDimension: "territory" });
    d.swotItems.push(item);
    const nb = freshNotebook();
    Rules.runAllTutorRules(nb, d.metadata.diagnosisId, "1.0", d);
    const alert = alertsByRulePrefix(nb, "TUT_ALERT_010")[0];
    assert(!!alert, "Caso 6: fraqueza de origem territorial deveria gerar TUT_ALERT_010 (reflexão)");
    assert(alert && alert.type === "reflection", "Caso 6: o alerta deve ser do tipo reflexão, não uma correção");
    assert(d.swotItems[0].category === "weakness", "Caso 6: o sistema nunca deve reclassificar o item automaticamente");
  }
}

/* ---------------------------------------------------------------------- */
/* Invariantes de arquitetura                                              */
/* ---------------------------------------------------------------------- */

function architectureInvariants() {
  console.log("\n== Invariantes de arquitetura ==");

  // Read-only: o diagnóstico congelado não pode ser alterado.
  {
    const d = DM.createDiagnosis();
    d.school = { SCH_NAME: "Escola Imutável" };
    const frozen = TD.deepFreeze(JSON.parse(JSON.stringify(d)));
    let threw = false;
    try {
      frozen.school.SCH_NAME = "Tentativa de alteração";
    } catch (err) {
      threw = true;
    }
    assert(threw, "Uma tentativa de escrever no diagnóstico congelado deve lançar erro (modo estrito)");
    assert(frozen.school.SCH_NAME === "Escola Imutável", "O valor original do diagnóstico não deve mudar mesmo se a escrita falhar silenciosamente");
  }

  // Versionamento: reimportação com o mesmo updatedAt não deve gerar nova versão.
  {
    const notebook = freshNotebook();
    const diagnosesStore = {};
    const d1 = DM.createDiagnosis();
    d1.school = { SCH_NAME: "Escola Versão" };
    d1.metadata.updatedAt = "2024-01-01T00:00:00.000Z";
    const r1 = DI.importDiagnosis(notebook, diagnosesStore, { diagnosis: d1 });
    assert(r1.schoolEntry.diagnosisVersion === "1.0", "Primeira importação deve iniciar na versão 1.0");

    const r1b = DI.importDiagnosis(notebook, diagnosesStore, { diagnosis: d1 });
    assert(r1b.schoolEntry.diagnosisVersion === "1.0", "Reimportar o mesmo updatedAt não deve avançar a versão");

    const d2 = JSON.parse(JSON.stringify(d1));
    d2.metadata.updatedAt = "2024-02-01T00:00:00.000Z";
    const r2 = DI.importDiagnosis(notebook, diagnosesStore, { diagnosis: d2 });
    assert(r2.schoolEntry.diagnosisVersion === "1.1", "Uma nova importação com updatedAt diferente deve avançar para a versão 1.1");
  }

  // Imutabilidade de revisão encerrada.
  {
    const notebook = freshNotebook();
    const schoolId = "school-lock";
    TD.setStageField(notebook, schoolId, 1, "1.0", "TUT_PARTICIPATION_ASSESSMENT", "participatory");
    TD.lockReview(notebook, { schoolId, diagnosisVersion: "1.0", stage: 7, status: "adequate_to_continue" });
    let threw = false;
    try {
      TD.setStageField(notebook, schoolId, 1, "1.0", "TUT_PARTICIPATION_ASSESSMENT", "consultative");
    } catch (err) {
      threw = true;
    }
    assert(threw, "Escrever em uma versão com revisão encerrada (locked) deve lançar erro");
    assert(TD.getStageField(notebook, schoolId, 1, "1.0", "TUT_PARTICIPATION_ASSESSMENT") === "participatory", "O valor gravado antes do lock deve permanecer intacto");
  }

  // Nunca sobrescrever a decisão do tutor sobre um alerta já existente.
  {
    const notebook = freshNotebook();
    const d = DM.createDiagnosis();
    d.problems.push(DM.createProblem({ title: "X", evidenceIds: [] }));
    Rules.runAllTutorRules(notebook, d.metadata.diagnosisId, "1.0", d);
    const alertId = notebook.alerts[0].alertId;
    TD.setAlertStatus(notebook, alertId, "resolved", "Já conversei com a escola sobre isso.");
    Rules.runAllTutorRules(notebook, d.metadata.diagnosisId, "1.0", d); // roda de novo
    const alert = notebook.alerts.find((a) => a.alertId === alertId);
    assert(alert.status === "resolved", "Rodar as regras novamente não deve reverter a decisão do tutor sobre o alerta");
    assert(alert.tutorComment === "Já conversei com a escola sobre isso.", "O comentário do tutor sobre o alerta deve ser preservado");
  }

  // Ausência de qualquer campo de pontuação nas estruturas de dados.
  {
    const notebook = freshNotebook();
    const serialized = JSON.stringify(notebook);
    assert(!/"score"|"grade"|"ranking"|"resilienceIndex"|"sustainabilityScore"/i.test(serialized), "A estrutura do tutorNotebook não deve conter nenhum campo de pontuação/ranking");
  }
}

scenarioA();
scenarioB();
scenarioC();
additionalCases();
architectureInvariants();

console.log(`\n${passed} verificações passaram, ${failed} falharam.`);
if (failed > 0) {
  console.error("\nFalhas:");
  failures.forEach((f) => console.error(` - ${f}`));
  process.exitCode = 1;
} else {
  console.log("Todos os cenários obrigatórios (seções 76-77) passaram.");
}
