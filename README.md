# Minha Rotina

Backend para acompanhamento de hábitos saudáveis, desenvolvido como projeto da disciplina de Backend (Engenharia de Software), no tema **Saúde e Bem-Estar**.

**Status:** configuração, PostgreSQL, API de participantes e cadastro de registros de prática (R2 e R3) implementados. Metas, histórico de registros e progresso diário ainda estão em planejamento.

## Problema e público

Pessoas que desejam manter uma rotina saudável precisam acompanhar quanto praticaram em cada dia e consultar seu histórico. O Minha Rotina permitirá definir metas pessoais diárias e registrar quantidades realizadas, reunindo o acompanhamento em um único sistema.

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

| Regra | Comportamento planejado |
|---|---|
| R1: Preservar a medição do histórico | Alvo e unidade são fixos; uma mudança exige encerrar a meta e criar outra |
| R2: Respeitar o período da meta | Registros só aceitam datas entre o início da meta e hoje |
| R3: Impedir registros em metas encerradas | Uma meta encerrada não recebe novos registros, inclusive atrasados |
| R4: Calcular o cumprimento diário | Somar as quantidades da mesma meta e data; o dia é cumprido quando o total atinge ou ultrapassa o alvo |
| R5: Evitar compromissos duplicados | Impedir metas não encerradas com nome e unidade iguais para o mesmo participante, ignorando caixa e espaços nas extremidades do nome |

As regras serão implementadas nos casos de uso da camada de aplicação. Violações de R2, R3 e R5 retornarão `400` com mensagem explicativa. Repetir o encerramento retornará sucesso, mantendo o instante do primeiro encerramento.

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

## Entidades e estrutura planejada

Os IDs das três entidades são UUIDs gerados pelo backend, representados como strings na API e armazenados em colunas `uuid` no PostgreSQL. Chaves estrangeiras também usam `uuid`.

Um **Participante** possui várias **Metas de hábito**; cada meta possui vários **Registros de prática**. O progresso diário é calculado a partir dos registros.

Este repositório contém um único backend, com código em `src/` e configurações na raiz. As regras são implementadas em casos de uso no contexto `domain/habits`; controllers e factories ficam em `infra/http`, e schemas, mappers e repositórios Drizzle em `infra/db`.

| Entidade | Modelo | Contrato de persistência | Implementação |
|---|---|---|---|
| Participante | `Participant` | `ParticipantRepository` | `DrizzleParticipantRepository` |
| Meta de hábito | `HabitGoal` | `HabitGoalRepository` | `DrizzleHabitGoalRepository` |
| Registro de prática | `PracticeRecord` | `PracticeRecordRepository` | `DrizzlePracticeRecordRepository` |

Cada operação tem seu caso de uso, controller e factory. Schemas Zod definem DTOs separados dos modelos; mappers convertem dados de persistência. A [estrutura de pastas](docs/architecture/project-structure.md) apresenta a árvore completa e a função de cada pasta.

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

As três rotas de participantes estão implementadas, com `400` para campos inválidos ou e-mail duplicado e `404` para participante inexistente. `POST /goals/{id}/records` está implementada, com `400` para campos inválidos e violações de R2/R3 e `404` para meta inexistente. As demais rotas permanecem planejadas. Exemplos de JSON e respostas estão no [contrato da API](docs/contrato-da-api.md).

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

## Mapa da implementação de participantes

