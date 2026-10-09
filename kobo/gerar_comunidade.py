#!/usr/bin/env python3
"""Gera a versão "Comunidade" do formulário (estudantes, pessoas que já trabalharam em escola e pessoas de ONGs,
sem vínculo formal com escola/secretaria). Parte do conteúdo-base de gerar_xlsform.py e adapta."""
import copy
import re

import gerar_xlsform as g

TERMO = ("TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO. Você está sendo convidado(a) a responder este Diagnóstico "
         "Socioambiental, Climático e de Educação Ambiental da sua comunidade. A participação é voluntária: você pode "
         "recusar ou interromper a qualquer momento, sem qualquer prejuízo. Você pode participar SEM informar seu "
         "nome verdadeiro: use um apelido ou o código fornecido pelo(a) tutor(a). As informações fornecidas serão "
         "tratadas com sigilo, NÃO serão compartilhadas com terceiros de forma que identifique você, sua "
         "organização ou sua comunidade e serão utilizadas apenas para compor um banco de dados do projeto. "
         "Eventuais resultados e relatórios serão apresentados somente de forma agregada, sem identificar pessoas. "
         "O tratamento dos dados segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Em caso de dúvidas, "
         "procure o(a) tutor(a) ou a equipe responsável pelo projeto.")
g.TCLE_TEXTO = TERMO


def com(t):
    if not isinstance(t, str):
        return t
    for p, r in [(r"\bescola/comunidade\b", "comunidade"), (r"\bEscola/comunidade\b", "Comunidade"),
                 (r"\bescolas\b", "escolas"), (r"\bEscola\b", "Comunidade"), (r"\bescola\b", "comunidade")]:
        t = re.sub(p, r, t)
    return t.replace("comunidade/comunidade", "comunidade")


# ---------------------------------------------------------------- utilitários sobre a lista de linhas
def _find(rows, name):
    return next(i for i, r in enumerate(rows) if r.get("name") == name and not r["type"].startswith("end"))


def _end(rows, i):
    d = 0
    for j in range(i, len(rows)):
        t = rows[j]["type"]
        if t.startswith("begin_"):
            d += 1
        elif t.startswith("end_"):
            d -= 1
            if d == 0:
                return j
    raise ValueError


def drop(rows, *names):
    S = set(names) | {n + "_outro" for n in names}
    i = 0
    while i < len(rows):
        r = rows[i]
        if r.get("name") in S and not r["type"].startswith("end"):
            j = _end(rows, i) if r["type"].startswith("begin_") else i
            del rows[i:j + 1]
        else:
            i += 1


def unwrap(rows, name):
    i = _find(rows, name)
    j = _end(rows, i)
    del rows[j]
    del rows[i]


def replace_block(rows, name, new):
    i = _find(rows, name)
    rows[i:_end(rows, i) + 1] = new


def insert_after(rows, name, new):
    i = _find(rows, name)
    j = i
    while j + 1 < len(rows) and rows[j + 1].get("name", "").startswith(rows[i]["name"] + "_outro"):
        j += 1
    rows[j + 1:j + 1] = new


def setq(rows, name, label=None, hint=None, rel=None, lst=None, ):
    i = _find(rows, name)
    r = rows[i]
    if label is not None:
        m = re.match(r"^(Q\d+\.\d+[a-z]*\.\s*)", r.get("label") or "")
        r["label"] = (m.group(1) if m else "") + label
    if hint is not None:
        r["hint"] = hint
    if rel is not None:
        r["relevant"] = rel
        for y in rows:
            if y.get("name") == name + "_outro":
                cond = ("selected(${%s}, 'outro')" if r["type"].startswith("select_multiple") else "${%s}='outro'") % name
                y["relevant"] = "(%s) and %s" % (rel, cond) if rel else cond
    if lst:
        r["type"] = r["type"].split()[0] + " " + lst
        if "outro" not in [n for n, _ in g.choices[lst]]:
            k = [x for x, y in enumerate(rows) if y.get("name") == name + "_outro"]
            for x in reversed(k):
                del rows[x]


