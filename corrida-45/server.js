/* Servidor local do app "45 km aos 45". Sem dependências: só precisa do Node.js. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const Logic = require("./public/logic.js");

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const PLAN_FILE = process.env.PLAN_FILE || path.join(ROOT, "plan.json");
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(ROOT, "backups");
const RESULTS_FILE = path.join(DATA_DIR, "resultados.json");
const HISTORY_FILE = path.join(DATA_DIR, "historico.jsonl");
const PUBLIC = path.join(ROOT, "public");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(BACKUP_DIR, { recursive: true });

/* ---------- arquivos ---------- */
function writeAtomic(file, text) {
  const tmp = file + ".tmp";
  const fd = fs.openSync(tmp, "w");
  try { fs.writeSync(fd, text); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(tmp, file);
}
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) {
    if (e.code === "ENOENT") return fallback;
    // arquivo estragado: guarda uma cópia e avisa, nunca apaga
    const aside = file + ".corrompido-" + Date.now();
    try { fs.copyFileSync(file, aside); } catch (_) {}
    console.error("Aviso: não consegui ler " + file + ". Cópia guardada em " + aside);
    throw e;
  }
}
const nowISO = () => new Date().toISOString();
const pad = (n) => String(n).padStart(2, "0");
const localDay = (d = new Date()) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

function loadPlan() { return readJSON(PLAN_FILE, null); }
function loadResults() {
  const r = readJSON(RESULTS_FILE, null);
  return r && r.entries ? r : { versao: 1, entries: {} };
}
function logHistory(obj) {
  fs.appendFileSync(HISTORY_FILE, JSON.stringify({ em: nowISO(), ...obj }) + "\n");
}

/* ---------- backup diário ---------- */
function backupNow(prefixo) {
  const plan = loadPlan();
  const results = loadResults();
  const nome = prefixo ? prefixo + "-" + nowISO().replace(/[:.]/g, "-") + ".json" : "backup-" + localDay() + ".json";
  writeAtomic(path.join(BACKUP_DIR, nome), JSON.stringify({ app: "45km-aos-45", feito_em: nowISO(), plan, results }, null, 1));
  return nome;
}
function ensureDailyBackup() { try { backupNow(); } catch (e) { console.error("Falha no backup:", e.message); } }

/* ---------- validação ---------- */
const KEY_RE = /^(\d{1,3})-(ter|qui|sab|sem)$/;
function cleanEntry(key, input, plan) {
  const m = KEY_RE.exec(key);
  if (!m) throw new Error("Chave inválida.");
  const n = +m[1], dia = m[2];
  if (!plan.semanas.some((w) => w.n === n)) throw new Error("Semana inexistente.");
  const out = {};
  if ("km" in input) {
    if (dia === "sem") throw new Error("Km não vale para o resumo da semana.");
    const km = Logic.parseKm(input.km);
    if (Number.isNaN(km)) throw new Error("Km inválido: use número maior ou igual a zero, ex: 12,5.");
    out.km = km;
  }
  const inteiro = (campo, min, max, nome) => {
    if (!(campo in input)) return;
    const v = input[campo];
    if (v === null || v === "") { out[campo] = null; return; }
    const num = Number(String(v).replace(",", "."));
    if (!isFinite(num) || num < min || num > max) throw new Error(nome + " fora do intervalo permitido (" + min + " a " + max + ").");
    out[campo] = num;
  };
  inteiro("fatigue", 1, 5, "Cansaço");
  if (out.fatigue != null && !Number.isInteger(out.fatigue)) throw new Error("Cansaço deve ser de 1 a 5.");
  inteiro("sleep", 0, 24, "Horas de sono");
  inteiro("hr", 20, 250, "Frequência cardíaca de repouso");
  if (out.hr != null && !Number.isInteger(out.hr)) throw new Error("Frequência cardíaca deve ser um número inteiro.");
  if ("pain" in input) out.pain = input.pain === null || input.pain === "" ? null : !!input.pain;
  for (const c of ["painWhere", "note"]) {
    if (c in input) {
      const s = input[c] == null ? "" : String(input[c]);
      if (s.length > 1000) throw new Error("Texto muito longo (máximo 1000 caracteres).");
      out[c] = s.trim() === "" ? null : s;
    }
  }
  return out;
}

