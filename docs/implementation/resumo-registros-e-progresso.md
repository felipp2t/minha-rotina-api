# Registros de prática e progresso diário: resumo da implementação

Responsável: Renan Floriano. Data: 13/10/2026.

Este documento reúne tudo o que foi adicionado ao Minha Rotina nas três issues de registros e progresso: o que a API passou a fazer, onde está cada parte do código, as decisões tomadas e como verificar. Os detalhes de cada rota estão nos manuais:

- [Manual do registro de prática](manual-registro-de-pratica.md): `POST /goals/{id}/records`
- [Manual do histórico de registros](manual-historico-de-registros.md): `GET /goals/{id}/records` e `GET /goals/{goalId}/records/{id}`
- [Manual do progresso diário](manual-progresso-diario.md): `GET /goals/{id}/progress`

## 1. O que foi entregue

| Issue | Rota | Regras | Commit |
|---|---|---|---|
| Cadastro de registros | `POST /goals/{id}/records` | R2, R3 | `feat(records): register practice records with R2 and R3` |
| Histórico | `GET /goals/{id}/records`, `GET /goals/{goalId}/records/{id}` | Histórico preservado após encerramento | `feat(records): list a goal's history and get a single record` |
| Progresso diário | `GET /goals/{id}/progress?date=AAAA-MM-DD` | R4 | `feat(progress): calculate daily progress of a goal (R4)` |

Com isso, a parte de Renan no [plano de implementação](roadmap.md) (registros, histórico e progresso diário) está completa. Faltam as rotas de metas (João), que vão usar os mesmos arquivos de meta já criados.

## 2. Rotas

| Método | Rota | Sucesso | Erros |
|---|---|---|---|
| POST | `/goals/{id}/records` | `201` com o registro | `400` campos inválidos, R2, R3; `404` meta |
| GET | `/goals/{id}/records?page=&limit=` | `200` com `data` e `pagination` | `400` UUID, paginação, parâmetro desconhecido; `404` meta |
| GET | `/goals/{goalId}/records/{id}` | `200` com o registro | `400` UUID, qualquer parâmetro; `404` meta, registro ou registro de outra meta |
| GET | `/goals/{id}/progress?date=` | `200` com o progresso do dia | `400` data ausente, inválida ou fora do intervalo, parâmetro desconhecido; `404` meta |

Exemplos de JSON estão no [contrato da API](../contrato-da-api.md). Todas as rotas aparecem no Swagger (`/docs/`) e no `openapi.json`.

## 3. Regras de negócio

| Regra | Onde | Comportamento |
|---|---|---|
| R2: período da meta | `create-practice-record.ts` | Registro só com data entre o início da meta e hoje (São Paulo). Meta com início futuro ainda não aceita registros |
| R3: meta encerrada | `create-practice-record.ts` + Repository | Nenhum registro novo, nem atrasado. Garantido também numa corrida com o encerramento (`SELECT ... FOR SHARE`) |
| R4: cumprimento diário | `get-daily-progress.ts` | Soma de todos os registros da data; cumprido quando o total atinge ou ultrapassa o alvo; total real preservado |
| Histórico preservado | `get-practice-records.ts`, `get-practice-record.ts`, `get-daily-progress.ts` | Consultas funcionam para metas encerradas |

O mesmo intervalo de datas (início ≤ data ≤ hoje) vale para registrar e para consultar progresso. "Hoje" sempre segue `America/Sao_Paulo` (`today-in-sao-paulo.ts`), independentemente do fuso do servidor.

## 4. Mapa do código

Caminhos relativos a `src/`. Equivalência com a disciplina entre parênteses.

```text
domain/habits/
├── enterprise/
│   ├── entities/
│   │   ├── practice-record.ts            (Model) registro: goalId, date, quantity
│   │   └── habit-goal.ts                 (Model) meta: startDate, isClosed, unit, dailyTarget
│   └── services/
│       └── today-in-sao-paulo.ts         data de hoje em São Paulo
└── application/
    ├── repositories/                     (Repository, contratos)
    │   ├── habit-goal-repository.ts      findById
    │   └── practice-record-repository.ts create, findManyByGoalId, findById, sumQuantityByGoalIdAndDate
    └── use-cases/                        (Service)
        ├── create-practice-record.ts     R2 e R3
        ├── get-practice-records.ts       histórico paginado
        ├── get-practice-record.ts        registro dentro da meta
        ├── get-daily-progress.ts         R4
        └── errors/
            ├── habit-goal-not-found-error.ts
            ├── habit-goal-closed-error.ts
            ├── invalid-practice-date-error.ts
            ├── invalid-progress-date-error.ts
            └── practice-record-not-found-error.ts
infra/
├── db/drizzle/
│   ├── mappers/                          (Mapper)
│   │   ├── drizzle-habit-goal-mapper.ts
│   │   └── drizzle-practice-record-mapper.ts
│   └── repositories/                     (Repository, PostgreSQL)
│       ├── habit-goal-repository.ts
│       └── practice-record-repository.ts
└── http/
    ├── schemas/practice-record.schema.ts (DTO) entrada e saída das 4 rotas
    ├── controllers/                      (Controller)
    │   ├── create-practice-record.controller.ts
    │   ├── get-practice-records.controller.ts
    │   ├── get-practice-record.controller.ts
    │   └── get-daily-progress.controller.ts
    └── factories/                        (Config)
        ├── make-create-practice-record-use-case.ts
        ├── make-get-practice-records-use-case.ts
        ├── make-get-practice-record-use-case.ts
        └── make-get-daily-progress-use-case.ts
```

