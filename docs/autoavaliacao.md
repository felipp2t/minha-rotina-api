# Minha Rotina: autoavaliação da Etapa 1

Status: implementação e testes automatizados concluídos; conferência acadêmica final pendente.

Não há nota estimada. As operações de participantes, metas, registros e progresso estão implementadas. A avaliação abaixo deve ser confirmada pelo grupo com demonstração e evidências da entrega.

| Critério | Situação atual | Evidência a apresentar |
|---|---|---|
| P1: Sobe pelo README | Verificado em pasta limpa | Em 12/10/2026: instalação pelo lockfile, migrations, build e HTTP do servidor compilado, usando PostgreSQL do Compose |
| P2: Camadas | Implementado | Casos de uso, contratos, repositórios, controllers e factories de participantes, metas e registros |
| P3: Banco e entidades | Implementado | Schemas Drizzle, modelos, migrations e chaves estrangeiras |
| P4: DTOs | Implementado | Entrada validada por Zod e saída separada dos modelos |
| P5: Estrutura documentada | Implementado | Dependências por construtor, estrutura de pastas e responsabilidades descritas no README e em `docs/` |
| P6: API simples | Implementado e testado | `test/integrations/participants.integration.spec.ts`: POST e GETs, `400`, `404`, paginação e cadastros simultâneos |
| P7: Regras implementadas | Implementado e coberto por testes | R1–R5 aplicadas nas operações de metas, registros e progresso |
| P8: Regras atendem ao tema | Documentado; confirmar na apresentação | Demonstrar acompanhamento diário, metas e preservação do histórico |
| P9: Código igual ao desenho | Implementado; confirmar na revisão final | Camadas e contratos descritos correspondem às rotas e testes existentes |
| P10: README completo | Atualizado | Comandos, mapa, rotas e situação atual documentados |

Após verificar a implementação, substituir a situação por atende, parcial ou não atende e acrescentar evidências reais. Referência: [critérios da disciplina](./enunciado/AVALIACAO.md).

Verificação em 12/10/2026: typecheck, Biome/Ultracite, build, exportação OpenAPI e 39 testes passaram em pasta limpa. A suíte completa com PostgreSQL, build e OpenAPI também passou no CI do PR #17 em 13/10/2026.