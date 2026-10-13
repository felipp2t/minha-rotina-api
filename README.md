# Minha Rotina

Backend para acompanhamento de hábitos saudáveis, desenvolvido como projeto da disciplina de Backend (Engenharia de Software), no tema **Saúde e Bem-Estar**.

**Status:** API de participantes, criação, consulta e encerramento de metas, registros de prática, histórico e progresso diário implementada e integrada à `main` pelo PR #17.

## Problema e público

Pessoas que desejam manter uma rotina saudável precisam acompanhar quanto praticaram em cada dia e consultar seu histórico. O Minha Rotina permite definir metas pessoais diárias e registrar quantidades realizadas, reunindo o acompanhamento em um único sistema.

Por exemplo, uma pessoa define a meta “Caminhar”, com alvo de 30 minutos por dia. Registra 15 minutos pela manhã e 20 à tarde. O sistema apresenta 35 minutos realizados e considera o dia cumprido, mantendo os dois registros no histórico.

## Integrantes

| Integrante | Responsabilidade principal |
|---|---|
| Felipe Rossetto da Silva | Configuração, banco e cadastro de participantes |
| João Otávio Benedet Zanette | Criação, consulta e encerramento de metas |
| Renan Floriano | Registros, histórico e progresso diário |

Todos participam da integração, dos testes e da apresentação.

## Escopo inicial

- Cadastrar participantes com nome e e-mail, sem login nesta etapa.
- Garantir e-mail único, ignorando maiúsculas e espaços nas extremidades.
- Criar metas com nome livre, alvo diário inteiro positivo, data de início e unidade: ml, minutos ou repetições.
- Permitir início passado, atual ou futuro.
- Registrar quantidades inteiras positivas e somar vários registros no mesmo dia.
- Consultar histórico e progresso diário, inclusive de metas encerradas.
- Encerrar metas preservando o histórico.

O calendário usa `America/Sao_Paulo`, com datas no formato `AAAA-MM-DD`. Quantidades acima do alvo são aceitas e preservadas. Frontend, autenticação, notificações e edição ou exclusão de registros ficam fora desta etapa.

## Regras de negócio

| Regra | Comportamento |
|---|---|
| R1: Preservar a medição do histórico | Alvo e unidade são fixos; uma mudança exige encerrar a meta e criar outra |
| R2: Respeitar o período da meta | Registros só aceitam datas entre o início da meta e hoje |
| R3: Impedir registros em metas encerradas | Uma meta encerrada não recebe novos registros, inclusive atrasados |
| R4: Calcular o cumprimento diário | Somar as quantidades da mesma meta e data; o dia é cumprido quando o total atinge ou ultrapassa o alvo |
| R5: Evitar compromissos duplicados | Impedir metas não encerradas com nome e unidade iguais para o mesmo participante, ignorando caixa e espaços nas extremidades do nome |

As regras são aplicadas pelos casos de uso e, quando necessário, garantidas também por constraints e transações no PostgreSQL. Violações de R2, R3 e R5 retornam `400` com mensagem explicativa. Repetir o encerramento retorna sucesso e mantém o instante do primeiro encerramento.

## Tecnologias definidas

Convenção do projeto: funções, variáveis, classes, campos JSON, rotas e identificadores de banco em inglês. A documentação explicativa permanece em português. Os modelos técnicos são `Participant`, `HabitGoal` e `PracticeRecord`.

| Responsabilidade | Tecnologia |
|---|---|
| Runtime e linguagem | Node.js + TypeScript |
| API HTTP | Fastify |
| Validação de entrada | Zod |
| Banco de dados | PostgreSQL |
| Persistência | Drizzle ORM |

PostgreSQL roda via Docker Compose, com migrations SQL versionadas pelo Drizzle Kit. A API usa Swagger UI em `/docs/` e exporta OpenAPI com `pnpm openapi`. O lockfile fixa as versões instaladas.

## Entidades e estrutura

Os IDs das três entidades são UUIDs gerados pelo backend, representados como strings na API e armazenados em colunas `uuid` no PostgreSQL. Chaves estrangeiras também usam `uuid`.