def build(fn):
    saved = g.survey
    g.survey = []
    try:
        fn()
        return g.survey
    finally:
        g.survey = saved


# ---------------------------------------------------------------- conteúdo-base e listas
rows = copy.deepcopy(g.survey)
PROTEGER = {"cat_ator", "tipo_local"}
for ln, items in list(g.choices.items()):
    if ln not in PROTEGER:
        g.choices[ln] = [(n, com(l)) for n, l in items]
for r in rows:
    for k in ("label", "hint", "constraint_message"):
        if k in r:
            r[k] = com(r[k])

L = g.L
L("perfil_com", [("estudante", "Estudante"),
                 ("ex_escola", "Pessoa que já trabalhou em escola, mas atualmente não trabalha"),
                 ("ong", "Pessoa de ONG ou outra organização da sociedade civil"), ("outro", "Outro")])
L("nivel_estudo", ["Ensino Fundamental", "Ensino Médio", "EJA", "Ensino técnico/profissional", "Graduação",
                   "Pós-graduação", "Outro"])
L("funcao_ex", ["Professor(a)", "Gestor(a) / Direção", "Coordenação / supervisão pedagógica",
                "Apoio escolar / funcionário(a)", "Outro"])
L("ong_area", ["Educação", "Meio ambiente", "Direitos humanos", "Saúde", "Cultura",
               "Assistência social", "Povos e comunidades tradicionais", "Outro"])
L("vinculo_escola", [("nenhum", "Nenhum vínculo atual com escola"), "Familiar de estudante", "Ex-aluno(a)",
                     "Voluntário(a) ou parceiro(a) de escola", "Atuo em projetos em escolas por meio de organização",
                     "Outro"])
L("onde_ea_com", ["Escolas do território", "Associações / ONGs", "Mutirões e ações comunitárias",
                  "Igrejas / grupos religiosos", "Coletivos e grupos de jovens", "Universidades / institutos",
                  "Rodas de conversa e oficinas", "Redes sociais / comunicação", "Não acontece", "Outro"])
L("instit_com", ["Inexistente", "Isolada/ocasional", "Recorrente, dependente de poucas pessoas",
                 "Presente em diferentes grupos/organizações", "Integrada às ações da comunidade",
                 "Contínua e reconhecida pela comunidade", "Não sabe"])
L("esc_territorio", ["Sim, com frequência", "Às vezes", "Raramente", "Não", "Não existe escola no território",
                     "Não sei"])
L("contexto_ea_com", ["Escola", "Espaço comunitário / associação", "Rua, praça ou área externa",
                      "Visita de campo / trilha", "Evento / feira", "Online / redes sociais", "Outro"])
L("quem_planejou_com", ["Estudantes", "Professores(as)", "Associação / ONG", "Lideranças comunitárias",
                        "Poder público", "Universidade / instituto", "Moradores em geral", "Outro"])
L("continuidade_com", ["Depende de pessoas específicas", ("garantida", "Tem continuidade garantida (organização ou parceria)"),
                       "Incerta", "Não sabe"])
L("causa_dif_com", ["Falta de formação", "Falta de material", "Tema sensível/delicado", "Falta de tempo",
                    "Falta de apoio ou recursos", "Outro"])
L("apoio_com", ["Formação", "Material educativo", "Tempo para se organizar",
                "Apoio de lideranças / poder público", "Parcerias", "Recursos financeiros", "Outro"])
BARR_COM = ["Tempo", "Formação", "Materiais", "Recursos financeiros", "Apoio do poder público",
            "Apoio de lideranças", "Organização coletiva / planejamento conjunto", "Informações sobre o território",
            "Descontinuidade das ações", "Rotatividade de pessoas", "Outras"]
