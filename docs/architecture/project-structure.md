# Estrutura do projeto

Status: backend único configurado na raiz; participantes implementados e banco criado para as três entidades.

## Organização

O Minha Rotina é um projeto backend único, com código em `src/`, testes em `test/`, configurações na raiz e documentação em `docs`. O contexto `habits` reúne participantes, metas e registros. O domínio define o comportamento; a infraestrutura conecta esse comportamento ao HTTP e ao PostgreSQL.

## Estrutura atual

```text
minha-rotina-api/
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── biome.json
├── vitest.config.ts
├── drizzle.config.ts
├── docker-compose.yml
├── .env.example
├── openapi.json
├── drizzle/
│   └── meta/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── openapi.ts
│   ├── core/
│   │   ├── errors/
│   │   └── types/
│   ├── domain/
│   │   └── habits/
│   │       ├── application/
│   │       │   ├── repositories/
│   │       │   └── use-cases/
│   │       │       └── errors/
│   │       └── enterprise/
│   │           └── entities/
│   └── infra/
│       ├── db/
│       │   ├── database.ts
│       │   ├── migrate.ts
│       │   └── drizzle/
│       │       ├── mappers/
│       │       ├── repositories/
│       │       └── schema/
│       │           └── index.ts
│       └── http/
│           ├── controllers/
│           ├── factories/
│           ├── schemas/
│           └── error-handler.ts
├── test/
│   ├── repositories/
│   ├── integrations/
│   └── infra/
│       └── db/
└── docs/
```

`pnpm-workspace.yaml` configura somente a permissão de build do esbuild; não declara pacotes de workspace. TypeScript, Biome, Vitest e Drizzle são configurados diretamente na raiz.

## Função das pastas

| Pasta | Função |
|---|---|
| `src/core/` | Tipos e contratos técnicos compartilhados |
| `src/domain/habits/application/` | Casos de uso e contratos de persistência |
| `src/domain/habits/enterprise/` | Modelos de domínio |
| `src/infra/db/` | Conexão e aplicação de migrations |
| `src/infra/db/drizzle/` | Schemas, mappers e repositórios PostgreSQL |
| `src/infra/http/` | Controllers, DTOs, factories e tratamento de erros |
| `drizzle/` | Migrations SQL versionadas |
| `drizzle/meta/` | Snapshots e controle gerados pelo Drizzle Kit |
| `test/repositories/` | Repositórios em memória para testes unitários |
| `test/integrations/` | Testes HTTP com banco real |
| `test/infra/db/` | Criação e remoção de bancos temporários de teste |
| `docs/` | Planejamento, contratos e evidências de implementação |

Os caminhos de código nas tabelas abaixo são relativos a `src/`. Participantes estão implementados em todas as camadas. Para metas e registros, os schemas e migrations já existem; modelos, casos de uso, repositórios e HTTP permanecem planejados. Pastas de serviços de domínio e scripts auxiliares serão criadas quando houver conteúdo.

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
| `biome.json` e `tsconfig.json` na raiz | Configurações de lint, formatação e TypeScript |

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
| Config | `app.ts`, `infra/db/database.ts` e arquivos de configuração na raiz |

O enunciado pede pastas por camada e classes por entidade. A estrutura escolhida organiza por domínio e infraestrutura, com controllers funcionais por ação. Conforme informado por Felipe, o professor aceita a organização escolhida e o contrato de erros. DTOs separados, conversões explícitas, migrations e regras na camada de aplicação continuam necessários.
