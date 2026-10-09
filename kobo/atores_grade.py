"""Bloco "Atores do território" em formato de grade (usado por gerar_xlsform.py e pelo script da Semana 2 dos
professores) e utilitário de renumeração de uma etapa."""
import re

CATS = [
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
    ("outro_comunidades", "Outro (comunidades e conhecimentos)")]

LEVELS = [("nao_existe", "Não existe no território"), ("nao_sei", "Não sei se existe"),
          ("sem_contato", "Existe, mas nunca houve contato"),
          ("contato_pontual", "Contato pontual, sem combinação formal (ainda não é parceiro(a))"),
          ("parceria", "Parceria — já colaboram em ações combinadas"),
          ("articulacao", "Articulação permanente — parceria contínua e estruturada")]


def _or(parts):
    return " or ".join(parts)


def atores_rows():
    rows = []
    add = rows.append
    n = len(CATS)
    ref = lambda i: "${net_rel_%02d}" % i
    add(dict(type="note", name="net_nota", label=(
        "Atores do território (NET_ACTORS). Existência, contato, parceria e articulação permanente são níveis "
        "diferentes — não confunda um com o outro. Só marque \"Parceria\" ou \"Articulação permanente\" se a escola "
        "já colabora de fato com esse ator; se ele apenas existe no território ou já houve um contato pontual, isso "
        "ainda NÃO é parceria.")))
    add(dict(type="begin_group", name="net_rel", appearance="table-list",
             label="Q3.0. Para cada tipo de ator, qual é a relação atual da escola com ele?"))
    for i, (_, lab) in enumerate(CATS, 1):
        add(dict(type="select_one nivel_rel_grade", name="net_rel_%02d" % i, label=lab, required="true"))
    add(dict(type="end_group"))
    add(dict(type="select_multiple cat_ator", name="net_prioridade",
             label="Q3.0. Quais atores são prioritários para fortalecer a relação? (NET_PRIORITY_ACTORS)"))
    add(dict(type="text", name="net_ator_relevante", appearance="multiline",
             label="Q3.0. Cite o nome do ator mais relevante para a escola hoje (ex.: UBS Vila Nova)"))
    return rows


def renumber(rows, stage, lab="label"):
    """Renumera sequencialmente os rótulos 'Q<stage>.n' da etapa (e os nomes q<stage>_n), atualizando as
    referências em relevant/constraint de todas as linhas."""
    start = None
    depth = 0
    mp, last, last_old, cnt = {}, None, None, 0
    for r in rows:
        t = r["type"]
        if start is None:
            if t == "begin_group" and r.get("name") == "etapa%d" % stage:
                start, depth = True, 1
            continue
        if t in ("begin_group", "begin_repeat"):
            depth += 1
        elif t in ("end_group", "end_repeat"):
            depth -= 1
            if depth == 0:
                break
        l = r.get(lab)
        m = re.match(r"^Q%d\.\d+[a-z]*\.\s*" % stage, l) if isinstance(l, str) else None
        if m:
            cnt += 1
            r[lab] = "Q%d.%d. " % (stage, cnt) + l[m.end():]
            if t not in ("begin_group", "begin_repeat") and r.get("name"):
                new = "q%d_%d" % (stage, cnt)
                mp[r["name"]] = new
                last, last_old = new, r["name"]
        elif last_old and r.get("name") == last_old + "_outro":
            mp[r["name"]] = last + "_outro"
    for r in rows:
        if r.get("name") in mp:
            r["name"] = mp[r["name"]]
        for col in ("relevant", "constraint"):
            if r.get(col):
                r[col] = re.sub(r"\$\{(\w+)\}", lambda x: "${" + mp.get(x.group(1), x.group(1)) + "}", r[col])
    return mp
