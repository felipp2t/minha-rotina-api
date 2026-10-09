# Minha Rotina — plano de implementação e divisão do grupo

Status: divisão e dias de entrega confirmados; sequência proposta. Mês e ano considerados pelo contexto da sessão: outubro de 2026. Horários não informados. Responsáveis associados na ordem em que os nomes foram informados.

## Marcos de entrega

| Prazo | Entrega | Preparação sugerida |
|---|---|---|
| 15/10/2026 | Todos os contratos | Até 14/10, revisar conjuntamente modelo de domínio, rotas, DTOs, exemplos de JSON, erros e regras; consolidar a documentação para entrega no dia 15 |
| 22/10/2026 | Projeto completo | De 16 a 20/10, concluir implementação e integração; reservar 21/10 para roteiro de testes, clone novo, autoavaliação e ensaio |

Proposta para o primeiro marco: entregar os contratos de todas as entidades em `docs/contrato-da-api.md`, acompanhados do modelo de domínio e do planejamento. Confirmar com o professor se há formato adicional exigido. A entrega do dia 15 não será apresentada como backend já implementado.

O enunciado disponível descreve uma entrega antes da Aula 11. Para este planejamento, os dois marcos informados pelo grupo são a referência; conferir o horário de corte e a data da apresentação com o professor.

## Responsabilidades

| Integrante | Responsabilidade principal | Componentes |
|---|---|---|
| Pessoa 1 — Felipe Rossetto da Silva | Configuração, banco, migrations e API simples de participantes | Casos de uso e controllers de participantes, factories, ParticipantRepository, DrizzleParticipantRepository, mappers e schemas |
| Pessoa 2 — João Otávio Benedet Zanette | Criação, consulta e encerramento de metas | Casos de uso e controllers de metas, factories, HabitGoalRepository, DrizzleHabitGoalRepository, mappers e schemas |
| Pessoa 3 — Renan Floriano | Registros, histórico e progresso diário | Casos de uso e controllers de registros/progresso, factories, PracticeRecordRepository, DrizzlePracticeRecordRepository, mappers e schemas |

Cada integrante implementa todas as camadas de sua funcionalidade. Pessoa 1 coordena os schemas e migrations para evitar alterações concorrentes conflitantes; as outras pessoas definem com ela os campos de suas tabelas. Todos revisam a integração e conseguem explicar o fluxo completo na apresentação.

## Etapa 1 — Preparação

- Partir do template oficial, preservando docs e Docker Compose, preenchendo o README do grupo e adaptando o código para Node conforme a [seção 8 das orientações de arquitetura](../enunciado/ARQUITETURA.md#8-em-outra-linguagem).
- Criar o repositório público do Minha Rotina, adicionar os três colaboradores e fixar versões compatíveis das ferramentas.
- Configurar TypeScript, Fastify, Zod, Drizzle, PostgreSQL e variáveis em `.env.example`.
- Definir integração de Zod e OpenAPI/Swagger UI; implementar erros com `message` e `metadata.fields`, conforme adaptação aprovada pelo professor e informada por Felipe.
- Preparar o workspace com `apps/api`, `packages/biome` e `packages/tsconfig`; criar schemas, migrations, modelos, contratos de repositório, casos de uso, controllers, factories e schemas HTTP conforme a [estrutura de pastas](../architecture/project-structure.md). Documentar responsabilidades e fornecer dependências dos casos de uso por construtor.

Prova de conclusão: cada integrante sobe o banco e a API e aplica as migrations em um banco vazio.

## Etapa 2 — Implementação por funcionalidade

1. Pessoa 1 implementa POST, GET e GET por ID de participantes, com `400` e `404`.
2. Pessoa 2 implementa metas e R5, incluindo encerramento e preservação do alvo/unidade (R1).
3. Pessoa 3 implementa registros e R2/R3, histórico e cálculo diário (R4).

As pessoas 2 e 3 podem trabalhar em paralelo após acordar os contratos dos Repositories. O progresso usa `get-daily-progress.ts`, seu controller, factory e DTO específico de saída; não exige uma quarta entidade.

Prova de conclusão: cadastrar participante, meta e registros, consultar o progresso, encerrar a meta e demonstrar bloqueios por datas, encerramento e duplicidade.

## Etapa 3 — Integração e entrega

- Executar o [roteiro de testes](../testing/roteiro-de-testes.md) e corrigir divergências entre código e documentos.
- Preencher o README do projeto com problema, integrantes, regras, mapa de classes, rotas, comandos reais e situação de cada funcionalidade.
- Mapear no README os equivalentes de Java para TypeScript, sem omitir DTOs, Mapper ou Repository.
- Preencher [autoavaliação](../autoavaliacao.md) com evidências, sem marcar funcionalidades ainda não verificadas como prontas.
- Um integrante valida o projeto em um clone novo seguindo somente o README.
- Conferir a branch `main` antes do início da Aula 11 e enviar o link conforme o enunciado.

Reservar o último dia disponível para integração e ensaio, sem adicionar funcionalidades.

## Apresentação — até 10 minutos

| Tempo | Conteúdo | Responsável sugerido |
|---|---|---|
| 2 min | Problema, público e regras | Pessoa 1 |
| 2 min | Entidades e relacionamentos | Pessoa 2 |
| 1 min | Contrato das rotas | Pessoa 3 |
| 2 min | Camadas e localização das regras | Os três, cada um em sua funcionalidade |
| 3 min | API simples, `400`, `404` e regras barrando pedidos | Os três |

## Comandos a preparar

Scripts propostos: `dev`, `build`, `start`, `db:generate`, `db:migrate` e `test`. Os comandos de execução só devem entrar no README como funcionais depois de implementados e verificados.

## Fora desta etapa

Login, frontend, edição ou exclusão de registros, alteração de alvo/unidade na mesma meta, notificações, recomendações clínicas e integrações externas.