L("barreiras_com", BARR_COM)
L("materiais_com", ["Livros e cartilhas", "Vídeos", "Jogos", "Materiais produzidos pela comunidade/organização",
                    "Recursos digitais", "Nenhum", "Outro"])
L("quem_part_com", ["Estudantes", "Professores(as)", "Famílias", "Moradores", "Lideranças comunitárias",
                    "Associações / ONGs", "Poder público", "Outros"])
L("esp_com", ["Associação de moradores", "Conselho comunitário", "Assembleias / reuniões comunitárias",
              "Grêmio estudantil / coletivos de jovens", "Conselhos de políticas públicas", "Nenhum", "Outro"])
L("instancias_com", ["Associação de moradores", "Conselho comunitário", "Conselho escolar",
                     "Conselhos de políticas públicas", "Grêmio / coletivos", "Nenhuma", "Outra"])
L("impacto_alag_com", ["Danos às moradias", "Danos a ruas, estradas ou pontes", "Acesso interrompido (trabalho, escola, saúde)",
                       "Contaminação da água", "Perda de bens ou plantações", "Impacto na saúde",
                       "Interrupção de aulas", "Outro"])
L("impacto_clima_com", ["Danos materiais", ("deslocamento_de_pessoas", "Deslocamento de pessoas (necessidade de migração)"),
                        ("obitos", "Óbitos"), "Perda de renda ou plantações", "Impacto na saúde", "Impacto emocional",
                        "Interrupção de aulas ou do trabalho", "Outro"])
L("impacto_risco_com", ["Danos às moradias", "Acesso interrompido", "Perda de bens/materiais", "Impacto na saúde",
                        "Impacto emocional", "Perda de renda ou plantações", "Interrupção de aulas ou do trabalho",
                        "Outro"])
L("afetou_com", ["Minha família / moradia", "A comunidade como um todo", "Ambos", "Nenhum", "Não sabe"])
L("ativos_com", ["Moradias", "Escola(s)", "Posto de saúde", "Ruas, estradas e pontes", "Plantações, roças e criações",
                 "Fontes de água", "Comércios / locais de trabalho", "Espaços comunitários", "Outro"])
L("grupos_exp_com", ["Estudantes", "Famílias", "Pessoas com deficiência", "Crianças pequenas", "Idosos",
                     "Trabalhadores rurais / pescadores", "Povos e comunidades tradicionais", "Outro"])
L("cartog_com", ["Estudantes", "Moradores", "Lideranças", "Pessoas de ONGs", "Outros"])
L("abrangencia_com", ["Individual", "Uma família", "Um grupo ou organização", "Toda a comunidade",
                      "Mais de uma comunidade / território"])
L("afetados_com", ["Estudantes", "Famílias", "Moradores", "Trabalhadores", "Crianças e idosos", "Outro"])
L("decisao_part_com", ["Estudantes", "Famílias", "Moradores", "Lideranças comunitárias", "Associações / ONGs",
                       "Poder público", "Escola(s) do território", "Outro"])
L("publicos_com", ["Estudantes", "Professores(as)", "Famílias", "Moradores", "Associações / ONGs", "Poder público",
                   "Outro"])
L("dependencias_com", ["Aprovação de lideranças / poder público", "Recursos financeiros", "Parceria externa",
                       "Formação prévia", "Nenhuma", "Outra"])
L("evid_exec_com", ["Fotos", "Lista de presença", "Produções da comunidade", "Registro em ata", "Depoimentos", "Outro"])
L("metodo_sel_com", ["Votação", "Consenso", "Decisão de lideranças ou da coordenação", "Critérios técnicos",
                     "Discussão coletiva", "Outro"])
L("com_produz_com", ["Estudantes", "Moradores", "Associação / ONG", "Coletivos de jovens", "Parceiros externos",
                     "Outro"])

