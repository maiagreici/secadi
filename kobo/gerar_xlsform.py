#!/usr/bin/env python3
"""Gera o XLSForm (KoboToolbox) do Instrumento de Diagnóstico Socioambiental,
Climático e de Educação Ambiental da Escola (v1.0.0).

Uso: python3 gerar_xlsform.py  ->  diagnostico_socioambiental_escola.xlsx
Depois: Kobo > Novo projeto > Carregar um XLSForm.
"""
import re
import unicodedata
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

LANG = "Português (pt)"
survey, choices = [], {}


def slug(t):
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    t = re.sub(r"\(.*?\)", "", t)
    t = re.sub(r"[^a-zA-Z0-9]+", "_", t).strip("_").lower()
    return t[:32] or "x"


def L(name, items):
    """items: lista de rótulos ou tuplas (nome, rótulo)."""
    out, used = [], set()
    for it in items:
        n, lab = it if isinstance(it, tuple) else (None, it)
        if n is None:
            n = "outro" if re.fullmatch(r"Outr[oa]s?", lab) else slug(lab)
        base, i = n, 2
        while n in used:
            n, i = f"{base}_{i}", i + 1
        used.add(n)
        out.append((n, lab))
    choices[name] = out


def row(**k):
    survey.append(k)


def q(id, type, label, hint="", req=False, rel="", app="", cons="", cmsg="", name=None, other=True):
    nm = name or "q" + id.replace(".", "_")
    lab = f"Q{id.rstrip('r')}. {label}" if id and id[0].isdigit() else label
    t = type
    r = dict(type=t, name=nm, label=lab, hint=hint, required="true" if req else "",
             relevant=rel, appearance=app, constraint=cons, constraint_message=cmsg)
    row(**r)
    # campo "Especifique" automático para opções "Outro(a)"
    m = re.match(r"select_(one|multiple) (\w+)", type)
    if m and other and any(n == "outro" for n, _ in choices.get(m.group(2), [])):
        cond = f"selected(${{{nm}}}, 'outro')" if m.group(1) == "multiple" else f"${{{nm}}}='outro'"
        if rel:
            cond = f"({rel}) and {cond}"
        row(type="text", name=nm + "_outro", label="Especifique (Outro)", relevant=cond)
    return nm


def note(name, label, rel=""):
    row(type="note", name=name, label=label, relevant=rel)


def bg(name, label, app="", rel=""):
    row(type="begin_group", name=name, label=label, appearance=app, relevant=rel)


def eg():
    row(type="end_group")


def br(name, label, rel="", count=""):
    row(type="begin_repeat", name=name, label=label, relevant=rel, repeat_count=count)


def er():
    row(type="end_repeat")


def txt(id, label, hint="", req=False, rel="", name=None, multiline=True):
    return q(id, "text", label, hint, req, rel, "multiline" if multiline else "", name=name)


def ref(n):
    return "${" + n + "}"


def eq(n, v):
    return f"${{{n}}}='{v}'"


