# Minha Rotina: roteiro de testes e demonstração

Status: cenários das rotas de participantes, metas, registros e progresso diário cobertos por testes automatizados; CI completo com PostgreSQL passou no PR #17.

Usar Swagger UI ou Postman e datas calculadas em `America/Sao_Paulo`. Nos testes automatizados das regras, controlar o relógio para que os cenários não dependam do dia da execução.

| Cenário | Resultado esperado |
|---|---|
| Cadastrar participante válido | `201` com ID, nome e e-mail |
| Listar e buscar participante cadastrado | `200` e DTO correspondente |
| Listar participantes e metas com nomes repetidos | Ordem crescente por nome e desempate por UUID |
| Listar registros de datas distintas ou da mesma data | Ordem crescente por data e desempate por UUID |
| Listar sem parâmetros de paginação | Página 1, limite 20, resposta com `data` e `pagination` |
| Consultar páginas consecutivas de uma listagem sem alterações nos dados | Ordenação preservada, sem repetir ou omitir itens; totais da listagem completos |
| Informar `limit=1` ou `limit=100` | Aceito |
| Informar `page` zero, negativo, fracionado ou não numérico | `400`, erro no campo `page` |
| Informar `limit` zero, negativo, fracionado, não numérico ou maior que 100 | `400`, erro no campo `limit` |
| Listar coleção vazia ou página além da última | `200`, `data: []`, totais reais; coleção vazia tem `totalPages: 0` |
| Consultar progresso de dia com mais registros que o limite da página | Total inclui todos os registros do dia |
| Nome vazio ou e-mail inválido | `400` com campos explicados |
| Informar nome vazio ou composto apenas por espaços em participante ou meta | `400` com erro no campo `name` |
| Informar nome com 1 ou 100 caracteres após remover espaços externos | Aceito |
| Informar nome com 101 caracteres após remover espaços externos | `400` com erro no campo `name` |
| Cadastrar nome com espaços externos e maiúsculas | Nome armazenado e retornado sem espaços externos, preservando maiúsculas |
| Cadastrar e-mail já existente, inclusive com maiúsculas e espaços nas extremidades | `400` com erro associado ao campo `email` |
| Cadastrar e-mail com maiúsculas e espaços nas extremidades | E-mail validado, armazenado e retornado em minúsculas e sem os espaços externos |
| Enviar dois cadastros simultâneos com o mesmo e-mail | Um cadastro; outro retorna `400`, sem criar participante duplicado |
| Informar UUID malformado em parâmetro ou referência | `400`, validação de campo |
| Buscar UUID válido inexistente | `404` no formato único |
| Criar meta com participante inexistente | `404` |
| Criar meta com início futuro | `201`; consulta disponível |
| Registrar prática hoje em meta que começa amanhã | `400`, R2 |
| Registrar prática anterior ao início | `400`, R2 |
| Registrar prática amanhã em meta já iniciada | `400`, R2 |
| Registrar na data de início e hoje | `201`, se a meta não estiver encerrada |
| Registrar zero, negativo ou fração | `400`, validação de campo |
| Informar unidade não permitida ao criar meta | `400`, validação de campo |
| Registrar 15 e 20 numa meta de 30, na mesma data | Total 35, dia cumprido, dois registros no histórico |
| Consultar um dia válido sem registros | Total 0 e dia não cumprido |
| Consultar progresso antes do início ou em data futura | `400` |
| Consultar progresso de meta encerrada em data válida | `200`, com total calculado pelos registros preservados |
| Consultar progresso de meta com início futuro | `400`, pois ainda não existe data no intervalo permitido |
| Encerrar a meta e consultar histórico | Histórico preservado |
| Buscar registro individual com a meta correta, inclusive encerrada | `200`, com o DTO do registro |
| Buscar registro individual com meta ou registro inexistente | `404` |
| Buscar registro existente usando UUID de outra meta | `404`, sem devolver o registro |
| Buscar registro individual com `goalId` ou `id` malformado | `400`, com o parâmetro inválido em `metadata.fields` |
| Repetir o encerramento da meta | `200`, preservando o instante do primeiro encerramento |
| Registrar em meta encerrada, inclusive com data passada válida | `400`, R3 |
| Criar meta duplicada com diferenças de caixa e espaços externos | `400`, R5 |
| Criar meta igual para outro participante | Permitido |
| Criar meta com mesmo nome e unidade diferente | Permitido |
| Encerrar a meta e criar outra com mesmo nome/unidade | Permitido; histórico anterior preservado |
| Enviar dois cadastros simultâneos da mesma meta | Um cadastro; outro retorna `400`, R5 |
| Enviar encerramento e registro simultaneamente | Escritas coordenadas: não aceitar registro após o encerramento efetivo |
| Validar a aplicação perto da meia-noite com servidor em outro fuso | Regra de hoje continua seguindo São Paulo |
| Enviar JSON malformado | `400` no formato único |
| Adicionar campo desconhecido ao cadastro de participante, meta ou registro | `400`, com o nome de cada campo desconhecido em `metadata.fields`; nenhum dado é gravado |
| Enviar `quantidad` em vez de `quantity` no registro | `400`, informando campo desconhecido e ausência do campo obrigatório |
| Enviar parâmetro de consulta desconhecido, como `pag` nas listagens | `400`, com o nome do parâmetro em `metadata.fields` |
| Enviar `page` ou `limit` à consulta de progresso | `400`, pois essa rota aceita somente `date` |
| Enviar parâmetro de consulta a uma operação que não aceita nenhum | `400`, com o nome do parâmetro em `metadata.fields` |
| Subir em clone novo com banco vazio | Migrations criam tabelas e README permite executar |

