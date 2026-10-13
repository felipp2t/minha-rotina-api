# Manual: histórico de registros

Rotas `GET /goals/{id}/records` e `GET /goals/{goalId}/records/{id}`. Responsável: Renan Floriano. Este manual continua o [manual do registro de prática](manual-registro-de-pratica.md) e reutiliza a mesma entidade, o mesmo mapper e o mesmo Repository.

## 1. O que as rotas fazem

| Rota | Objetivo |
|---|---|
| `GET /goals/{id}/records?page=1&limit=20` | Lista o histórico da meta, em páginas |
| `GET /goals/{goalId}/records/{id}` | Busca um registro, mas só dentro da meta informada |

As duas funcionam também para metas encerradas: encerrar impede novos registros (R3), mas não esconde o histórico.

Exemplo de listagem (`200`):

```json
{"data":[{"id":"90855dc9-f3bc-4f92-aab7-b8b20e8c4cd3","goalId":"189bc8fc-9e93-4c18-a48e-d11fd7ad4b02","date":"2026-10-09","quantity":15}],"pagination":{"page":1,"limit":20,"total":1,"totalPages":1}}
```

A busca individual devolve só o objeto do registro, no mesmo formato de cada item de `data`.

## 2. Caminho da requisição

O fluxo é o mesmo do cadastro: Zod valida a URL, o controller chama o caso de uso montado pela factory, e o caso de uso usa os Repositories.

**Listagem (`get-practice-records.ts`):**

1. Zod valida `id` (UUID), `page` (inteiro ≥ 1, padrão 1) e `limit` (inteiro de 1 a 100, padrão 20). Qualquer outro parâmetro retorna `400`.
2. O caso de uso confere se a meta existe (`HabitGoalRepository.findById`). Se não existir, retorna `404`.
3. `PracticeRecordRepository.findManyByGoalId` conta todos os registros da meta e lê só a página pedida.
4. O caso de uso calcula `totalPages = ceil(total / limit)` e o controller converte cada registro em DTO.

**Busca individual (`get-practice-record.ts`):**

1. Zod valida `goalId` e `id` (UUIDs) e recusa qualquer parâmetro de consulta.
2. O caso de uso confere se a meta existe; se não, retorna `404` "Meta não encontrada.".
3. Busca o registro pelo `id` (`PracticeRecordRepository.findById`).
4. Se o registro não existir **ou pertencer a outra meta**, retorna `404` "Registro não encontrado.".

## 3. Arquivos novos e alterados

Caminhos relativos a `src/`.

| Camada | Arquivo | O que mudou |
|---|---|---|
| Repository (contrato) | `domain/habits/application/repositories/practice-record-repository.ts` | Novos `findManyByGoalId` e `findById` |
| Service | `domain/habits/application/use-cases/get-practice-records.ts` | Novo: listagem paginada |
| Service | `domain/habits/application/use-cases/get-practice-record.ts` | Novo: busca dentro da meta |
| Erro | `domain/habits/application/use-cases/errors/practice-record-not-found-error.ts` | Novo: "Registro não encontrado." |
| Repository (PostgreSQL) | `infra/db/drizzle/repositories/practice-record-repository.ts` | Implementa as duas consultas |
| DTO | `infra/http/schemas/practice-record.schema.ts` | Parâmetros da busca, query da listagem e formato da lista |
| Controllers | `infra/http/controllers/get-practice-records.controller.ts`, `get-practice-record.controller.ts` | Novos |
| Config | `infra/http/factories/make-get-practice-records-use-case.ts`, `make-get-practice-record-use-case.ts` | Novos |
| Config | `app.ts` | Registra os dois controllers |

A entidade `PracticeRecord` e o `DrizzlePracticeRecordMapper.toDomain` já existiam desde o cadastro e não mudaram.

## 4. Ordenação e paginação

A consulta no PostgreSQL é:

```sql
SELECT count(*) FROM practice_records WHERE goal_id = $1;

SELECT * FROM practice_records
WHERE goal_id = $1
ORDER BY date, id
LIMIT $limit OFFSET ($page - 1) * $limit;
```

