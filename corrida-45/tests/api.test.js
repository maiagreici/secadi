/* Teste de ponta a ponta: grava, reinicia o servidor e confere que o dado continuou. Usa pastas temporárias. */
const { spawn } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path"), assert = require("assert");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "c45-"));
const planCopy = path.join(tmp, "plan.json");
fs.copyFileSync(path.join(__dirname, "..", "plan.json"), planCopy);
const PORT = 3999;
const env = { ...process.env, PORT: String(PORT), HOST: "127.0.0.1", DATA_DIR: path.join(tmp, "data"), BACKUP_DIR: path.join(tmp, "backups"), PLAN_FILE: planCopy };
const base = "http://127.0.0.1:" + PORT;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function iniciar() {
  const p = spawn("node", [path.join(__dirname, "..", "server.js")], { env, stdio: "ignore" });
  for (let i = 0; i < 50; i++) { try { await fetch(base + "/api/state"); return p; } catch (_) { await sleep(100); } }
  throw new Error("servidor não subiu");
}
const parar = (p) => new Promise((r) => { p.on("exit", r); p.kill("SIGTERM"); });
const j = (path, method, body) => fetch(base + path, { method, headers: { "Content-Type": "application/json" }, body: body && JSON.stringify(body) }).then(async (r) => ({ s: r.status, b: await r.json() }));
(async () => {
  let p = await iniciar();
  let r = await j("/api/entry", "PUT", { key: "5-ter", fields: { km: "6,5" } });
  assert.strictEqual(r.s, 200); assert.strictEqual(r.b.entry.km, 6.5); assert.ok(r.b.entry.updatedAt);
  r = await j("/api/entry", "PUT", { key: "5-ter", fields: { fatigue: 4, sleep: "7,5", pain: true, painWhere: "joelho", note: "ok" } });
  assert.strictEqual(r.b.entry.sleep, 7.5);
  for (const ruim of [{ km: "-2" }, { km: "abc" }, { fatigue: 9 }, { sleep: 30 }, { hr: 5 }]) assert.strictEqual((await j("/api/entry", "PUT", { key: "5-ter", fields: ruim })).s, 400);
  assert.strictEqual((await j("/api/entry", "PUT", { key: "99-ter", fields: { km: 1 } })).s, 400);
  assert.strictEqual((await j("/api/entry", "PUT", { key: "5-qua", fields: { km: 1 } })).s, 400);
  console.log("ok  gravação e validação");
  await parar(p); p = await iniciar();
  let st = await j("/api/state", "GET");
  assert.strictEqual(st.b.results.entries["5-ter"].km, 6.5); assert.strictEqual(st.b.results.entries["5-ter"].painWhere, "joelho");
  console.log("ok  dado sobreviveu à reinicialização");
  assert.ok(fs.readdirSync(env.BACKUP_DIR).some((f) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)));
  console.log("ok  backup diário criado");
  const csv = await (await fetch(base + "/api/export.csv")).text();
  assert.ok(csv.includes("6.5") && csv.includes("joelho"));
  const exp = await (await fetch(base + "/api/export.json")).json();
  // importar CSV em modo substituir e conferir
  await j("/api/entry", "PUT", { key: "5-sab", fields: { km: 10 } });
  r = await j("/api/import", "POST", { formato: "csv", conteudo: csv, modo: "substituir" });
  assert.strictEqual(r.s, 200); st = await j("/api/state", "GET");
  assert.strictEqual(st.b.results.entries["5-sab"], undefined); assert.strictEqual(st.b.results.entries["5-ter"].km, 6.5);
  assert.ok(fs.readdirSync(env.BACKUP_DIR).some((f) => f.startsWith("antes-importar")));
  r = await j("/api/import", "POST", { formato: "json", conteudo: JSON.stringify(exp), modo: "juntar" });
  assert.strictEqual(r.s, 200);
  assert.strictEqual((await j("/api/import", "POST", { formato: "json", conteudo: "{\"x\":1}", modo: "juntar" })).s, 400);
  console.log("ok  exportar e importar");
  const novo = JSON.parse(JSON.stringify(st.b.plan)); novo.semanas[8].sabado = 22;
  assert.strictEqual((await j("/api/plan", "PUT", { plan: novo })).s, 200);
  novo.semanas[8].sabado = -1; assert.strictEqual((await j("/api/plan", "PUT", { plan: novo })).s, 400);
  assert.strictEqual(JSON.parse(fs.readFileSync(planCopy, "utf8")).semanas[8].sabado, 22);
  console.log("ok  edição do plano");
  r = await j("/api/entry", "PUT", { key: "5-ter", fields: { km: null, fatigue: null, sleep: null, pain: null, painWhere: null, note: null } });
  assert.strictEqual(r.b.entry, null);
  assert.ok(fs.readFileSync(path.join(tmp, "data", "historico.jsonl"), "utf8").split("\n").filter(Boolean).length >= 3);
  console.log("ok  histórico de alterações");
  await parar(p); fs.rmSync(tmp, { recursive: true, force: true });
  console.log("\nTestes de gravação passaram.");
})().catch((e) => { console.error(e); process.exit(1); });
