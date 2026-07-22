# Auditoria técnica — Estudo Flex Languages v0.9.1

## Escopo

Auditoria direcionada ao onboarding em celular, persistência dos dados pedagógicos e integridade da revisão espaçada.

## Regras verificadas

- Nenhuma revisão é criada sem atividade concluída.
- Todo item revisável possui `sourceActivityId`, `sourceActivityTitle` e `introducedAt`.
- Itens antigos sem proveniência são removidos na migração do estado.
- Um item só aparece na revisão quando `nextReviewAt` venceu.
- O contato anterior altera dificuldade, quantidade de conteúdo e intervalo inicial.
- Completar a mesma atividade novamente não duplica histórico, fila ou XP.
- Tempo diário, frequência e interesses chegam ao perfil específico do idioma.
- Conclusão do onboarding, Home e Perfil Vivo consultam o mesmo perfil efetivo.
- Selecionar interesses no celular não recria a página inteira.
- O passo de metas possui rolagem e ações alcançáveis em viewport móvel.

## Validação automatizada

- auditoria estrutural de JavaScript, imports, rotas, Web Components, CSS, assets, manifesto e PWA;
- testes de estado e migração;
- testes do onboarding e sincronização por idioma;
- testes da primeira atividade;
- testes de revisão bloqueada, programada e disponível;
- testes de intervalo por contato anterior;
- checagem de sintaxe do backend.

## Homologação de interface

Foi executado um fluxo em navegador Chromium com viewport móvel para verificar:

- entrada no onboarding;
- seleção e confirmação das respostas;
- acesso e conclusão do passo de prazo, frequência e interesses;
- alcance do botão de avanço sem modo desktop;
- ausência de rolagem horizontal indevida;
- bloqueio da revisão antes da primeira atividade;
- criação de itens de revisão somente depois da atividade.

Resultado da homologação móvel em Chromium (390 × 844 px):

- largura do `body`: 390 px;
- largura rolável do conteúdo: 390 px, sem overflow horizontal;
- altura útil do `main`: 844 px;
- altura rolável do passo 2: 2040 px;
- botão “Avançar para o diagnóstico” visível e clicável em `y=567,5`, sem modo desktop;
- tempo diário persistido: 15 minutos;
- frequência persistida: 3 vezes por semana;
- interesse persistido: Engenharia;
- Home bloqueou corretamente a revisão sem atividade;
- Perfil Vivo exibiu os três dados;
- atividade de reconhecimento guiado criou 4 itens com proveniência;
- XP após a atividade: 10;
- revisão permaneceu programada para o dia seguinte, sem aparecer imediatamente;
- nenhum erro JavaScript ou erro de console durante o fluxo homologado.

Como a infraestrutura do ambiente bloqueia navegação direta para servidores locais, a página foi carregada por interceptação local de recursos no Playwright. O DOM, CSS, módulos, rotas e interações executados são os arquivos reais da versão 0.9.1.

## Integrações não abrangidas

- transcrição externa e Gemini com credenciais reais;
- microfone físico em diferentes fabricantes de celular;
- sincronização em PostgreSQL;
- autenticação e persistência em nuvem.
