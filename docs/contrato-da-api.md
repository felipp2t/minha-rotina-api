# Minha Rotina — contrato da API

Status: rotas de participantes implementadas e testadas; metas, registros e progresso permanecem planejados.

## Convenções

Base local confirmada: `http://localhost:3333`. Campos e identificadores JSON em inglês, IDs UUID representados como strings e gerados pelo backend e datas de negócio `AAAA-MM-DD`. O calendário usa `America/Sao_Paulo`. Listagens retornam um objeto com `data` e `pagination`. Campos técnicos do banco não são expostos. O cliente não envia `id` no cadastro; envia apenas os UUIDs de referência quando necessários. UUID malformado retorna `400`; UUID válido de recurso inexistente retorna `404`.

### Respostas de cadastro

Os cadastros de participantes, metas e registros retornam HTTP `201` com o JSON do recurso criado. O header `Location` fica fora do contrato nesta etapa.

### Paginação das listagens

Aplicável a `GET /participants`, `GET /participants/{id}/goals` e `GET /goals/{id}/records`.

- Parâmetros opcionais: `page` (inteiro positivo, padrão 1) e `limit` (inteiro entre 1 e 100, padrão 20).
- Parâmetros inválidos retornam `400`, com o nome do parâmetro em `metadata.fields`. Na implementação de participantes, `page` e o offset calculado devem estar dentro do intervalo de inteiros seguros do JavaScript.
- `data` contém os itens da página, respeitando a ordenação definida para a rota antes do recorte.
- `pagination` contém `page`, `limit`, `total` e `totalPages`; `total` conta todos os itens da listagem correspondente, não apenas a página.
- `totalPages = ceil(total / limit)`; se não houver itens, será zero.
- Página além da última retorna `200`, com `data: []` e os totais reais, preservando `page` solicitado.
- Participante ou meta inexistente nas listagens vinculadas continua retornando `404`.

### Campos desconhecidos no corpo JSON

Os corpos JSON de cadastro de participantes, criação de metas e registro de práticas aceitam apenas os campos definidos para a operação. Um campo desconhecido retorna `400`; não é ignorado nem persistido. Cada campo desconhecido aparece em `metadata.fields` com seu nome em `field` e uma mensagem explicativa. Campos obrigatórios ausentes também geram erros de validação.

Exemplo: adicionar `observacao` ao corpo de um registro de prática retorna HTTP `400`:

```json
{"message":"Campos inválidos.","metadata":{"fields":[{"field":"observacao","message":"Campo não permitido."}]}}
```

### Parâmetros de consulta desconhecidos

Parâmetros de consulta não definidos para a operação retornam `400`, com cada nome desconhecido em `metadata.fields` e a mensagem “Parâmetro não permitido.”.

| Operação | Parâmetros de consulta aceitos |
|---|---|
| `GET /participants` | `page`, `limit` |
| `GET /participants/{id}/goals` | `page`, `limit` |
| `GET /goals/{id}/records` | `page`, `limit` |
| `GET /goals/{id}/progress` | `date` (obrigatório) |
| Demais operações deste contrato | Nenhum |

Por exemplo, `GET /participants?pag=1` retorna HTTP `400`:

```json
{"message":"Campos inválidos.","metadata":{"fields":[{"field":"pag","message":"Parâmetro não permitido."}]}}
```

## Participantes — API simples da entrega

### POST /participants

Entrada:

```json
{"name":"Ana Silva","email":"ana@example.com"}
```

Saída `201`:

```json
{"id":"72f43a86-cf1a-4d20-b60a-3a9c92e5d8f1","name":"Ana Silva","email":"ana@example.com"}
```

O nome deve conter de 1 a 100 caracteres após remover espaços nas extremidades; o valor sem esses espaços é armazenado e retornado. Nome fora desses limites e e-mail inválido retornam `400`. O e-mail é normalizado removendo espaços nas extremidades e convertendo para minúsculas antes da validação e persistência; a resposta retorna esse valor normalizado. Um e-mail já cadastrado retorna `400`, com `message` explicativa e um item em `metadata.fields` cujo `field` é `email`. Não há login.

### GET /participants

Ordenação confirmada: nome e, em caso de empate, UUID, ambos crescentes.

Sem corpo de entrada. Saída `200`:

```json
{"data":[{"id":"72f43a86-cf1a-4d20-b60a-3a9c92e5d8f1","name":"Ana Silva","email":"ana@example.com"}],"pagination":{"page":1,"limit":20,"total":1,"totalPages":1}}
```

### GET /participants/{id}

Sem corpo de entrada. Saída `200`: o mesmo objeto do cadastro. Participante inexistente retorna `404`.

## Metas

### POST /goals

Entrada:

```json
{"participantId":"72f43a86-cf1a-4d20-b60a-3a9c92e5d8f1","name":"Caminhar","dailyTarget":30,"unit":"MINUTES","startDate":"2026-10-09"}
```

Saída `201`:

```json
{"id":"189bc8fc-9e93-4c18-a48e-d11fd7ad4b02","participantId":"72f43a86-cf1a-4d20-b60a-3a9c92e5d8f1","name":"Caminhar","dailyTarget":30,"unit":"MINUTES","startDate":"2026-10-09","closedAt":null}
```

Unidades: `ML`, `MINUTES`, `REPETITIONS`. O nome deve conter de 1 a 100 caracteres após remover espaços nas extremidades; o valor sem esses espaços é armazenado e retornado, preservando maiúsculas e minúsculas para exibição. Alvo inteiro positivo e data válida. Campos inválidos retornam `400`. Início passado ou futuro é permitido. Participante inexistente retorna `404`; meta duplicada não encerrada retorna `400` (R5).

