"""Campo de e-mail em todos os formulários (cópia das respostas enviada pela equipe do curso)."""
import re

LABEL = "Insira abaixo o seu e-mail para receber uma cópia das suas respostas"
DICA = "A cópia é enviada pela equipe do curso. Use o mesmo e-mail em todas as semanas."
REGEX = "regex(., '^[^@ ]+@[^@ ]+[.][^@ ]+$')"
MSG = "Informe um e-mail válido, por exemplo nome@exemplo.com."
TCLE_ANTES = "(nome, função, local de atuação)"
TCLE_DEPOIS = "(nome, e-mail, função, local de atuação)"
TCLE_EXTRA = (" O e-mail informado será usado apenas para o envio, pela equipe do curso, de uma cópia das suas "
              "respostas.")


def linha(lab, hint, cm):
    return {"type": "text", "name": "email", "required": "true", lab: LABEL, hint: DICA, "constraint": REGEX, cm: MSG}


def tcle(texto):
    if TCLE_DEPOIS in texto:
        return texto
    texto = texto.replace(TCLE_ANTES, TCLE_DEPOIS)
    return texto.replace(" Em caso de dúvidas,", TCLE_EXTRA + " Em caso de dúvidas,")


def aplicar(rows, lab, hint, cm):
    """Semana 1: após o nome (Etapa 0). Semanas 2 a 5: após o nome no bloco de identificação."""
    from revisao_s3 import numerar
    if any(r.get("name") == "email" for r in rows):
        return
    nomes = [r.get("name") for r in rows]
    if "id_nome" in nomes:
        i = nomes.index("id_nome")
    else:
        i = nomes.index("q0_1")  # "Seu nome" da Etapa 0
    rows.insert(i + 1, linha(lab, hint, cm))
    for r in rows:
        if r.get("name") == "tcle_texto":
            r[lab] = tcle(r[lab])
    if "q0_1" in nomes and "id_nome" not in nomes:
        numerar(rows, 0, lab)