Um **Participante** possui várias **Metas de hábito**; cada meta possui vários **Registros de prática**. O progresso diário é calculado a partir dos registros.

Este repositório contém um único backend, com código em `src/` e configurações na raiz. As regras são implementadas em casos de uso no contexto `domain/habits`; controllers e factories ficam em `infra/http`, e schemas, mappers e repositórios Drizzle em `infra/db`.

As tabelas abaixo mapeiam as classes e módulos de cada entidade por camada. Os caminhos são relativos a `src/`; arquivos `.spec.ts` de teste foram omitidos. Controllers são plugins Fastify e factories são funções, não classes.

Na equivalência com a disciplina, os casos de uso cumprem a responsabilidade dos Services. Conforme informado por Felipe, o professor aceita a organização adotada.

## Rotas

URL base local: `http://localhost:3333`.

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/participants` | Cadastrar participante |
| GET | `/participants` | Listar participantes |
| GET | `/participants/{id}` | Buscar participante |
| POST | `/goals` | Criar meta |
| GET | `/participants/{id}/goals` | Listar metas do participante |
| GET | `/goals/{id}` | Buscar meta |
| POST | `/goals/{id}/closure` | Encerrar meta |
| POST | `/goals/{id}/records` | Registrar prática |
| GET | `/goals/{id}/records` | Consultar histórico |
| GET | `/goals/{goalId}/records/{id}` | Buscar um registro da meta |
| GET | `/goals/{id}/progress?date=AAAA-MM-DD` | Consultar progresso diário |

Todas as rotas listadas estão implementadas. As operações de encerramento, histórico e progresso também preservam os registros e regras descritos no [contrato da API](docs/contrato-da-api.md).

As três listagens aceitam `page` e `limit` (padrões 1 e 20, máximo de 100 itens por página) e retornam `data` e `pagination` com os totais.

O contrato de erros usa `message` e `metadata.fields`, mantendo o status apenas no HTTP. Essa adaptação foi aprovada pelo professor, conforme informado por Felipe.

## Como executar

Requisitos: Node.js 24+, pnpm 11.10.0 e Docker com Compose. Execute na raiz:

```bash
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d --wait
pnpm db:migrate
pnpm dev
```

API: `http://localhost:3333`. Swagger UI: `http://localhost:3333/docs/`.

O PostgreSQL usa a porta local `5439` e persiste os dados em um volume Docker. As credenciais de `.env.example` são apenas para desenvolvimento local. `.env` fica fora do Git. Ajuste `DATABASE_URL`, `HOST` e `PORT` se necessário. A API aplica migrations pendentes também ao iniciar; não cria tabelas por outro mecanismo.

Para executar o build:

```bash
pnpm build
pnpm start
```

Comandos de verificação:

```bash
pnpm typecheck
pnpm run lint
pnpm test:unit
pnpm test
pnpm openapi
```

`pnpm test` inclui testes HTTP com PostgreSQL real. Eles criam e removem um banco temporário, sem apagar dados do banco configurado. O usuário de `TEST_DATABASE_URL` (ou `DATABASE_URL`, quando omitida) precisa de permissão `CREATEDB`; o usuário local do Compose já possui essa permissão. `pnpm test:integration` executa apenas essa cobertura.

Para alterar o schema: edite os arquivos de `src/infra/db/drizzle/schema/`, execute `pnpm db:generate`, revise o SQL gerado e aplique com `pnpm db:migrate`. Não edite migrations já aplicadas.

## Integração contínua

O workflow `.github/workflows/ci.yml` executa em pushes e pull requests para `main` e `develop`, além de permitir execução manual pelo GitHub Actions. Ele instala as dependências pelo lockfile, verifica tipos e lint, aplica migrations, executa testes unitários e de integração com PostgreSQL 17, compila a API e confere se `openapi.json` está atualizado.

O banco do CI é temporário e usa credenciais de teste definidas no workflow. Não é necessário configurar secrets para essas verificações.

## Fluxo de branches