### GET /participants/{id}/goals

Sem corpo de entrada. Saída `200`: objeto paginado cujo `data` contém metas no formato da resposta de cadastro, incluindo metas encerradas. Ordenação confirmada: nome e, em caso de empate, UUID, ambos crescentes. Participante inexistente retorna `404`.

Exemplo com `page=1&limit=20`:

```json
{"data":[{"id":"189bc8fc-9e93-4c18-a48e-d11fd7ad4b02","participantId":"72f43a86-cf1a-4d20-b60a-3a9c92e5d8f1","name":"Caminhar","dailyTarget":30,"unit":"MINUTES","startDate":"2026-10-09","closedAt":null}],"pagination":{"page":1,"limit":20,"total":1,"totalPages":1}}
```

### GET /goals/{id}

Sem corpo de entrada. Saída `200`: objeto da meta no formato acima. Meta inexistente retorna `404`.

### POST /goals/{id}/closure

Sem corpo de entrada. Saída `200`:

```json
{"id":"189bc8fc-9e93-4c18-a48e-d11fd7ad4b02","participantId":"72f43a86-cf1a-4d20-b60a-3a9c92e5d8f1","name":"Caminhar","dailyTarget":30,"unit":"MINUTES","startDate":"2026-10-09","closedAt":"2026-10-10T15:00:00Z"}
```

O servidor determina o instante de encerramento. Comportamento confirmado: repetir a operação mantém o primeiro instante e retorna a meta encerrada com `200`. Meta inexistente retorna `404`. Alvo e unidade não possuem rota de alteração.

## Registros e progresso

### POST /goals/{id}/records

Entrada:

```json
{"date":"2026-10-09","quantity":15}
```

Saída `201`:

```json
{"id":"90855dc9-f3bc-4f92-aab7-b8b20e8c4cd3","goalId":"189bc8fc-9e93-4c18-a48e-d11fd7ad4b02","date":"2026-10-09","quantity":15}
```

Quantidade inteira positiva; a unidade é herdada da meta. Vários registros na mesma data e totais acima do alvo são permitidos. Meta inexistente retorna `404`. Data anterior ao início ou posterior a hoje retorna `400` (R2). Meta encerrada retorna `400` (R3), inclusive para registros atrasados.

### GET /goals/{id}/records

Sem corpo de entrada. Saída `200`:

```json
{"data":[{"id":"90855dc9-f3bc-4f92-aab7-b8b20e8c4cd3","goalId":"189bc8fc-9e93-4c18-a48e-d11fd7ad4b02","date":"2026-10-09","quantity":15}],"pagination":{"page":1,"limit":20,"total":1,"totalPages":1}}
```

Ordenação confirmada: data e, em caso de empate, UUID, ambos crescentes. UUID é um critério de desempate, não indica a sequência de cadastro. Histórico de metas encerradas permanece consultável. Meta inexistente retorna `404`.

### GET /goals/{goalId}/records/{id}

Sem corpo de entrada e sem parâmetros de consulta. `goalId` e `id` devem ser UUIDs válidos; valores malformados retornam `400`.

Saída `200`:

```json
{"id":"90855dc9-f3bc-4f92-aab7-b8b20e8c4cd3","goalId":"189bc8fc-9e93-4c18-a48e-d11fd7ad4b02","date":"2026-10-09","quantity":15}
```

A consulta também está disponível para metas encerradas. Meta inexistente, registro inexistente ou registro pertencente a outra meta retornam `404`. O caso de uso verifica o vínculo entre os dois IDs antes de devolver o DTO.

### GET /goals/{id}/progress?date=2026-10-09

Data de consulta obrigatória. Sem corpo de entrada. Saída `200`, considerando dois registros de 15 e 20 minutos:

```json
{"goalId":"189bc8fc-9e93-4c18-a48e-d11fd7ad4b02","date":"2026-10-09","unit":"MINUTES","dailyTarget":30,"totalCompleted":35,"completed":true}
```

Dia válido sem registros retorna total zero e `completed: false`. Comportamento confirmado: aceitar consultas entre o início e hoje, inclusive de metas encerradas; fora desse intervalo retornar `400`. Uma meta com início futuro ainda não possui data válida para consultar progresso. Meta inexistente retorna `404`.

O cálculo de progresso soma todos os registros da meta na data consultada, independentemente da paginação da listagem de registros.

## Erros

Formato confirmado pelo grupo: o status fica apenas na resposta HTTP; o corpo contém `message` e `metadata`. `metadata` contém `fields`, um array de objetos com `field` e `message`, ambos strings. Quando não houver erros associados a campos específicos, `fields` será um array vazio. Não há outros atributos de metadata previstos nesta etapa.

### Regra de negócio — HTTP 400

```json
{"message":"A data da prática não pode ser anterior ao início da meta.","metadata":{"fields":[]}}
```

### Campo inválido — HTTP 400

```json
{"message":"Campos inválidos.","metadata":{"fields":[{"field":"quantity","message":"Informe um inteiro positivo."}]}}
```

### Recurso inexistente — HTTP 404

```json
{"message":"Meta não encontrada.","metadata":{"fields":[]}}
```

JSON malformado e parâmetros inválidos retornam `400`. Os casos de uso retornam falhas esperadas para regras e recursos inexistentes; o tratamento central os converte no contrato de erro. Erros internos retornam `500` sem detalhes do banco.

### Compatibilidade com a disciplina

O grupo adotou um contrato próprio com `message` e `metadata.fields`, sem status no corpo. Conforme informado por Felipe, o professor aprovou essa adaptação em conversa com ele. A aprovação resolve a diferença em relação ao formato do template solicitado no enunciado.
