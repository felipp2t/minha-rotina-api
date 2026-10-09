# Minha Rotina

Backend para acompanhamento de hábitos saudáveis, desenvolvido como projeto da disciplina de Backend (Engenharia de Software), no tema **Saúde e Bem-Estar**.

**Status:** planejamento e documentação inicial. A API, as migrations e a estrutura executável ainda não foram implementadas.

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
| R1 — Preservar a medição do histórico | Alvo e unidade são fixos; uma mudança exige encerrar a meta e criar outra |
| R2 — Respeitar o período da meta | Registros só aceitam datas entre o início da meta e hoje |
| R3 — Impedir registros em metas encerradas | Uma meta encerrada não recebe novos registros, inclusive atrasados |
| R4 — Calcular o cumprimento diário | Somar as quantidades da mesma meta e data; o dia é cumprido quando o total atinge ou ultrapassa o alvo |
| R5 — Evitar compromissos duplicados | Impedir metas não encerradas com nome e unidade iguais para o mesmo participante, ignorando caixa e espaços nas extremidades do nome |

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

O planejamento prevê PostgreSQL via Docker Compose, migrations SQL versionadas com Drizzle Kit e documentação OpenAPI com Swagger UI. Versões e configurações serão fixadas durante a implementação.

## Entidades e estrutura planejada

Os IDs das três entidades são UUIDs gerados pelo backend, representados como strings na API e armazenados em colunas `uuid` no PostgreSQL. Chaves estrangeiras também usam `uuid`.

Um **Participante** possui várias **Metas de hábito**; cada meta possui vários **Registros de prática**. O progresso diário é calculado a partir dos registros.

A API fica em `apps/api`. As regras são implementadas em casos de uso no contexto `domain/habits`; controllers e factories ficam em `infra/http`, e schemas, mappers e repositórios Drizzle em `infra/db`.

| Entidade | Modelo | Contrato de persistência | Implementação |
|---|---|---|---|
| Participante | `Participant` | `ParticipantRepository` | `DrizzleParticipantRepository` |
| Meta de hábito | `HabitGoal` | `HabitGoalRepository` | `DrizzleHabitGoalRepository` |
| Registro de prática | `PracticeRecord` | `PracticeRecordRepository` | `DrizzlePracticeRecordRepository` |

Cada operação tem seu caso de uso, controller e factory. Schemas Zod definem DTOs separados dos modelos; mappers convertem dados de persistência. A [estrutura de pastas](docs/architecture/project-structure.md) apresenta a árvore completa e a função de cada pasta.

Na equivalência com a disciplina, os casos de uso cumprem a responsabilidade dos Services. A organização por domínio e infraestrutura difere das pastas por camada solicitadas no enunciado; essa adaptação ainda precisa ser alinhada com o professor.

## Rotas planejadas

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

Os exemplos de JSON e respostas estão no [contrato da API](docs/contrato-da-api.md). A API simples exigida na disciplina será a de participantes, com `400` para campos inválidos e `404` para recurso inexistente.

As três listagens aceitam `page` e `limit` (padrões 1 e 20, máximo de 100 itens por página) e retornam `data` e `pagination` com os totais.

O contrato de erros usa `message` e `metadata.fields`, mantendo o status apenas no HTTP. Essa adaptação foi aprovada pelo professor, conforme informado por Felipe.

## Como executar

Ainda não há aplicação executável neste repositório. Os comandos de instalação, banco, migrations e inicialização serão documentados após a implementação e a validação em um clone novo.

## Situação da entrega

| Item | Situação |
|---|---|
| Problema, escopo e regras | Documentados |
| Modelo de domínio e diagrama | Documentados, com campos técnicos propostos |
| Contrato da API | Documentado, com detalhes técnicos propostos |
| Divisão de tarefas e roteiro de testes | Documentados |
| Estrutura do código, banco e migrations | Pendentes |
| API e regras funcionando | Pendentes |
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