`develop` é a branch padrão. Crie branches de trabalho a partir dela e abra PRs para integrar as alterações. `main` recebe as entregas por PR.

PRs para `main` e `develop` exigem o check `Backend checks` aprovado e a branch de origem atualizada com a branch de destino. As proteções também se aplicam aos administradores; pushes diretos, force pushes e exclusão dessas branches são bloqueados.

`pnpm install` configura o hook de pre-commit de `.githooks/`, que bloqueia commits locais na `main`. Para ativá-lo em um clone já instalado, execute `pnpm run prepare`.

### Participante

| Camada / responsabilidade | Classe ou módulo |
|---|---|
| Entidade de domínio | `Participant` — `domain/habits/enterprise/entities/participant.ts` |
| Contrato de Repository | `ParticipantRepository` — `domain/habits/application/repositories/participant-repository.ts` |
| Services / casos de uso | `CreateParticipantUseCase`, `GetParticipantUseCase`, `GetParticipantsUseCase` — `domain/habits/application/use-cases/` |
| Erros | `ParticipantAlreadyExistsError`, `ParticipantNotFoundError` — `domain/habits/application/use-cases/errors/` |
| Repository PostgreSQL | `DrizzleParticipantRepository` — `infra/db/drizzle/repositories/participant-repository.ts` |
| Mapper | `DrizzleParticipantMapper` — `infra/db/drizzle/mappers/drizzle-participant-mapper.ts` |
| Schema de banco | `participants` — `infra/db/drizzle/schema/participants.ts` |
| DTOs de entrada/saída e validação | schemas Zod e tipos inferidos — `infra/http/schemas/participant.schema.ts` |
| Controllers | `createParticipantController`, `getParticipantController`, `getParticipantsController` — `infra/http/controllers/` |
| Factories / injeção por construtor | `makeCreateParticipantUseCase`, `makeGetParticipantUseCase`, `makeGetParticipantsUseCase` — `infra/http/factories/` |

Os casos de uso recebem o contrato de Repository por construtor e retornam falhas esperadas por `Either`. Os controllers devolvem DTOs explícitos. A unicidade de e-mail também é garantida pelo banco; conflitos em cadastros simultâneos retornam `400`.

### Meta de hábito

| Camada / responsabilidade | Classe ou módulo |
|---|---|
| Entidade de domínio | `HabitGoal` — `domain/habits/enterprise/entities/habit-goal.ts` |
| Contrato de Repository | `HabitGoalRepository` — `domain/habits/application/repositories/habit-goal-repository.ts` |
| Services / casos de uso | `CreateHabitGoalUseCase`, `GetHabitGoalUseCase`, `GetParticipantGoalsUseCase`, `CloseHabitGoalUseCase` — `domain/habits/application/use-cases/` |
| Erros | `HabitGoalAlreadyExistsError`, `HabitGoalNotFoundError` — `domain/habits/application/use-cases/errors/` |
| Repository PostgreSQL | `DrizzleHabitGoalRepository` — `infra/db/drizzle/repositories/habit-goal-repository.ts` |
| Mapper | `DrizzleHabitGoalMapper` — `infra/db/drizzle/mappers/drizzle-habit-goal-mapper.ts` |
| Schema de banco | `habitGoals` — `infra/db/drizzle/schema/habit-goals.ts` |
| DTOs de entrada/saída e validação | schemas Zod e tipos inferidos — `infra/http/schemas/habit-goal.schema.ts` |
| Controllers | `createHabitGoalController`, `getHabitGoalController`, `getParticipantGoalsController`, `closeHabitGoalController` — `infra/http/controllers/` |
| Factories / injeção por construtor | `makeCreateHabitGoalUseCase`, `makeGetHabitGoalUseCase`, `makeGetParticipantGoalsUseCase`, `makeCloseHabitGoalUseCase` — `infra/http/factories/` |

`CreateHabitGoalUseCase` também usa `ParticipantRepository` e pode retornar `ParticipantNotFoundError` quando o participante informado não existe.

### Registro de prática e progresso diário

