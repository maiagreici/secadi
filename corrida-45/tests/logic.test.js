const assert = require("assert");
const fs = require("fs");
const path = require("path");
const L = require("../public/logic.js");
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "plan.json"), "utf8"));
let n = 0; const t = (nome, fn) => { fn(); n++; console.log("ok  " + nome); };

t("plano válido", () => assert.deepStrictEqual(L.validatePlan(plan), []));
t("27 semanas", () => assert.strictEqual(plan.semanas.length, 27));
t("semana 1 começa 12/10/2026 (segunda)", () => { assert.strictEqual(L.weekStart(plan, 1), "2026-10-12"); assert.strictEqual(new Date(L.parseISO("2026-10-12")).getUTCDay(), 1); });
t("semana 27 começa 12/04/2027", () => assert.strictEqual(L.weekStart(plan, 27), "2027-04-12"));
t("terça da semana 27 é 13/04/2027 com 45 km", () => { assert.strictEqual(L.dayDate(plan, 27, "ter"), "2027-04-13"); assert.strictEqual(plan.semanas[26].terca, 45); assert.strictEqual(plan.desafio.data, "2027-04-13"); });
t("13/04/2027 é terça", () => assert.strictEqual(new Date(L.parseISO("2027-04-13")).getUTCDay(), 2));
t("sábado da semana 8 é 05/12/2026 (competição 18 km)", () => { assert.strictEqual(L.dayDate(plan, 8, "sab"), "2026-12-05"); assert.strictEqual(plan.semanas[7].sabado, 18); });
t("semana de uma data", () => { assert.strictEqual(L.weekOf(plan, "2026-11-12"), 5); assert.strictEqual(L.weekOf(plan, "2026-10-11"), 0); assert.strictEqual(L.weekOf(plan, "2026-10-12"), 1); assert.strictEqual(L.weekOf(plan, "2026-10-18"), 1); assert.strictEqual(L.weekOf(plan, "2027-04-18"), 27); });
t("dias até o desafio", () => assert.strictEqual(L.diffDays("2026-11-12", "2027-04-13"), 152));
t("datas inválidas rejeitadas", () => { assert.ok(isNaN(L.parseISO("2026-02-30"))); assert.ok(isNaN(L.parseISO("2026-13-01"))); assert.ok(isNaN(L.parseISO("abc"))); });
t("vírgula e validação de km", () => { assert.strictEqual(L.parseKm("12,5"), 12.5); assert.strictEqual(L.parseKm("12.5"), 12.5); assert.strictEqual(L.parseKm(" 8 "), 8); assert.strictEqual(L.parseKm(""), null); assert.ok(Number.isNaN(L.parseKm("-3"))); assert.ok(Number.isNaN(L.parseKm("abc"))); assert.ok(Number.isNaN(L.parseKm("1,2,3"))); assert.strictEqual(L.fmtKm(12.5), "12,5"); });
t("totais e semana cumprida", () => {
  const w = plan.semanas[4]; // sem 5: 6 + 12
  let r = { entries: { "5-ter": { km: 6 } } };
  let tot = L.weekTotals(plan, r, w);
  assert.deepStrictEqual([tot.prev, tot.real, tot.cumprida], [18, 6, false]);
  r = { entries: { "5-ter": { km: 6 }, "5-sab": { km: 11 } } }; // 17/18 = 94%
  tot = L.weekTotals(plan, r, w); assert.strictEqual(tot.real, 17); assert.strictEqual(tot.cumprida, true);
  r = { entries: { "5-ter": { km: 6 }, "5-sab": { km: 8 } } };
  assert.strictEqual(L.weekTotals(plan, r, w).cumprida, false);
});
t("painel: maior longão e % do previsto", () => {
  const r = { entries: { "1-sab": { km: 10 }, "2-sab": { km: 14 }, "2-ter": { km: 3 } } };
  const d = L.dashboard(plan, r, "2026-11-12");
  assert.strictEqual(d.maiorLongao, 14); assert.strictEqual(d.kmTotal, 27); assert.strictEqual(d.pctPrevisto, Math.round(27 / 30 * 100)); assert.strictEqual(d.semanaAtual, 5);
});
t("aviso de cansaço: 2 semanas seguidas em 4 ou 5", () => {
  assert.strictEqual(L.fatigueWarning(plan, { entries: { "3-ter": { fatigue: 4 }, "5-sab": { fatigue: 5 } } }), null);
  assert.strictEqual(L.fatigueWarning(plan, { entries: { "3-ter": { fatigue: 4 }, "4-sem": { fatigue: 5 } } }).weeks.join(), "3,4");
  assert.strictEqual(L.fatigueWarning(plan, { entries: { "3-ter": { fatigue: 4 }, "4-sem": { fatigue: 3 } } }), null);
});
t("plano com dados ruins é rejeitado", () => { const p = JSON.parse(JSON.stringify(plan)); p.semanas[0].terca = -1; assert.ok(L.validatePlan(p).length > 0); p.semanas[0].terca = 5; p.inicio = "2026-10-13"; assert.ok(L.validatePlan(p).length > 0); });
console.log("\n" + n + " testes de cálculo passaram.");
