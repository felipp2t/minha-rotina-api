# Minha Rotina — acompanhamento de hábitos saudáveis

Sistema para acompanhar metas pessoais de hábitos saudáveis e manter o histórico das práticas realizadas. O projeto pertence ao tema Saúde e Bem-Estar.

## Linguagem

**Participante**: pessoa cadastrada com nome e e-mail que mantém suas próprias metas de hábitos saudáveis.
_Evitar_: paciente.

**Meta de hábito**: compromisso pessoal, com nome escolhido pelo participante, de atingir uma quantidade alvo diária de uma atividade saudável.

**Quantidade alvo diária**: quantidade que deve ser atingida em um dia, expressa na unidade de medida da meta.

**Data de início**: primeiro dia para o qual a meta permite registrar práticas, podendo ser anterior, igual ou posterior ao dia do cadastro.

**Registro de prática**: ocorrência de uma atividade realizada para uma meta, com data e quantidade medida.
_Evitar_: status da meta, conclusão da meta.

**Unidade de medida**: referência escolhida para expressar as quantidades de uma meta e de seus registros, limitada a mililitros (ml), minutos ou repetições.

**Progresso diário**: soma das quantidades registradas para uma meta em uma determinada data.

**Dia cumprido**: dia em que o progresso diário atingiu ou ultrapassou a quantidade alvo da meta.

**Meta encerrada**: meta cuja rotina deixou de ser acompanhada, preservando seus registros históricos.

## Relacionamentos

- Um **Participante** possui zero ou mais **Metas de hábito**.
- Cada **Meta de hábito** pertence a exatamente um **Participante**.
- Uma **Meta de hábito** possui zero ou mais **Registros de prática**.
- Cada **Registro de prática** pertence a exatamente uma **Meta de hábito**.
- Cada **Registro de prática** usa a unidade de medida da sua **Meta de hábito**.
- O participante escolhe livremente o nome da meta; não há um catálogo obrigatório de hábitos.
- Uma **Meta de hábito** aceita vários **Registros de prática** na mesma data.
- O **Progresso diário** soma os registros da mesma meta na mesma data.
- O **Dia cumprido** é calculado a partir do progresso diário e da quantidade alvo.

## Regras acordadas

- Cada participante possui um e-mail único, comparado após remover espaços nas extremidades e converter para minúsculas.
- O alvo diário e a unidade de medida ficam fixos desde a criação da meta.
- Para mudar o alvo ou a unidade, o participante encerra a meta atual e cria outra.
- Encerrar uma meta preserva seus registros e o significado do progresso dos dias anteriores.
- Repetir o encerramento de uma meta já encerrada mantém o instante do primeiro encerramento e retorna a meta sem erro.
- Uma meta ativa aceita registros com data entre seu início e o dia atual, inclusive.
- Uma meta pode ser cadastrada com início futuro; antes dessa data, não há data válida para registrar práticas nela.
- Datas futuras e datas anteriores ao início da meta não são aceitas.
- Uma meta encerrada pode ser consultada, mas não aceita novos registros, inclusive de práticas anteriores ao encerramento.
- O alvo diário é um objetivo, não um limite: registros podem fazer o total ultrapassá-lo, e o progresso preserva a quantidade real realizada.
- O alvo diário e a quantidade de cada registro são números inteiros positivos nas unidades permitidas.
- O dia atual e os limites diários seguem o calendário de `America/Sao_Paulo` para todos os participantes.
- A consulta de progresso aceita datas entre o início da meta e hoje, inclusive para metas encerradas; um dia válido sem registros possui total zero e não está cumprido.
- Consultas de progresso anteriores ao início ou futuras são recusadas. Uma meta com início futuro ainda não possui data válida para essa consulta.
- Um participante não pode ter duas metas não encerradas com o mesmo nome e unidade, incluindo metas com início futuro.
- A comparação de nomes ignora maiúsculas e minúsculas e espaços nas extremidades; unidades diferentes distinguem as metas.
- Encerrar a meta anterior permite criar outra com o mesmo nome e unidade.

## Exemplo de diálogo

> **Equipe:** Uma caminhada registrada conclui a meta?
> **Participante:** Não. Duas caminhadas de 15 minutos somam 30 minutos no dia e cumprem uma meta diária de 30 minutos; a meta continua nos dias seguintes.

## Ambiguidades resolvidas

- Registro de prática não é um status da meta: representa cada ocorrência e preserva seu histórico.
- Cada registro guarda uma quantidade medida, em vez de apenas confirmar uma prática completa.
- As metas são diárias; vários registros no mesmo dia contribuem para o mesmo progresso.
- O nome do hábito é livre, mas sua unidade deve ser ml, minutos ou repetições.
- Alterar o compromisso significa encerrar a meta antiga e criar outra; não recalcular o histórico com um novo alvo.

O cadastro do participante não representa uma conta autenticada: esta etapa não terá login.