| Camada / responsabilidade | Classe ou módulo |
|---|---|
| Entidade de domínio | `PracticeRecord` — `domain/habits/enterprise/entities/practice-record.ts` |
| Serviço de domínio compartilhado | `todayInSaoPaulo` — `domain/habits/enterprise/services/today-in-sao-paulo.ts` |
| Contrato de Repository | `PracticeRecordRepository` — `domain/habits/application/repositories/practice-record-repository.ts` |
| Services / casos de uso | `CreatePracticeRecordUseCase`, `GetPracticeRecordsUseCase`, `GetPracticeRecordUseCase`, `GetDailyProgressUseCase` — `domain/habits/application/use-cases/` |
| Erros | `HabitGoalClosedError`, `HabitGoalNotFoundError`, `InvalidPracticeDateError`, `InvalidProgressDateError`, `PracticeRecordNotFoundError` — `domain/habits/application/use-cases/errors/` |
| Repositories PostgreSQL | `DrizzlePracticeRecordRepository` em `infra/db/drizzle/repositories/practice-record-repository.ts`; `DrizzleHabitGoalRepository` também fornece os dados da meta |
| Mapper | `DrizzlePracticeRecordMapper` — `infra/db/drizzle/mappers/drizzle-practice-record-mapper.ts` |
| Schema de banco | `practiceRecords` — `infra/db/drizzle/schema/practice-records.ts`; consulta a `habitGoals` para validar estado da meta |
| DTOs de entrada/saída e validação | schemas Zod e tipos inferidos — `infra/http/schemas/practice-record.schema.ts` |
| Controllers | `createPracticeRecordController`, `getPracticeRecordsController`, `getPracticeRecordController`, `getDailyProgressController` — `infra/http/controllers/` |
| Factories / injeção por construtor | `makeCreatePracticeRecordUseCase`, `makeGetPracticeRecordsUseCase`, `makeGetPracticeRecordUseCase`, `makeGetDailyProgressUseCase` — `infra/http/factories/` |

### Classes compartilhadas

| Camada / responsabilidade | Classe ou módulo |
|---|---|
| Identidade de entidades | `Entity`, `UniqueEntityID` — `core/entities/` |
| Resultado de sucesso ou falha | `Left`, `Right`, `Either` — `core/types/either.ts` |
| Contrato dos erros esperados | `BaseError` — `core/errors/base-error.ts` |
| DTO de erro e conversão de erros HTTP | schemas Zod — `infra/http/schemas/error.schema.ts`; handler — `infra/http/error-handler.ts` |
| Composição da aplicação e conexão | `buildApp` — `app.ts`; `getDatabase` — `infra/db/database.ts`; inicialização — `server.ts` |
| Migration | SQL versionado em `drizzle/0000_keen_hardball.sql` |

O caso de uso busca a meta e aplica as regras: meta inexistente (`404`), meta encerrada (R3) e data fora do intervalo entre o início da meta e hoje em `America/Sao_Paulo` (R2), inclusive para metas com início futuro. Os testes fixam a data do sistema para verificar os limites sem depender do dia da execução.

Para garantir R3 também numa corrida com o encerramento, `DrizzlePracticeRecordRepository.create` lê a meta aberta com `SELECT ... FOR SHARE` na mesma transação do `INSERT` e retorna `false` se ela já estiver encerrada, como o cadastro de participantes faz com e-mails duplicados. O encerramento só precisa atualizar `closed_at` com um `UPDATE` na linha da meta. O [manual do registro de prática](docs/implementation/manual-registro-de-pratica.md) explica o fluxo completo.

## Implementação da consulta e listagem de metas (issue #2)