- **Ordenar antes de paginar**: o `ORDER BY` vem antes do `LIMIT/OFFSET`, então a página 2 é sempre a continuação da página 1, sem repetir nem pular registros.
- **Desempate por UUID**: vários registros na mesma data precisam de uma ordem fixa; o UUID garante isso. Ele é só desempate e não indica qual registro foi criado primeiro.
- **Totais completos**: `total` conta todos os registros da meta, não só os da página.
- **Mesma "foto" do banco**: contagem e página rodam numa transação `repeatable read`, somente leitura, como na listagem de participantes. Assim um registro criado no meio não deixa o total diferente da página.
- **Índice**: a migration já criou `practice_records_goal_date_index` em `(goal_id, date, id)`, exatamente a ordem da consulta.

Casos de borda:

| Situação | Resposta |
|---|---|
| Histórico vazio | `200`, `data: []`, `total: 0`, `totalPages: 0` |
| Página além da última | `200`, `data: []`, totais reais e o `page` pedido |
| `limit=1` ou `limit=100` | Aceito |
| `page` 0, negativo, fracionado ou texto; `limit` 0, maior que 100 ou fracionado | `400`, com o campo em `metadata.fields` |

As regras de `page` e `limit` reutilizam o schema da listagem de participantes, então as três listagens do contrato se comportam igual.

## 5. Por que conferir a meta na busca individual

O registro poderia ser buscado só pelo `id`. Mas a URL diz "o registro X **da meta Y**". Se o registro existe e pertence a outra meta, devolver ele seria responder a uma pergunta diferente da que foi feita. Por isso o caso de uso compara `record.goalId` com o `goalId` da URL e responde `404`, sem revelar o registro.

## 6. Respostas de erro

| Situação | HTTP | Mensagem |
|---|---|---|
| UUID malformado (`id` ou `goalId`) | `400` | Campos inválidos., com o parâmetro em `metadata.fields` |
| Parâmetro de consulta desconhecido (`?pag=1`) ou qualquer parâmetro na busca individual | `400` | Campos inválidos., "Parâmetro não permitido." |
| Meta inexistente | `404` | Meta não encontrada. |
| Registro inexistente ou de outra meta | `404` | Registro não encontrado. |

## 7. Testes

| Tipo | Arquivo | O que cobre |
|---|---|---|
| Unitário | `src/domain/habits/application/use-cases/get-practice-records.spec.ts` | Ordem, paginação, totais, página além da última, histórico vazio, meta encerrada, meta inexistente |
| Unitário | `src/domain/habits/application/use-cases/get-practice-record.spec.ts` | Registro da meta, registro de outra meta, registro e meta inexistentes |
| Integração | `test/integrations/practice-record-history.integration.spec.ts` | As duas rotas com PostgreSQL: ordem com UUIDs fixos, páginas, bordas, validação, `404`, meta encerrada e Swagger |

O Repository em memória (`test/repositories/in-memory-practice-record-repository.ts`) imita a mesma ordenação para os testes unitários.

## 8. Como demonstrar

Com uma meta e alguns registros criados (veja o manual do registro de prática):

1. `GET /goals/{id}/records` → registros em ordem de data.
2. `GET /goals/{id}/records?page=2&limit=1` → um registro por página, com `total` completo.
3. `GET /goals/{id}/records?page=99` → `data: []` com os totais reais.
4. `GET /goals/{id}/records?limit=101` → `400`.
5. `GET /goals/{goalId}/records/{id}` → o registro; trocando `goalId` por outra meta → `404`.
6. Encerrar a meta e repetir o passo 1 → o histórico continua lá.

## 9. Perguntas que podem aparecer

**Por que a listagem confere se a meta existe?** Sem isso, uma meta inexistente e uma meta sem registros dariam a mesma resposta (`data: []`). O contrato pede `404` para meta inexistente.

**Por que não usar só `OFFSET` sem `ORDER BY`?** Sem ordem definida, o PostgreSQL pode devolver as linhas em qualquer ordem, e as páginas poderiam repetir ou omitir registros.

**Por que o registro de outra meta é `404` e não `400`?** Do ponto de vista da URL, aquele registro não existe dentro daquela meta. `400` é para pedidos mal formados, como um UUID inválido.

**Meta encerrada some do histórico?** Não. Encerrar só bloqueia novos registros (R3); as consultas não olham `closedAt`.