`app.ts` registra os quatro controllers. Nenhuma tabela ou migration foi alterada.

Em todas as rotas, o fluxo é o mesmo dos participantes: **Zod** valida a requisição → **controller** chama o **caso de uso** criado pela **factory** → o caso de uso usa os **contratos de Repository** e devolve `Either` → o controller converte em **DTO** ou no contrato de erro (`message` + `metadata.fields`).

## 5. Decisões importantes

- **Regras nos casos de uso.** Controllers só traduzem para HTTP. O banco garante integridade e a corrida de R3.
- **Corrida entre registro e encerramento (R3).** O Repository lê a meta aberta com `FOR SHARE` na mesma transação do `INSERT`. Se o encerramento chegar antes, o registro espera e é recusado; se chegar depois, espera o registro terminar. `create` devolve `false` nesse caso, no mesmo padrão do e-mail duplicado de participantes.
- **Histórico ordenado antes de paginar.** `ORDER BY date, id` e depois `LIMIT/OFFSET`, com contagem e página na mesma transação `repeatable read`. As regras de `page` e `limit` reutilizam o schema de participantes.
- **Registro só dentro da sua meta.** A busca individual compara o `goalId` do registro com o da URL; um registro de outra meta dá `404`.
- **Progresso calculado, não armazenado.** `SUM(quantity)` no banco, sem tabela nem entidade de progresso, conforme o modelo de domínio. Independe da paginação.
- **Unidade herdada.** O registro não recebe `unit`; enviá-la retorna `400` como campo desconhecido.
- **Relógio controlado nos testes.** Todos os testes fixam "hoje" em 13/10/2026 com `vi.setSystemTime`, inclusive um caso às 23:30 em São Paulo, quando o UTC já está no dia seguinte.

## 6. Testes

| Nível | Quantidade | Arquivos |
|---|---|---|
| Unitários (casos de uso com Repositories em memória) | 47 no projeto | `create-practice-record.spec.ts`, `get-practice-records.spec.ts`, `get-practice-record.spec.ts`, `get-daily-progress.spec.ts` |
| Integração (HTTP + PostgreSQL real) | 100 no projeto | `practice-records.integration.spec.ts`, `practice-record-history.integration.spec.ts`, `daily-progress.integration.spec.ts` |
| **Total** | **147** | Typecheck, lint e build também passam |

Antes destas issues o projeto tinha 49 testes; as três issues adicionaram 98. O teste da corrida de R3 foi conferido removendo o `FOR SHARE`: ele falha sem o bloqueio e passa com ele.

Até as rotas de metas existirem, os testes HTTP inserem metas direto no banco.

## 7. Como verificar

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm run lint
pnpm test:unit      # 47 testes, não precisa de banco
pnpm test           # 147 testes, precisa de PostgreSQL (.env + docker compose up -d --wait)
pnpm openapi        # openapi.json não deve mudar
```

Sem PostgreSQL local, o CI do GitHub ("Backend checks") roda os 147 testes ao abrir o PR.

## 8. Combinados com o grupo

- **João (metas):** `HabitGoal`, `HabitGoalRepository.findById`, `DrizzleHabitGoalRepository`, `DrizzleHabitGoalMapper` e `HabitGoalNotFoundError` já existem na versão mínima que registros e progresso precisam. As rotas de metas devem ampliar esses arquivos, não criar outros. O encerramento deve ser um `UPDATE` em `habit_goals.closed_at`, o que basta para a proteção de R3.
- **Felipe (banco):** nenhuma mudança de schema ou migration foi necessária. Os índices existentes atendem às consultas.
- **Testes HTTP:** quando `POST /goals` existir, os testes podem trocar a inserção direta de metas pela rota.

## 9. Demonstração sugerida (cerca de 3 minutos)

1. Criar uma meta "Caminhar", 30 minutos, iniciada em uma data passada.
2. `POST` de 15 e de 20 minutos na mesma data → dois `201`.
3. `GET .../progress?date=...` → `totalCompleted: 35`, `completed: true` (R4, acima do alvo).
4. `POST` com data de amanhã → `400` (R2).
5. `GET .../records?limit=1` → paginação com `total: 2`.
6. Encerrar a meta e fazer um `POST` com data passada → `400` (R3).
7. Repetir o `GET` do histórico e do progresso → dados preservados.
