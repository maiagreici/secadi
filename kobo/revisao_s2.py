"""Ajustes da revisão da Semana 2 (professores e gestores). Funciona sobre linhas-dicionário do XLSForm."""
import re


def apply(rows, lab, hint, add_choice, keep=False):
    def idx(name=None, label_re=None):
        for i, r in enumerate(rows):
            if r["type"].startswith("end"):
                continue
            if name is not None and r.get("name") == name:
                return i
            if label_re and re.search(label_re, r.get(lab) or ""):
                return i
        return None

    def prefix(i):
        m = re.match(r"^(Q\d+\.\d+[a-z]*\.\s*)", rows[i].get(lab) or "")
        return m.group(1) if m else ""

    def setlabel(i, text, h=None, protect=False):
        rows[i][lab] = prefix(i) + text
        if h is not None:
            rows[i][hint] = h
        if protect and keep:
            rows[i]["keep"] = True

    def drop(*names):
        alvo = set(names) | {n + "_outro" for n in names}
        rows[:] = [r for r in rows if r.get("name") not in alvo]

    def after(i, new):
        j = i
        while j + 1 < len(rows) and (rows[j + 1].get("name") or "") == rows[i]["name"] + "_outro":
            j += 1
        rows[j + 1:j + 1] = new

    setlabel(idx("q2_7"), "Como ocorre a articulação da educação ambiental entre áreas/disciplinas?")
    setlabel(idx("q2_18"), "Qual problema territorial foi abordado?")
    setlabel(idx("q2_20"), "Quais foram os resultados dessa atividade (ex. O que essa atividade mudou ou gerou?)")
    setlabel(idx("q2_24"), "Quais métodos/estratégias a escola já utilizou em práticas de Educação Ambiental?", protect=True)
    setlabel(idx("q2_26"), "Frequência de uso pedagógico dos espaços do entorno da escola, como aulas de campo, visitas e "
             "trilhas e outras atividades educativas fora da sala de aula.", protect=True)
    i = idx("q2_27")
    after(i, [{"type": "text", "name": "q2_27_quais", lab: "Quais problemas locais/territoriais são abordados?",
               "relevant": "${q2_27}='sim'", "appearance": "multiline"}])
    add_choice("confianca", "nao_se_aplica", "Não se aplica", None)
    setlabel(idx("q2_34"), "Que tipo de apoio faria diferença para integração da Educação Ambiental no território escolar?",
             protect=True)
    setlabel(idx("q2_37"), "Materiais didáticos utilizados (para Educação Ambiental e/ou no dia a dia escolar)",
             "Indique todos os que se aplicam, tanto os usados especificamente em Educação Ambiental quanto os do dia a "
             "dia escolar.")
    setlabel(idx("q2_39"), "Quais materiais fazem falta?")
    drop("e2_leitura", "q2_42", "q2_43", "q3_5")
    add_choice("quem_part", "instituicao_parceira", "Instituição parceira", "outro")
    i = idx("q3_10")
    after(i, [{"type": "text", "name": "q3_10_quais", lab: "Quais mecanismos de escuta existem?",
               "relevant": "${q3_10}='sim'", "appearance": "multiline"}])
    j = idx(label_re=r"instâncias de decisão colegiada")
    if j is not None:
        setlabel(j, "Quais instâncias de decisão colegiada existem e funcionam na escola?", protect=True)
    setlabel(idx(label_re=r"Quais atores são prioritários"),
             "Quais atores são prioritários para fortalecer a relação da escola com o território? (NET_PRIORITY_ACTORS)",
             protect=True)