- `GET /goals/{id}` devolve o DTO público, inclusive de metas encerradas ou com início futuro. Meta inexistente retorna `404`.
- `GET /participants/{id}/goals` verifica se o participante existe (`404`) e lista somente suas metas, incluindo encerradas e futuras. Ordena por nome e UUID crescentes antes de aplicar a paginação.
- `page` e `limit` seguem os padrões 1 e 20; `limit` permite de 1 a 100. UUIDs, parâmetros inválidos e queries desconhecidas retornam `400`, com `message` e `metadata.fields` e sem status no corpo.
- A resposta da listagem contém `data` e `pagination` (`page`, `limit`, `total`, `totalPages`). Páginas além da última retornam uma lista vazia e os totais reais. Sem metas, `totalPages` é zero.
- O Repository Drizzle conta e lê a página na mesma transação somente de leitura com isolamento `repeatable read`, preservando a consistência dos totais. Não foram alterados schemas nem migrations do banco.
- A entidade, o mapper e o DTO da issue #1 foram reutilizados. Novos casos de uso, factories, controllers e schemas seguem a organização de participantes. As rotas são registradas em `buildApp` e em `openapi.json`.
- Testes dos casos de uso ficam junto às implementações. Testes HTTP com repositórios em memória estão em `src/infra/http/controllers/goal-queries.controller.spec.ts`; os 22 testes HTTP com PostgreSQL estão em `test/integrations/goal-queries.integration.spec.ts`.

### Validação da issue #2

- `pnpm typecheck`, `pnpm lint`, `pnpm build` e `pnpm openapi`: aprovados.
- `pnpm test:unit`: 84 testes aprovados, incluindo consulta/listagem via HTTP com repositórios em memória.
- No ambiente de edição, `pnpm test:integration` não pôde ser executado por falta de PostgreSQL configurado. A suíte completa passou no CI do PR #17, que disponibiliza PostgreSQL e executa `pnpm test`, typecheck, lint, migrations, build e verificação do OpenAPI.

## Implementação da criação de metas (issue #1)

`POST /goals` segue o contrato da API e a organização de participantes:

- `HabitGoal` em `src/domain/habits/enterprise/entities/habit-goal.ts` herda `Entity`, usa `UniqueEntityID` e mantém alvo e unidade sem setters.
- `CreateHabitGoalUseCase` verifica o participante, normaliza o nome e aplica R5.
- `HabitGoalRepository` em `src/domain/habits/application/repositories/habit-goal-repository.ts` oferece `create` e `findById`.
- `DrizzleHabitGoalRepository` e `DrizzleHabitGoalMapper` fazem a persistência. A criação usa `ON CONFLICT` com o índice parcial `habit_goals_active_unique`, que impede duplicatas e arbitra requisições concorrentes numa única operação.
- Schema/DTO, controller e factory ficam em `infra/http`. `normalizedName` é interno; o DTO contém apenas `id`, `participantId`, `name`, `dailyTarget`, `unit`, `startDate` e `closedAt`.
- Corpo e query são estritos. O alvo aceita inteiros de 1 a 2.147.483.647, limite da coluna PostgreSQL existente. Datas válidas no formato `AAAA-MM-DD`, a partir do ano 0001, podem ser passadas, atuais ou futuras.
- Testes unitários estão junto ao caso de uso e testes HTTP em `test/integrations/habit-goals.integration.spec.ts`.

### Validação desta alteração

- `pnpm typecheck`, `pnpm lint`, `pnpm build` e `pnpm openapi`: aprovados.
- `pnpm test:unit`: 57 testes aprovados, incluindo testes HTTP com repositórios em memória.
- No ambiente de edição, os testes de integração não puderam ser executados por falta de PostgreSQL configurado. A suíte completa passou no CI do PR #17, incluindo os testes de integração com PostgreSQL.

Para repetir a validação localmente, siga “Como executar” e rode `pnpm test:integration` com PostgreSQL configurado.

### Contrato disponível para integração com os registros (Renan)

A entidade e o contrato acima são os pontos compartilhados. Para consultar a meta, injete `HabitGoalRepository` no caso de uso dos registros e chame `findById(goalId)`: retorna `HabitGoal | null`, incluindo metas encerradas. `closedAt` permanece `Date | null` no domínio e `isClosed` permanece disponível, conforme a implementação dos registros. O chamador pode consultar `startDate`, `unit`, `dailyTarget` e `closedAt` para aplicar as regras dos registros. IDs são `UniqueEntityID` no domínio; use `.toString()` ao montar DTOs. A factory pode usar `new DrizzleHabitGoalRepository(getDatabase())`.