## Evidências

Ao executar, registrar data, responsável e resultado. Preparar uma sequência curta de requisições para a apresentação: API simples, ID inexistente, campo inválido, três regras impeditivas e progresso acima do alvo.

## Cobertura automatizada atual

- `pnpm test:unit`: casos de uso de participantes e de cadastro de registros com repositórios em memória e data do sistema fixada nos testes.
- Cadastro de registros: limites de R2 (início, hoje, meta com início futuro, virada do dia em São Paulo), R3 (inclusive registro atrasado), vários registros no mesmo dia, validação de data e quantidade, campos e parâmetros desconhecidos, `404` e corrida com encerramento. Nos testes HTTP, as metas são inseridas diretamente no banco até as rotas de metas existirem.
- Histórico de registros: ordenação por data e UUID antes de paginar, totais completos, página além da última, histórico vazio, `limit` 1 e 100, paginação inválida, meta encerrada, registro de outra meta, `404` de meta e registro, UUIDs malformados e parâmetros de consulta desconhecidos.
- Progresso diário: soma de vários registros (15 + 20 numa meta de 30), total abaixo, igual e acima do alvo, mais registros do que cabem numa página do histórico, dia válido sem registros, outra meta e outra data, limites de início e hoje, meta com início futuro, virada do dia em São Paulo, meta encerrada, data ausente ou inválida, `page`/`limit` recusados, `404` e UUID malformado.
- `pnpm test:integration`: HTTP, PostgreSQL real, migrations, normalização, unicidade concorrente, paginação, validação, erros, concorrência de encerramento e Swagger; executado no CI do PR #17.
- `pnpm test`: ambas as coberturas.

Os testes de integração usam `TEST_DATABASE_URL` ou `DATABASE_URL` para criar um banco temporário por execução; somente esse banco é limpo e removido. O usuário precisa da permissão `CREATEDB`. Para execução local, configure PostgreSQL conforme o README.

Resultado em 12/10/2026: 39 testes passaram (8 unitários e 31 de integração), inclusive em uma instalação em pasta limpa.

Resultado em 13/10/2026 (Renan, cadastro de registros): 87 testes passaram (28 unitários e 59 de integração).

Resultado em 13/10/2026 (Renan, histórico de registros): 115 testes passaram (37 unitários e 78 de integração).

Resultado em 13/10/2026 (Renan, progresso diário): 147 testes passaram (47 unitários e 100 de integração). Após a implementação das consultas e do encerramento de metas, a suíte completa passou no CI do PR #17.