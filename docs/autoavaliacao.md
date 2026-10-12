# Minha Rotina: autoavaliação da Etapa 1

Status: configuração, banco e participantes implementados; etapa completa ainda pendente.

Não há nota estimada. Há testes automatizados de participantes e banco; as operações de metas e registros ainda não foram implementadas.

| Critério | Situação atual | Evidência a apresentar |
|---|---|---|
| P1: Sobe pelo README | Verificado em pasta limpa | Em 12/10/2026: instalação pelo lockfile, migrations, build e HTTP do servidor compilado, usando PostgreSQL do Compose |
| P2: Camadas | Parcial: participantes implementados | Pastas e classes de todas as entidades |
| P3: Banco e entidades | Parcial: migrations das três tabelas; somente modelo de participantes | Schemas Drizzle, modelos, migrations e chaves estrangeiras |
| P4: DTOs | Parcial: participantes implementados | Entrada validada por Zod e saída separada do modelo |
| P5: Estrutura documentada | Parcial: participantes completos | Classes completas, dependências por construtor, cabeçalhos e mapa no README |
| P6: API simples | Implementado e testado | `test/integrations/participants.integration.spec.ts`: POST e GETs, `400`, `404`, paginação e cadastros simultâneos |
| P7: Regras implementadas | Pendente | R2, R3 e R5 nos casos de uso e requisições que as violam; R1/R4 demonstradas |
| P8: Regras atendem ao tema | Problema e regras documentados | Mostrar como preservam o acompanhamento diário e histórico dos hábitos |
| P9: Código igual ao desenho | Parcial: participantes e schemas correspondem ao desenho | Contratos de participantes cobertos nos testes; metas e registros ainda sem API |
| P10: README completo | Atualizado para o escopo implementado | Comandos reais, mapa de participantes e pendências documentados |

Após verificar a implementação, substituir a situação por atende, parcial ou não atende e acrescentar evidências reais. Referência: [critérios da disciplina](./enunciado/AVALIACAO.md).

Verificação em 12/10/2026: typecheck, Biome/Ultracite, build, exportação OpenAPI e 39 testes passaram. A instalação e execução também foram verificadas em pasta temporária sem dependências ou build pré-existentes.