# ---------------------------------------------------------------- Etapa 0
def etapa0():
    q, txt = g.q, g.txt
    g.note("e0_intro", "Estas informações identificam quem está respondendo e o território sobre o qual falamos. Elas "
                       "serão reaproveitadas nas próximas etapas. Você preenche sozinho(a), com a ajuda do(a) "
                       "tutor(a) sempre que precisar. | Instrumento de Diagnóstico Socioambiental, Climático e de "
                       "Educação Ambiental — Comunidade — versão 1.0.0.")
    q("0.1", "text", "Como você prefere ser identificado(a)?", "Pode ser seu nome, um apelido ou o código "
      "fornecido pelo(a) tutor(a). Use sempre o mesmo nas 5 semanas.", req=True)
    q("0.2", "select_one perfil_com", "Qual é o seu perfil?", req=True)
    est, ex, ong = g.eq("q0_2", "estudante"), g.eq("q0_2", "ex_escola"), g.eq("q0_2", "ong")
    q("0.3", "select_one nivel_estudo", "Qual é o seu nível de estudo?", rel=est)
    q("0.4", "text", "Em qual instituição você estuda? (opcional)", rel=est)
    q("0.5", "select_one funcao_ex", "Qual função você exercia na escola?", rel=ex)
    q("0.6", "integer", "Há quantos anos você deixou de trabalhar em escola?", rel=ex, cons=". >= 0",
      cmsg="Informe um número positivo.")
    q("0.7", "text", "Disciplina/área em que atuou (se aplicável)", rel=ex)
    q("0.8", "text", "Nome da organização (opcional)", rel=ong)
    q("0.9", "text", "Qual é a sua função ou atuação na organização?", rel=ong)
    q("0.10", "select_multiple ong_area", "Principal(is) área(s) de atuação da organização", rel=ong)
    q("0.11", "select_one formacao", "Nível de formação")
    q("0.12", "integer", "Há quantos anos você vive ou atua neste território?", cons=". >= 0",
      cmsg="Informe um número positivo.")
    q("0.13", "select_multiple vinculo_escola", "Você tem hoje algum vínculo com escola(s) do território?",
      cons="not(selected(., 'nenhum') and count-selected(.) > 1)",
      cmsg='"Nenhum vínculo" não pode ser combinado com outras opções.')
    q("0.14", "text", "Nome do território (bairro, comunidade ou localidade)", req=True)
    q("0.15", "text", "Município", req=True)
    q("0.16", "select_one uf", "UF", req=True)
    q("0.17", "select_one localizacao", "Localização", req=True)
    q("0.18", "select_multiple contextos", "Contextos territoriais",
      'Se o território é urbano comum, sem nenhuma dessas identidades territoriais específicas, marque "Nenhum".',
      cons="not(selected(., 'nenhum') and count-selected(.) > 1)",
      cmsg='"Nenhum" não pode ser combinado com outras opções.')


novo0 = build(etapa0)
i0 = _find(rows, "etapa0")
rows[i0 + 1:_end(rows, i0)] = novo0

# ---------------------------------------------------------------- Etapa 1
EQUIP = ["Escola", "Posto de saúde / UBS", "Praça e áreas de lazer", "Quadras e espaços esportivos", "Áreas verdes",
         "Hortas comunitárias", "Centro comunitário / associação", "Igreja / templo", "Ponto de apoio ou abrigo em "
         "emergências", "Transporte público", "Internet / conectividade", "Iluminação pública", "Coleta de lixo",
         "Drenagem / pavimentação"]
tab11 = build(lambda: g.tabela("1.1", "Espaços e equipamentos da comunidade — estado de cada um, quando pertinente",
                                "", EQUIP, "estado_infra", req=True, prefix="q1_1"))
