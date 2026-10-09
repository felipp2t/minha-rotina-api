# Planejamento do Minha Rotina

Status: rascunho; decisões confirmadas na conversa, com questões em aberto.

## Contexto da entrega

- Stack acordada: Node.js + TypeScript, Fastify para HTTP, Zod para validação de entrada, PostgreSQL como banco de dados e Drizzle ORM para persistência.
- Porta local da API: `3333` (`http://localhost:3333`).
- Tema: Saúde e Bem-Estar.
- Nome confirmado: Minha Rotina.
- Equipe: Felipe Rossetto da Silva, João Otávio Benedet Zanette e Renan Floriano.
- Entrega dos contratos: 15/10/2026.
- Entrega do projeto completo: 22/10/2026.
- Mês e ano considerados pelo contexto da sessão; horários de entrega não informados.
- Entrega: planejamento e estrutura completa do backend, API simples e pelo menos três regras implementadas, conforme o enunciado da disciplina.

## Problema e proposta

Pessoas que desejam manter hábitos saudáveis precisam acompanhar quanto praticaram em cada dia e consultar seu histórico. O sistema permitirá criar metas pessoais diárias, registrar quantidades realizadas e consultar o progresso por data.

## Escopo acordado

- Participantes são cadastrados com nome e e-mail, sem login nesta etapa.
- E-mails são únicos, normalizados sem espaços nas extremidades e em minúsculas; duplicatas retornam `400`.
- Cada meta pertence a um participante, referenciado pelo seu ID nas requisições.
- Listagens de participantes, metas e registros usam paginação com `page` e `limit`, padrões 1 e 20, limite máximo de 100, e resposta com `data` e `pagination`.
- Corpos JSON de cadastro aceitam somente os campos definidos no contrato; campos desconhecidos retornam `400` e são identificados em `metadata.fields`.
- Parâmetros de consulta desconhecidos também retornam `400`: listagens aceitam apenas `page` e `limit`, progresso aceita apenas `date`, e as demais operações não aceitam parâmetros de consulta.
- O participante escolhe o nome do hábito livremente.
- Nomes de participantes e metas devem ter de 1 a 100 caracteres após remover espaços nas extremidades; o valor sem esses espaços é armazenado e retornado.
- Cada meta possui uma quantidade alvo diária e uma unidade: ml, minutos ou repetições.
- A data de início é escolhida pelo participante e pode ser passada, atual ou futura.
- Uma meta com início futuro pode ser cadastrada e consultada, mas só aceita práticas a partir da data de início, sem aceitar registros de práticas futuras.
- Cada registro informa uma data e uma quantidade na unidade da meta.
- Registros podem ser listados com paginação ou consultados individualmente dentro da meta à qual pertencem, inclusive após o encerramento.
- Vários registros da mesma meta no mesmo dia são somados.
- Um dia é cumprido quando a soma atinge ou ultrapassa o alvo diário.
- Quantidades acima do alvo são aceitas; a consulta preserva o total real, sem limitá-lo ao alvo.
- O alvo diário e as quantidades registradas devem ser inteiros positivos; zero, valores negativos e frações são inválidos.
- O dia atual é determinado no fuso `America/Sao_Paulo`; datas de início e de prática são informadas como `AAAA-MM-DD`, sem horário.
- O cumprimento de um dia não encerra a meta: ela representa uma rotina recorrente.
- O histórico é preservado quando a meta é encerrada.
- Repetir o encerramento retorna sucesso e preserva o instante do primeiro encerramento.
- Consultas de progresso aceitam datas entre o início da meta e hoje, inclusive de metas encerradas. Dias válidos sem registros retornam total zero e dia não cumprido; datas fora desse intervalo retornam `400`.

## Entidades propostas

| Entidade | Responsabilidade | Situação |
|---|---|---|
| Participante | Representar a pessoa cadastrada com nome e e-mail que acompanha suas metas | Confirmado; sem login nesta etapa |
| Meta de hábito | Representar um compromisso diário com nome, alvo e unidade | Conceito confirmado |
| Registro de prática | Guardar uma ocorrência com data e quantidade vinculada à meta | Conceito confirmado |

## Regras de negócio acordadas

| Regra | Comportamento esperado |
|---|---|
| R1 — Preservar a medição do histórico | Alvo e unidade ficam fixos desde a criação; para mudá-los, encerra-se a meta e cria-se outra |
| R2 — Respeitar o período da meta | Um registro não pode ter data anterior ao início da meta nem posterior ao dia atual |
| R3 — Impedir registros em metas encerradas | Uma meta encerrada não aceita novos registros, mesmo que a data da prática seja anterior ao encerramento |
| R4 — Calcular o cumprimento diário | Somar os registros da mesma meta e data; considerar o dia cumprido quando o total atingir ou ultrapassar o alvo |
| R5 — Evitar compromissos duplicados | Impedir duas metas não encerradas do mesmo participante com nome e unidade iguais, incluindo metas com início futuro; ignorar maiúsculas e espaços nas extremidades do nome |

A unicidade de e-mail é uma regra adicional de cadastro, aplicada pelo caso de uso e garantida no banco. Ela não substitui as três regras específicas do acompanhamento de hábitos exigidas para a demonstração.

As regras estão planejadas, ainda não implementadas. As violações de R2, R3 e R5 deverão retornar HTTP 400 com mensagem explicativa. Essas três regras constituem o mínimo de regras impeditivas a demonstrar na entrega. A decisão de manter alvo e unidade fixos será refletida nas operações disponíveis na API.

## Exemplo de uso

Uma pessoa cria a meta “Caminhar”, com alvo diário de 30 minutos. Registra 15 minutos pela manhã e 20 à tarde. A consulta daquele dia apresenta 35 minutos realizados e o dia cumprido. Os registros permanecem no histórico e a meta continua no dia seguinte.

## Questões em aberto

- Fechar detalhes técnicos dos campos e contratos; erros definidos com `message` e `metadata.fields`, um array de objetos contendo `field` e `message`.
- Horários das entregas de 15/10 e 22/10.

## Divisão acordada

O formato próprio de erro (`message` e `metadata.fields`, com status apenas no HTTP) foi aprovado pelo professor, conforme informado por Felipe.

- Felipe Rossetto da Silva (Pessoa 1): configuração inicial, banco e cadastro de participantes.
- João Otávio Benedet Zanette (Pessoa 2): criação, consulta e encerramento de metas.
- Renan Floriano (Pessoa 3): registros, histórico e progresso diário.

Os responsáveis foram associados na ordem em que os nomes foram informados.

Cada pessoa cuida das camadas da sua funcionalidade. Todos participam da integração e da apresentação. Detalhes no [plano de implementação](../implementation/roadmap.md).

## Referências locais

- [Enunciado da disciplina](../enunciado/README.md).
- [Critérios de avaliação](../enunciado/AVALIACAO.md).
- [Vocabulário acordado](../../CONTEXT.md).
