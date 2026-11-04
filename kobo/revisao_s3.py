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


def apply(rows, lab, hint, add_choice, relabel=None, gestores=False):
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
    if relabel:
        esr(rows, lab, hint, relabel, gestores)


MARC = {"lacuna": "Não sabemos avaliar este risco com segurança",
        "aval_externa": "Precisa de avaliação técnica externa (Defesa Civil, universidade etc.)",
        "selecionado": "Este risco deve entrar no planejamento (Leitura Integrada e Plano de Ação)"}


def esr(rows, lab, hint, relabel, gestores):
    """Revisão da Semana 3 (ESR): esclarece perguntas que geraram dúvida."""
    by = {r["name"]: r for r in rows if r.get("name") and not r["type"].startswith("end")}

    def prefixo(r):
        m = re.match(r"^(Q\d+\.\d+[a-z]*\.\s*)", r.get(lab) or "")
        return m.group(1) if m else ""

    def seta(nome, label=None, dica=None, keep=False):
        r = by[nome]
        if label is not None:
            r[lab] = prefixo(r) + label
        if dica is not None:
            r[hint] = dica
        if keep and gestores:
            r["keep"] = True

    onde = "na instituição (escola ou secretaria) e na comunidade" if gestores else "na escola e na comunidade"
    seta("risco_capacidades", "Capacidades de resposta já existentes " + onde,
         "Marque o que já existe HOJE, " + onde + ", para responder a este risco (equipes, planos, alertas, apoio externo).",
         keep=True)
    seta("risco_prob", "Probabilidade percebida de este risco acontecer (não é medição técnica)",
         "É a chance de a ameaça ocorrer de novo, na sua percepção. Não é sobre a capacidade de responder a ela.")
    seta("risco_grav", "Gravidade potencial percebida, caso este risco aconteça",
         "É o tamanho do dano se a ameaça ocorrer, na sua percepção.")
    seta("risco_evid", "Evidências associadas a este risco",
         "Registre o que mostra que este risco existe: fatos, registros, fotos, notícias, documentos ou relatos. "
         "Ex.: \"alagamento de 2023, registrado em fotos\"; \"relato de moradores antigos\".")
    seta("risco_marcacoes", "Encaminhamentos sobre este risco (marque o que se aplica)",
         "Se não houver nada a marcar, deixe em branco.")
    for nome, label in MARC.items():
        relabel("marc_risco", nome, label)
    seta("map_nota", "Cartografia participativa é a construção coletiva de um mapa do território. Como fazer: "
         "(1) desenhem juntos o mapa da comunidade ou do entorno, em papel grande ou sobre uma imagem de mapa; "
         "(2) marquem com cores ou símbolos, e façam uma legenda: zonas de risco, de insegurança, de afeto, recursos e "
         "pontos de apoio, lugares de memória e áreas de cuidado/preservação; (3) fotografem o mapa e anexem a imagem "
         "mais abaixo; (4) registrem o que surgiu de novo e se houve diferenças de percepção. Se tiver dúvidas, "
         "procure o(a) tutor(a) antes de preencher.")
    seta("swot_rel_nota", "Relações estratégicas: ligue o que você listou acima. Escolha UM item de cada lado e explique "
         "a relação em uma ou duas frases. Se não conseguir, deixe em branco.")
    seta("swot_rel_forca_ameaca", "Como uma força pode responder a uma ameaça?",
         "Escolha uma força e uma ameaça que você listou. Ex.: \"A equipe engajada (força) pode organizar simulados "
         "para as enchentes (ameaça).\"")
    seta("swot_rel_oport_fragil", "Como uma oportunidade pode reduzir uma fragilidade?",
         "Escolha uma oportunidade e uma fragilidade que você listou. Ex.: \"A parceria com a universidade "
         "(oportunidade) pode suprir a falta de formação (fragilidade).\"")
    seta("swot_rel_fragil_ameaca", "Como uma fragilidade agrava uma ameaça?",
         "Escolha uma fragilidade e uma ameaça que você listou. Ex.: \"Sem plano de emergência (fragilidade), as "
         "enchentes (ameaça) interrompem as aulas por mais tempo.\"")