/* ---------- API ---------- */
function send(res, code, body, type) {
  const data = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, { "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(data);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (c) => { size += c.length; if (size > 5e6) { reject(new Error("Arquivo grande demais.")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); } catch (e) { reject(new Error("JSON inválido.")); } });
    req.on("error", reject);
  });
}

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",;\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const CSV_COLS = ["semana", "dia", "data", "previsto_km", "realizado_km", "cansaco_1a5", "sono_horas", "fc_repouso", "dor", "dor_onde", "observacao", "registrado_em"];
function buildCSV(plan, results) {
  const linhas = [CSV_COLS.join(",")];
  for (const w of plan.semanas) {
    for (const dia of ["ter", "qui", "sab", "sem"]) {
      const e = results.entries[w.n + "-" + dia];
      if (!e) continue;
      const prev = dia === "sem" ? "" : Logic.planned(w, dia);
      const data = dia === "sem" ? Logic.weekStart(plan, w.n) : Logic.dayDate(plan, w.n, dia);
      linhas.push([w.n, dia, data, prev, e.km ?? "", e.fatigue ?? "", e.sleep ?? "", e.hr ?? "",
        e.pain === true ? "sim" : e.pain === false ? "nao" : "", e.painWhere ?? "", e.note ?? "", e.updatedAt ?? ""].map(csvEscape).join(","));
    }
  }
  return "﻿" + linhas.join("\r\n") + "\r\n";
}
function parseCSV(text) {
  const rows = []; let row = [], f = "", q = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ""));
}

let writing = Promise.resolve();
function serial(fn) { const p = writing.then(fn, fn); writing = p.catch(() => {}); return p; }