| Responsabilidade | Arquivo em `src/` |
|---|---|
| Modelo de domínio | `domain/habits/enterprise/entities/participant.ts` |
| Contrato de persistência | `domain/habits/application/repositories/participant-repository.ts` |
| Casos de uso / Services | `domain/habits/application/use-cases/create-participant.ts`, `get-participant.ts`, `get-participants.ts` |
| Erros de domínio | `domain/habits/application/use-cases/errors/participant-already-exists-error.ts`, `participant-not-found-error.ts` |
| Repository PostgreSQL | `infra/db/drizzle/repositories/participant-repository.ts` |
| Mapper de persistência | `infra/db/drizzle/mappers/drizzle-participant-mapper.ts` |
| Tabela e constraints | `infra/db/drizzle/schema/participants.ts` |
| DTOs e conversão pública | `infra/http/schemas/participant.schema.ts` |
| Controllers | `infra/http/controllers/create-participant.controller.ts`, `get-participant.controller.ts`, `get-participants.controller.ts` |
| Composição por construtor | `infra/http/factories/make-create-participant-use-case.ts`, `make-get-participant-use-case.ts`, `make-get-participants-use-case.ts` |
| Contrato e tratamento de erros | `infra/http/schemas/error.schema.ts`, `infra/http/error-handler.ts` |

Os casos de uso recebem o contrato de Repository por construtor e retornam falhas esperadas por `Either`. Os controllers devolvem DTOs explícitos. A unicidade de e-mail também é garantida pelo banco; conflitos em cadastros simultâneos retornam `400`.

## Mapa da implementação de registros de prática

| Responsabilidade | Arquivo em `src/` |
|---|---|
| Modelos de domínio | `domain/habits/enterprise/entities/practice-record.ts`, `habit-goal.ts` |
| Data de hoje em São Paulo | `domain/habits/enterprise/services/today-in-sao-paulo.ts` |
| Contratos de persistência | `domain/habits/application/repositories/practice-record-repository.ts`, `habit-goal-repository.ts` |
| Caso de uso / Service (R2 e R3) | `domain/habits/application/use-cases/create-practice-record.ts` |
| Erros de domínio | `domain/habits/application/use-cases/errors/habit-goal-not-found-error.ts`, `habit-goal-closed-error.ts`, `invalid-practice-date-error.ts` |
| Repositories PostgreSQL | `infra/db/drizzle/repositories/practice-record-repository.ts`, `habit-goal-repository.ts` |
| Mappers de persistência | `infra/db/drizzle/mappers/drizzle-practice-record-mapper.ts`, `drizzle-habit-goal-mapper.ts` |
| DTOs e conversão pública | `infra/http/schemas/practice-record.schema.ts` |
| Controller | `infra/http/controllers/create-practice-record.controller.ts` |
| Composição por construtor | `infra/http/factories/make-create-practice-record-use-case.ts` |

O caso de uso busca a meta e aplica as regras: meta inexistente (`404`), meta encerrada (R3) e data fora do intervalo entre o início da meta e hoje em `America/Sao_Paulo` (R2), inclusive para metas com início futuro. Os testes fixam a data do sistema para verificar os limites sem depender do dia da execução.

Para garantir R3 também numa corrida com o encerramento, `DrizzlePracticeRecordRepository.create` lê a meta aberta com `SELECT ... FOR SHARE` na mesma transação do `INSERT` e retorna `false` se ela já estiver encerrada, como o cadastro de participantes faz com e-mails duplicados. O encerramento só precisa atualizar `closed_at` com um `UPDATE` na linha da meta. O [manual do registro de prática](docs/implementation/manual-registro-de-pratica.md) explica o fluxo completo.

## Situação da entrega

| Item | Situação |
|---|---|
| Problema, escopo e regras | Documentados |
| Modelo de domínio e diagrama | Documentados, com campos técnicos propostos |
| Contrato da API | Documentado, com detalhes técnicos propostos |
| Divisão de tarefas e roteiro de testes | Documentados |
| Banco e migrations | Três tabelas criadas, com constraints e chaves estrangeiras |
| Estrutura do código | Participantes e cadastro de registros implementados; metas, histórico e progresso pendentes |
| API simples | Cadastro, listagem paginada e busca de participantes implementados e testados |
| Regras R1–R5 pela API | R2 e R3 implementadas e testadas no cadastro de registros; R1, R4 e R5 pendentes; constraints de banco preparadas |
| Autoavaliação | Ficha criada; verificação da implementação pendente |

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