def rev2(rows, lab, hint, ensure_list, gestores):
    """Revisão 2 da Semana 3: ficha logo após a Q4.1, plano de contingência, cartografia opcional, FOFA e
    capacidades simplificados, sem o espaço de evidências."""
    onde = "na escola ou na rede (secretaria)" if gestores else "na escola"
    de = "da escola ou da rede" if gestores else "da escola"

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

    def remover(*nomes):
        for n in nomes:
            i = idx(n)
            j = fim(i) if rows[i]["type"].startswith("begin_") else i
            del rows[i:j + 1]

    def seta(nome, label=None, dica=None, keep=True):
        r = rows[idx(nome)]
        if label is not None:
            r[lab] = label
        if dica is not None:
            r[hint] = dica
        if keep and gestores:
            r["keep"] = True
        return r

    # sem o espaço de evidências e sem as relações estratégicas / cinco campos de capacidades
    remover("evid_e4", "swot_rel_nota", "swot_rel_forca_ameaca", "swot_rel_oport_fragil", "swot_rel_fragil_ameaca",
            "cap_pedagogical", "cap_social", "cap_institutional", "cap_territorial", "cap_material")

    # ficha de risco logo após a Q4.1
    i = idx("risco")
    bloco = rows[i:fim(i) + 1]
    del rows[i:fim(i) + 1]
    k = idx("q4_1")
    while k + 1 < len(rows) and (rows[k + 1].get("name") or "") == "q4_1_outro":
        k += 1
    rows[k + 1:k + 1] = bloco
    seta("q4_1", dica="Para cada evento marcado aqui, você vai preencher uma ficha de risco logo abaixo.", keep=False)
    seta("risco", "Ficha de risco: PREENCHA UMA FICHA PARA CADA EVENTO CLIMÁTICO marcado na Q4.1", keep=False)
    seta("risco_nota", "**ATENÇÃO: uma ficha para cada evento climático.** Se você marcou 3 eventos na Q4.1, preencha "
         "3 fichas: use \"Adicionar\" para criar cada nova ficha e escolha o evento no primeiro campo.", keep=False)

    # plano de contingência (após o apoio técnico, antes da cartografia)
    ensure_list("plano_cont", [("sim", "Sim"), ("nao", "Não"), ("em_elaboracao", "Em elaboração"),
                               ("nao_sabemos", "Não sabemos")])
    if gestores:
        pergunta = "O local de atuação (escola ou secretaria) possui plano de contingência para eventos climáticos?"
        dica = ("Plano de contingência é o documento ou combinado que define o que fazer antes, durante e depois de um "
                "evento (ex.: rotas de evacuação, responsáveis, contatos de emergência). Se você atua em secretaria, "
                "responda também sobre as escolas da rede.")
    else:
        pergunta = "A escola possui plano de contingência para eventos climáticos?"
        dica = ("Plano de contingência é o documento ou combinado que define o que fazer antes, durante e depois de um "
                "evento (ex.: rotas de evacuação, responsáveis, contatos de emergência).")
    k = idx("q4_8")
    novo = [{"type": "select_one plano_cont", "name": "q4_cont", lab: pergunta, hint: dica},
            {"type": "text", "name": "q4_cont_desc", lab: "Descreva brevemente o que o plano prevê",
             "relevant": "${q4_cont}='sim' or ${q4_cont}='em_elaboracao'", "appearance": "multiline"}]
    if gestores:
        novo[0]["keep"] = True
    rows[k + 1:k + 1] = novo

    # cartografia: atividade sugerida
    seta("cartografia", "Cartografia participativa (atividade sugerida)", keep=False)
    m = rows[idx("map_nota")]
    if not m[lab].startswith("**Atividade sugerida"):
        m[lab] = ("**Atividade sugerida e opcional:** ninguém é obrigado a realizá-la. Se não for fazer, siga para a "
                  "próxima etapa.\n\n" + m[lab])

    seta("map_porque", "Se não for realizar a cartografia, conte o motivo (opcional)", keep=False)
    # FOFA
    seta("e5_nota",
         "**O que é a matriz FOFA?** É um quadro para organizar o que você já sabe sobre a situação da **Educação "
         "Ambiental** " + onde + ". Ela ajuda a decidir, nas próximas semanas, quais problemas enfrentar e que ações "
         "planejar.\n\n**Forças** (internas, positivas): o que já favorece a Educação Ambiental e depende de vocês. "
         "Ex.: professores com experiência em projetos de EA, horta escolar, apoio da direção.\n**Fragilidades** "
         "(internas, negativas): o que dificulta ou limita e também depende de vocês. Ex.: EA só em datas "
         "comemorativas, falta de formação, projetos que dependem de uma única pessoa.\n**Oportunidades** (externas, "
         "positivas): o que existe fora " + de + " e pode ajudar. Ex.: parceria com universidade ou ONG, apoio da Defesa "
         "Civil, programas públicos de EA.\n**Ameaças** (externas, negativas): o que vem de fora e pode atrapalhar "
         "ou aumentar os riscos. Ex.: enchentes ou ondas de calor que interrompem as aulas, corte de recursos, troca "
         "frequente de equipes.\n\nUse o que você registrou nesta semana (riscos) e na Semana 2 (participação e redes). "
         "Escreva um item por linha. Se precisar de ajuda, procure o(a) tutor(a).")
    seta("swot_forcas", "Forças: o que já favorece a Educação Ambiental " + onde,
         "Um item por linha. Ex.: professores com experiência em projetos de EA; horta escolar; apoio da direção.")
    seta("swot_fragilidades", "Fragilidades: o que dificulta a Educação Ambiental " + onde,
         "Um item por linha. Ex.: EA só em datas comemorativas; falta de formação; projetos que dependem de uma só "
         "pessoa.")
    seta("swot_oportunidades", "Oportunidades: o que existe fora " + de + " e pode ajudar a Educação Ambiental",
         "Um item por linha. Ex.: parceria com universidade ou ONG; apoio da Defesa Civil; programas públicos de EA.")
    seta("swot_ameacas", "Ameaças: o que vem de fora e pode atrapalhar a Educação Ambiental ou aumentar os riscos",
         "Um item por linha. Ex.: enchentes ou calor extremo que interrompem as aulas; corte de recursos; troca "
         "frequente de equipes.")

    # capacidades adaptativas em um único campo
    k = idx("cap_nota")
    seta("cap_nota",
         "**Capacidades adaptativas** são os recursos, saberes e formas de organização que **já existem** e ajudam "
         + onde + " e a comunidade a enfrentar os desafios do clima e a fazer Educação Ambiental. Podem ser formais ou "
         "informais. Exemplos: professores experientes em projetos de EA; mutirões, associações e redes de apoio entre "
         "famílias; apoio da direção e PPP que dá continuidade às ações; saberes tradicionais sobre o clima local e "
         "parceiros do bairro; horta, materiais e equipamentos.")
    rows[k + 1:k + 1] = [{"type": "text", "name": "cap_adaptativas", lab: "Descreva as capacidades adaptativas que já existem",
                          hint: "Escreva livremente, um item por linha.", "appearance": "multiline"}]
    numerar(rows, 4, lab)
    numerar(rows, 5, lab)