async function handleApi(req, res, url) {
  const route = req.method + " " + url.pathname;
  const plan = loadPlan();
  if (!plan) return send(res, 500, { erro: "plan.json não encontrado." });

  if (route === "GET /api/state") return send(res, 200, { plan, results: loadResults(), servidor: nowISO() });

  if (route === "PUT /api/entry") {
    const body = await readBody(req);
    return serial(() => {
      let campos;
      try { campos = cleanEntry(String(body.key), body.fields || {}, plan); }
      catch (e) { return send(res, 400, { erro: e.message }); }
      const results = loadResults();
      const antes = results.entries[body.key] || null;
      const novo = { ...(antes || {}), ...campos };
      for (const k of Object.keys(novo)) if (novo[k] === null || novo[k] === undefined) delete novo[k];
      const vazio = Object.keys(novo).filter((k) => k !== "updatedAt").length === 0;
      if (vazio) delete results.entries[body.key];
      else { novo.updatedAt = nowISO(); results.entries[body.key] = novo; }
      results.salvoEm = nowISO();
      writeAtomic(RESULTS_FILE, JSON.stringify(results, null, 1));
      logHistory({ acao: "editar", chave: body.key, antes, depois: vazio ? null : novo });
      ensureDailyBackup();
      return send(res, 200, { ok: true, entry: vazio ? null : novo, salvoEm: results.salvoEm });
    });
  }

  if (route === "PUT /api/plan") {
    const body = await readBody(req);
    return serial(() => {
      const erros = Logic.validatePlan(body.plan);
      if (erros.length) return send(res, 400, { erro: erros.join(" ") });
      backupNow("antes-editar-plano");
      writeAtomic(PLAN_FILE, JSON.stringify(body.plan, null, 1));
      logHistory({ acao: "editar_plano" });
      ensureDailyBackup();
      return send(res, 200, { ok: true });
    });
  }

  if (route === "GET /api/export.json")
    return send(res, 200, JSON.stringify({ app: "45km-aos-45", exportado_em: nowISO(), plan, results: loadResults() }, null, 1), "application/json; charset=utf-8");
  if (route === "GET /api/export.csv")
    return send(res, 200, buildCSV(plan, loadResults()), "text/csv; charset=utf-8");

  if (route === "POST /api/import") {
    const body = await readBody(req);
    return serial(() => {
      const results = loadResults();
      let novas = {}; let novoPlano = null;
      try {
        if (body.formato === "json") {
          const d = JSON.parse(body.conteudo);
          if (!d.results || typeof d.results.entries !== "object") throw new Error("O arquivo JSON não parece ser um backup deste app.");
          novas = d.results.entries;
          if (d.plan && body.incluirPlano) {
            const erros = Logic.validatePlan(d.plan);
            if (erros.length) throw new Error("Plano do arquivo inválido: " + erros.join(" "));
            novoPlano = d.plan;
          }
        } else if (body.formato === "csv") {
          const rows = parseCSV(String(body.conteudo));
          const head = rows.shift() || [];
          const idx = (nome) => head.indexOf(nome);
          if (idx("semana") < 0 || idx("dia") < 0) throw new Error("CSV sem as colunas 'semana' e 'dia'.");
          for (const r of rows) {
            const g = (nome) => { const i = idx(nome); return i < 0 ? "" : (r[i] ?? ""); };
            const dorTxt = g("dor").toLowerCase();
            novas[g("semana") + "-" + g("dia")] = {
              km: g("realizado_km") === "" ? null : g("realizado_km"),
              fatigue: g("cansaco_1a5") || null, sleep: g("sono_horas") || null, hr: g("fc_repouso") || null,
              pain: dorTxt === "sim" ? true : dorTxt === "nao" ? false : null,
              painWhere: g("dor_onde") || null, note: g("observacao") || null,
              updatedAt: g("registrado_em") || null,
            };
          }
        } else throw new Error("Formato desconhecido.");
        const alvo = novoPlano || plan;
        const limpas = {};
        for (const [k, v] of Object.entries(novas)) {
          const c = cleanEntry(k, v || {}, alvo);
          limpas[k] = { ...c, updatedAt: (v && v.updatedAt) || nowISO() };
          for (const kk of Object.keys(limpas[k])) if (limpas[k][kk] === null) delete limpas[k][kk];
        }
        novas = limpas;
      } catch (e) { return send(res, 400, { erro: e.message }); }
      const backup = backupNow("antes-importar");
      if (novoPlano) writeAtomic(PLAN_FILE, JSON.stringify(novoPlano, null, 1));
      let n = 0;
      if (body.modo === "substituir") { results.entries = novas; n = Object.keys(novas).length; }
      else for (const [k, v] of Object.entries(novas)) { results.entries[k] = { ...(results.entries[k] || {}), ...v }; n++; }
      results.salvoEm = nowISO();
      writeAtomic(RESULTS_FILE, JSON.stringify(results, null, 1));
      logHistory({ acao: "importar", formato: body.formato, modo: body.modo, registros: n });
      ensureDailyBackup();
      return send(res, 200, { ok: true, registros: n, backup });
    });
  }

  if (route === "GET /api/backups") {
    const lista = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json")).sort().reverse()
      .map((f) => ({ nome: f, bytes: fs.statSync(path.join(BACKUP_DIR, f)).size }));
    return send(res, 200, { pasta: BACKUP_DIR, lista });
  }
  return send(res, 404, { erro: "Rota não encontrada." });
}

/* ---------- arquivos estáticos ---------- */
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".webmanifest": "application/manifest+json" };
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, "Acesso negado", "text/plain");
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "Não encontrado", "text/plain; charset=utf-8");
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) await handleApi(req, res, url);
    else serveStatic(req, res, url);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, 500, { erro: e.message || "Erro interno." });
  }
});

function enderecos() {
  const out = [];
  for (const lista of Object.values(os.networkInterfaces()))
    for (const i of lista || []) if (i.family === "IPv4" && !i.internal) out.push(i.address);
  return out;
}

if (require.main === module) {
  ensureDailyBackup();
  setInterval(ensureDailyBackup, 3600 * 1000).unref();
  server.listen(PORT, HOST, () => {
    console.log("\n  45 km aos 45 está rodando.\n");
    console.log("  No computador:  http://localhost:" + PORT);
    if (HOST !== "127.0.0.1") for (const ip of enderecos()) console.log("  No celular (mesmo Wi-Fi):  http://" + ip + ":" + PORT);
    console.log("\n  Seus dados ficam em: " + DATA_DIR);
    console.log("  Para parar: Ctrl + C\n");
  });
  const fechar = () => server.close(() => process.exit(0));
  process.on("SIGINT", fechar); process.on("SIGTERM", fechar);
}
module.exports = { server, buildCSV, parseCSV };
