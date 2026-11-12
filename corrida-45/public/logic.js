/* Cálculos puros (datas, totais, avisos). Funciona no navegador e no Node (testes). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Logic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const DAY_MS = 86400000;
  const DIAS = ["ter", "qui", "sab"];
  const DIA_CAMPO = { ter: "terca", qui: "quinta", sab: "sabado" };
  const DIA_OFFSET = { seg: 0, ter: 1, qua: 2, qui: 3, sex: 4, sab: 5, dom: 6 };
  const DIA_NOME = { seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" };

  function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
    if (!m) return NaN;
    const y = +m[1], mo = +m[2], d = +m[3];
    const t = Date.UTC(y, mo - 1, d);
    const dt = new Date(t);
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return NaN;
    return t;
  }
  function toISO(t) {
    const d = new Date(t);
    const p = (n) => String(n).padStart(2, "0");
    return d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate());
  }
  function addDays(iso, n) { return toISO(parseISO(iso) + n * DAY_MS); }
  function diffDays(a, b) { return Math.round((parseISO(b) - parseISO(a)) / DAY_MS); }
  function todayISO(now) {
    const d = now || new Date();
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function fmtBR(iso, curto) {
    const t = parseISO(iso);
    if (isNaN(t)) return "";
    const d = new Date(t);
    const p = (n) => String(n).padStart(2, "0");
    return p(d.getUTCDate()) + "/" + p(d.getUTCMonth() + 1) + (curto ? "" : "/" + d.getUTCFullYear());
  }

  function weekStart(plan, n) { return addDays(plan.inicio, 7 * (n - 1)); }
  function dayDate(plan, n, dia) { return addDays(weekStart(plan, n), DIA_OFFSET[dia]); }
  /* Número da semana (pode ser <1 antes do início ou >total depois do fim). */
  function weekOf(plan, iso) { return Math.floor(diffDays(plan.inicio, iso) / 7) + 1; }

  /* Aceita "12,5", "12.5", " 12 ". Vazio => null. Inválido ou negativo => NaN. */
  function parseKm(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return isFinite(v) && v >= 0 ? v : NaN;
    const s = String(v).trim().replace(",", ".");
    if (s === "") return null;
    if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
    const n = parseFloat(s);
    return n >= 0 && n <= 200 ? n : NaN;
  }
  function fmtKm(n) {
    if (n === null || n === undefined || isNaN(n)) return "";
    return (Math.round(n * 100) / 100).toString().replace(".", ",");
  }

  function planned(week, dia) {
    const v = week[DIA_CAMPO[dia]];
    return typeof v === "number" && v > 0 ? v : 0;
  }
  function entry(results, n, dia) { return (results.entries || {})[n + "-" + dia] || null; }
  function realized(results, n, dia) {
    const e = entry(results, n, dia);
    return e && typeof e.km === "number" ? e.km : null;
  }

  function weekTotals(plan, results, week) {
    let prev = 0, real = 0, dias = 0, registrados = 0, prevReg = 0;
    for (const d of DIAS) {
      const p = planned(week, d);
      if (p <= 0) continue;
      dias++; prev += p;
      const r = realized(results, week.n, d);
      if (r !== null) { registrados++; real += r; prevReg += p; }
    }
    const pct = plan.cumprida_pct || 90;
    const cumprida = dias > 0 && registrados === dias && real >= prev * pct / 100;
    return { prev, real, dias, registrados, prevReg, cumprida };
  }

  function weekFatigue(results, n) {
    let max = null;
    for (const k of ["ter", "qui", "sab", "sem"]) {
      const e = entry(results, n, k);
      if (e && typeof e.fatigue === "number") max = max === null ? e.fatigue : Math.max(max, e.fatigue);
    }
    return max;
  }

  /* Duas semanas seguidas (numeração consecutiva) com cansaço 4 ou 5. */
  function fatigueWarning(plan, results) {
    let prevHigh = false;
    for (const w of plan.semanas) {
      const f = weekFatigue(results, w.n);
      const high = f !== null && f >= 4;
      if (high && prevHigh) return { weeks: [w.n - 1, w.n] };
      prevHigh = high;
    }
    return null;
  }

  function dashboard(plan, results, hojeISO) {
    const total = plan.semanas.length;
    const wn = weekOf(plan, hojeISO);
    let kmTotal = 0, prevReg = 0, realReg = 0, maiorLongao = null, maiorLongaoSemana = null, cumpridas = 0;
    for (const w of plan.semanas) {
      for (const d of DIAS) {
        const r = realized(results, w.n, d);
        if (r === null) continue;
        kmTotal += r;
        prevReg += planned(w, d);
        realReg += r;
        if (d === "sab" && (maiorLongao === null || r > maiorLongao)) { maiorLongao = r; maiorLongaoSemana = w.n; }
      }
      if (weekTotals(plan, results, w).cumprida) cumpridas++;
    }
    return {
      diasAteDesafio: diffDays(hojeISO, plan.desafio.data),
      semanaAtual: wn, totalSemanas: total,
      antesDoPlano: wn < 1, depoisDoPlano: wn > total,
      kmTotal, pctPrevisto: prevReg > 0 ? Math.round((realReg / prevReg) * 100) : null,
      maiorLongao, maiorLongaoSemana, cumpridas,
    };
  }

  function validatePlan(plan) {
    const erros = [];
    if (!plan || typeof plan !== "object") return ["Plano inválido."];
    if (isNaN(parseISO(plan.inicio))) erros.push("Data de início inválida.");
    else if (new Date(parseISO(plan.inicio)).getUTCDay() !== 1) erros.push("O início do plano precisa ser uma segunda-feira.");
    if (!plan.desafio || isNaN(parseISO(plan.desafio.data))) erros.push("Data do desafio inválida.");
    if (!plan.competicao || isNaN(parseISO(plan.competicao.data))) erros.push("Data da competição inválida.");
    if (!Array.isArray(plan.semanas) || plan.semanas.length === 0) erros.push("O plano precisa ter semanas.");
    else plan.semanas.forEach((w, i) => {
      if (w.n !== i + 1) erros.push("Semana fora de ordem na posição " + (i + 1) + ".");
      for (const c of ["terca", "quinta", "sabado"]) {
        const v = w[c];
        if (v === null) { if (c !== "quinta") erros.push("Semana " + w.n + ": " + c + " não pode ficar vazio."); continue; }
        if (typeof v !== "number" || !isFinite(v) || v < 0 || v > 200) erros.push("Semana " + w.n + ": km inválido em " + c + ".");
      }
    });
    return erros;
  }

  return { DIAS, DIA_CAMPO, DIA_OFFSET, DIA_NOME, parseISO, toISO, addDays, diffDays, todayISO, fmtBR,
    weekStart, dayDate, weekOf, parseKm, fmtKm, planned, entry, realized, weekTotals, weekFatigue,
    fatigueWarning, dashboard, validatePlan };
});
