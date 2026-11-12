# 45 km aos 45

Caderno de treino para acompanhar o plano de 27 semanas (12/10/2026 a 18/04/2027), com a competição de 18 km em 05/12/2026 e o desafio de 45 km em 13/04/2027. Seus resultados ficam salvos no computador, em arquivos.

> Este app é só um caderno de treino. Ele não substitui orientação médica nem de treinador.

## Como abrir

1. Instale o Node.js (versão 18 ou mais nova) em https://nodejs.org, só na primeira vez.
2. Abra um terminal nesta pasta (`corrida-45`) e rode:

```bash
node server.js
```

3. No computador, abra http://localhost:3000 no navegador.
4. No celular, conectado ao **mesmo Wi-Fi**, abra o endereço "No celular" que aparece no terminal (algo como `http://192.168.0.10:3000`). O computador precisa estar ligado com o app aberto.

Para parar: `Ctrl + C` no terminal. Ao abrir de novo, tudo continua salvo.

Cuidado: no modo Wi-Fi, qualquer pessoa na mesma rede consegue abrir o app. Use em rede de casa. Para liberar só o computador: `HOST=127.0.0.1 node server.js`.

## Onde ficam os dados

- `data/resultados.json`: tudo que você digitou (cada registro tem data e hora).
- `data/historico.jsonl`: diário de todas as alterações, com o valor antes e depois. Nada se perde, mesmo se você editar por engano.
- `plan.json`: o plano (km previstos). Fica fora do código.

## Backup

- **Automático**: todo dia o app guarda uma cópia na pasta `backups/` (arquivo `backup-AAAA-MM-DD.json`). Também é feita uma cópia antes de importar dados ou editar o plano. Nenhuma cópia é apagada.
- **Manual**: aba **Mais**, botões Exportar CSV (abre no Excel) e Exportar JSON (guarda tudo, inclusive o plano).
- **Trazer dados de outro lugar**: aba **Mais**, Importar. Escolha "Juntar" para somar ao que você já tem.
- Para guardar em segurança de verdade, copie a pasta `corrida-45/data` e `backups` de vez em quando para um pendrive ou nuvem.

## Como editar o plano

Pelo app: aba **Mais**, Editar o plano. Quinta vazia significa CrossFit, zero significa descanso, e a caixa "Prov." marca semana provisória. Ou edite `plan.json` num editor de texto e recarregue a página. As semanas 9 a 27 estão marcadas como provisórias e devem ser refeitas depois de 05/12/2026.

"Semana cumprida" = todos os treinos da semana registrados e pelo menos 90% do previsto (valor `cumprida_pct` em `plan.json`).

## Testes

```bash
npm test
```

Confere datas (semana 27 começa em 12/04/2027 e a terça é 13/04/2027), totais, validações e se os dados sobrevivem a reiniciar o servidor.
