# Estrutura do projeto

Status: organização definida pelo grupo; estrutura executável ainda não criada.

## Organização

O Minha Rotina usa um workspace pnpm com API em `apps/api`, configurações compartilhadas em `packages` e documentação em `docs`. O contexto `habits` reúne participantes, metas e registros. O domínio define o comportamento; a infraestrutura conecta esse comportamento ao HTTP e ao PostgreSQL.

## Estrutura prevista para esta entrega

```text
minha-rotina/
├── README.md
├── CONTEXT.md
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── biome.json
├── apps/
│   └── api/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── biome.json
│       ├── drizzle.config.ts
│       ├── openapi.json
│       ├── drizzle/
│       │   └── meta/
│       ├── src/
│       │   ├── app.ts
│       │   ├── server.ts
│       │   ├── openapi.ts
│       │   ├── core/
│       │   │   ├── errors/
│       │   │   └── types/
│       │   ├── domain/
│       │   │   └── habits/
│       │   │       ├── application/
│       │   │       │   ├── repositories/
│       │   │       │   └── use-cases/
│       │   │       │       └── errors/
│       │   │       └── enterprise/
│       │   │           ├── entities/
│       │   │           └── services/
│       │   └── infra/
│       │       ├── db/
│       │       │   ├── database.ts
│       │       │   ├── migrate.ts
│       │       │   └── drizzle/
│       │       │       ├── mappers/
│       │       │       ├── repositories/
│       │       │       ├── schema/
│       │       │       │   └── index.ts
│       │       │       └── scripts/
│       │       └── http/
│       │           ├── controllers/
│       │           ├── factories/
│       │           └── schemas/
│       └── test/
│           ├── repositories/
│           ├── integrations/
│           └── infra/
│               └── db/
│                   └── drizzle/
├── packages/
│   ├── biome/
│   └── tsconfig/
└── docs/
```

A árvore descreve os locais dos arquivos quando implementados, não funcionalidades prontas. Pastas sem necessidade atual, como `enterprise/services` e scripts de seed, podem ficar previstas até surgir conteúdo.

## Função das pastas de agrupamento

| Pasta | Função |
|---|---|
| `apps/` | Aplicações executáveis do workspace |
| `apps/api/` | Código, dependências, configurações e testes da API |
| `apps/api/src/` | Código executável da aplicação |
| `src/core/` | Tipos e contratos técnicos compartilhados |
| `src/domain/` | Contextos de negócio independentes de HTTP e banco |
| `src/domain/habits/` | Contexto de acompanhamento de hábitos |
| `habits/application/` | Orquestração das operações e contratos de persistência |
| `habits/enterprise/` | Modelos e cálculos do domínio |
| `src/infra/` | Implementações dos mecanismos externos |
| `src/infra/db/` | Conexão, migrations e infraestrutura de persistência |
| `src/infra/db/drizzle/` | Implementações de banco usando Drizzle |
| `src/infra/db/drizzle/scripts/` | Scripts auxiliares, como seed de dados de demonstração |
| `src/infra/http/` | Entrada HTTP, contratos públicos e composição das dependências |
| `apps/api/drizzle/meta/` | Snapshots e controle gerados das migrations |
| `apps/api/test/` | Suporte de testes e testes de integração |
| `test/infra/` | Verificação da infraestrutura |
| `test/infra/db/` | Verificação da conexão e persistência |
| `test/infra/db/drizzle/` | Verificação dos schemas, mappers e operações Drizzle |
| `packages/` | Configurações compartilhadas pelos pacotes do workspace |

Os caminhos iniciados em `src/` são relativos a `apps/api/`; os caminhos iniciados em `habits/` são relativos a `apps/api/src/domain/`.

## Responsabilidades e nomes