replace_block(rows, "t1_1", tab11)
drop(rows, "t1_1r", "e1_rede")
unwrap(rows, "e1_escola")
setq(rows, "q1_3", "Conforto térmico nas moradias e espaços de uso coletivo da comunidade", rel="")
setq(rows, "q1_4", "Problemas relacionados às condições térmicas/estruturais das moradias e espaços coletivos", rel="")
setq(rows, "q1_5", hint="Considere a água que abastece a sua comunidade.")
setq(rows, "q1_13", "Há esgoto a céu aberto na sua comunidade?")
setq(rows, "q1_14", "Ocorrem alagamentos na sua comunidade?")
setq(rows, "q1_15", "Em que locais da comunidade esses alagamentos costumam ocorrer (Ex: ruas, casas, praça, áreas de "
     "plantio)?")
setq(rows, "q1_16", lst="impacto_alag_com")
setq(rows, "q1_17", "Há separação de resíduos (coleta seletiva, reciclagem) na sua comunidade?")
setq(rows, "q1_19", "Existem problemas relacionados a resíduos na sua comunidade?",
     "Considere o seu bairro ou a área em que você vive ou atua, não o município inteiro.")
setq(rows, "q1_21", "Elementos presentes no território da comunidade",
     "Considere o território mais imediato, em geral o bairro ou a região em que você vive ou atua, não o município "
     "inteiro. A existência de um elemento não significa, por si só, risco ou impacto, isso será explorado a seguir.")
setq(rows, "q1_33", lst="impacto_clima_com")

# ---------------------------------------------------------------- Etapa 2
setq(rows, "q2_1", "Onde a Educação Ambiental acontece hoje na sua comunidade?", lst="onde_ea_com")
setq(rows, "q2_2", "Como caracterizar a presença da Educação Ambiental na comunidade?", lst="instit_com")
drop(rows, "q2_3", "q2_4", "q2_5", "q2_7", "q2_41a")
esc = build(lambda: g.q("2.0", "select_one esc_territorio", "A escola do território (se houver) trabalha Educação "
                          "Ambiental com a comunidade?", name="q2_esc_territorio"))
insert_after(rows, "q2_2", esc)
setq(rows, "q2_6", "Em quais áreas/disciplinas você viu ou trabalhou Educação Ambiental na escola?",
     rel="${q0_2}='estudante' or ${q0_2}='ex_escola'")
setq(rows, "q2_9", lst="contexto_ea_com")
setq(rows, "q2_14", lst="quem_planejou_com")
setq(rows, "q2_16", "Qual foi o papel das pessoas da comunidade?")
setq(rows, "q2_19", lst="continuidade_com")
setq(rows, "q2_23", lst="causa_dif_com")
setq(rows, "q2_24", "Quais métodos/estratégias já foram usados em práticas de Educação Ambiental na comunidade?")
setq(rows, "q2_26", "Frequência de uso do território da comunidade como espaço de aprendizagem")
setq(rows, "q2_33", "Quão confiante você se sente para participar de ações de Educação Ambiental hoje?")
setq(rows, "q2_34", lst="apoio_com")
tab235 = build(lambda: g.tabela("2.35", "Intensidade de cada barreira percebida", "", BARR_COM, "intensidade",
                                 prefix="q2_35"))
replace_block(rows, "t2_35", tab235)
setq(rows, "q2_35a", rel="${q2_35_11} != ''")
setq(rows, "q2_36", lst="barreiras_com")
setq(rows, "q2_37", lst="materiais_com")
setq(rows, "q2_40", "Como caracterizar, de modo geral, a participação das pessoas da comunidade nas ações de EA?")

# ---------------------------------------------------------------- Etapa 3
setq(rows, "q3_1", lst="quem_part_com")
setq(rows, "q3_3", "Espaços de participação da comunidade existentes", lst="esp_com")
setq(rows, "q3_4", "Descreva práticas concretas de participação da comunidade (se houver)")
setq(rows, "q3_5", "O nível de participação descrito na Etapa 2 continua condizente?")
setq(rows, "q3_6", "Nível de envolvimento da comunidade com a escola do território")
setq(rows, "q3_7", "Barreiras à participação da comunidade")
setq(rows, "q3_8", "Frequência de atividades da escola do território com a comunidade")
setq(rows, "q3_10", "A comunidade tem mecanismos de escuta (ex.: reuniões, assembleias, ouvidoria)?")
setq(rows, "q3_11", "Quais instâncias de decisão coletiva existem e funcionam na comunidade?", lst="instancias_com")
drop(rows, "q3_12")
setq(rows, "q3_21", "Que canais de comunicação a comunidade usa para se informar e se organizar?")

