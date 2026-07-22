# Alterações — Estudo Flex Languages 0.9.0

## 1. Onboarding

- Criado tutorial inicial com explicação do fluxo e opção de pular.
- A conversa inicial aceita somente opções pré-definidas.
- Uma opção selecionada só é enviada depois de confirmação explícita.
- As alternativas são exibidas verticalmente, sem necessidade de rolagem horizontal.
- A área interna da conversa possui rolagem própria para mouse, touchpad e toque.
- O botão **Continuar depois pela Home** salva a etapa e abre a Home.
- A retomada usa a etapa armazenada; não retorna indevidamente à tela do nome.
- Objetivo e contexto de uso foram reunidos em uma única escolha coerente.
- Estilo de aprendizagem oferece a opção **Ainda não sei; descobrir depois**.
- A etapa seguinte pergunta somente prazo, frequência e assuntos, evitando duplicidade.
- Interesses podem ser personalizados ou deixados para descoberta gradual.

## 2. Diagnóstico e jornadas

- Mantidas 12 evidências por idioma.
- Revisadas alternativas de múltipla escolha para reduzir pistas por tamanho ou redação.
- Distribuídas as posições das respostas corretas.
- Incluídas três produções próprias com dificuldade progressiva.
- Produções muito curtas, repetidas ou escritas apenas em português recebem avaliação conservadora.
- Removidos os cartões de confiança inicial e quantidade de evidências respondidas.
- O resultado usa somente as jornadas do Estudo Flex: Explorando, Descobrindo, Construindo, Conectando e Vivendo o idioma.
- **Vivendo o idioma** depende de evidências reais ao longo do tempo e não é liberado por um único diagnóstico.

## 3. Idiomas independentes

Cada idioma mantém separadamente:

- finalidade;
- contexto de uso;
- contato anterior;
- tempo, frequência e prazo;
- interesses;
- jornada e diagnóstico;
- plano diário;
- fila de revisão;
- Communication Lab;
- Professional Lab;
- progresso e XP.

Editar finalidade, rotina ou interesses não apaga um diagnóstico concluído. A migração do primeiro idioma preserva dados já existentes.

## 4. Conclusão do onboarding e Home

- A tela final usa o idioma, jornada, finalidade, tempo, frequência e interesses realmente salvos.
- Removidos valores genéricos como “Temas variados” e “A definir” quando já existem respostas.
- A primeira sessão separa revisão, conteúdo e Communication Lab.
- A Home diferencia idioma geral, Mentor, Communication Lab e Professional Lab.
- Quando o onboarding está pausado, a Home mostra progresso salvo e ação de retomada, sem inventar um plano incompleto.

## 5. Perfil Vivo e privacidade

- Objetivo e contexto são derivados da mesma fonte usada pelo idioma.
- Preferências usam rótulos normalizados em português.
- Mantidos controles para excluir interesses, excluir memórias, bloquear reaprendizado, desativar memória e excluir o perfil.
- O editor de avatar e os resumos foram convertidos para layout de uma coluna em telas estreitas.

## 6. Mentor

- Criadas opções de atividade: explicar, corrigir, ampliar vocabulário, criar exercício, simular cenário e descrever imagem.
- A descrição de imagem possui upload, pré-visualização e endpoint multimodal próprio.
- O Mentor permanece separado do Communication Lab.

## 7. Communication Lab

- Mantidos os oito módulos técnicos: pronúncia, projeção, clareza, ritmo, muletas, repetição, entonação e oratória profissional.
- A gravação continua produzindo áudio e tentativa de transcrição.
- O módulo não se apresenta como conversa automática com a IA.

## 8. Professional Lab

- Layout transformado em uma coluna dentro do shell do aplicativo.
- Estado selecionado possui contraste legível.
- Módulos, conteúdo e ações não ficam mais cortados lateralmente.
- Progresso permanece separado por idioma e trilha.

## 9. Passaporte, avatar e conquistas

- Cards permanecem totalmente dinâmicos e sem nome, idioma, data ou XP fixos.
- A imagem contém apenas a cena ilustrada; textos são montados pelo frontend.
- Idioma, ação, descrição, avatar e ilustração passam por validação de consistência.
- O nome do estudante substitui o código fictício do passaporte.
- Compartilhamento gera arquivo a partir do card atual.
- Layout foi ajustado para impedir corte de imagem, título, estatísticas e botão.

## 10. Layout e compatibilidade

- Criada a folha `css/v090.css`, importada por último.
- O aplicativo usa um shell central de até 540 px também em computadores.
- Componentes internos recebem `min-width: 0` e largura máxima de 100%.
- Removidos layouts laterais que excediam a largura do shell.
- Corrigidas quebras verticais de palavras no editor de avatar e no Perfil Vivo.
- Welcome mantém o Brasil circulando o globo.

## 11. Backend

- Adicionado `POST /api/mentor/image-description`.
- Corrigido o fluxo de tratamento de erro do servidor.
- Versão do endpoint de saúde atualizada para 0.9.0.
- Mantidos limites de upload, MIME, CORS, Helmet, rate limiting e respostas estruturadas.

## 12. Validação

- Auditoria de 132 arquivos JavaScript.
- 60 testes automatizados aprovados.
- Sintaxe do backend aprovada.
- Imports, rotas, Web Components, CSS, assets, manifesto, Service Worker e versões validados.
