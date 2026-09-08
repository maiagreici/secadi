/**
 * stage0.js — Etapa 0: Identificação
 * Escola, respondente e metodologia do diagnóstico.
 */

(function () {
  const { el, renderField } = window.Components;

  const NETWORK_OPTIONS = [
    { value: "municipal", label: "Municipal" },
    { value: "estadual", label: "Estadual" },
    { value: "federal", label: "Federal" },
    { value: "privada", label: "Privada" },
    { value: "comunitaria", label: "Comunitária" },
    { value: "other", label: "Outra" },
  ];

  const EDUCATION_LEVELS_OPTIONS = [
    { value: "educacao_infantil", label: "Educação Infantil" },
    { value: "ef_anos_iniciais", label: "Ensino Fundamental — anos iniciais" },
    { value: "ef_anos_finais", label: "Ensino Fundamental — anos finais" },
    { value: "ensino_medio", label: "Ensino Médio" },
    { value: "eja", label: "EJA" },
    { value: "educacao_profissional", label: "Educação Profissional e Tecnológica" },
    { value: "educacao_especial", label: "Educação Especial" },
    { value: "other", label: "Outra" },
  ];

  const LOCATION_OPTIONS = [
    { value: "urbana", label: "Urbana" },
    { value: "rural", label: "Rural" },
    { value: "periurbana", label: "Periurbana / de transição" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const TERRITORIAL_CONTEXT_OPTIONS = [
    { value: "educacao_campo", label: "Educação do Campo" },
    { value: "indigena", label: "Território indígena" },
    { value: "quilombola", label: "Quilombola" },
    { value: "ribeirinho", label: "Ribeirinho" },
    { value: "caicara", label: "Caiçara" },
    { value: "extrativista", label: "Extrativista" },
    { value: "assentamento", label: "Assentamento" },
    { value: "other", label: "Outro" },
    { value: "none", label: "Nenhum" },
    { value: "dontknow", label: "Não sabe" },
  ];

  const RESP_ROLE_OPTIONS = [
    { value: "professor", label: "Professor(a)" },
    { value: "gestor", label: "Gestor(a) / Direção" },
    { value: "coordenador_pedagogico", label: "Coordenador(a) pedagógico(a)" },
    { value: "funcionario", label: "Funcionário(a)" },
    { value: "other", label: "Outro" },
  ];

  const RESP_EDUCATION_LEVEL_OPTIONS = [
    { value: "ensino_medio", label: "Ensino Médio / Magistério" },
    { value: "graduacao", label: "Graduação" },
    { value: "especializacao", label: "Pós-graduação (especialização)" },
    { value: "mestrado", label: "Mestrado" },
    { value: "doutorado", label: "Doutorado" },
    { value: "dontknow", label: "Não sabe / não se aplica" },
  ];

  const MET_PARTICIPANTS_OPTIONS = [
    { value: "students", label: "Estudantes" },
    { value: "teachers", label: "Professores(as)" },
    { value: "management", label: "Gestão" },
    { value: "pedagogical_coordination", label: "Coordenação pedagógica" },
    { value: "staff", label: "Funcionários(as)" },
    { value: "families", label: "Famílias" },
    { value: "school_council", label: "Conselho escolar" },
    { value: "community", label: "Comunidade" },
    { value: "leaderships", label: "Lideranças" },
    { value: "partners", label: "Parceiros" },
    { value: "other", label: "Outros" },
    { value: "only_respondent", label: "Somente o(a) cursista" },
  ];

  const MET_SOURCES_OPTIONS = [
    { value: "direct_observation", label: "Observação direta" },
    { value: "talk_students", label: "Conversa com estudantes" },
    { value: "talk_teachers", label: "Conversa com professores(as)" },
    { value: "families_community", label: "Famílias/comunidade" },
    { value: "collective_meeting", label: "Reunião coletiva" },
    { value: "ppp", label: "PPP" },
    { value: "school_documents", label: "Documentos escolares" },
    { value: "public_data", label: "Dados públicos" },
    { value: "participatory_mapping", label: "Cartografia participativa" },
    { value: "historical_records", label: "Registros históricos" },
    { value: "other", label: "Outras" },
  ];

  const fields = [
    { id: "SCH_NAME", type: "text", label: "Nome da escola", qNumber: "Q0.1", required: true },
    { id: "SCH_INEP_CODE", type: "text", label: "Código INEP", qNumber: "Q0.2", help: "Código público de 8 dígitos, o mesmo usado no Censo Escolar — não é uma informação sigilosa; pode ser consultado por qualquer pessoa no site do INEP ou com a secretaria da escola. Deixe em branco se não souber." },
    { id: "SCH_CITY", type: "text", label: "Município", qNumber: "Q0.3", required: true },
    { id: "SCH_STATE", type: "text", label: "UF", qNumber: "Q0.4", required: true },
    { id: "SCH_NETWORK", type: "singleChoice", label: "Rede", qNumber: "Q0.5", options: NETWORK_OPTIONS, otherFieldId: "SCH_NETWORK_OTHER", required: true },
    { id: "SCH_EDUCATION_LEVELS", type: "multiChoice", label: "Etapas/modalidades de ensino ofertadas", qNumber: "Q0.6", options: EDUCATION_LEVELS_OPTIONS, required: true },
    { id: "SCH_LOCATION", type: "singleChoice", label: "Localização", qNumber: "Q0.7", options: LOCATION_OPTIONS, required: true },
    { id: "SCH_TERRITORIAL_CONTEXT", type: "multiChoice", label: "Contextos territoriais", qNumber: "Q0.8", options: TERRITORIAL_CONTEXT_OPTIONS, otherFieldId: "SCH_TERRITORIAL_OTHER", help: "Se a escola está em contexto urbano comum, sem nenhuma dessas identidades territoriais específicas, marque \"Nenhum\"." },
    { id: "SCH_STUDENT_COUNT", type: "number", label: "Número aproximado de estudantes", qNumber: "Q0.9", min: 0 },
    { id: "SCH_STAFF_COUNT", type: "number", label: "Número aproximado de profissionais", qNumber: "Q0.10", min: 0 },

    { id: "RESP_NAME", type: "text", label: "Seu nome", qNumber: "Q0.11", required: true },
    { id: "RESP_ROLE", type: "singleChoice", label: "Sua função na escola", qNumber: "Q0.12", options: RESP_ROLE_OPTIONS, otherFieldId: "RESP_ROLE_OTHER", required: true },
    {
      id: "RESP_TEACHING_AREA",
      type: "text",
      label: "Área de atuação/disciplina (se docente)",
      qNumber: "Q0.13",
      condition: (d) => window.DataModel.getAnswer(d, "RESP_ROLE") === "professor",
    },
    { id: "RESP_EDUCATION_LEVEL", type: "singleChoice", label: "Nível de formação", qNumber: "Q0.14", options: RESP_EDUCATION_LEVEL_OPTIONS },
    { id: "RESP_EDUCATION_AREA", type: "text", label: "Área de formação", qNumber: "Q0.15" },
    { id: "RESP_TIME_AT_SCHOOL", type: "text", label: "Tempo de atuação nesta escola", qNumber: "Q0.16" },

    { id: "MET_PARTICIPANTS", type: "multiChoice", label: "Quem participou da construção deste diagnóstico até agora", qNumber: "Q0.17", options: MET_PARTICIPANTS_OPTIONS, required: true },
    { id: "MET_SOURCES", type: "multiChoice", label: "Quais fontes de informação foram utilizadas", qNumber: "Q0.18", options: MET_SOURCES_OPTIONS, required: true },
    { id: "MET_PROCESS_DESCRIPTION", type: "textarea", label: "Descreva brevemente como o processo de diagnóstico foi conduzido", qNumber: "Q0.19", help: "Quem esteve envolvido, como as informações foram levantadas, em quantos encontros, etc." },
  ];

  function render(diagnosis) {
    const container = el("div", { class: "stage-form" });
    container.appendChild(
      el("p", { class: "stage-intro" }, "Estas informações identificam a escola, quem está respondendo e como o diagnóstico está sendo construído. Elas serão reaproveitadas nas próximas etapas.")
    );
    fields.forEach((f) => {
      const node = renderField(f, diagnosis, window.App.setField);
      if (node) container.appendChild(node);
    });
    return container;
  }

  window.Stages = window.Stages || {};
  window.Stages[0] = {
    id: 0,
    key: "identification",
    title: "Identificação",
    fields,
    render,
  };
})();
