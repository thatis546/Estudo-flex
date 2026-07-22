# Changelog

## 0.9.0 — 2026-07-21

- Refeito o onboarding com tutorial, opções verticais, confirmação antes do envio e rolagem interna.
- Removidas respostas livres e perguntas redundantes da conversa inicial.
- Corrigida a pausa do onboarding para abrir e retomar pela Home.
- Revisado o diagnóstico de 12 evidências, sem cartões de confiança e sem CEFR na interface.
- Conectados finalidade, tempo, frequência e interesses entre onboarding, conclusão, Home e Perfil Vivo.
- Adicionadas atividades do Mentor, incluindo descrição de imagem.
- Mantido o Communication Lab separado da conversa com o Mentor.
- Corrigidos layouts de computador, Professional Lab, Passaporte, Perfil e editor de avatar.
- Adicionado endpoint multimodal de imagem do Mentor.
- Atualizados PWA, versionamento, diagnóstico de publicação e documentação.
- Ampliada a suíte para 60 testes automatizados.

## 0.8.1 — 2026-07-16

- Corrigida a inicialização no GitHub Pages após atualizações parciais ou cache antigo.
- Criado bootstrap versionado que limpa caches incompatíveis antes de carregar o aplicativo.
- Carregamento dos Web Components passou a ser isolado por arquivo; um módulo ausente não derruba toda a aplicação.
- Service Worker passou a usar rede primeiro para JavaScript, CSS e JSON.
- Adicionada tela de recuperação com limpeza de cache e Service Worker.
- Migração de conquistas e XP antigos ficou tolerante a registros malformados.
- Mensagens de erro agora indicam publicação incompleta ou mistura de versões.

## 0.8.0 — 2026-07-16

- Substituído o diagnóstico curto por 12 evidências independentes em cada idioma.
- Adotadas as jornadas Explorando, Descobrindo, Construindo, Conectando e Vivendo o idioma.
- Preservado o diagnóstico ao editar objetivo, contexto, rotina ou interesses.
- Ampliado o Perfil Vivo com resumo de todos os idiomas e controles de privacidade.
- Criadas exclusão simples e exclusão com bloqueio de reaprendizado para memórias da IA.
- Separada a conversa textual com Mentor do Communication Lab.
- Transformada a oratória em laboratório técnico com oito módulos, áudio, transcrição e relatórios.
- Tornado o Professional Lab utilizável, com progresso preservado por idioma e trilha.
- Corrigido XP para atividades reais e idempotentes; adicionadas sequência e duração de estudo.
- Implementados avatar ilustrado validado, conquistas consistentes e compartilhamento dinâmico.
- Alterado o Welcome para destacar o Brasil circulando o globo.
- Adicionado backend Node.js para texto, áudio, avatar e ilustrações, com validação estruturada.
- Reforçadas segurança, compatibilidade, PWA, auditoria e suíte de testes.

## 0.7.0 — 2026-07-15

- Criado onboarding e diagnóstico independentes para cada idioma.
- Removida a atribuição automática de A1 ao selecionar uma nova língua.
- Tornado o diagnóstico introdutório conservador entre A0 e A2.
- Criada revisão real de vocabulário com cartões e avaliação de lembrança.
- Reorganizados Perfil Vivo e Home com dados específicos do idioma atual.
- Adicionada página de estudo para a trilha profissional.
- Preparada transcrição pelo navegador, fallback STT no backend e resposta automática da IA.
- Removido XP por onboarding, configuração de idioma e seleção profissional.
- Adicionada migração para corrigir XP concedido por versões anteriores.
- Acrescentados testes de perfil por idioma, diagnóstico e recompensas.

## 0.6.1 — 2026-07-15

- Corrigido conflito do link “Pular para o conteúdo” com o roteador por hash.
- Removidos IDs duplicados e adicionados nomes acessíveis aos campos de resposta.
- Corrigida a avaliação curta para não atribuir B2/C1/C2 com três questões introdutórias.
- Adicionada a atividade principal que estava ausente na Home.
- Traduzidos os valores internos exibidos no Perfil.
- Corrigida a leitura das subáreas da trilha profissional.
- Ajustado o texto do Speaking para não afirmar que a análise fonética já está ativa.
- Reforçada a compatibilidade e a auditoria de imports dinâmicos, CSS e IDs.
- Ampliada a suíte de 10 para 15 testes.

## 0.6.0

- Estabilização inicial do estado, onboarding, passaporte, áudio local, PWA e trilhas profissionais.
