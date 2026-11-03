"""Ajustes da Semana 3 (Etapas 4 e 5) para gestores e professores."""
import re

CODE = re.compile(r"\s*\((?:RISK|MAP|CAP|SWOT)_[A-Z_*]*\)")
DICAS = {
    "swot_forcas": "Aspectos positivos INTERNOS, que dependem de vocês. Ex.: equipe engajada, horta em funcionamento, "
                   "apoio da direção.",
    "swot_fragilidades": "Aspectos INTERNOS que dificultam ou limitam. Ex.: falta de formação, ausência de plano de "
                         "emergência.",
    "swot_oportunidades": "Aspectos EXTERNOS favoráveis. Ex.: parceria com universidade, programa público de "
                          "educação ambiental.",
    "swot_ameacas": "Aspectos EXTERNOS que trazem risco. Ex.: enchentes recorrentes, corte de recursos.",
}


def numerar(rows, stage, lab):
    dentro, d, n = False, 0, 0
    for r in rows:
        t = r["type"]
        if not dentro:
            if t == "begin_group" and r.get("name") == "etapa%d" % stage:
                dentro, d = True, 1
            continue
        if t.startswith("begin_"):
            d += 1
            continue
        if t.startswith("end_"):
            d -= 1
            if d == 0:
                break
            continue
        if t == "note" or (r.get("name") or "").endswith("_outro") or not r.get(lab):
            continue
        n += 1
        r[lab] = "Q%d.%d. %s" % (stage, n, re.sub(r"^Q\d+\.\d+[a-z]*\.\s*", "", r[lab]))


def apply(rows, lab, hint, add_choice):
    by = {r["name"]: r for r in rows if r.get("name") and not r["type"].startswith("end")}
    for r in rows:
        for k in (lab, hint):
            if isinstance(r.get(k), str) and CODE.search(r[k]):
                r[k] = CODE.sub("", r[k])
    by["risco"][lab] = "Ficha de risco — uma ficha para cada ameaça selecionada na Q4.1"
    by["cartografia"][lab] = "Cartografia participativa"
    by["risco_ameaca"]["choice_filter"] = "selected(${q4_1}, name)"
    by["risco_ameaca"][hint] = "Aparecem apenas as ameaças marcadas na Q4.1."
    add_choice("prio_1a5", "nao_sabe", "Não sabe", None)
    for nome, texto in DICAS.items():
        by[nome][hint] = texto
    numerar(rows, 4, lab)
    numerar(rows, 5, lab)
