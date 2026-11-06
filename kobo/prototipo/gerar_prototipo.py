#!/usr/bin/env python3
"""Gera prototipo_semanaN.html a partir dos XLSForms da semana N (professores e gestores).
Uso: python3 prototipo/gerar_prototipo.py 3"""
import json
import os
import sys

import openpyxl

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
SEMANA = sys.argv[1] if len(sys.argv) > 1 else "3"
CURSOS = [("professores", "Professores", "professores_semana%s_diagnostico.xlsx" % SEMANA),
          ("gestores", "Gestores", "gestores_semana%s_diagnostico.xlsx" % SEMANA)]


def ler(path):
    wb = openpyxl.load_workbook(path)
    h = [c.value for c in wb["survey"][1]]
    rows = []
    for r in wb["survey"].iter_rows(min_row=2, values_only=True):
        d = dict(zip(h, r))
        rows.append({"type": d.get("type") or "", "name": d.get("name") or "",
                     "label": d.get("label::Português (pt)") or "", "hint": d.get("hint::Português (pt)") or "",
                     "required": str(d.get("required") or ""), "relevant": d.get("relevant") or "",
                     "appearance": d.get("appearance") or "", "constraint": d.get("constraint") or "",
                     "constraint_message": d.get("constraint_message::Português (pt)") or "",
                     "choice_filter": d.get("choice_filter") or ""})
    ch = {}
    for r in wb["choices"].iter_rows(min_row=2, values_only=True):
        if r[0]:
            ch.setdefault(r[0], []).append([r[1], r[2]])
    st = [c.value for c in wb["settings"][2]]
    return {"rows": rows, "choices": ch, "title": st[0], "id": st[1]}


dados = {}
for chave, nome, arq in CURSOS:
    d = ler(os.path.join(RAIZ, arq))
    d["curso"] = nome
    dados[chave] = d
html = open(os.path.join(AQUI, "template.html"), encoding="utf-8").read()
html = html.replace("/*DATA*/", json.dumps(dados, ensure_ascii=False))
saida = os.path.join(RAIZ, "prototipo_semana%s.html" % SEMANA)
open(saida, "w", encoding="utf-8").write(html)
print(saida, len(html) // 1024, "KB")
