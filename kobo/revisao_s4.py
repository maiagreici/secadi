"""Ajustes da Semana 4 (Etapas 6 e 7) para gestores e professores."""
import re
import unicodedata

CODE = re.compile(r"\s*\((?:PRI|ACT)_[A-Z_]+(?:\s*/\s*(?:PRI|ACT)_[A-Z_]+)?\)")


def slug(t):
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    t = re.sub(r"\(.*?\)", "", t)
    return (re.sub(r"[^a-zA-Z0-9]+", "_", t).strip("_").lower()[:32]) or "x"


def itens(labels):
    out, used = [], set()
    for lab in labels:
        n = "outro" if re.fullmatch(r"Outr[oa]s?", lab) else slug(lab)
        base, i = n, 2
        while n in used:
            n, i = "%s_%d" % (base, i), i + 1
        used.add(n)
        out.append((n, lab))
    return out


BMA_NS = ["Baixa", "Média", "Alta", "Não sabe"]
LISTAS_GEST = {
    "abrangencia_gest": ["Individual", "Uma turma ou setor", "Toda a escola ou unidade", "Toda a rede", "Comunidade",
                         "Território", "Não sabe"],
    "afetados_gest": ["Estudantes", "Professores(as)", "Funcionários(as) e equipes técnicas", "Famílias",
                      "Comunidade", "Outro"],
    "decisao_part_gest": ["Estudantes", "Professores(as)", "Gestão", "Equipes técnicas", "Famílias", "Comunidade",
                          "Conselho escolar ou conselhos locais", "Outro"],
    "publicos_gest": ["Estudantes", "Professores(as)", "Famílias", "Comunidade", "Gestão", "Equipes técnicas",
                      "Outro"],
    "dependencias_gest": ["Aprovação da gestão ou da secretaria", "Recursos financeiros", "Parceria externa",
                          "Formação prévia", "Nenhuma", "Outra"],
    "evid_exec_gest": ["Fotos", "Lista de presença", "Produção dos estudantes ou da rede", "Registro em ata",
                       "Depoimentos", "Outro"],
}
TROCA_GEST = {"pri_abrangencia": "abrangencia_gest", "pri_afetados": "afetados_gest",
              "pri_decisao_part": "decisao_part_gest", "pri_sel_participantes": "decisao_part_gest",
              "act_audiences": "publicos_gest", "act_dependencies": "dependencias_gest",
              "act_execution_evidence": "evid_exec_gest"}


def e6_texto(gestores):
    if gestores:
        abre = ("**Esta atividade é uma proposta pedagógica:** é um exercício de planejamento do curso. Você vai "
                "escolher **um** problema e transformá-lo em um plano de ação.\n\n")
        p1 = "da escola, da rede ou do território"
        p2 = "da escola ou da rede"
        fecha = "Use o que você registrou nas semanas anteriores (riscos, FOFA, território). "
    else:
        abre = ("**Esta atividade é uma proposta pedagógica:** é um exercício do curso para escolher e analisar "
                "um problema. **Os planos de ação serão elaborados apenas nos questionários dos gestores.** Aqui você "
                "escolhe e analisa o problema.\n\n")
        p1 = "da escola ou do território"
        p2 = "da escola"
        fecha = "Use o que você registrou nas semanas anteriores (riscos, FOFA, território). "
    return (abre + "**Como escolher o problema a analisar.** Pode ser:\n"
            "(1) um **problema socioambiental " + p1 + "**" +
            (", a partir do qual você vai elaborar uma **proposta de plano de ação**; ou\n" if gestores else "; ou\n") +
            "(2) um **problema ambiental " + p2 + " em relação ao qual já existe uma ação em andamento** (pode ser "
            "uma ação que já está acontecendo)" +
            (", que você vai descrever e organizar neste plano.\n\n" if gestores else ".\n\n") +
            fecha + "Se quiser analisar mais de um problema, use \"Adicionar\"; ao final, indique **1 prioridade**. "
            "Se precisar de ajuda, procure o(a) tutor(a).")


def apply(rows, lab, hint, cm, ensure_list, add_choice, gestores):
    by = {r["name"]: r for r in rows if r.get("name") and not r["type"].startswith("end")}

    def tipo(nome, lista):
        by[nome]["type"] = by[nome]["type"].split()[0] + " " + lista

    # nota da Etapa 6 (sem o texto do sistema antigo)
    by["e6_nota"][lab] = e6_texto(gestores)
    if gestores:
        by["e6_nota"]["keep"] = True
    # "Não sabe" em gravidade, urgência e abrangência
    ensure_list("bma_ns", itens(BMA_NS))
    tipo("pri_gravidade", "bma_ns")
    tipo("pri_urgencia", "bma_ns")
    if gestores:
        for nome, itens_l in LISTAS_GEST.items():
            ensure_list(nome, itens(itens_l))
        for nome, lista in TROCA_GEST.items():
            tipo(nome, lista)
    else:
        add_choice("abrangencia", "nao_sabe", "Não sabe", None)
    # datas
    for n in ("act_ativ_inicio", "act_ativ_termino", "act_start"):
        by[n]["type"] = "date"
    by["act_ativ_termino"]["constraint"] = ". = '' or ${act_ativ_inicio} = '' or . >= ${act_ativ_inicio}"
    by["act_ativ_termino"][cm] = "O término não pode ser anterior ao início."
    # obrigatoriedade
    for n in ("pri_top_problems", "act_evidence", "act_ativ_desc"):
        by[n]["required"] = None
    # códigos internos fora dos títulos
    for r in rows:
        for k in (lab, hint):
            if isinstance(r.get(k), str) and CODE.search(r[k]):
                r[k] = CODE.sub("", r[k])
    by["pri_problema"][lab] = "Problema confirmado"
    # numeração das Etapas 6 e 7
    for st in (6, 7):
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


def rev3(rows, lab, hint, gestores):
    """Semana 4, revisão 3: uma prioridade (teste), sem o campo de evidências; plano de ação só nos gestores."""
    from revisao_s3 import numerar

    def idx(nome):
        return next(i for i, r in enumerate(rows) if r.get("name") == nome and not r["type"].startswith("end"))

    def fim(i):
        d = 0
        for j in range(i, len(rows)):
            if rows[j]["type"].startswith("begin_"):
                d += 1
            elif rows[j]["type"].startswith("end_"):
                d -= 1
                if d == 0:
                    return j

    del rows[idx("pri_evidencias")]
    rows[idx("pri_expected_change")][lab] = "Que mudança se espera ao escolher este problema como prioridade?"
    rows[idx("pri_justification")][lab] = "Por que este problema é a prioridade agora?"
    rows[idx("pri_top_problems")][lab] = "Selecione 1 prioridade — informe o título do problema escolhido"
    n = rows[idx("e6_nota")]
    n[lab] = e6_texto(gestores)
    if gestores:
        n["keep"] = True
        i = idx("plano")
        j = fim(i)
        rows[i]["type"] = "begin_group"
        rows[j]["type"] = "end_group"
        rows[i][lab] = "Plano de ação para o problema prioritário"
    else:
        i = idx("etapa7")
        del rows[i:fim(i) + 1]
    numerar(rows, 6, lab)
    numerar(rows, 7, lab)
