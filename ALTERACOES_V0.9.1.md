# Alterações — Estudo Flex Languages v0.9.1

## Objetivo da correção

A versão 0.9.1 corrige três falhas observadas na homologação em celular:

1. o passo de rotina e interesses do onboarding não podia ser concluído de forma confiável em telas pequenas;
2. tempo diário, frequência e interesses não permaneciam sincronizados entre onboarding, conclusão e Perfil Vivo;
3. a revisão rápida apresentava vocabulário que nunca havia sido estudado.

## Onboarding móvel

- O contêiner principal do aplicativo passa a ocupar a altura dinâmica real da tela (`100dvh`).
- Existe apenas uma área vertical de rolagem principal, evitando disputa entre o documento e o conteúdo interno.
- O diálogo inicial, as opções e a confirmação podem ser percorridos por toque, roda do mouse e touchpad.
- O passo de prazo, frequência e interesses usa uma coluna em celulares.
- `fieldset` recebeu `min-width: 0`, impedindo expansão lateral invisível.
- A barra com Voltar e Avançar permanece acessível no final da tela, respeitando a área segura do aparelho.
- Selecionar um interesse não reconstrói mais toda a página nem reposiciona a rolagem.

## Sincronização do perfil por idioma

- Objetivo, contexto, contato anterior, tempo diário, frequência, interesses, preferência de aprendizagem e apoio passam a ser copiados para o perfil do idioma atual.
- A leitura usa uma função única de perfil efetivo, combinando os dados específicos do idioma com os dados válidos do onboarding apenas quando necessário.
- A conclusão do onboarding e o Perfil Vivo consultam a mesma fonte.
- Valores preenchidos não são substituídos por campos vazios durante a migração de dados.
- Cada novo idioma continua independente e deve receber sua própria configuração.

## Primeira atividade e revisão

- A lista de vocabulário inicial fixa foi removida da revisão.
- Um item só entra na fila de revisão depois de ter sido apresentado em uma atividade concluída.
- Cada item revisável registra a atividade de origem, data de introdução e próxima data de revisão.
- Registros antigos sem origem comprovada são descartados durante a normalização do estado.
- A Home não oferece revisão antes da primeira atividade.
- Ao abrir Revisão sem conteúdo estudado, o aplicativo orienta a iniciar a primeira atividade.
- Foi criada uma rota própria de conteúdo (`lesson`) para a primeira atividade.
- A dificuldade e o intervalo inicial de revisão consideram o contato anterior declarado com o idioma.
- A conclusão da atividade e a criação da fila são idempotentes: recarregar ou tocar novamente não duplica conteúdo ou XP.
- A revisão mostra somente itens vencidos; itens futuros exibem a data prevista.

## Jornada inicial adaptada ao contato

- Nunca estudou: primeiro contato, menor quantidade de itens e apoio maior.
- Reconhece palavras básicas: reconhecimento guiado.
- Entende frases simples: uso contextual.
- Conversa sobre assuntos conhecidos: ativação de vocabulário.
- Usa o idioma com frequência: precisão e variação lexical.

## Arquivos principais

- `core/state.js`
- `services/language-profile.service.js`
- `services/lesson.service.js`
- `services/review.service.js`
- `components/onboarding/ef-onboarding.js`
- `components/onboarding/ef-goals.js`
- `components/onboarding/ef-finish.js`
- `components/home/ef-home-page.js`
- `components/lesson/ef-lesson-page.js`
- `components/review/ef-review-page.js`
- `components/profile/ef-profile-card.js`
- `components/profile/ef-learning-style.js`
- `components/languages/ef-language-card.js`
- `css/v091.css`

## Limite desta versão

A primeira atividade é o mecanismo válido que libera a primeira fila de revisão. A geração contínua de novas lições pelo futuro motor pedagógico e pelo backend de IA permanece uma etapa posterior; nenhum conteúdo não estudado é usado para simular revisão.
