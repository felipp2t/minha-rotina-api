# Manual: progresso diário (`GET /goals/{id}/progress?date=AAAA-MM-DD`)

Responsável: Renan Floriano. Esta rota aplica a regra **R4**: somar as quantidades da meta numa data e dizer se o dia foi cumprido. Ela reutiliza a leitura de metas e de registros; não existe tabela nem entidade de progresso.

## 1. O que a rota faz

Pergunta respondida: "Quanto pratiquei desta meta neste dia, e atingi o alvo?"

```http
GET /goals/189bc8fc-9e93-4c18-a48e-d11fd7ad4b02/progress?date=2026-10-09
```

Com dois registros de 15 e 20 minutos numa meta de 30 minutos, a resposta `200` é:

```json
{"goalId":"189bc8fc-9e93-4c18-a48e-d11fd7ad4b02","date":"2026-10-09","unit":"MINUTES","dailyTarget":30,"totalCompleted":35,"completed":true}
```

| Campo | De onde vem |
|---|---|
| `goalId`, `date` | Da URL |
| `unit`, `dailyTarget` | Da meta |
| `totalCompleted` | Soma das quantidades de **todos** os registros da meta na data |
| `completed` | `totalCompleted >= dailyTarget` |

## 2. Caminho da requisição

1. **Zod** valida `id` (UUID) e exige `date` no formato `AAAA-MM-DD` e com dia existente. Qualquer outro parâmetro, inclusive `page` e `limit`, retorna `400`.
2. **Controller** chama o caso de uso montado pela factory.
3. **Caso de uso** (`get-daily-progress.ts`):
   1. Busca a meta (`HabitGoalRepository.findById`). Se não existir, retorna `404`.
   2. Confere se a data está entre o início da meta e hoje em São Paulo (mesma lógica de R2 do cadastro).
   3. Pede a soma ao Repository (`sumQuantityByGoalIdAndDate`).
   4. Calcula `completed = total >= alvo` (R4).
4. **Resposta** `200` com o objeto da seção 1.

A meta encerrada **não** é bloqueada: encerrar impede novos registros (R3), mas o progresso dos dias anteriores continua consultável.

## 3. Arquivos novos e alterados

Caminhos relativos a `src/`.

| Camada | Arquivo | O que faz |
|---|---|---|
| Service | `domain/habits/application/use-cases/get-daily-progress.ts` | Valida a data e aplica R4 |
| Erro | `domain/habits/application/use-cases/errors/invalid-progress-date-error.ts` | Data fora do intervalo permitido |
| Repository (contrato) | `domain/habits/application/repositories/practice-record-repository.ts` | Novo método `sumQuantityByGoalIdAndDate` |
| Repository (PostgreSQL) | `infra/db/drizzle/repositories/practice-record-repository.ts` | `SUM` no banco |
| DTO | `infra/http/schemas/practice-record.schema.ts` | `dailyProgressQuerySchema` (entrada) e `dailyProgressSchema` (saída) |
| Controller | `infra/http/controllers/get-daily-progress.controller.ts` | Rota e conversão para HTTP |
| Config | `infra/http/factories/make-get-daily-progress-use-case.ts` | Monta o caso de uso |
| Config | `app.ts` | Registra o controller |

**Por que não há entidade de progresso?** O progresso é um cálculo sobre dados que já existem. Guardá-lo numa tabela criaria duas fontes de verdade: se um registro fosse criado e a tabela não fosse atualizada, os números ficariam diferentes. O modelo de domínio do grupo define isso: "Progresso diário e dia cumprido são calculados, não tabelas".

## 4. A soma

A consulta no PostgreSQL é:

```sql
SELECT coalesce(sum(quantity), 0)
FROM practice_records
WHERE goal_id = $1 AND date = $2;
```

- **Todos os registros**: a soma é feita no banco, sem `LIMIT`. Por isso independe da paginação do histórico. Um teste cria 25 registros, mais do que a página padrão de 20, e confere o total.
- **Dia sem registros**: `sum` de nenhuma linha é `NULL`; o `coalesce(..., 0)` transforma em `0`, e `completed` fica `false`.
- **Texto para número**: o PostgreSQL devolve a soma de inteiros como `bigint`, que o driver entrega como texto. O Repository converte com `Number(...)`.
- **Índice**: a busca usa `practice_records_goal_date_index` em `(goal_id, date, id)`, criado na migration.

## 5. R4: quando o dia é cumprido

| Registros no dia (alvo 30) | `totalCompleted` | `completed` |
|---|---|---|
| nenhum | 0 | `false` |
| 29 | 29 | `false` |
| 30 | 30 | `true` |
| 15 + 20 | 35 | `true` |

O alvo é um objetivo, não um limite: o total real (35) é devolvido, não "30".

## 6. Datas aceitas e erros

Intervalo permitido: **início da meta ≤ data ≤ hoje** (São Paulo), igual ao cadastro de registros.

| Situação | HTTP | Mensagem |
|---|---|---|
| `date` ausente, vazia ou inválida (`2026-02-29`, `2026-10-9`, `10/10/2026`) | `400` | Campos inválidos., campo `date` |
| Parâmetro desconhecido, inclusive `page` e `limit` | `400` | Campos inválidos., "Parâmetro não permitido." |
| UUID malformado | `400` | Campos inválidos., campo `id` |
| Meta começa depois de hoje | `400` | A meta ainda não começou; o progresso pode ser consultado a partir de AAAA-MM-DD. |
| Data depois de hoje | `400` | A data consultada não pode ser posterior a hoje. |
| Data antes do início | `400` | A data consultada não pode ser anterior ao início da meta. |
| Meta inexistente | `404` | Meta não encontrada. |

Uma meta com início futuro não tem nenhuma data válida ainda, então qualquer consulta dela retorna `400` até a data de início chegar.

## 7. Testes

| Tipo | Arquivo | O que cobre |
|---|---|---|
| Unitário | `src/domain/habits/application/use-cases/get-daily-progress.spec.ts` | Soma, abaixo/igual/acima do alvo, dia vazio, outra meta e outra data, limites, início futuro, meta encerrada, meta inexistente |
| Integração | `test/integrations/daily-progress.integration.spec.ts` | Exemplo do contrato, 25 registros, limites, virada do dia em São Paulo, meta encerrada, validação de `date`, parâmetros desconhecidos, `404` e Swagger |

Como nas outras rotas, os testes fixam "hoje" em 13/10/2026 com `vi.setSystemTime`.

## 8. Como demonstrar

1. Registrar 15 e 20 numa meta de 30, na mesma data → `GET .../progress?date=...` mostra `35` e `completed: true`.
2. Consultar um dia válido sem registros → `0` e `false`.
3. Consultar amanhã → `400`.
4. Esquecer o `date` → `400` com o campo `date`.
5. Encerrar a meta e consultar de novo o passo 1 → mesma resposta.

## 9. Perguntas que podem aparecer

**Por que somar no banco e não no código?** O banco soma direto, sem trazer todas as linhas para a aplicação, e o resultado não depende da paginação.

**Por que `completed` usa `>=`?** A regra diz que o dia é cumprido quando o total **atinge ou ultrapassa** o alvo. Exatamente 30 de 30 já cumpre.

**Por que meta encerrada continua consultável?** Encerrar preserva o histórico e o significado do progresso dos dias anteriores. Só novos registros são bloqueados (R3).

**Por que aceitar uma data válida sem registros em vez de dar `404`?** O dia existe no período da meta; ele só não teve prática. A resposta correta é "0, não cumprido".
