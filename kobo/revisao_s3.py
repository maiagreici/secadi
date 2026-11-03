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
