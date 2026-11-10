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


E8_TEXTO = ("**Este formulário é um convite para planejar a parte de mobilização comunitária da sua proposta de ação "
            "educativa:** a educomunicação, ou seja, como vocês vão informar, ouvir e envolver a comunidade na ação. "
            "Retome o que foi trabalhado no módulo do curso sobre Educomunicação para responder. Responda uma vez para "
            "cada ação.")
E8_GEST = ("**Este formulário completa o seu Plano de Implementação e Monitoramento da EA:** a educomunicação é a parte "
           "de articulação com atores territoriais e comunitários e de mobilização, ou seja, como vocês vão informar, "
           "ouvir e envolver a comunidade nas ações. Retome o que foi trabalhado no módulo do curso sobre "
           "Educomunicação para responder. Responda uma vez para cada ação.")
E9_GEST = ("Aqui você define os **indicadores e as estratégias de monitoramento** das ações do seu plano. Indicador é uma "
           "medida que mostra se a ação está funcionando. Exemplos: nº de oficinas realizadas (processo); % de "
           "famílias presentes (participação); redução de alagamentos no pátio (resultado).")
E10_TEXTO = ("**Antes de começar:** para responder a esta síntese, consulte o histórico das suas respostas das semanas "
             "anteriores (Semanas 1 a 4), disponibilizado pela equipe do curso.\n\nEsta etapa não substitui a leitura já "
             "construída — ela organiza uma síntese final a partir do que foi registrado.")


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
    by["e10_nota"][lab] = E10_TEXTO
    esclarece(rows, lab, hint, ensure_list)
    for _n in ("com_acao", "mon_acao"):
        by[_n][lab] = re.sub(r"Ação: título do problema confirmado",
                             "Título do plano" if gestores else "Título da proposta de ação educativa", by[_n][lab])
    notas = {"comunic": ("e8_nota", E8_GEST if gestores else E8_TEXTO),
             "monit": ("e9_nota", E9_GEST if gestores else "Indicador é uma medida que mostra se a ação está funcionando. "
                                  "Exemplos: nº de oficinas realizadas (processo); % de famílias presentes "
                                  "(participação); redução de alagamentos no pátio (resultado).")}
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


MOMENTOS = [("antes", "Antes da ação (divulgação e mobilização)"), ("durante", "Durante a ação"),
            ("depois", "Depois da ação (devolutiva e prestação de contas)")]


def esclarece(rows, lab, hint, ensure_list):
    """Torna mais claras duas perguntas que geraram dúvida: momento da comunicação e linha de base."""
    ensure_list("com_momento", MOMENTOS)
    by = {r["name"]: r for r in rows if r.get("name") and not r["type"].startswith("end")}

    def pref(r):
        m = re.match(r"^(Q\d+\.\d+\.\s*)", r.get(lab) or "")
        return m.group(1) if m else ""

    r = by["com_timing"]
    r["type"] = "select_multiple com_momento"
    r["appearance"] = None
    r[lab] = pref(r) + "Em que momento a comunicação será feita, em relação à ação?"
    r[hint] = "Marque todos os momentos em que vocês vão se comunicar com o público."
    r = by["mon_sabe_baseline"]
    r[lab] = pref(r) + "Já temos o valor atual deste indicador (a linha de base)?"
    r[hint] = ("Linha de base é o ponto de partida: como está hoje, antes da ação. Ex.: hoje 30% das famílias "
               "participam das reuniões.")
    by["mon_baseline"][hint] = "Informe o valor de hoje. Ex.: 30% das famílias participam das reuniões."