Nenhum schema ou migration existente foi alterado. Consulta HTTP e encerramento foram implementados nas issues #2 e #3.

## Situação da entrega

| Item | Situação |
|---|---|
| Problema, escopo e regras | Documentados |
| Modelo de domínio e diagrama | Documentados, com campos técnicos propostos |
| Contrato da API | Documentado, com detalhes técnicos propostos |
| Divisão de tarefas e roteiro de testes | Documentados |
| Banco e migrations | Três tabelas criadas, com constraints e chaves estrangeiras |
| Estrutura do código | Participantes, criação/consulta/encerramento de metas, registros e progresso diário implementados |
| API simples | Cadastro, listagem paginada e busca de participantes implementados e testados |
| Regras R1–R5 pela API | R2 e R3 no cadastro de registros; R5 na criação de metas; R1 no encerramento; R4 no progresso diário |
| Autoavaliação | Ficha criada; conferência acadêmica final pendente |

## Prazos

- **15/10/2026:** entrega de todos os contratos.
- **22/10/2026:** entrega do projeto completo previsto para esta etapa.

Dias informados pelo grupo; mês e ano considerados pelo contexto do planejamento. Os horários ainda precisam ser confirmados. O enunciado escrito estabelece entrega até o início da Aula 11 e não explicita esses dois marcos.

## Documentação

- [Índice da documentação](docs/README.md).
- [Vocabulário do domínio](CONTEXT.md).
- [Planejamento e requisitos](docs/requirements/mvp.md).
- [Modelo de domínio](docs/modelo-de-dominio.md).
- [Contrato da API](docs/contrato-da-api.md).
- [Desenho técnico](docs/architecture/system-design.md).
- [Plano de implementação](docs/implementation/roadmap.md).
- [Roteiro de testes](docs/testing/roteiro-de-testes.md).
- [Autoavaliação](docs/autoavaliacao.md).

## Documentos enviados pelo professor

Os arquivos originais foram preservados em `docs/enunciado/`:

- [Enunciado do trabalho](docs/enunciado/README.md).
- [Critérios de avaliação](docs/enunciado/AVALIACAO.md).
- [Orientações de arquitetura](docs/enunciado/ARQUITETURA.md).

## Implementação do encerramento de metas (issue #3)

- `POST /goals/{id}/closure` retorna `200` com o DTO da meta. O servidor PostgreSQL determina `closedAt` após obter o bloqueio da linha. Repetições, inclusive concorrentes, mantêm exatamente o primeiro instante.
- UUID inválido ou parâmetros de consulta retornam `400`; meta inexistente retorna `404`, com `message` e `metadata.fields`.
- O contrato `HabitGoalRepository.close` encapsula a operação atômica. Caso de uso, factory e controller seguem as camadas existentes. Alvo, unidade e registros históricos são preservados; não foram criadas rotas para editá-los.
- A transação usa `SELECT ... FOR UPDATE`, incompatível com o `FOR SHARE` já usado pelo cadastro de registros. Uma gravação anterior termina antes do encerramento; uma gravação posterior aguarda e verifica novamente se a meta está aberta.
- O índice parcial existente permite criar outra meta com o mesmo nome/unidade após encerrar a anterior, inclusive com outro alvo. Nenhum schema ou migration foi alterado.
- Testes unitários e HTTP em memória acompanham as implementações; `test/integrations/goal-closure.integration.spec.ts` verifica o histórico, concorrência, bloqueios, nova meta e erros no PostgreSQL.

### Validação da issue #3

- `pnpm typecheck`, `pnpm lint`, `pnpm build` e `pnpm openapi`: aprovados.
- `pnpm test:unit`: 111 testes aprovados, incluindo encerramento e respostas HTTP em memória.
- No ambiente de edição, os testes de integração não puderam ser executados por falta de PostgreSQL configurado. A suíte completa passou no CI do PR #17, incluindo os testes de encerramento, bloqueios e concorrência com PostgreSQL.
- Para repetir a validação localmente, siga “Como executar” e rode `pnpm test:integration` com PostgreSQL configurado.
