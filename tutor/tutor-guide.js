"use strict";
/**
 * tutor-guide.js
 * Apresentação e guia metodológico do Caderno — conteúdo institucional
 * fornecido pela coordenação do projeto (SECADI-UFPEL). Texto de
 * referência, estático, reproduzido tal como recebido (estruturado em
 * HTML semântico); não é dado do notebook nem do diagnóstico e não
 * grava nada — é conteúdo de leitura para o tutor.
 */

(function () {
  const { el } = window.TutorComponents;

  function p(text) {
    return el("p", {}, text);
  }

  function ul(items) {
    return el("ul", {}, items.map((i) => el("li", {}, i)));
  }

  function eyebrow(text) {
    return el("p", { class: "guide-eyebrow" }, text);
  }

  function indicatorsTable() {
    const rows = [
      ["Processo", "Inserção da EA no PPP e Planejamento Coletivo Interdisciplinar.", "Mensal / Anual"],
      ["Prática Docente", "Frequência de atividades de campo e uso de materiais inovadores.", "Trimestral"],
      ["Impacto Físico", "Redução real da queima de lixo e aumento da taxa de reciclagem.", "Semestral"],
      ["Saneamento", "Frequência de testes de potabilidade e limpeza de filtros.", "Trimestral"],
      ["Mobilização", "Percentual de aumento na interação escola-comunidade (meta > 8%).", "Semestral"],
    ];
    const table = el("table", { class: "dashboard-table guide-table" });
    table.appendChild(el("thead", {}, [el("tr", {}, ["Categoria", "Indicador", "Periodicidade"].map((h) => el("th", { scope: "col" }, h)))]));
    const tbody = el("tbody");
    rows.forEach((r) => tbody.appendChild(el("tr", {}, r.map((c) => el("td", {}, c)))));
    table.appendChild(tbody);
    return el("div", { class: "table-scroll" }, table);
  }

  function render() {
    const wrap = el("article", { class: "guide" });

    wrap.appendChild(el("h2", {}, "Caderno de Diagnóstico Escolar e Territorial para Tutores (SECADI-UFPEL)"));

    wrap.appendChild(el("section", { class: "guide-block" }, [
      el("h3", {}, "Apresentação"),
      p("Este Caderno constitui uma ferramenta técnico-pedagógica estratégica para a condução do diagnóstico socioambiental nas instituições de ensino, sob a égide da Secretaria de Educação Continuada, Alfabetização e Diversidade (SECADI/MEC). O objetivo central é instrumentalizar tutores e cursistas para que transcendam a burocracia acadêmica e identifiquem, com precisão técnica e sensibilidade territorial, as vulnerabilidades e potencialidades que fundamentarão projetos de Educação Ambiental (EA) críticos, resilientes e adaptados à crise climática contemporânea."),
      p("Além disso, é importante fomentar entre os cursistas a proposta de formação de rede de Escolas Resilientes a partir dos dados de diagnóstico gerados ao longo do curso."),
      p("O produto deve incluir:"),
      ul([
        "diagnóstico socioambiental do território escolar",
        "identificação de vulnerabilidades e riscos climáticos relevantes para a comunidade escolar",
        "estratégias educativas de prevenção e adaptação climática",
        "iniciativas de educomunicação socioambiental e mobilização comunitária",
        "articulação com instituições territoriais (defesa civil, secretarias ambientais, órgãos de gestão de riscos)",
        "indicadores de acompanhamento das ações educativas.",
      ]),
    ]));

    wrap.appendChild(el("section", { class: "guide-block" }, [
      eyebrow("Bloco 1"),
      el("h3", {}, "Diagnóstico socioambiental do território escolar"),

      el("h4", {}, "A Escola como Nó de Resiliência Territorial"),
      p("A escola precisa ser compreendida como um nó, em uma rede territorial complexa. Por isso, o mapeamento dos atores locais (como associações comunitárias, parceiros institucionais e órgãos de proteção) é o que define a resiliência escolar frente às crises climáticas. Uma escola isolada é uma escola vulnerável. Uma escola em rede é um polo de adaptação social."),

      el("h4", {}, "A Escola como um Ecossistema Integrado ao Território"),
      p("Além da rede territorial, a escola é um ecossistema por si só, em interação com o seu território. A construção de uma escola resiliente perpassa a compreensão dos fatores biológicos, físicos, sociais, históricos e culturais nos quais estão inseridas, que explicam a realidade, os desafios e potenciais da comunidade escolar. O olhar complexo sobre a escola e o seu meio permite compreender os impactos das mudanças climáticas no território, e dá subsídio para um plano de enfrentamento e adaptação."),

      el("h4", {}, "1. Identificação e Perfil Crítico do Respondente"),
      p("O tutor deve estar atento ao perfil do respondente, correlacionando-o com os dados da SECADI:"),
      ul(["Nome", "Cargo/função", "Tempo de experiência na escola", "Escolaridade e área de formação"]),

      el("h4", {}, "2. Infraestrutura"),
      ul([
        "Identificação: Nome da escola; Cidade; Estado",
        "Localização: Rural/Campo; Urbana; Quilombola; Indígena",
        "Equipamentos e infraestrutura: Biblioteca, equipamentos de vídeo, laboratório de ciências, laboratório de informática",
        "Espaços Verdes: a comunidade colabora na manutenção de hortas, pomares ou áreas de jardim da escola?",
      ]),
      p("Gestão de Resíduos:"),
      ul([
        "Como funciona a gestão de resíduos na escola?",
        "Existe separação e destinação adequada?",
        "Existe queima de resíduos no entorno da escola?",
      ]),
      p("Condições de Saneamento:"),
      ul([
        "A água de consumo é testada e há presença de infraestrutura hídrica (cisternas ou filtros)?",
        "Os efluentes (esgoto) têm destinação adequada (rede ou fossa) ou correm a céu aberto?",
      ]),

      el("h4", {}, "Metodologia de Cartografia Afetiva"),
      p("O tutor deve exigir a apresentação de um croqui coletivo elaborado com os alunos, mapeando:"),
      ul([
        "Pontos de Insegurança: onde os estudantes temem transitar?",
        "Pontos de Vulnerabilidade Climática: onde o lixo se acumula ou a água invade?",
        "Zonas de Afeto: quais áreas naturais o estudante deseja preservar?",
      ]),

      el("h4", {}, "3. Caracterização do Território e Matriz de Inserção"),
      p("O tutor deve orientar o cursista a compreender a escola contextualizada em seu território, considerando os elementos naturais e as temporalidades tradicionais:"),
      p("Aspectos territoriais:"),
      ul([
        "Elementos Naturais: rios/córregos, lagoas, lagos, represas; encostas; áreas verdes/parques; áreas impactadas",
        "Atividades Econômicas do Entorno: empreendimentos, indústrias (tipos), comércio, saúde (hospitais, UPA, UBS), pedreira, madeireira, aterro sanitário — incentivar a pensar impactos ambientais diretos e indiretos",
        "Ciclos Locais: sazonalidade do território — como são as mudanças do clima ao longo de um ano? Há uma época de colheita que muda a dinâmica local (ex.: fornecimento de merenda)? Existe ciclo de cheia/enchente/vazante? Quais os períodos de seca severa?",
        "Integração comunitária (instituições parceiras, datas comemorativas, festividades locais)",
        "Mapeamento de atores-chave no enfrentamento climático: defesa civil, secretarias ambientais, órgãos de gestão de riscos",
      ]),

      el("h4", {}, "Inclusão formal da EA na escola"),
      ul([
        "Como a Educação Ambiental se organiza na grade (projetos, temas transversais, disciplinas específicas, datas comemorativas ou atividades comunitárias)?",
        "Como a EA está inserida no PPP da escola?",
        "Quais disciplinas você percebe a inserção de temáticas ambientais?",
        "Existe algum projeto ou programa do qual a escola faz parte relacionado a Educação Ambiental (temáticas ambientais e/ou climáticas)?",
      ]),
      p("Como funciona a formação continuada nessa temática?"),
    ]));

    wrap.appendChild(el("section", { class: "guide-block" }, [
      eyebrow("Bloco 2"),
      el("h3", {}, "Do diagnóstico ao plano de ação"),
      p("As informações coletadas até aqui servem de matéria-prima para análise complexa do território escolar e para o planejamento de ações que dialoguem com a realidade do território frente às mudanças climáticas."),

      el("h4", {}, "Identificação de Vulnerabilidades e Riscos Climáticos"),
      p("Propor que o cursista elabore uma Matriz FOFA (SWOT) Pedagógica, a fim de olhar de forma estratégica para o território escolar, buscando soluções inovadoras, participativas e com potencial de mobilização."),
      p("Tópicos da Matriz FOFA:"),
      ul([
        "Fortalezas: ex. presença de professores idealistas, pátio arborizado.",
        "Oportunidades: ex. editais da SECADI, parcerias com universidades.",
        "Fraquezas: ex. falta de recursos materiais, descontinuidade de projetos.",
        "Ameaças: ex. queima de lixo vizinha, riscos de enchentes.",
      ]),

      el("h4", {}, "Estratégias educativas de prevenção e adaptação climática — proposta de educomunicação"),
      p("A educomunicação deve garantir o protagonismo estudantil na gestão de riscos:"),
      ul([
        "Rádio/Podcast Escolar: discussão sobre os riscos hídricos e térmicos do bairro.",
        "Murais Interativos: transparência dos dados de potabilidade e resíduos para a comunidade.",
        "Fortalecimento da Com-Vida: institucionalizar a comissão para gerir o Plano de Ação.",
      ]),
    ]));

    wrap.appendChild(el("section", { class: "guide-block" }, [
      eyebrow("Bloco 3"),
      el("h3", {}, "Indicadores e monitoramento"),
      p("Tabela de indicadores de acompanhamento:"),
      indicatorsTable(),
    ]));

    wrap.appendChild(el("section", { class: "guide-block" }, [
      el("h3", {}, "Fechamento e Síntese de Valor"),
      p("O papel do tutor é garantir que este diagnóstico não seja um fim em si mesmo, mas o início de uma cultura de prevenção e adaptação climática. Ao fundamentar as ações na realidade nua do território e na diversidade das populações brasileiras, a escola deixa de ser um reduto de discursos para se tornar um território de resiliência e cuidado socioambiental."),
    ]));

    return wrap;
  }

  window.TutorGuide = { render };
})();