# ---------------------------------------------------------------- Etapa 4
setq(rows, "risco_afetou", "Afetou quem?", lst="afetou_com")
setq(rows, "risco_impactos", lst="impacto_risco_com")
setq(rows, "risco_ativos", lst="ativos_com")
setq(rows, "risco_grupos", lst="grupos_exp_com")
setq(rows, "map_quem", lst="cartog_com")
insert_after(rows, "map_quem", build(lambda: g.q("", "geopoint", "Marque no mapa um local importante (risco, apoio, "
                                                  "memória ou cuidado), se puder", name="map_ponto")))

# ---------------------------------------------------------------- Etapa 5
setq(rows, "cap_pedagogical", "Educativas (CAP_PEDAGOGICAL)",
     "Saberes e práticas de ensino e aprendizagem já presentes na comunidade — ex.: educadores populares, oficinas, "
     "experiência de quem já trabalhou em escola.")
setq(rows, "cap_institutional", hint="Organizações, regras e acordos — ex.: associações, ONGs, conselhos, canais de "
     "decisão coletiva.")

# ---------------------------------------------------------------- Etapas 6 a 8
setq(rows, "pri_abrangencia", lst="abrangencia_com")
setq(rows, "pri_afetados", lst="afetados_com")
setq(rows, "pri_sel_metodo", lst="metodo_sel_com")
setq(rows, "pri_decisao_part", lst="decisao_part_com")
setq(rows, "pri_sel_participantes", lst="decisao_part_com")
setq(rows, "act_audiences", lst="publicos_com")
setq(rows, "act_student_role", "Papel das pessoas da comunidade (ACT_COMMUNITY_ROLE)")
setq(rows, "act_dependencies", lst="dependencias_com")
setq(rows, "act_execution_evidence", lst="evid_exec_com")
setq(rows, "com_producers", lst="com_produz_com")
setq(rows, "com_student_decision", "Nível de decisão das pessoas da comunidade (COM_COMMUNITY_DECISION)")

# ---------------------------------------------------------------- renumeração e saída
for st in range(0, 11):
    g.renumber(rows, st)
g.survey = rows
ident = lambda t: t
meta, bl = g.blocos()

TIT = "Diagnóstico Socioambiental, Climático e de Educação Ambiental — Comunidade"
g.salvar("comunidade_diagnostico_completo.xlsx", g.com_tcle(rows[:4], rows[4:]), TIT, "diagnostico_comunidade",
         loc=ident)
for n, nome, etapas in g.SEMANAS:
    body = []
    if n > 1:
        body += [dict(type="begin_group", name="identificacao", label="Identificação (igual à Semana 1)"),
                 dict(type="select_one perfil_com", name="q0_2", required="true", label="Qual é o seu perfil?"),
                 dict(type="text", name="id_nome", required="true",
                      label="Como você prefere ser identificado(a)? (use o mesmo nome, apelido ou código da Semana 1)"),
                 dict(type="text", name="id_territorio", required="true",
                      label="Nome do território (bairro, comunidade ou localidade)"),
                 dict(type="end_group")]
    for e in etapas:
        body += bl[e]
    g.salvar("comunidade_semana%d_diagnostico.xlsx" % n, g.com_tcle(meta, body, n),
             "Diagnóstico Socioambiental (Comunidade) — Semana %d/5: %s" % (n, nome),
             "diagnostico_comunidade_semana%d" % n, loc=ident)