| Local | Conteúdo e convenção |
|---|---|
| `domain/habits/enterprise/entities/` | Modelos `participant.ts`, `habit-goal.ts` e `practice-record.ts` |
| `domain/habits/application/repositories/` | Contratos `participant-repository.ts`, `habit-goal-repository.ts` e `practice-record-repository.ts` |
| `domain/habits/application/use-cases/` | Uma ação por arquivo, como `create-participant.ts`, `create-habit-goal.ts`, `close-habit-goal.ts`, `create-practice-record.ts` e `get-daily-progress.ts` |
| `domain/habits/application/use-cases/errors/` | Falhas esperadas, como `habit-goal-already-exists-error.ts` e `habit-goal-closed-error.ts` |
| `domain/habits/enterprise/services/` | Cálculos de domínio compartilhados, quando necessários |
| `infra/db/drizzle/schema/` | Uma tabela por arquivo: `participants.ts`, `habit-goals.ts`, `practice-records.ts`; `index.ts` agrega os schemas |
| `infra/db/drizzle/repositories/` | Implementações `DrizzleParticipantRepository`, `DrizzleHabitGoalRepository` e `DrizzlePracticeRecordRepository`, em arquivos `*-repository.ts` |
| `infra/db/drizzle/mappers/` | Conversões entre linhas do banco e modelos de domínio, em arquivos `drizzle-*-mapper.ts` |
| `infra/http/controllers/` | Controllers por operação, como `create-participant.controller.ts`; funções Fastify |
| `infra/http/factories/` | Arquivos `make-*-use-case.ts` que compõem casos de uso e dependências concretas |
| `infra/http/schemas/` | Schemas Zod e DTOs de entrada e saída, separados dos modelos, em arquivos `*.schema.ts`; conversões públicas explícitas junto ao contrato HTTP |
| `core/errors/` e `core/types/` | Contrato base de erro e tipo `Either` |
| `drizzle/` | Migrations SQL versionadas e metadados gerados pelo Drizzle Kit |
| `test/repositories/` | Implementações em memória para testes dos casos de uso |
| `test/integrations/` e `test/infra/db/` | Testes HTTP e de persistência |
| `packages/biome/` e `packages/tsconfig/` | Configurações compartilhadas de lint, formatação e TypeScript |

Os testes unitários `*.spec.ts` ficam ao lado dos casos de uso. Casos de uso recebem contratos de repositório por construtor e retornam falhas esperadas por `Either`; os controllers convertem o resultado no contrato HTTP acordado. Falhas inesperadas e erros de validação recebem tratamento central configurado em `app.ts`.

`app.ts` monta a aplicação, schemas, documentação e controllers. `server.ts` abre a conexão com PostgreSQL e inicia a API na porta 3333. `openapi.ts` exporta a especificação a partir da aplicação. Não há container de injeção: as factories fazem a composição explícita.

## Documentação

| Pasta | Função |
|---|---|
| `docs/` | Índice e documentos obrigatórios: modelo de domínio, contrato da API e autoavaliação |
| `docs/enunciado/` | Documentos originais enviados pelo professor |
| `docs/architecture/` | Desenho técnico e modelo da estrutura de pastas |
| `docs/requirements/` | Problema, escopo, regras e critérios funcionais |
| `docs/implementation/` | Cronograma e divisão das responsabilidades |
| `docs/testing/` | Cenários de validação e roteiro da demonstração |

## Relação com a avaliação

| Camada citada na disciplina | Local equivalente |
|---|---|
| Controller | `infra/http/controllers/` |
| Service | `domain/habits/application/use-cases/` e cálculos em `enterprise/services/` |
| Repository | Contratos em `application/repositories/`, implementações em `infra/db/drizzle/repositories/` |
| Model | `enterprise/entities/` e mapeamento de tabelas em `infra/db/drizzle/schema/` |
| DTO | Contratos de entrada e saída em `infra/http/schemas/` |
| Mapper | Mappers de persistência em `infra/db/drizzle/mappers/` e conversões de resposta na camada HTTP |
| Config | `app.ts`, `infra/db/database.ts` e arquivos de configuração da API/workspace |

O enunciado pede pastas por camada e classes por entidade. A estrutura escolhida organiza por domínio e infraestrutura, com controllers funcionais por ação. Esse desvio deve ser explicado ao professor: a aprovação relatada até agora foi somente do formato de erros. DTOs separados, conversões explícitas, migrations e regras na camada de aplicação continuam necessários.