# ---------------------------------------------------------------- LISTAS
L("confirmo", [("confirmo", "Sim, confirmo o envio")])
L("concordo", [("concordo", "Sim, concordo em participar"), ("nao_concordo", "Não concordo")])
L("sim_nao_ns", ["Sim", "Não", "Não sabemos"])
L("sim_nao_nsabe", ["Sim", "Não", "Não sabe"])
L("sim_nao", ["Sim", "Não"])
L("uf", [(u, u) for u in "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split()])
L("tipo_local", [("escola", "Escola"), "Secretaria municipal de educação", "Secretaria estadual de educação",
                 "Diretoria/coordenadoria regional de ensino", "Outro"])
L("rede", ["Municipal", "Estadual", "Federal", "Privado", "Comunitário", "Outro"])
L("etapas_ens", ["Educação Infantil", "Ensino Fundamental — anos iniciais", "Ensino Fundamental — anos finais",
                 "Ensino Médio", "EJA", "Educação Profissional e Tecnológica", "Educação Especial", "Outra"])
L("localizacao", ["Urbana", "Rural", "Periurbana / de transição", "Não sabe"])
L("contextos", ["Educação do Campo", "Território indígena", "Quilombola", "Ribeirinho", "Caiçara", "Extrativista",
                "Assentamento", "Outro", "Nenhum", "Não sabe"])
L("funcao", ["Diretor(a)", "Vice-diretor(a)", "Coordenador(a) pedagógico(a)", "Supervisor(a) pedagógico(a)",
             "Orientador(a) educacional", "Secretário(a) escolar", ("outro", "Outro (equipe gestora)")])
L("formacao", ["Ensino Fundamental", "Ensino Médio / Magistério", "Graduação", "Pós-graduação (especialização)",
               "Mestrado", "Doutorado", "Não sabe / não se aplica"])
L("participantes_diag", ["Estudantes", "Professores(as)", "Gestão", "Coordenação pedagógica", "Funcionários(as)",
                         "Famílias", "Conselho escolar", "Comunidade", "Lideranças", "Parceiros", "Outros",
                         "Somente o(a) gestor(a)"])
L("fontes", ["Observação direta", "Conversa com estudantes", "Conversa com professores(as)", "Famílias/comunidade",
             "Reunião coletiva", "PPP", "Documentos escolares", "Dados públicos", "Cartografia participativa",
             "Registros históricos", "Outras"])
L("estado_infra", ["Inexistente", "Inadequado", "Regular", "Bom", "Não se aplica", "Não sabe"])
L("qtd_rede", ["Em nenhuma", "Em poucas", "Em cerca de metade", "Na maioria", "Em todas", "Não sabe"])
L("qtd_rede_tab", ["Em nenhuma", "Em poucas", "Em cerca de metade", "Na maioria", "Em todas", "Não se aplica", "Não sabe"])
L("termica", ["Muito quente no verão", "Muito fria no inverno", "Adequada na maior parte do ano",
              "Muito variável, sem padrão sazonal claro", "Não sabe"])
L("prob_estrut", ["Mofo", "Infiltração", "Calor excessivo", "Frio excessivo", "Falta de ventilação", "Outro"])
L("agua_fonte", ["Rede pública", "Poço", "Nascente", "Cisterna", "Outra", "Não sabe"])
L("infra_hidrica", ["Reservatório / caixa d'água", "Filtro / purificador", "Bebedouros", "Rede encanada interna",
                    "Outro", "Não sabe"])
L("esgoto", ["Rede coletora", "Fossa séptica", "Fossa rudimentar", "Céu aberto", "Outro", "Não sabe"])
L("impacto_alag", ["Interrupção de aulas", "Danos à estrutura", ("acesso_interrompido", "Dificuldade ou interrupção do acesso à escola"),
                   ("baixa_adesao", "Baixa adesão dos estudantes (aulas mantidas, mas poucos conseguem frequentar)"),
                   "Outro"])
L("destino_res", ["Coleta pública", "Coleta seletiva", "Cooperativa", "Compostagem", "Reutilização", "Queima",
                  "Enterramento", "Outro", "Não sabe"])
L("prob_res", ["Aterro sanitário", "Lixão", "Queima de resíduos", "Acúmulo de resíduos no entorno", "Outro",
               "Nenhum", "Não sabe"])
ELEM = ["Rios/córregos", "Lagoas/lagos/reservatórios", "Áreas de vegetação nativa (matas, florestas, campos)",
        "Parques", "Encostas", "Agricultura", "Indústria", "Mineração", "Aterro/lixão", "Áreas queimadas",
        "Áreas inundáveis", "Comércios", "Outras áreas degradadas", "Equipamentos Urbanos", "Outros"]
L("elementos", ELEM)
L("relacao_elem", ["Ambiente", "Cultura", "Uso comunitário", "Renda", "Risco", "Degradação", "Conflito", "Outra",
                   "Não sabe"])
L("ativ_econ", ["Agricultura", "Pecuária", "Comércio", "Indústria", "Turismo", "Pesca", "Extrativismo", "Outro"])
L("meses", [(m.lower(), m) for m in "Jan Fev Mar Abr Mai Jun Jul Ago Set Out Nov Dez".split()])
L("impacto_clima", ["Interrupção de aulas", "Danos materiais",
                    ("deslocamento_de_pessoas", "Deslocamento de pessoas (necessidade de migração)"), ("perdas", "Óbitos"),
                    "Impacto emocional", "Outro"])
L("tipo_evid", ["Observação direta", "Documento", "Foto", "Depoimento", "Registro histórico", "Outra"])

L("onde_ea", ["Aulas regulares", "Projetos interdisciplinares", "Feiras/mostras", "Momentos cívicos",
              "Em datas comemorativas", "Clube/grêmio estudantil", "Iniciativas de estudantes",
              "Parcerias externas", "Outro"])
L("instit_ea", ["Inexistente", "Isolada/ocasional", "Recorrente, dependente de algumas pessoas",
                "Presente em diferentes componentes/projetos", "Integrada ao planejamento",
                "Institucionalizada e contínua", "Não sabe"])
L("ppp_sit", ["Presente e detalhada", "Presente de forma genérica", "Ausente", "Não sabe"])
L("ppp_pratica", ["Totalmente", "Parcialmente", "Pouco", "Não", "Não sabe"])
L("areas_curr", ["Ciências", "Geografia", "História", "Língua Portuguesa", "Matemática", "Artes",
                 "Educação Física", "Outras"])
L("articulacao", ["Disciplinas separadas", "Mesmo tema, sem planejamento conjunto", "Algum planejamento conjunto",
                  "Investigação conjunta", "Objetivos comuns", "Intervenção territorial coletiva", "Sem articulação",
                  "Não sabe"])
L("freq_ea", ["Diária", "Semanal", "Mensal", "Esporádica", "Anual", "Não ocorre", "Não sabe"])
L("contexto_ea", ["Sala de aula", "Pátio/área externa", "Visita de campo", "Projeto especial", "Feira", "Outro"])
L("quem_planejou", ["Professor(a) individualmente", "Grupo de professores(as)", "Coordenação pedagógica",
                    "Estudantes", "Comunidade", "Outro"])
L("papel_estud", ["Espectador", "Participante pontual", "Protagonista", "Coprodutor", "Não sabe"])
L("continuidade_ativ", ["Depende da permanência de professor(a) específico(a)",
                        ("institucional", "Tem continuidade institucional garantida"), "Incerta", "Não sabe"])
L("freq5", ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Não sabe"])
TEMAS = ["Água", "Biodiversidade", "Resíduos", "Mudanças climáticas", "Energia", "Alimentação", "Consumo",
         "Saneamento", "Saúde", "Riscos/desastres", "Justiça socioambiental", "Território", "Conflitos",
         "Povos e comunidades tradicionais", "Outros"]
L("temas", TEMAS)
L("causa_dif", ["Falta de formação", "Falta de material", "Tema sensível/delicado", "Falta de tempo", "Currículo",
                "Outro"])
METODOS = ["Aula expositiva", "Projeto", "Oficina", "Saída de campo", "Horta/experimentação", "Rodas de conversa",
           "Produção audiovisual", "Cartografia", "Outro"]
L("metodos", METODOS)
L("impacto_form", ["Nenhum", "Pouco", "Moderado", "Significativo", "Não sabe"])
L("confianca", [("1", "1 — Nada confiante(a)"), ("2", "2 — Pouco confiante"), ("3", "3 — Moderadamente confiante"),
                ("4", "4 — Confiante"), ("5", "5 — Muito confiante")])
L("apoio", ["Formação", "Material didático", "Tempo de planejamento", "Apoio da gestão", "Parcerias",
            "Recursos financeiros", "Outro"])
BARR = ["Tempo", "Currículo sobrecarregado", "Formação", "Materiais", "Recursos financeiros", "Apoio da gestão",
        "Planejamento coletivo", "Interdisciplinaridade", "Informações territoriais", "Descontinuidade",
        "Rotatividade de profissionais", "Outras"]
L("barreiras", BARR)
L("intensidade", ["Baixa", "Média", "Alta", "Não se aplica"])
L("apoio_gestao", ["Reserva tempo para planejamento coletivo", "Inclui a EA no PPP/planejamento anual",
                   "Viabiliza recursos e materiais", "Articula parcerias externas", "Apoia projetos de estudantes",
                   "Participa de formações sobre o tema", "Acompanha e valoriza as práticas da equipe",
                   ("nenhum", "Nenhum apoio sistemático"), "Outro"])
L("instancias", ["Conselho escolar", "APM / caixa escolar", "Grêmio estudantil", "Conselho de classe",
                 "Reunião pedagógica/planejamento coletivo", "Associação de pais e mestres", "Nenhuma", "Outra"])
L("materiais", ["Livros didáticos", "Vídeos", "Jogos", "Kits científicos", "Materiais produzidos pela escola",
                "Recursos digitais", "Outro"])
L("acesso_mat", ["Fácil", "Moderado", "Difícil", "Inexistente", "Não sabe"])
L("part_estud", ["Espectadores", "Colaboradores pontuais", "Protagonistas em alguns momentos",
                 "Protagonistas contínuos", "Não sabe"])
L("continuidade_proj", ["Garantida institucionalmente", "Dependente de pessoas específicas", "Incerta", "Não sabe"])

L("quem_part", ["Estudantes", "Professores(as)", "Gestão", "Funcionários(as)", "Famílias", "Comunidade", "Outros"])
L("nivel_part", [("informativa", "Informativa (recebem informação)"), ("consultiva", "Consultiva (são ouvidos)"),
                 ("colaborativa", "Colaborativa (constroem junto)"),
                 ("protagonista", "Protagonista (decidem e conduzem)"), "Não sabe"])
L("esp_estud", ["Grêmio estudantil", "Assembleias", "Projetos protagonizados por estudantes", "Conselhos", "Nenhum",
                "Outro"])
L("env_fam", ["Ausente", "Esporádico", "Regular", "Ativo/protagonista", "Não sabe"])
L("barr_fam", ["Horário de trabalho", "Distância", "Comunicação inadequada", "Falta de convite/convocação", "Outra"])
L("cat_ator", [
    ("sec_educacao", "Secretaria de Educação"), ("sec_meio_amb", "Secretaria de Meio Ambiente"),
    ("defesa_civil", "Defesa Civil"), ("sec_saude", "Secretaria de Saúde"), ("assist_social", "Assistência Social"),
    ("obras", "Obras"), ("bombeiros", "Bombeiros"), ("ubs", "UBS"), ("vigilancia", "Vigilância"),
    ("outro_publico", "Outro (poder público)"), ("universidade", "Universidade"),
    ("inst_federal", "Instituto Federal"), ("escola_tecnica", "Escola técnica"),
    ("centro_pesquisa", "Centro de pesquisa"), ("museu", "Museu"), ("jardim_botanico", "Jardim botânico"),
    ("outro_educ_ciencia", "Outro (educação/ciência)"), ("assoc_moradores", "Associação de moradores"),
    ("ong", "ONG"), ("cooperativa", "Cooperativa"), ("catadores", "Catadores"),
    ("mov_sociais", "Movimentos sociais"), ("coletivos", "Coletivos"), ("grupos_culturais", "Grupos culturais"),
    ("org_comunit_relig", "Organizações comunitárias/religiosas"),
    ("outro_soc_civil", "Outro (sociedade civil)"), ("povos_indigenas", "Povos indígenas"),
    ("quilombolas", "Quilombolas"), ("agric_familiares", "Agricultores familiares"), ("pescadores", "Pescadores"),
    ("com_tradicionais", "Comunidades tradicionais"), ("liderancas", "Lideranças"),
    ("detentores_saberes", "Detentores de conhecimentos locais"),
    ("outro_comunidades", "Outro (comunidades e conhecimentos)")])
L("nivel_rel", [("nao_existe", "Não existe relação — não é parceiro(a)"),
                ("sabe_existe", "Sabe que existe, mas nunca houve contato — não é parceiro(a)"),
                ("contato_pontual", "Já houve contato pontual, sem combinação formal — ainda não é parceiro(a)"),
                ("parceria", "Parceria — já colaboram em ações combinadas"),
                ("articulacao", "Articulação permanente — parceria contínua e estruturada")])
L("contrib", ["Recursos", "Formação", "Articulação institucional", "Apoio técnico", "Mobilização comunitária",
              "Conhecimentos tradicionais/locais", "Outro"])
L("canais", ["WhatsApp", "Comunicados impressos", "Reuniões", "Redes sociais", "Alto-falante/rádio local", "Outro"])
L("suficiente", ["Sim", "Parcialmente", "Não", "Não sabe"])
L("barr_artic", ["Falta de contato", "Burocracia", "Desconfiança/histórico de relação", "Falta de tempo", "Outra"])

AMEACAS = ["Enchente", "Inundação", "Alagamento", "Enxurrada", "Deslizamento", "Erosão", "Estiagem/seca",
           "Falta de água", "Onda de calor", "Frio intenso", "Tempestades", "Vendavais", "Granizo", "Ciclones",
           "Queimadas", "Incêndios", "Fumaça/poluição atmosférica", "Contaminação da água",
           "Problemas relacionados a resíduos", "Outros"]
L("ameacas", AMEACAS)
L("base_percepcao", ["Observação ao longo dos anos", "Relatos de moradores antigos", "Comparação com registros",
                     "Notícias", "Não sabe"])
L("fontes_risco", ["Defesa Civil", "Dados meteorológicos (ex.: INMET)", "Universidade", "ONG",
                   "Conhecimento tradicional", "Não há fonte consultada", "Outra"])
L("afetou", ["Escola", "Comunidade", "Ambos", "Nenhum", "Não sabe"])
L("freq_risco", ["Raro (já ocorreu uma vez)", "Ocasional", "Frequente", "Muito frequente/recorrente", "Não sabe"])
L("impacto_risco", ["Interrupção de aulas", "Danos à estrutura", "Acesso interrompido", "Perda de materiais",
                    "Impacto na saúde", "Impacto emocional", "Outro"])
L("ativos", ["Prédio escolar", "Biblioteca", "Quadra", "Horta", "Equipamentos", "Arquivos/documentos", "Outro"])
L("grupos_exp", ["Estudantes", "Professores(as)", "Funcionários(as)", "Famílias", "Pessoas com deficiência",
                 "Crianças pequenas", "Idosos", "Outro"])
L("cond_amplia", ["Acessibilidade limitada nas rotas de saída", "Ausência de sinalização de emergência",
                  "Estrutura física fragilizada",
                  "Ausência de comunicação acessível (Libras/Braile/linguagem simples)",
                  "Ausência de plano de evacuação adaptado", "Distância de pontos de apoio/socorro",
                  ("outro", "Outra condição")])
L("cap_resp", ["Brigada/equipe treinada", "Plano de evacuação", "Comunicação de alerta", "Apoio de rede externa",
               "Kit de emergência", "Nenhuma identificada", "Outra"])
L("aval_cap", ["Boa", "Regular", "Fraca", "Inexistente", "Não sabe"])
L("bma_ns", ["Baixa", "Média", "Alta", "Não sabe"])
L("bma", ["Baixa", "Média", "Alta"])
L("prio_1a5", [("1", "1 — Muito baixa"), ("2", "2"), ("3", "3 — Média"), ("4", "4"), ("5", "5 — Muito alta")])
L("marc_risco", [("lacuna", "Não sabemos avaliar isso com segurança (gera lacuna de conhecimento)"),
                 ("aval_externa", "Requer avaliação técnica externa"),
                 ("selecionado", "Selecionar este risco para a Leitura Integrada e planejamento")])
L("cartog_quem", ["Estudantes", "Professores(as)", "Comunidade", "Outros"])

L("abrangencia", ["Individual", "Uma turma", "Toda a escola", "Comunidade", "Território"])
L("acionavel", ["A escola pode agir sozinha", "Precisa de parceria", "Está fora do alcance da escola", "Não sabe"])
L("afetados", ["Estudantes", "Professores(as)", "Funcionários(as)", "Famílias", "Comunidade", "Outro"])
L("decisao_part", ["Estudantes", "Professores(as)", "Gestão", "Famílias", "Comunidade", "Conselho escolar", "Outro"])
L("metodo_sel", ["Votação", "Consenso", "Decisão da gestão", "Critérios técnicos", "Discussão coletiva", "Outro"])
L("resp_tipo", ["Ação estrutural", "Ação pedagógica", "Articulação institucional", "Comunicação",
                "Mobilização comunitária", "Monitoramento", "Outro"])
L("status_ativ", ["Planejada", "Em andamento", "Concluída", "Não realizada"])
L("publicos", ["Estudantes", "Professores(as)", "Famílias", "Comunidade", "Gestão", "Outro"])
L("papel_estud2", ["Espectador", "Participante", "Protagonista", "Coprodutor"])
L("viabilidade", ["Alta", "Média", "Baixa", "Incerta"])
L("dependencias", ["Aprovação da gestão", "Recursos financeiros", "Parceria externa", "Formação prévia", "Nenhuma",
                   "Outra"])
L("evid_exec", ["Fotos", "Lista de presença", "Produção dos estudantes", "Registro em ata", "Depoimentos", "Outro"])
L("barr_impl", ["Tempo", "Recursos", "Articulação", "Clima", "Adesão", "Outra"])
L("coerencia", ["Coerente", "Parcialmente coerente", "Não tenho certeza"])
L("com_final", ["Informar", "Sensibilizar", "Mobilizar", "Prestar contas", "Dar voz à comunidade", "Outro"])
L("com_publico", ["Estudantes", "Professores(as)", "Famílias", "Comunidade", "Poder público", "Outro"])
L("com_escuta", ["Caixa de sugestões", "Roda de conversa", "Formulário", "Redes sociais", "Reunião", "Outro"])
L("com_midia", ["Cartaz", "Rádio escolar", "Vídeo", "Redes sociais", "Jornal mural", "Teatro", "Podcast", "Outro"])
L("com_barr", ["Idioma/linguagem técnica", "Acessibilidade para pessoas com deficiência", "Falta de conectividade",
               "Alfabetização", "Outra"])
L("com_produz", ["Estudantes", "Professores(as)", "Comunicação escolar", "Parceiros externos", "Outro"])
L("com_decisao", ["Nenhuma", "São consultados", "Colaboram na produção", "Decidem conteúdo/formato"])
L("ind_tipo", ["Processo", "Participação", "Resultado"])
L("periodicidade", ["Mensal", "Bimestral", "Trimestral", "Semestral", "Anual", "Por evento"])


def evidencias(key, titulo):
    br(f"evid_{key}", f"Evidências — {titulo}")
    note(f"evid_{key}_nota", "Evidências sustentam análises futuras (problemas, prioridades, plano de ação). "
                             "Registrar não é obrigatório para todo campo, mas fortalece a rastreabilidade do "
                             "diagnóstico.")
    q("", "select_one tipo_evid", "Tipo de evidência", name=f"evid_{key}_tipo")
    q("", "text", "Descreva a evidência", name=f"evid_{key}_desc", app="multiline")
    q("", "file", "Anexo (foto/documento) — opcional", name=f"evid_{key}_anexo")
    er()


def tabela(id, titulo, hint, itens, lst, req=False, prefix=None, rel=""):
    bg(f"t{id.replace('.', '_')}", f"Q{id.rstrip('r')}. {titulo}", app="table-list", rel=rel)
    for i, it in enumerate(itens):
        row(type=f"select_one {lst}", name=f"{prefix}_{i + 1:02d}", label=it, required="true" if req else "")
    eg()


# ---------------------------------------------------------------- SURVEY
row(type="start", name="start")
row(type="end", name="end")
row(type="today", name="today")
row(type="deviceid", name="deviceid")

# ======================= ETAPA 0
bg("etapa0", "Etapa 0 — Identificação")
note("e0_intro", "Estas informações identificam quem está respondendo, o local de atuação e como o diagnóstico está "
                 "sendo construído. Elas serão reaproveitadas nas próximas etapas. Este formulário é respondido pelo(a) "
                 "gestor(a), com apoio da equipe e da comunidade sempre que possível. | Instrumento de Diagnóstico "
                 "Socioambiental, Climático e de Educação Ambiental — Gestores — versão 1.0.0.")
q("0.1", "text", "Seu nome", req=True)
q("0.2", "select_one funcao", "Sua função ou cargo", req=True)
q("0.3", "text", "Disciplina/área em que atuou como docente (se aplicável)")
q("0.4", "select_one formacao", "Nível de formação")
q("0.5", "text", "Área de formação")
q("0.6", "integer", "Tempo de atuação (anos)", cons=". >= 0", cmsg="Informe um número positivo.")
q("0.7", "integer", "Tempo na função de gestão (anos, neste ou em outro local)", cons=". >= 0",
  cmsg="Informe um número positivo.")
q("0.8", "text", "Nome do local de atuação", "Escola, secretaria de educação, diretoria regional ou outro órgão.",
  req=True)
q("0.9", "select_one tipo_local", "Tipo de local", req=True)
q("0.10", "text", "Código INEP", "Preencha apenas se o local for uma escola. Código público de 8 dígitos, o mesmo "
  "usado no Censo Escolar — não é uma informação sigilosa; pode ser consultado por qualquer pessoa no site do INEP. "
  "Deixe em branco se não souber.", rel=eq("q0_9", "escola"), cons="regex(., '^[0-9]{8}$')",
  cmsg="O código INEP deve ter exatamente 8 dígitos.")
q("0.11", "text", "Município", req=True)
q("0.12", "select_one uf", "UF", req=True)
q("0.13", "select_one rede", "Âmbito do local em que atua", req=True)
q("0.14", "select_one localizacao", "Localização", req=True)
q("0.15", "select_multiple contextos", "Contextos territoriais",
  'Se o local está em contexto urbano comum, sem nenhuma dessas identidades territoriais específicas, marque "Nenhum".',
  cons="not(selected(., 'nenhum') and count-selected(.) > 1)",
  cmsg='"Nenhum" não pode ser combinado com outras opções.')
eg()

# ======================= ETAPA 1
bg("etapa1", "Etapa 1 — Território")
INFRA = ["Biblioteca / espaço de leitura", "Laboratório de Ciências", "Laboratório de informática", "Internet", "Pátio",
         "Espaços esportivos", "Áreas verdes", "Horta", "Pomar", "Sombreamento", "Espaços externos para atividades", "Ar-condicionado nas salas de aula",
         "Ventiladores/estufas nas salas de aula"]
tabela("1.1", "Infraestrutura da escola — estado de cada espaço, quando pertinente", "", INFRA, "estado_infra",
       req=True, prefix="q1_1", rel=eq("q0_9", "escola"))
tabela("1.1r", "Infraestrutura da rede — em quantas escolas da rede existe cada espaço?", "", INFRA, "qtd_rede_tab",
       req=True, prefix="q1_1r", rel="${q0_9} != 'escola'")
txt("1.2", "Outra estrutura relevante não listada (se houver)")
q("1.3", "select_multiple termica", "Condição térmica das salas de aula",
  "A condição térmica costuma variar ao longo do ano — marque todas as situações que se aplicam (ex.: pode ser muito "
  "quente no verão E muito fria no inverno).", rel=eq("q0_9", "escola"))
q("1.4", "select_multiple prob_estrut", "Problemas relacionados às condições térmicas/estruturais",
  rel=eq("q0_9", "escola"))
bg("e1_escola", "Água, esgoto e resíduos — escola", rel=eq("q0_9", "escola"))
q("1.5", "select_multiple agua_fonte", "Fonte de abastecimento de água")
q("1.6", "select_one sim_nao_ns", "Há interrupções no abastecimento de água?")
txt("1.7", "Em que período(s) isso costuma ocorrer?", rel=eq("q1_6", "sim"))
q("1.8", "select_one sim_nao_ns", "Existe monitoramento da qualidade da água?")
txt("1.9", "Quem é responsável por esse monitoramento?", rel=eq("q1_8", "sim"))
q("1.10", "select_one sim_nao_ns", "Existem registros desse monitoramento?", rel=eq("q1_8", "sim"))
q("1.11", "select_multiple infra_hidrica", "Infraestrutura hídrica disponível")
q("1.12", "select_multiple esgoto", "Destinação do esgoto")
q("1.13", "select_one sim_nao_ns", "Há esgoto a céu aberto no entorno da escola?")
q("1.14", "select_one sim_nao_ns", "Ocorrem alagamentos na escola ou no entorno?", req=True)
txt("1.15", "Em que espaços da escola esses alagamentos costumam ocorrer (Ex: apenas na área externa, invadem as "
    "salas, etc)?", rel=eq("q1_14", "sim"))
q("1.16", "select_multiple impacto_alag", "Impactos observados nesses episódios", rel=eq("q1_14", "sim"))
q("1.17", "select_one sim_nao_ns", "Há separação de resíduos na escola?")
q("1.18", "select_multiple destino_res", "Destinação dos resíduos")
q("1.19", "select_multiple prob_res", "Existem problemas relacionados a resíduos no entorno da escola?",
  "Considere a área imediatamente ao redor da escola, não o município inteiro.",
  cons="not((selected(., 'nenhum') or selected(., 'nao_sabe')) and count-selected(.) > 1)",
  cmsg='"Nenhum" e "Não sabe" não podem ser combinados com outras opções.')
txt("1.20", "Descreva os problemas causados pela disposição incorreta dos resíduos, caso ocorra.",
    rel="${q1_19} != '' and not(selected(${q1_19}, 'nenhum')) and not(selected(${q1_19}, 'nao_sabe'))")
eg()

# ---- Etapa 1 para locais que não são escola (secretaria/regional): visão da rede
bg("e1_rede", "Água, esgoto e resíduos — escolas da rede", rel="${q0_9} != 'escola'")
note("e1_rede_nota", "Responda com base na sua visão geral das escolas da rede/região de atuação. Estimativas são "
                     "bem-vindas; \"Não sabe\" é uma resposta válida e vira lacuna de conhecimento registrada.")
q("1.3r", "select_multiple termica", "Condição térmica das salas de aula nas escolas da rede",
  "Marque todas as situações que se aplicam à rede.")
q("1.4r", "select_multiple prob_estrut", "Problemas estruturais mais comuns nas escolas da rede")
q("1.5r", "select_multiple agua_fonte", "Fontes de abastecimento de água das escolas da rede", req=True)
q("1.6r", "select_one qtd_rede", "Em quantas escolas da rede há interrupções no abastecimento de água?")
txt("1.7r", "Em que período(s) isso costuma ocorrer?",
    rel="${q1_6r} != '' and ${q1_6r} != 'em_nenhuma' and ${q1_6r} != 'nao_sabe'")
q("1.8r", "select_one qtd_rede", "Em quantas escolas da rede há monitoramento da qualidade da água?")
txt("1.9r", "Quem é responsável por esse monitoramento?",
    rel="${q1_8r} != '' and ${q1_8r} != 'em_nenhuma' and ${q1_8r} != 'nao_sabe'", multiline=False)
q("1.10r", "select_one sim_nao_ns", "A secretaria/órgão tem acesso aos registros desse monitoramento?",
  rel="${q1_8r} != '' and ${q1_8r} != 'em_nenhuma' and ${q1_8r} != 'nao_sabe'")
q("1.11r", "select_multiple infra_hidrica", "Infraestrutura hídrica presente nas escolas da rede")
q("1.12r", "select_multiple esgoto", "Destinação do esgoto nas escolas da rede")
q("1.13r", "select_one qtd_rede", "Em quantas escolas da rede há esgoto a céu aberto no entorno?")
q("1.14r", "select_one qtd_rede", "Em quantas escolas da rede ocorrem alagamentos na escola ou no entorno?", req=True)
txt("1.15r", "Quais escolas/regiões são mais afetadas?",
    rel="${q1_14r} != '' and ${q1_14r} != 'em_nenhuma' and ${q1_14r} != 'nao_sabe'")
q("1.16r", "select_multiple impacto_alag", "Impactos observados nesses episódios",
  rel="${q1_14r} != '' and ${q1_14r} != 'em_nenhuma' and ${q1_14r} != 'nao_sabe'")
q("1.17r", "select_one qtd_rede", "Em quantas escolas da rede há separação de resíduos?")
q("1.18r", "select_multiple destino_res", "Destinação dos resíduos nas escolas da rede")
q("1.19r", "select_multiple prob_res", "Problemas relacionados a resíduos no entorno das escolas da rede",
  "Considere a área imediatamente ao redor das escolas, não o município inteiro.",
  cons="not((selected(., 'nenhum') or selected(., 'nao_sabe')) and count-selected(.) > 1)",
  cmsg='"Nenhum" e "Não sabe" não podem ser combinados com outras opções.')
txt("1.20r", "Descreva os problemas causados pela disposição incorreta dos resíduos, caso ocorra.",
    rel="${q1_19r} != '' and not(selected(${q1_19r}, 'nenhum')) and not(selected(${q1_19r}, 'nao_sabe'))")
eg()

q("1.21", "select_multiple elementos", "Elementos presentes no território de atuação", "Considere o território mais "
  "imediato — para uma escola, o bairro ou a região do entorno em que a comunidade escolar circula; para uma "
  "secretaria ou regional, a área de abrangência da rede (não o município inteiro, se a atuação for menor). A "
  "existência de um elemento não significa, por si só, risco ou impacto, isso será explorado a seguir.", req=True)
bg("t1_22", "Q1.22. Para cada elemento selecionado, qual sua relação com a escola/comunidade?", app="table-list",
   rel="${q1_21} != ''")
for i, el in enumerate(ELEM):
    ch = choices["elementos"][i][0]
    row(type="select_multiple relacao_elem", name=f"q1_22_{i + 1:02d}", label=el,
        relevant=f"selected(${{q1_21}}, '{ch}')", hint="")
eg()
note("q1_22_nota", "Nota para tutoria: um mesmo elemento pode ter mais de uma relação ao mesmo tempo (ex.: um rio pode "
                   "ser, simultaneamente, ambiente e cultura, ou risco e uso comunitário) — marque quantas se "
                   "aplicarem.", rel="${q1_21} != ''")
q("1.23", "select_multiple ativ_econ", "Principais atividades econômicas do território")
q("1.24", "select_one sim_nao_ns", "Essas atividades têm impacto percebido no ambiente ou na comunidade (Ex: odor desagradável, excesso de "
  "veículos pesados, etc)?")
txt("1.25", "Descreva os impactos percebidos por atividade", rel=eq("q1_24", "sim"))
q("1.26", "select_one sim_nao_ns", "Há eventos sazonais que afetam a escola/comunidade (safras, secas, chuvas, "
  "festas, etc.)?",
  "Os eventos sazonais podem ter efeitos negativos e/ou positivos.")
txt("1.27", "Qual é esse evento? Descreva-o, incluindo o período do ano que costuma ocorrer.", rel=eq("q1_26", "sim"))
txt("1.29", "Qual o impacto desse evento na escola?",
    "Os impactos podem ser negativos e/ou positivos (ex.: negativo — falta de água, aulas suspensas; positivo — "
    "chuvas que renovam as nascentes, safra que gera renda para as famílias). Descreva ambos, se houver.",
    rel=eq("q1_26", "sim"))
q("1.30", "select_one sim_nao_ns", "Há histórico recente de eventos climáticos extremos que afetaram a escola/comunidade?",
  "Eventos climáticos extremos são fenômenos fora do padrão habitual, como ciclones, queimadas, ondas de calor, "
  "períodos de seca extrema, enchentes, vendavais, granizo, entre outros.", req=True)
txt("1.31", "Descreva o(s) evento(s) e a intensidade.", rel=eq("q1_30", "sim"))
txt("1.32", "Quando ocorreu(ram)?", rel=eq("q1_30", "sim"), multiline=False)
q("1.33", "select_multiple impacto_clima", "Impactos observados", rel=eq("q1_30", "sim"))
txt("1.34", "O que a escola/comunidade aprendeu com esse evento?", rel=eq("q1_30", "sim"))
evidencias("e1", "Evidências sobre a escola e o território")
eg()

# ======================= ETAPA 2
bg("etapa2", "Etapa 2 — Educação Ambiental")
q("2.1", "select_multiple onde_ea", "Onde a Educação Ambiental acontece hoje na escola")
q("2.2", "select_one instit_ea", "Como caracterizar a institucionalização da Educação Ambiental na escola?", req=True)
q("2.3", "select_one ppp_sit", "Situação da Educação Ambiental no Projeto Político-Pedagógico (PPP)")
txt("2.4", "Como a Educação Ambiental aparece no PPP?", rel="${q2_3} = 'presente_e_detalhada' or ${q2_3} = 'presente_de_forma_generica'")
q("2.5", "select_one ppp_pratica", "O que está no PPP se traduz em prática?",
  rel="${q2_3} = 'presente_e_detalhada' or ${q2_3} = 'presente_de_forma_generica'")
q("2.6", "select_multiple areas_curr", "Áreas curriculares que já trabalharam Educação Ambiental")
q("2.7", "select_multiple articulacao", "Como ocorre a articulação entre áreas/disciplinas?",
  "Mais de uma forma de articulação pode coexistir — marque todas que se aplicam.")
q("2.8", "select_one freq_ea", "Frequência das práticas de Educação Ambiental")
q("2.9", "select_multiple contexto_ea", "Em que contextos essas práticas costumam acontecer?")
q("2.10", "select_one sim_nao_ns", "Houve alguma atividade concreta de Educação Ambiental nos últimos meses?",
  "Se não houve, tudo bem responder que não — não é necessário inventar uma prática.", req=True)
r10 = eq("q2_10", "sim")
txt("2.11", "Quando ocorreu?", rel=r10, multiline=False)
txt("2.12", "Qual foi o tema?", rel=r10, multiline=False)
txt("2.13", "O que motivou essa atividade?", rel=r10)
q("2.14", "select_multiple quem_planejou", "Quem planejou essa atividade?", rel=r10)
txt("2.15", "Qual foi a duração?", rel=r10, multiline=False)
q("2.16", "select_one papel_estud", "Qual foi o papel dos estudantes?", rel=r10)
q("2.17", "select_one sim_nao_ns", "Essa atividade teve relação com o território?", rel=r10)
txt("2.18", "Que problema territorial foi abordado?", rel=f"({r10}) and ${{q2_17}}='sim'")
q("2.19", "select_one continuidade_ativ", "Essa atividade tem perspectiva de continuidade?", rel=r10)
txt("2.20", "O que essa atividade mudou ou gerou?", rel=r10)
tabela("2.21", "Com que frequência cada tema é trabalhado?", "", TEMAS, "freq5", prefix="q2_21")
txt("2.21a", 'Você marcou uma frequência para "Outros" temas acima — quais temas são esses?',
    rel="${q2_21_15} != ''")
q("2.22", "select_multiple temas", "Quais temas são mais difíceis de trabalhar?")
q("2.23", "select_multiple causa_dif", "O que causa essa dificuldade?", rel="${q2_22} != ''")
q("2.24", "select_multiple metodos", "Quais métodos/estratégias a escola já utilizou em práticas de Educação "
  "Ambiental?", "Marque todos os que já foram usados, mesmo que raramente.")
q("2.25", "select_one metodos", "Qual método/estratégia é o mais utilizado no dia a dia?",
  "Diferente da pergunta anterior (que pedia todos os já usados, mesmo raramente), esta pede só UM — o "
  "predominante. A lista de opções é a mesma da pergunta anterior.")
q("2.26", "select_one freq5", "Frequência de uso do território como espaço pedagógico", req=True)
q("2.27", "select_one sim_nao_ns", "Problemas locais/territoriais são abordados nas práticas de EA?")
q("2.28", "select_one sim_nao_ns", "Houve formação recente em Educação Ambiental?")
r28 = eq("q2_28", "sim")
txt("2.29", "Quem ofereceu a formação?", rel=r28, multiline=False)
txt("2.30", "Quais temas foram abordados?", rel=r28)
q("2.31", "select_one impacto_form", "Qual o impacto dessa formação na prática?", rel=r28)
txt("2.32", "Dê um exemplo desse impacto", rel=r28)
q("2.33", "select_one confianca", "Quão confiante você se sente, como gestor(a), para liderar e apoiar a Educação Ambiental na escola hoje?",
  "Escala de 1 (nada confiante) a 5 (muito confiante).", app="horizontal-compact")
q("2.34", "select_multiple apoio", "Que tipo de apoio faria diferença?")
tabela("2.35", "Intensidade de cada barreira percebida", "", BARR, "intensidade", prefix="q2_35")
txt("2.35a", 'Você marcou uma intensidade para "Outras" barreiras acima — quais são elas?', rel="${q2_35_12} != ''")
q("2.36", "select_one barreiras", "Principal barreira hoje")
q("2.37", "select_multiple materiais", "Materiais didáticos utilizados")
q("2.38", "select_one acesso_mat", "Facilidade de acesso a esses materiais")
txt("2.39", "Que materiais fazem falta?")
q("2.40", "select_one part_estud", "Como caracterizar, de modo geral, a participação dos estudantes nas ações de EA?",
  req=True)
q("2.41", "select_one continuidade_proj", "De modo geral, a continuidade dos projetos de EA está...")
q("2.41a", "select_multiple apoio_gestao", "Como a gestão escolar apoia a Educação Ambiental hoje?",
  "Pense no que a gestão efetivamente faz, não no que deveria fazer.",
  cons="not(selected(., 'nenhum') and count-selected(.) > 1)", cmsg='"Nenhum apoio sistemático" não pode ser combinado com outras opções.')
note("e2_leitura", "Como o sistema está lendo suas respostas (revise e confirme) — no Kobo não há leitura automática: "
                   "a tutoria/quem aplica o formulário deve revisar as respostas desta etapa antes de responder abaixo.")
q("2.42", "select_one sim_nao_ns", "Essa leitura reflete a realidade da escola?")
txt("2.43", "O que precisa ser corrigido ou complementado?", rel=f"{eq('q2_42', 'nao')} or {eq('q2_42', 'nao_sabemos')}")
evidencias("e2", "Evidências sobre Educação Ambiental")
eg()

# ======================= ETAPA 3
bg("etapa3", "Etapa 3 — Participação e Redes")
q("3.1", "select_multiple quem_part", "Quem participa das ações de Educação Ambiental hoje?")
q("3.2", "select_one nivel_part", "Como essa participação costuma acontecer?",
  "Participação não é sinônimo de presença — o que importa é o nível de envolvimento na decisão.")
q("3.3", "select_multiple esp_estud", "Espaços de participação estudantil existentes",
  cons="not(selected(., 'nenhum') and count-selected(.) > 1)", cmsg='"Nenhum" não pode ser combinado com outras opções.')
txt("3.4", "Descreva práticas concretas de participação estudantil (se houver)")
q("3.5", "select_one sim_nao_ns", "O nível de participação estudantil descrito na Etapa 2 continua condizente?")
q("3.6", "select_one env_fam", "Nível de envolvimento das famílias com a escola")
q("3.7", "select_multiple barr_fam", "Barreiras à participação das famílias")
q("3.8", "select_one freq5", "Frequência de atividades da escola com o território/comunidade")
txt("3.9", "Quais atividades com o território/comunidade já ocorreram?")
q("3.10", "select_one sim_nao_ns", "A escola tem mecanismos de escuta da comunidade?")

q("3.10a", "select_multiple instancias", "Quais instâncias de decisão colegiada existem e funcionam na escola?",
  cons="not(selected(., 'nenhuma') and count-selected(.) > 1)", cmsg='"Nenhuma" não pode ser combinada com outras opções.')
q("3.10b", "select_one sim_nao_ns", "A gestão tem autonomia para decidir e destinar recursos a ações de Educação "
  "Ambiental?")
br("net_actors", "Atores do território (NET_ACTORS)")
note("net_nota", "Existência, contato, parceria e articulação permanente são níveis diferentes — não confunda um com o "
                 "outro. Só marque \"Parceria\" ou \"Articulação permanente\" se a escola já colabora de fato com esse "
                 "ator; se ele apenas existe no território ou já houve um contato pontual, isso ainda NÃO é parceria. "
                 "Use \"Adicionar\" para registrar um ator por vez.")
q("", "select_one cat_ator", "Categoria do ator", name="net_cat")
q("", "text", "Nome do ator (ex.: UBS Vila Nova)", name="net_nome")
q("", "select_one sim_nao_nsabe", "Existe no território?", name="net_existe")
q("", "select_one nivel_rel", "Nível de relação", name="net_nivel")
q("", "select_multiple contrib", "Contribuições atuais", name="net_contrib_atual")
q("", "select_multiple contrib", "Contribuições potenciais", name="net_contrib_pot")
q("", "select_one sim_nao", "Prioridade para fortalecimento (NET_PRIORITY_ACTORS) — é um ator prioritário a "
  "fortalecer?", name="net_prioridade")
er()

q("3.11", "select_one sim_nao_ns", "A escola sabe a quem contatar em uma emergência climática?", req=True)
txt("3.12", "Quais são esses contatos?", rel=eq("q3_11", "sim"))
q("3.13", "select_one sim_nao_ns", "Existe um procedimento de emergência definido para eventos climáticos?", req=True)
q("3.14", "select_one sim_nao_ns", "Esse procedimento está documentado/formalizado?", rel=eq("q3_13", "sim"))
txt("3.15", "Que ações de preparação já foram feitas (simulados, sinalização, etc.)?")
q("3.16", "select_multiple canais", "Canais de comunicação da escola com a comunidade")
q("3.17", "select_one suficiente", "Esses canais seriam suficientes numa emergência?")
txt("3.18", "Algum grupo fica de fora desses canais de comunicação?")
txt("3.19", "Que capacidades/conhecimentos a comunidade já possui e podem ser mobilizados?",
    "Ex.: conhecimento tradicional sobre o clima local, organização comunitária, mutirões, saberes de manejo.")
txt("3.20", "Quais dessas capacidades parecem mais estratégicas de fortalecer?")
q("3.21", "select_multiple barr_artic", "Barreiras para articular com atores do território")
txt("3.22", "Descreva um caso concreto de articulação (bem ou malsucedida) com a comunidade/rede")
txt("3.23", "Quem participou desse caso?", rel="${q3_22} != ''")
txt("3.24", "O que funcionou bem?", rel="${q3_22} != ''")
txt("3.25", "Quais foram as dificuldades?", rel="${q3_22} != ''")
txt("3.26", "O que essa experiência ensinou?", rel="${q3_22} != ''")
txt("3.27", "Se houvesse uma relação prioritária para fortalecer agora, qual seria?")
txt("3.28", "Por quê?", rel="${q3_27} != ''")
evidencias("e3", "Evidências sobre participação e redes")
eg()

# ======================= ETAPA 4
bg("etapa4", "Etapa 4 — Riscos Climáticos")
q("4.1", "select_multiple ameacas", "Quais ameaças/eventos climáticos já afetaram (ou podem afetar) a "
  "escola/comunidade?", req=True)
q("4.2", "select_one sim_nao_ns", "A comunidade percebe mudanças no padrão climático local ao longo dos anos?")
txt("4.3", "Que mudanças são percebidas?", "Registre como percepção da comunidade — o relatório final não converterá "
    "isso em dado técnico comprovado.", rel=eq("q4_2", "sim"))
q("4.4", "select_multiple base_percepcao", "Com base em quê essa percepção se formou?", rel=eq("q4_2", "sim"))
q("4.5", "select_multiple fontes_risco", "Existem fontes técnicas de informação sobre riscos consultadas pela "
  "escola?")
q("4.6", "select_one sim_nao_ns", "Seria necessário apoio técnico para avaliar melhor esses riscos?")
txt("4.7", "Apoio técnico para quê, especificamente?", rel=eq("q4_6", "sim"))
txt("4.8", "Algum ator já mapeado poderia oferecer esse apoio? (informe o nome do ator, conforme Etapa 3)")

br("risco", "Ficha de risco (RISK_*) — uma ficha para cada ameaça selecionada na Q4.1")
note("risco_nota", "Preencha uma ficha por ameaça selecionada na Q4.1 (use \"Adicionar\" para cada nova). "
                   "No sistema original as fichas são sugeridas automaticamente; aqui, escolha a ameaça abaixo.")
q("", "select_one ameacas", "Ameaça/evento climático desta ficha", name="risco_ameaca", req=True)
q("", "select_one sim_nao_nsabe", "Já ocorreu antes?", name="risco_ocorreu")
q("", "select_one afetou", "Afetou a escola, a comunidade, ou ambos?", name="risco_afetou")
q("", "select_one freq_risco", "Frequência", name="risco_freq")
q("", "text", "Ano da última ocorrência", name="risco_ano", cons=". = '' or regex(., '^[0-9]{4}$')",
  cmsg="Informe um ano com 4 dígitos.")
q("", "text", "Período do ano em que costuma ocorrer", name="risco_periodo")
q("", "select_multiple impacto_risco", "Impactos observados", name="risco_impactos")
q("", "text", "Descreva os impactos", name="risco_impactos_desc", app="multiline")
q("", "select_multiple ativos", "Ativos/estruturas expostos", name="risco_ativos")
q("", "select_multiple grupos_exp", "Grupos expostos", name="risco_grupos")
q("", "select_multiple cond_amplia", "Condições que podem ampliar dificuldades de proteção (não são características "
  "das pessoas — são condições do ambiente/organização)", name="risco_condicoes")
q("", "select_multiple cap_resp", "Capacidades de resposta já existentes", name="risco_capacidades")
q("", "select_one aval_cap", "Avaliação geral da capacidade de resposta", name="risco_aval_cap")
q("", "select_one bma_ns", "Probabilidade percebida (não é medição técnica)", name="risco_prob")
q("", "select_one bma_ns", "Gravidade potencial percebida", name="risco_grav")
q("", "text", "Justificativa da gravidade percebida", name="risco_grav_just", app="multiline")
q("", "select_one prio_1a5", "Prioridade que a comunidade dá a este risco (1 a 5)", name="risco_prioridade",
  app="horizontal-compact")
q("", "text", "Evidências associadas", name="risco_evid", app="multiline")
q("", "select_multiple marc_risco", "Marcações", name="risco_marcacoes")
er()

bg("cartografia", "Cartografia participativa (MAP_*)")
note("map_nota", "A cartografia pode registrar zonas de risco, de insegurança, de afeto, recursos/pontos de apoio, "
                 "lugares de memória e áreas de cuidado/preservação. Esta costuma ser uma etapa que se beneficia de "
                 "apoio de tutoria — se tiver dúvidas sobre como conduzir a cartografia com a turma/comunidade, "
                 "procure a equipe de tutoria antes de preencher.")
q("", "select_multiple cartog_quem", "Quem participou da cartografia?", name="map_quem")
txt("", "O que a cartografia revelou de novo?", name="map_novo")
q("", "select_one sim_nao_nsabe", "Houve diferenças de percepção entre participantes?", name="map_dif")
txt("", "Descreva essas diferenças", name="map_dif_desc", rel=eq("map_dif", "sim"))
txt("", "Se a cartografia ainda não foi feita, por quê?", name="map_porque")
q("", "image", "Anexar imagem da cartografia (MAP_FILE)", name="map_file")
eg()
evidencias("e4", "Evidências sobre riscos")
eg()

# ======================= ETAPA 5
bg("etapa5", "Etapa 5 — Leitura Integrada (FOFA)")
note("e5_nota", "No sistema original esta matriz é alimentada automaticamente pelas etapas anteriores (principalmente "
                "Riscos e Participação e Redes). No Kobo, preencha manualmente a partir das respostas já registradas "
                "(tutoria pode ajudar). Nada é definitivo sem revisão humana.")
q("5.1", "select_one sim_nao_ns", "A leitura construída até aqui reflete bem a realidade da escola e do território?",
  req=True)
txt("5.2", "Algum contexto importante para interpretar esta leitura integrada?")
txt("", "Forças — adicione uma por linha", name="swot_forcas")
txt("", "Fragilidades — adicione uma por linha", name="swot_fragilidades")
txt("", "Oportunidades — adicione uma por linha", name="swot_oportunidades")
txt("", "Ameaças — adicione uma por linha", name="swot_ameacas")
note("swot_rel_nota", "Relações estratégicas")
txt("", "Como uma força pode responder a uma ameaça? (SWOT_REL_STRENGTH_THREAT)", name="swot_rel_forca_ameaca")
txt("", "Como uma oportunidade pode reduzir uma fragilidade? (SWOT_REL_OPPORTUNITY_WEAKNESS)",
    name="swot_rel_oport_fragil")
txt("", "Como uma fragilidade agrava uma ameaça? (SWOT_REL_WEAKNESS_THREAT)", name="swot_rel_fragil_ameaca")
note("cap_nota", "Capacidades adaptativas: são recursos, saberes e formas de organização que a escola e o território JÁ "
                 "possuem e que ajudam a responder a desafios socioambientais e climáticos. Capacidades comunitárias "
                 "não são tratadas como inferiores às institucionais — registre o que já existe, mesmo que informal.")
txt("", "Pedagógicas (CAP_PEDAGOGICAL)", "Saberes e práticas de ensino já disponíveis na escola — ex.: professores "
    "com experiência em projetos interdisciplinares, metodologias ativas, uso do território como espaço de "
    "aprendizagem.", name="cap_pedagogical")
txt("", "Sociais (CAP_SOCIAL)", "Formas de organização e mobilização das pessoas — ex.: participação estudantil "
    "ativa, rede de apoio entre famílias, mutirões, associações comunitárias.", name="cap_social")
txt("", "Institucionais (CAP_INSTITUTIONAL)", "Estruturas, normas e gestão da própria escola — ex.: apoio da "
    "direção, PPP que sustenta continuidade, canais de decisão coletiva.", name="cap_institutional")
txt("", "Territoriais (CAP_TERRITORIAL)", "Recursos e conhecimentos do entorno — ex.: conhecimento tradicional "
    "sobre o clima local, parceiros no bairro, espaços públicos de apoio.", name="cap_territorial")
txt("", "Materiais (CAP_MATERIAL)", "Infraestrutura, equipamentos e recursos físicos — ex.: espaço para horta, "
    "materiais didáticos próprios, equipamentos disponíveis.", name="cap_material")
txt("5.3", "Qual a principal capacidade da escola/comunidade hoje?")
txt("5.4", "Qual a principal limitação hoje?")
txt("5.5", "Existe alguma oportunidade pouco aproveitada até agora?")
eg()

# ======================= ETAPA 6
bg("etapa6", "Etapa 6 — Problemas e Prioridades")
note("e6_nota", "No sistema original, candidatos a problema são propostos automaticamente (ex.: \"Problemas "
                "territoriais relacionados a resíduos\") a partir de outras etapas e só viram problemas se "
                "confirmados. Aqui, registre cada problema confirmado (use \"Adicionar\" para cada um) e analise-o.")
br("pri_problema", "Problema confirmado (PRI_CANDIDATES / PRI_CUSTOM_PROBLEM)")
q("", "text", "Título do problema", name="pri_titulo", req=True)
q("", "text", "Descrição", name="pri_descricao", app="multiline")
q("", "select_one bma", "Gravidade (PRI_SEVERITY)", name="pri_gravidade")
q("", "select_one bma", "Urgência (PRI_URGENCY)", name="pri_urgencia")
q("", "select_one abrangencia", "Abrangência (PRI_REACH)", name="pri_abrangencia")
q("", "select_one acionavel", "A escola consegue agir? (PRI_ACTIONABILITY)", name="pri_acionavel")
q("", "select_multiple afetados", "Grupos afetados (PRI_AFFECTED_GROUPS)", name="pri_afetados")
q("", "select_multiple decisao_part", "Quem deveria participar da decisão sobre este problema? "
  "(PRI_DECISION_PARTICIPANTS)", name="pri_decisao_part")
q("", "text", "Evidências (PRI_EVIDENCE)", name="pri_evidencias", app="multiline")
er()
txt("", "Selecione até 3 prioridades (PRI_TOP_PROBLEMS) — informe os títulos dos problemas, um por linha",
    "As informações acima organizam a análise, mas a escolha final não é uma soma automática de critérios — é uma "
    "decisão da comunidade escolar.", name="pri_top_problems",
    req=True)
txt("", "Por que esta é uma prioridade agora? (PRI_JUSTIFICATION)", name="pri_justification")
txt("", "Que mudança se espera ao endereçar isso? (PRI_EXPECTED_CHANGE)", name="pri_expected_change")
q("", "select_multiple decisao_part", "Participantes da decisão (PRI_SELECTION_PARTICIPANTS)",
  name="pri_sel_participantes")
q("", "select_one metodo_sel", "Método de seleção (PRI_SELECTION_METHOD)", name="pri_sel_metodo")
eg()

# ======================= ETAPA 7
bg("etapa7", "Etapa 7 — Plano de Ação")
br("plano", "Plano de ação (um por problema prioritário — use \"Adicionar\" para cada problema)")
q("", "text", "Plano para: título do problema confirmado", name="act_problema", req=True)
q("", "text", "Enunciado do problema (ACT_PROBLEM_STATEMENT)", name="act_problem_statement", app="multiline")
q("", "text", "Evidências que sustentam este plano (ACT_EVIDENCE)", name="act_evidence", app="multiline", req=True)
q("", "text", "Mudança desejada (ACT_DESIRED_CHANGE)", name="act_desired_change", app="multiline")
q("", "text", "Objetivo (ACT_OBJECTIVE)", name="act_objective", app="multiline", req=True)
q("", "select_multiple resp_tipo", "Tipos de resposta (ACT_RESPONSE_TYPES)", name="act_response_types")
br("atividades", "Atividades (ACT_ACTIVITIES)")
q("", "text", "Descrição", name="act_ativ_desc", app="multiline", req=True)
q("", "text", "Como será implementada", name="act_ativ_como", app="multiline")
q("", "text", "Responsável", name="act_ativ_resp")
q("", "text", "Início previsto", name="act_ativ_inicio")
q("", "text", "Término previsto", name="act_ativ_termino")
q("", "select_one status_ativ", "Status", name="act_ativ_status")
er()
q("", "select_multiple publicos", "Públicos envolvidos (ACT_AUDIENCES)", name="act_audiences")
q("", "select_one papel_estud2", "Papel dos estudantes (ACT_STUDENT_ROLE)", name="act_student_role")
q("", "text", "Coordenador(a) (ACT_COORDINATOR)", name="act_coordinator")
q("", "text", "Outros participantes (ACT_OTHER_PARTICIPANTS)", name="act_other_participants", app="multiline")
q("", "text", "Parceiros (ACT_PARTNERS) — nomes dos atores mapeados na Etapa 3", name="act_partners",
  app="multiline")
q("", "text", "Contribuição dos parceiros (ACT_PARTNER_CONTRIBUTION)", name="act_partner_contribution",
  app="multiline", rel="${act_partners} != ''")
q("", "text", "Recursos necessários (ACT_RESOURCES)", name="act_resources", app="multiline")
q("", "select_one viabilidade", "Viabilidade (ACT_VIABILITY)", name="act_viability")
q("", "text", "Início (ACT_START)", name="act_start")
q("", "text", "Duração (ACT_DURATION)", name="act_duration")
q("", "select_multiple dependencias", "Dependências (ACT_DEPENDENCIES)", name="act_dependencies",
  cons="not(selected(., 'nenhuma') and count-selected(.) > 1)",
  cmsg='"Nenhuma" não pode ser combinada com outras opções.')
q("", "text", "Detalhe das dependências (ACT_DEPENDENCY_DETAIL)", name="act_dependency_detail", app="multiline",
  rel="${act_dependencies} != '' and ${act_dependencies} != 'nenhuma'")
q("", "text", "Resultado esperado (ACT_EXPECTED_RESULT)", name="act_expected_result", app="multiline", req=True)
q("", "select_multiple evid_exec", "Como o resultado será evidenciado (ACT_EXECUTION_EVIDENCE)",
  name="act_execution_evidence")
q("", "select_multiple barr_impl", "Possíveis dificuldades de implementação (ACT_IMPLEMENTATION_BARRIERS)",
  name="act_implementation_barriers")
q("", "text", "Como mitigar? (ACT_MITIGATION)", name="act_mitigation", app="multiline")
note("act_trilha", "Trilha de coerência: problema → evidência → mudança desejada → objetivo → atividades → resultado "
                   "esperado.")
q("", "select_one coerencia", "Esta cadeia é coerente? (ACT_COHERENCE_CONFIRMATION)", name="act_coherence")
er()
eg()

# ======================= ETAPA 8
bg("etapa8", "Etapa 8 — Educomunicação")
br("comunic", "Plano de educomunicação (um por ação — use \"Adicionar\" para cada ação)")
q("", "text", "Ação: título do problema confirmado", name="com_acao", req=True)
q("", "select_multiple com_final", "Finalidades (COM_PURPOSE)", name="com_purpose")
q("", "select_multiple com_publico", "Públicos (COM_AUDIENCE)", name="com_audience")
q("", "text", "Mensagem central (COM_CENTRAL_MESSAGE)", name="com_central_message", app="multiline")
q("", "select_multiple com_escuta", "Canais de escuta (COM_LISTENING_CHANNELS)", name="com_listening_channels")
q("", "select_multiple com_midia", "Mídias/formatos (COM_MEDIA)", name="com_media")
q("", "select_multiple com_barr", "Barreiras de acesso (COM_ACCESS_BARRIERS)", name="com_access_barriers")
q("", "text", "Necessidades de acessibilidade (COM_ACCESS_NEEDS)", name="com_access_needs", app="multiline")
q("", "text", "Estratégias de acessibilidade (COM_ACCESS_STRATEGIES)", name="com_access_strategies", app="multiline")
q("", "select_multiple com_produz", "Quem produz (COM_PRODUCERS)", name="com_producers")
q("", "select_one com_decisao", "Nível de decisão dos estudantes (COM_STUDENT_DECISION)", name="com_student_decision")
q("", "text", "Momento em relação à ação (COM_TIMING)", name="com_timing", app="multiline")
er()
eg()

# ======================= ETAPA 9
bg("etapa9", "Etapa 9 — Monitoramento")
br("monit", "Indicador de monitoramento (um por indicador — use \"Adicionar\" para cada um)")
q("", "text", "Ação: título do problema confirmado", name="mon_acao", req=True)
q("", "text", "Nome do indicador (MON_INDICATOR_NAME)", name="mon_indicator_name")
q("", "select_one ind_tipo", "Tipo (MON_INDICATOR_TYPE)", name="mon_indicator_type")
q("", "text", "Como será medido (MON_MEASUREMENT)", name="mon_measurement", app="multiline")
q("", "select_one sim_nao", "Sabemos a linha de base atual?", name="mon_sabe_baseline")
q("", "text", "Linha de base (MON_BASELINE)", name="mon_baseline", rel=eq("mon_sabe_baseline", "sim"))
q("", "text", "Meta (MON_TARGET)", name="mon_target")
q("", "text", "Fonte de verificação (MON_SOURCE)", name="mon_source")
q("", "select_one periodicidade", "Periodicidade (MON_PERIODICITY)", name="mon_periodicity")
q("", "text", "Responsável (MON_RESPONSIBLE)", name="mon_responsible")
q("", "text", "Mudança qualitativa observada até agora (MON_QUALITATIVE_CHANGE)", name="mon_qual_change",
  app="multiline")
q("", "text", "Como reconheceremos essa mudança? (MON_QUALITATIVE_RECOGNITION)", name="mon_qual_recognition",
  app="multiline")
er()
eg()

# ======================= ETAPA 10
bg("etapa10", "Etapa 10 — Síntese")
note("e10_nota", "Esta etapa não substitui a leitura já construída — ela organiza uma síntese final a partir do que "
                 "foi registrado.")
q("10.1", "select_one sim_nao_ns", "Este diagnóstico, no conjunto, reflete a realidade da escola e do território?",
  req=True)
txt("10.2", "Há algo que precisa ser revisado antes de considerar este diagnóstico concluído?")
txt("10.3", "Qual o principal desafio revelado por este diagnóstico?")
txt("10.4", "Qual a principal capacidade/potencialidade revelada?")
txt("10.5", "Qual parceria é mais prioritária para os próximos passos?")
txt("10.6", "Que transformação a escola espera alcançar com os planos construídos?")
txt("10.7", "Nossa escola será mais resiliente quando...", "Complete a frase com suas próprias palavras — ela encerra "
    "este diagnóstico.", req=True)
eg()

# ---------------------------------------------------------------- ESCRITA
def _loc(t):
    if not isinstance(t, str):
        return t
    for p, r in [
        (r"\bA escola pode agir sozinha", "O local pode agir sozinho"),
        (r"\bNossa escola\b", "Nosso local"), (r"\bda própria escola\b", "do próprio local"),
        (r"\bToda a escola\b", "Todo o local"),
        (r"\b(d|n)?(es[st]a|essa) escola\b", lambda m: (m.group(1) or "") + {"esta": "este", "essa": "esse"}[m.group(2)] + " local"),
        (r"\bna escola\b", "neste local"), (r"\bNa escola\b", "Neste local"),
        (r"\bda escola\b", "do local"), (r"\bà escola\b", "ao local"), (r"\bpela escola\b", "pelo local"),
        (r"\bcom a escola\b", "com o local"), (r"\bA escola\b", "O local"), (r"\ba escola\b", "o local"),
        (r"\bescolas\b", "locais"), (r"\bEscola\b", "Local"), (r"\bescola\b", "local")]:
        t = re.sub(p, r, t)
    return t


def salvar(path, rows, titulo, form_id, versao="1.0.0"):
    titulo = _loc(titulo)
    rows = [{k: (_loc(v) if k in ("label", "hint", "constraint_message") and not (r.get("name") in ("q0_8", "q0_10", "t1_1r", "e1_rede", "e1_rede_nota", "e1_escola", "q1_15") or re.fullmatch(r"q1_\d+r(_outro)?", r.get("name", ""))) else v)
             for k, v in r.items()} for r in rows]
    usadas = {m.group(1) for r in rows for m in [re.match(r"select_\w+ (\w+)", r.get("type", ""))] if m}
    wb = Workbook()
    ws = wb.active
    ws.title = "survey"
    cols = ["type", "name", f"label::{LANG}", f"hint::{LANG}", "required", "relevant", "appearance", "constraint",
            f"constraint_message::{LANG}", "repeat_count"]
    inv = {f"label::{LANG}": "label", f"hint::{LANG}": "hint", f"constraint_message::{LANG}": "constraint_message"}
    ws.append(cols)
    for r in rows:
        ws.append([r.get(inv.get(c, c), "") or "" for c in cols])
    wc = wb.create_sheet("choices")
    wc.append(["list_name", "name", f"label::{LANG}"])
    for ln, items in choices.items():
        if ln in usadas:
            for n, lab in items:
                wc.append([ln, n, lab if ln in ("tipo_local", "cat_ator") else _loc(lab)])
    wsett = wb.create_sheet("settings")
    wsett.append(["form_title", "form_id", "version", "default_language", "style"])
    wsett.append([titulo, form_id, versao, LANG, "theme-grid no-text-transform"])
    fill = PatternFill("solid", fgColor="DDEBF7")
    for sh in (ws, wc, wsett):
        for c in sh[1]:
            c.font = Font(bold=True)
            c.fill = fill
    ws.freeze_panes = "A2"
    for col, w in zip("ABCDEFGHIJ", (22, 24, 70, 50, 9, 40, 16, 30, 30, 12)):
        ws.column_dimensions[col].width = w
    wb.save(path)
    print(f"{path}: {len(rows)} linhas")


TCLE_TEXTO = (
    "TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO. Você está sendo convidado(a) a responder este Diagnóstico "
    "Socioambiental, Climático e de Educação Ambiental. A participação é voluntária: você pode recusar ou "
    "interromper a qualquer momento, sem qualquer prejuízo. As informações fornecidas, inclusive seus dados "
    "pessoais e de identificação (nome, função, local de atuação), serão tratadas com sigilo, NÃO serão "
    "compartilhadas com terceiros de forma que identifique você ou o seu local de atuação e serão utilizadas "
    "apenas para compor um banco de dados do projeto. Eventuais resultados e relatórios serão apresentados "
    "somente de forma agregada, sem identificar pessoas. O tratamento dos dados segue a Lei Geral de Proteção de "
    "Dados (Lei nº 13.709/2018). Em caso de dúvidas, procure a equipe responsável pelo projeto.")


def tcle():
    return [
        dict(type="begin_group", name="tcle", label="Termo de Consentimento"),
        dict(type="note", name="tcle_texto", label=TCLE_TEXTO),
        dict(type="select_one concordo", name="tcle_consentimento", required="true",
             label="Li o termo acima e concordo em participar e em ter minhas respostas e meus dados utilizados "
                   "no banco de dados do projeto, nos termos descritos."),
        dict(type="note", name="tcle_recusa", relevant="${tcle_consentimento} = 'nao_concordo'",
             label="Sem o seu consentimento não é possível continuar. Obrigado(a) pelo seu tempo! Você pode "
                   "encerrar o formulário."),
        dict(type="end_group"),
    ]


def confirmacao(semana=None):
    msg = ("Semana %d/5 concluída. " % semana if semana else "") + (
        "Obrigado(a) pela sua participação! Suas respostas ajudam a construir um diagnóstico mais completo. "
        "Revise o que respondeu, confirme abaixo e clique em Enviar para concluir. ATENÇÃO: depois de clicar em "
        "Enviar, aparecerá a mensagem \"Submission successful\" e o formulário voltará em branco. Isso significa que "
        "suas respostas FORAM ENVIADAS. Não preencha nem envie novamente.")
    return [dict(type="begin_group", name="confirmacao", label="Confirmação final"),
            dict(type="note", name="confirmacao_msg", label=msg),
            dict(type="select_one confirmo", name="confirmacao_envio", required="true",
                 label="Revisei minhas respostas e confirmo o envio."),
            dict(type="end_group")]


def com_tcle(meta, corpo, semana=None):
    return list(meta) + tcle() + [dict(type="begin_group", name="conteudo", label="Diagnóstico",
                                       relevant="${tcle_consentimento} = 'concordo'")] + corpo + confirmacao(semana) + [dict(type="end_group")]


def blocos():
    """Divide o survey em grupos de nível superior (etapas)."""
    meta = [r for r in survey[:4]]
    out, cur, depth = {}, None, 0
    for r in survey[4:]:
        t = r["type"]
        if depth == 0 and t == "begin_group":
            cur = r["name"]
            out[cur] = []
        out[cur].append(r)
        if t in ("begin_group", "begin_repeat"):
            depth += 1
        elif t in ("end_group", "end_repeat"):
            depth -= 1
    return meta, out


salvar("gestores_diagnostico_completo.xlsx", com_tcle(survey[:4], survey[4:]),
       "Diagnóstico Socioambiental, Climático e de Educação Ambiental da Escola — Gestores Escolares", "diagnostico_gestores_escola")

SEMANAS = [
    (1, "Identificação e Território", ["etapa0", "etapa1"]),
    (2, "Educação Ambiental, Participação e Redes", ["etapa2", "etapa3"]),
    (3, "Riscos Climáticos e Leitura Integrada (FOFA)", ["etapa4", "etapa5"]),
    (4, "Problemas, Prioridades e Plano de Ação", ["etapa6", "etapa7"]),
    (5, "Educomunicação, Monitoramento e Síntese", ["etapa8", "etapa9", "etapa10"]),
]
meta, bl = blocos()
for n, nome, etapas in SEMANAS:
    rows = []
    if n > 1:  # identifica a escola/cursista para cruzar as semanas
        rows += [
            dict(type="begin_group", name="identificacao", label="Identificação (igual à Semana 1)"),
            dict(type="text", name="id_escola", label="Nome do local de atuação", required="true"),
            dict(type="text", name="id_inep", label="Código INEP (apenas se for escola; 8 dígitos)",
                 constraint="regex(., '^[0-9]{8}$')", constraint_message="O código INEP deve ter 8 dígitos."),
            dict(type="text", name="id_nome", label="Seu nome", required="true"),
            dict(type="end_group"),
        ]
    for e in etapas:
        rows += bl[e]
    rows = com_tcle(meta, rows, n)
    salvar(f"gestores_semana{n}_diagnostico.xlsx", rows,
           f"Diagnóstico Socioambiental (Gestores) — Semana {n}/5: {nome}", f"diagnostico_gestores_semana{n}")
