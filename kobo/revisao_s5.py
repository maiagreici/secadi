"""Ajustes da Semana 5 (Etapas 8 e 9) para gestores e professores."""
import re
from revisao_s4 import itens

CODE = re.compile(r"\s*\((?:COM|MON)_[A-Z_]+\)")
LISTAS_GEST = {
    "com_midia_gest": ["Cartaz", "Rádio (escolar ou institucional)", "Vídeo", "Redes sociais", "Mural / jornal mural",
                       "Teatro", "Podcast", "Site ou portal", "E-mail ou newsletter", "Ofício ou circular", "Outro"],
    "com_produz_gest": ["Estudantes", "Professores(as)", "Equipe de comunicação (escola ou secretaria)",
                        "Equipes técnicas", "Parceiros externos", "Outro"],
    "com_publico_gest": ["Estudantes", "Professores(as)", "Famílias", "Comunidade", "Poder público",
                         "Gestores(as) e equipes da rede", "Outro"],
}
TROCA = {"com_media": "com_midia_gest", "com_producers": "com_produz_gest", "com_audience": "com_publico_gest"}


def apply(rows, lab, hint, ensure_list, gestores):
    by = {r["name"]: r for r in rows if r.get("name") and not r["type"].startswith("end")}
    if gestores:
        for nome, its in LISTAS_GEST.items():
            ensure_list(nome, itens(its))
        for nome, lista in TROCA.items():
            by[nome]["type"] = by[nome]["type"].split()[0] + " " + lista
    for r in rows:
        for k in (lab, hint):
            if isinstance(r.get(k), str) and CODE.search(r[k]):
                r[k] = CODE.sub("", r[k])
    by["mon_qual_change"][hint] = "Preencha apenas se a ação já começou."
    notas = {"comunic": ("e8_nota", "Educomunicação é o uso da comunicação para engajar as pessoas na ação: como vocês "
                                    "vão informar, ouvir e envolver o público. Responda uma vez para cada ação."),
             "monit": ("e9_nota", "Indicador é uma medida que mostra se a ação está funcionando. Exemplos: nº de oficinas "
                                  "realizadas (processo); % de famílias presentes (participação); redução de "
                                  "alagamentos no pátio (resultado).")}
    for rep, (nome, texto) in notas.items():
        i = next(k for k, r in enumerate(rows) if r.get("name") == rep)
        rows.insert(i, {"type": "note", "name": nome, lab: texto})
    for st in (8, 9):
        dentro, d, n = False, 0, 0
        for r in rows:
            t = r["type"]
            if not dentro:
                if t == "begin_group" and r.get("name") == "etapa%d" % st:
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
            r[lab] = "Q%d.%d. %s" % (st, n, r[lab])
