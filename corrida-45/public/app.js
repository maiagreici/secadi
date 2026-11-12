/* Interface do app "45 km aos 45". Todo texto visível em português do Brasil. */
(function () {
  const L = window.Logic;
  const NOMES = { ter: "Terça", qui: "Quinta", sab: "Sábado" };
  const SEQ = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
  let S = null; // { plan, results }
  let hoje = L.todayISO();
  let view = "hoje";
  let semSel = null;
  const app = document.getElementById("app");

  /* ---------- utilidades ---------- */
  function h(tag, attrs, ...filhos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (k === "html") e.innerHTML = v;
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) e.append(f.nodeType ? f : document.createTextNode(f));
    return e;
  }
  let toastT;
  function aviso(msg, erro) {
    const t = document.getElementById("aviso");
    t.textContent = msg; t.className = "toast on" + (erro ? " erro" : "");
    clearTimeout(toastT); toastT = setTimeout(() => (t.className = "toast"), erro ? 5000 : 2200);
  }
  async function api(path, opts) {
    let r;
    try { r = await fetch(path, opts); } catch (e) { throw new Error("Sem conexão com o app. Verifique se ele está aberto no computador."); }
    const txt = await r.text();
    let j = {}; try { j = JSON.parse(txt); } catch (_) {}
    if (!r.ok) throw new Error(j.erro || "Erro ao falar com o app.");
    return j;
  }
  const put = (path, body) => api(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const hora = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dataHora = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "");
  const entry = (key) => (S.results.entries || {})[key] || {};

  async function salvarCampo(key, campo, valor) {
    try {
      const r = await put("/api/entry", { key, fields: { [campo]: valor } });
      if (r.entry) S.results.entries[key] = r.entry; else delete S.results.entries[key];
      aviso("Salvo às " + hora());
      return true;
    } catch (e) { aviso(e.message, true); return false; }
  }

  /* ---------- semana ---------- */
  function semanaAtualN() {
    const n = L.weekOf(S.plan, hoje);
    return Math.min(Math.max(n, 1), S.plan.semanas.length);
  }
  function rotuloDia(w, dia) {
    const data = L.dayDate(S.plan, w.n, dia);
    if (data === S.plan.desafio.data) return "DESAFIO";
    if (data === S.plan.competicao.data) return "COMPETIÇÃO";
    if (dia === "ter") return S.plan.rotina.ter;
    if (dia === "sab") return S.plan.rotina.sab;
    return "Corrida";
  }
  function rotinaNaoCorrida(w, dia) {
    if (dia === "qui" && w.quinta === 0) return "Descanso";
    if (dia === "sab" && w.sabado === 0) return "Descanso";
    if (dia === "ter" && w.terca === 0) return "Descanso";
    return S.plan.rotina[dia];
  }

  /* ---------- campos opcionais ---------- */
  function campoTexto(key, campo, rotulo, tipo, extra) {
    const e = entry(key);
    const inp = h("input", { type: "text", inputmode: tipo === "num" ? "decimal" : null, value: e[campo] ?? "", "aria-label": rotulo, ...(extra || {}) });
    inp.addEventListener("change", async () => {
      const antes = entry(key)[campo];
      const novo = inp.value.trim();
      if (novo === "" && antes != null && !confirm("Apagar este valor (" + rotulo + ")?")) { inp.value = antes; return; }
      const ok = await salvarCampo(key, campo, novo === "" ? null : novo);
      if (!ok) inp.value = antes ?? "";
    });
    return [h("label", {}, rotulo), inp];
  }
  function opcionais(key, titulo) {
    const e = entry(key);
    const niveis = h("div", { class: "nivel", role: "group", "aria-label": "Nível de cansaço de 1 a 5" });
    for (let i = 1; i <= 5; i++) {
      const b = h("button", { type: "button", "aria-pressed": String(e.fatigue === i) }, String(i));
      b.addEventListener("click", async () => {
        const atual = entry(key).fatigue;
        if (atual === i) { if (!confirm("Apagar o nível de cansaço?")) return; await salvarCampo(key, "fatigue", null); }
        else await salvarCampo(key, "fatigue", i);
        [...niveis.children].forEach((x, idx) => x.setAttribute("aria-pressed", String(entry(key).fatigue === idx + 1)));
      });
      niveis.append(b);
    }
    const dor = h("input", { type: "checkbox", id: "dor-" + key, style: "width:24px;height:24px" });
    dor.checked = e.pain === true;
    const onde = h("div", {});
    const mostraOnde = () => { onde.innerHTML = ""; if (dor.checked) onde.append(...campoTexto(key, "painWhere", "Onde dói?", "txt")); };
    dor.addEventListener("change", async () => {
      await salvarCampo(key, "pain", dor.checked);
      mostraOnde();
    });
    mostraOnde();
    const obs = h("textarea", { "aria-label": "Observação" }, e.note ?? "");
    obs.addEventListener("change", async () => {
      const antes = entry(key).note;
      if (obs.value.trim() === "" && antes && !confirm("Apagar a observação?")) { obs.value = antes; return; }
      await salvarCampo(key, "note", obs.value.trim() === "" ? null : obs.value);
    });
    const preenchido = ["fatigue", "sleep", "hr", "pain", "note"].some((c) => e[c] != null && e[c] !== false);
    return h("details", { open: preenchido },
      h("summary", {}, titulo || "Como me senti (opcional)"),
      h("label", {}, "Nível de cansaço (1 leve, 5 muito cansada)"), niveis,
      h("div", { class: "grade2" },
        h("div", {}, ...campoTexto(key, "sleep", "Horas de sono", "num")),
        h("div", {}, ...campoTexto(key, "hr", "FC de repouso (bpm)", "num"))),
      h("label", { for: "dor-" + key, class: "linha", style: "margin-top:14px;color:var(--tx);font-size:1rem" }, dor, "Senti dor"),
      onde,
      h("label", {}, "Observação"), obs,
      e.updatedAt ? h("p", { class: "pequeno mut" }, "Última alteração: " + dataHora(e.updatedAt)) : null);
  }

  /* ---------- treino (corrida) ---------- */
  function cartaoTreino(w, dia) {
    const key = w.n + "-" + dia;
    const prev = L.planned(w, dia);
    const e = entry(key);
    const data = L.dayDate(S.plan, w.n, dia);
    const inp = h("input", { type: "text", inputmode: "decimal", autocomplete: "off", "aria-label": "Km realizados em " + NOMES[dia], value: e.km != null ? L.fmtKm(e.km) : "", placeholder: "0" });
    const msg = h("p", { class: "pequeno", style: "color:var(--bad);margin:4px 0 0", role: "alert" });
    inp.addEventListener("change", async () => {
      const antes = entry(key).km;
      const v = L.parseKm(inp.value);
      if (Number.isNaN(v)) { inp.classList.add("erro"); msg.textContent = "Digite um número maior ou igual a zero. Exemplo: 12,5"; return; }
      inp.classList.remove("erro"); msg.textContent = "";
      if (v === null && antes != null && !confirm("Apagar o km registrado?")) { inp.value = L.fmtKm(antes); return; }
      const ok = await salvarCampo(key, "km", v);
      if (ok) { inp.value = v === null ? "" : L.fmtKm(v); atualizaResumo(); } else inp.value = antes != null ? L.fmtKm(antes) : "";
    });
    return h("section", { class: "treino", "aria-label": NOMES[dia] },
      h("div", { class: "cab" },
        h("div", {}, h("b", {}, NOMES[dia] + ", " + L.fmtBR(data, true)), " ", h("span", { class: "mut" }, rotuloDia(w, dia))),
        h("span", { class: "selo alvo" }, "Previsto: " + L.fmtKm(prev) + " km")),
      h("div", { class: "km" }, h("label", { style: "margin:0;font-size:1rem;color:var(--tx)" }, "Realizado"), inp, h("span", {}, "km")),
      msg,
      opcionais(key));
  }
  let resumoEl = null;
  function atualizaResumo() {
    if (!resumoEl) return;
    const w = S.plan.semanas[semSel - 1];
    const t = L.weekTotals(S.plan, S.results, w);
    resumoEl.textContent = "Semana: " + L.fmtKm(t.real) + " km realizados de " + L.fmtKm(t.prev) + " km previstos" + (t.cumprida ? ". Semana cumprida." : ".");
  }

  function bannerCansaco() {
    const f = L.fatigueWarning(S.plan, S.results);
    if (!f) return null;
    return h("div", { class: "aviso-card", role: "note" },
      h("b", {}, "Um cuidado com você"),
      h("p", { style: "margin:6px 0 0" }, "Seu cansaço ficou em 4 ou 5 por duas semanas seguidas (semanas " + f.weeks[0] + " e " + f.weeks[1] + "). Vale pensar em reduzir a carga e conversar com um médico do esporte. Este app não faz diagnóstico."));
  }

  /* ---------- telas ---------- */
  function telaHoje() {
    const n = semSel;
    const w = S.plan.semanas[n - 1];
    const ini = L.weekStart(S.plan, n), fim = L.addDays(ini, 6);
    const frag = [];
    if (L.weekOf(S.plan, hoje) < 1) frag.push(h("div", { class: "card" }, "O plano começa em " + L.fmtBR(S.plan.inicio) + ". Abaixo está a semana 1."));
    if (L.weekOf(S.plan, hoje) > S.plan.semanas.length) frag.push(h("div", { class: "card" }, "O plano já terminou. Abaixo está a última semana."));
    const b = bannerCansaco(); if (b) frag.push(b);
    const nav = h("div", { class: "linha espaca", style: "margin-bottom:8px" },
      h("button", { class: "btn-leve", type: "button", disabled: n <= 1, onclick: () => { semSel = n - 1; render(); } }, "Anterior"),
      h("span", { class: "mut pequeno" }, n === L.weekOf(S.plan, hoje) ? "Semana atual" : "Outra semana"),
      h("button", { class: "btn-leve", type: "button", disabled: n >= S.plan.semanas.length, onclick: () => { semSel = n + 1; render(); } }, "Próxima"));
    frag.push(nav);
    const cab = h("div", { class: "card" },
      h("h2", {}, "Semana " + n + " de " + S.plan.semanas.length + " ",
        w.provisoria ? h("span", { class: "selo prov" }, "provisória") : null),
      h("div", { class: "mut" }, L.fmtBR(ini) + " a " + L.fmtBR(fim)),
      w.obs ? h("p", { style: "margin:8px 0 0" }, "Observação do plano: " + w.obs) : null,
      w.provisoria ? h("p", { class: "pequeno mut", style: "margin:8px 0 0" }, "Semana provisória: será refeita depois de " + L.fmtBR(S.plan.firme_ate) + ". Você pode editar na aba Mais.") : null);
    frag.push(cab);
    resumoEl = h("p", { class: "pequeno", "aria-live": "polite" });
    for (const dia of SEQ) {
      if (L.DIAS.includes(dia) && L.planned(w, dia) > 0) frag.push(cartaoTreino(w, dia));
    }
    const rot = h("div", { class: "card" }, h("h3", {}, "Rotina da semana"));
    for (const dia of SEQ) {
      const corre = L.DIAS.includes(dia) && L.planned(w, dia) > 0;
      rot.append(h("div", { class: "dia" },
        h("span", {}, h("span", { class: "n" }, L.DIA_NOME[dia]), " ", h("span", { class: "mut pequeno" }, L.fmtBR(L.dayDate(S.plan, n, dia), true))),
        h("span", { class: corre ? "" : "mut" }, corre ? rotuloDia(w, dia) + ", " + L.fmtKm(L.planned(w, dia)) + " km" : rotinaNaoCorrida(w, dia))));
    }
    frag.push(h("div", { class: "card" }, resumoEl));
    frag.push(rot);
    frag.push(h("div", { class: "card" }, h("h3", {}, "A semana como um todo"), h("p", { class: "pequeno mut", style: "margin:0" }, "Opcional. Use se preferir anotar por semana em vez de por treino."), opcionais(n + "-sem", "Como foi a semana (opcional)")));
    atualizaResumoDepois();
    return frag;
  }
  function atualizaResumoDepois() { setTimeout(atualizaResumo, 0); }

  function telaSemanas() {
    const nAtual = L.weekOf(S.plan, hoje);
    const lista = [h("p", { class: "mut pequeno" }, "Toque numa semana para registrar ou ver detalhes. Semana cumprida: todos os treinos registrados e pelo menos " + (S.plan.cumprida_pct || 90) + "% do previsto.")];
    for (const w of S.plan.semanas) {
      const t = L.weekTotals(S.plan, S.results, w);
      const pct = t.prev > 0 ? Math.min(100, Math.round((t.real / t.prev) * 100)) : 0;
      const dias = L.DIAS.filter((d) => L.planned(w, d) > 0).map((d) => NOMES[d].slice(0, 3) + " " + L.fmtKm(L.realized(S.results, w.n, d) ?? 0) + "/" + L.fmtKm(L.planned(w, d)));
      lista.push(h("a", { class: "card semana" + (w.n === nAtual ? " atual" : ""), href: "#hoje/" + w.n },
        h("div", { class: "tt" },
          h("b", {}, "Semana " + w.n + " ", h("span", { class: "mut", style: "font-weight:400" }, L.fmtBR(L.weekStart(S.plan, w.n), true) + " a " + L.fmtBR(L.addDays(L.weekStart(S.plan, w.n), 6), true))),
          h("span", {}, w.provisoria ? h("span", { class: "selo prov" }, "provisória") : null, " ",
            t.cumprida ? h("span", { class: "selo ok" }, "cumprida") : null)),
        h("div", { class: "nums" }, h("span", {}, "Previsto " + L.fmtKm(t.prev) + " km"), h("span", {}, "Realizado " + L.fmtKm(t.real) + " km")),
        h("div", { class: "nums" }, dias.join("  ·  ")),
        w.obs ? h("div", { class: "nums" }, w.obs) : null,
        h("div", { class: "barra", "aria-hidden": "true" }, h("i", { style: "width:" + pct + "%" }))));
    }
    return lista;
  }

  function graficoLongoes() {
    const ws = S.plan.semanas, N = ws.length;
    const W = 720, H = 320, m = { l: 38, r: 14, t: 16, b: 34 };
    const maxY = 48;
    const x = (n) => m.l + ((n - 1) / (N - 1)) * (W - m.l - m.r);
    const y = (v) => H - m.b - (v / maxY) * (H - m.t - m.b);
    const ns = "http://www.w3.org/2000/svg";
    const el = (t, a, txt) => { const e = document.createElementNS(ns, t); for (const [k, v] of Object.entries(a || {})) e.setAttribute(k, v); if (txt) e.textContent = txt; return e; };
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, class: "graf", role: "img", "aria-label": "Gráfico dos longões por semana: previsto em linha e realizado em pontos. A parte provisória é tracejada." });
    for (const v of [0, 10, 20, 30, 40]) {
      svg.append(el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: "var(--grid)" }), el("text", { x: m.l - 6, y: y(v) + 4, "text-anchor": "end" }, v));
    }
    ws.forEach((w) => { if (w.n === 1 || w.n % 3 === 0 || w.n === N) svg.append(el("text", { x: x(w.n), y: H - m.b + 16, "text-anchor": "middle" }, w.n)); });
    svg.append(el("text", { x: (W + m.l) / 2, y: H - 4, "text-anchor": "middle" }, "Semana"));
    // linha prevista: firme até a última semana não provisória; depois tracejada
    const longs = ws.filter((w) => w.n < N);
    const ultimaFirme = Math.max(0, ...longs.filter((w) => !w.provisoria).map((w) => w.n));
    const pts = (arr) => arr.map((w) => x(w.n) + "," + y(w.sabado)).join(" ");
    const firme = longs.filter((w) => w.n <= ultimaFirme);
    const prov = longs.filter((w) => w.n >= ultimaFirme);
    if (firme.length > 1) svg.append(el("polyline", { points: pts(firme), fill: "none", stroke: "var(--ac)", "stroke-width": 2.5 }));
    if (prov.length > 1) svg.append(el("polyline", { points: pts(prov), fill: "none", stroke: "var(--prov)", "stroke-width": 2.5, "stroke-dasharray": "6 5" }));
    // desafio
    const d = ws[N - 1];
    svg.append(el("rect", { x: x(N) - 6, y: y(d.terca) - 6, width: 12, height: 12, transform: "rotate(45 " + x(N) + " " + y(d.terca) + ")", fill: "var(--prov)" }),
      el("text", { x: x(N) - 8, y: y(d.terca) - 12, "text-anchor": "end" }, "Desafio " + L.fmtKm(d.terca) + " km"));
    const comp = ws.find((w) => L.dayDate(S.plan, w.n, "sab") === S.plan.competicao.data);
    if (comp) svg.append(el("text", { x: x(comp.n), y: y(comp.sabado) - 10, "text-anchor": "middle" }, "Competição"));
    // realizado
    ws.forEach((w) => {
      const r = L.realized(S.results, w.n, "sab");
      if (r !== null && w.n < N) svg.append(el("circle", { cx: x(w.n), cy: y(r), r: 6, fill: "var(--tx)", stroke: "var(--bg)", "stroke-width": 2 }, null));
    });
    return svg;
  }

  function telaPainel() {
    const d = L.dashboard(S.plan, S.results, hoje);
    const stat = (v, r) => h("div", { class: "stat" }, h("b", {}, v), h("span", {}, r));
    const dias = d.diasAteDesafio;
    const frag = [];
    const b = bannerCansaco(); if (b) frag.push(b);
    frag.push(h("div", { class: "stats" },
      stat(dias >= 0 ? String(dias) : "0", dias >= 0 ? "dias até " + L.fmtBR(S.plan.desafio.data) : "o desafio já passou"),
      stat(d.antesDoPlano ? "Em breve" : d.depoisDoPlano ? "Fim" : d.semanaAtual + " de " + d.totalSemanas, "semana atual"),
      stat(L.fmtKm(d.kmTotal) + " km", "km registrados"),
      stat(d.pctPrevisto === null ? "Nenhum" : d.pctPrevisto + "%", "do previsto, nos treinos registrados"),
      stat(d.maiorLongao === null ? "Nenhum" : L.fmtKm(d.maiorLongao) + " km", d.maiorLongao === null ? "maior longão feito" : "maior longão feito (semana " + d.maiorLongaoSemana + ")"),
      stat(String(d.cumpridas), "semanas cumpridas")));
    const g = h("div", { class: "card" }, h("h2", {}, "Perfil dos longões"), graficoLongoes(),
      h("div", { class: "leg" },
        h("span", {}, "Linha cheia: previsto firme"), h("span", {}, "Tracejado: previsto provisório"), h("span", {}, "Ponto escuro: realizado")));
    frag.push(g);
    return frag;
  }

  function telaCansaco() {
    const frag = [];
    const b = bannerCansaco(); if (b) frag.push(b);
    frag.push(h("p", { class: "mut pequeno" }, "Linha do tempo dos seus registros opcionais. Serve só para você acompanhar como se sente, sem diagnóstico."));
    let algum = false;
    for (const w of S.plan.semanas) {
      const itens = [];
      for (const k of ["ter", "qui", "sab", "sem"]) {
        const e = (S.results.entries || {})[w.n + "-" + k];
        if (!e || !["fatigue", "sleep", "hr", "pain", "note"].some((c) => e[c] != null && e[c] !== false)) continue;
        const data = k === "sem" ? "Semana toda" : NOMES[k] + " " + L.fmtBR(L.dayDate(S.plan, w.n, k), true);
        const f = e.fatigue;
        itens.push(h("div", { class: "dia", style: "flex-direction:column" },
          h("div", { class: "linha espaca" }, h("b", {}, data),
            f != null ? h("span", { class: "cans" + (f >= 4 ? " alto" : ""), role: "img", "aria-label": "Cansaço " + f + " de 5" }, [1, 2, 3, 4, 5].map((i) => h("i", { class: i <= f ? "on" : "" }))) : null),
          h("div", { class: "pequeno mut" }, [
            f != null ? "Cansaço " + f + "/5" : null,
            e.sleep != null ? "Sono " + L.fmtKm(e.sleep) + " h" : null,
            e.hr != null ? "FC repouso " + e.hr + " bpm" : null,
            e.pain === true ? "Dor" + (e.painWhere ? ": " + e.painWhere : "") : null,
          ].filter(Boolean).join("  ·  ")),
          e.note ? h("div", { class: "pequeno" }, e.note) : null));
      }
      if (itens.length) { algum = true; frag.push(h("div", { class: "card" }, h("h3", {}, "Semana " + w.n + " (" + L.fmtBR(L.weekStart(S.plan, w.n), true) + ")"), itens)); }
    }
    if (!algum) frag.push(h("div", { class: "card" }, "Ainda não há registros. Na aba Hoje, abra \"Como me senti\" em qualquer treino."));
    return frag;
  }

  /* ---------- Mais: plano, dados ---------- */
  function editorPlano() {
    const copia = JSON.parse(JSON.stringify(S.plan));
    const corpo = h("tbody");
    const campos = [];
    copia.semanas.forEach((w, i) => {
      const num = (campo) => {
        const inp = h("input", { type: "text", inputmode: "decimal", value: w[campo] === null ? "" : L.fmtKm(w[campo]), "aria-label": "Semana " + w.n + " " + campo, placeholder: campo === "quinta" ? "CrossFit" : "0" });
        campos.push({ inp, w, campo });
        return inp;
      };
      const prov = h("input", { type: "checkbox", "aria-label": "Semana " + w.n + " provisória", style: "width:24px;height:24px" });
      prov.checked = !!w.provisoria;
      prov.addEventListener("change", () => (w.provisoria = prov.checked));
      const obs = h("input", { type: "text", value: w.obs || "", "aria-label": "Semana " + w.n + " observação" });
      obs.addEventListener("input", () => (w.obs = obs.value));
      corpo.append(h("tr", {},
        h("td", {}, h("b", {}, w.n), h("div", { class: "mut", style: "font-size:.7rem" }, L.fmtBR(L.weekStart(S.plan, w.n), true))),
        h("td", {}, num("terca")), h("td", {}, num("quinta")), h("td", {}, num("sabado")), h("td", {}, prov), h("td", { style: "min-width:11rem" }, obs)));
    });
    const salvar = h("button", { type: "button" }, "Salvar plano");
    salvar.addEventListener("click", async () => {
      let ruim = false;
      for (const c of campos) {
        const v = L.parseKm(c.inp.value);
        if (Number.isNaN(v) || (v === null && c.campo !== "quinta")) { c.inp.classList.add("erro"); ruim = true; }
        else { c.inp.classList.remove("erro"); c.w[c.campo] = v; }
      }
      if (ruim) return aviso("Confira os campos em vermelho: use números maiores ou iguais a zero.", true);
      if (!confirm("Salvar as mudanças no plano? Uma cópia de segurança do plano atual será feita antes.")) return;
      try { await put("/api/plan", { plan: copia }); S.plan = copia; aviso("Plano salvo às " + hora()); } catch (e) { aviso(e.message, true); }
    });
    return h("div", { class: "card" }, h("h2", {}, "Editar o plano"),
      h("p", { class: "pequeno mut" }, "Km previstos por dia de corrida. Quinta vazia significa CrossFit. Zero significa descanso. As datas seguem a semana 1 em " + L.fmtBR(S.plan.inicio) + "."),
      h("div", { class: "rolagem" }, h("table", {}, h("thead", {}, h("tr", {}, ["Sem", "Terça", "Quinta", "Sábado", "Prov.", "Observação"].map((t) => h("th", {}, t)))), corpo)),
      h("div", { style: "margin-top:12px" }, salvar));
  }

  function lerArquivo(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Não consegui ler o arquivo.")); r.readAsText(file); }); }

  function blocoDados() {
    const arq = h("input", { type: "file", accept: ".json,.csv,application/json,text/csv", "aria-label": "Arquivo para importar" });
    const modo = h("select", { "aria-label": "Como importar" },
      h("option", { value: "juntar" }, "Juntar com o que já tenho (recomendado)"),
      h("option", { value: "substituir" }, "Substituir meus registros pelos do arquivo"));
    const plano = h("input", { type: "checkbox", id: "inc-plano", style: "width:24px;height:24px" });
    const btn = h("button", { type: "button" }, "Importar");
    btn.addEventListener("click", async () => {
      const f = arq.files[0];
      if (!f) return aviso("Escolha um arquivo primeiro.", true);
      const formato = f.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
      const msg = modo.value === "substituir"
        ? "Isto vai SUBSTITUIR todos os seus registros pelos do arquivo. Uma cópia de segurança será feita antes. Continuar?"
        : "Importar os registros do arquivo e juntar com os seus? Uma cópia de segurança será feita antes.";
      if (!confirm(msg)) return;
      try {
        const r = await api("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formato, conteudo: await lerArquivo(f), modo: modo.value, incluirPlano: plano.checked && formato === "json" }) });
        aviso(r.registros + " registros importados.");
        await carregar(); render();
      } catch (e) { aviso(e.message, true); }
    });
    const bk = h("div", { class: "pequeno mut" }, "Carregando cópias...");
    api("/api/backups").then((r) => {
      bk.textContent = "";
      bk.append("Pasta: " + r.pasta + ". Total de cópias: " + r.lista.length + ". Mais recente: " + (r.lista[0] ? r.lista[0].nome : "nenhuma ainda") + ".");
    }).catch(() => (bk.textContent = ""));
    return [
      h("div", { class: "card" }, h("h2", {}, "Exportar (backup)"),
        h("p", { class: "pequeno mut" }, "Baixe uma cópia dos seus registros. CSV abre no Excel ou Planilhas. JSON guarda tudo, inclusive o plano."),
        h("div", { class: "linha" }, h("a", { class: "btn", href: "/api/export.csv", download: "45km-registros.csv" }, "Exportar CSV"), h("a", { class: "btn", href: "/api/export.json", download: "45km-backup.json" }, "Exportar JSON"))),
      h("div", { class: "card" }, h("h2", {}, "Importar"),
        h("p", { class: "pequeno mut" }, "Traga registros de um arquivo exportado antes (CSV ou JSON). Nada é apagado sem sua confirmação, e uma cópia é feita antes de importar."),
        arq, h("label", {}, "Como importar"), modo,
        h("label", { for: "inc-plano", class: "linha", style: "color:var(--tx);font-size:1rem" }, plano, "Também trazer o plano (só vale para arquivo JSON)"),
        h("div", { style: "margin-top:12px" }, btn)),
      h("div", { class: "card" }, h("h2", {}, "Cópias de segurança automáticas"),
        h("p", { class: "pequeno mut" }, "Todo dia o app guarda uma cópia na pasta backups/, dentro da pasta do projeto."), bk),
    ];
  }

  function telaMais() {
    return [editorPlano(), ...blocoDados(),
      h("p", { class: "rodape" }, "Este app é só um caderno de treino. Ele não substitui orientação médica nem de treinador. Se sentir dor persistente, tontura ou cansaço fora do normal, procure um profissional de saúde.")];
  }

  /* ---------- navegação ---------- */
  function rota() {
    const [v, p] = (location.hash.replace("#", "") || "hoje").split("/");
    view = ["hoje", "semanas", "painel", "cansaco", "mais"].includes(v) ? v : "hoje";
    if (view === "hoje" && p && S) { const n = parseInt(p, 10); if (n >= 1 && n <= S.plan.semanas.length) semSel = n; }
  }
  function render() {
    if (!S) return;
    if (semSel === null) semSel = semanaAtualN();
    document.querySelectorAll("#abas a").forEach((a) => a.classList.toggle("on", a.dataset.v === view));
    const tela = { hoje: telaHoje, semanas: telaSemanas, painel: telaPainel, cansaco: telaCansaco, mais: telaMais }[view];
    const y = window.scrollY;
    app.replaceChildren(...tela().flat());
    window.scrollTo(0, view === lastView ? y : 0);
    lastView = view;
    document.getElementById("sub").textContent = "Meta: " + L.fmtBR(S.plan.desafio.data) + ", " + L.fmtKm(S.plan.desafio.km) + " km de uma vez";
  }
  let lastView = null;

  async function carregar() { S = await api("/api/state"); hoje = L.todayISO(); }

  document.getElementById("tema").addEventListener("click", () => {
    const r = document.documentElement;
    const atual = r.getAttribute("data-theme");
    const prox = atual === "dark" ? "light" : atual === "light" ? null : "dark";
    if (prox) r.setAttribute("data-theme", prox); else r.removeAttribute("data-theme");
    try { prox ? localStorage.setItem("tema", prox) : localStorage.removeItem("tema"); } catch (_) {}
    aviso("Tema: " + (prox === "dark" ? "escuro" : prox === "light" ? "claro" : "automático"));
  });
  try { const t = localStorage.getItem("tema"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (_) {}

  window.addEventListener("hashchange", () => { rota(); render(); });
  carregar().then(() => { rota(); render(); }).catch((e) => {
    app.append(h("div", { class: "card" }, h("b", {}, "Não consegui abrir os dados."), h("p", {}, e.message)));
  });
})();
