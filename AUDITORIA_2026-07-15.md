# Auditoria técnica — Estudo Flex Languages v0.6.1

Data da revisão: 15/07/2026

Esta versão foi auditada e corrigida sobre o projeto enviado. A revisão não se limitou aos erros visuais: foram verificados estado, armazenamento, navegação, onboarding, idiomas, gravação de áudio, catálogo de conquistas, PWA, integração da API e testes automatizados.

## Correções aplicadas

- Corrigido o arquivo `typhography.css` para `typography.css`, com referências consolidadas em `css/main.css`.
- Normalização e migração segura do estado local, incluindo perfis antigos.
- Separação do nível, resultado e respostas do diagnóstico por idioma.
- Correção do fluxo Welcome → Onboarding → Goals → Level Test → Finish → Home.
- Retomada do onboarding na etapa incompleta, sem mandar o usuário indevidamente para a Home.
- Remoção do idioma provisório ao voltar e trocar a escolha inicial.
- Correção do roteador, histórico do navegador, hashes malformados, foco acessível, rotas inválidas e bloqueio de páginas antes do onboarding.
- Correção da serialização de objetos JSON em `core/api.js`, preservando `FormData` e dados binários.
- Correção da escala de humor/rigidez do mentor e do código do idioma usado pela IA.
- Correção da seleção e persistência de trilhas profissionais.
- Remoção de dados pessoais e conteúdos fixos nos componentes ativos de Perfil, Passaporte, Home e Idiomas.
- Gravação real com `MediaRecorder`, validação do áudio e liberação garantida do microfone.
- Cancelamento da solicitação ou gravação de áudio ao sair da página Speaking.
- Correção dos eventos e regras de conquistas do onboarding, idiomas, conversação e trilhas.
- Correção do manifesto, ícones, registro do Service Worker e política de cache.
- Service Worker impedido de armazenar chamadas de API ou entregar HTML no lugar de JS/CSS.
- Adição de tratamento para indisponibilidade, corrupção, quota excedida ou bloqueio do `localStorage`, mantendo a interface sincronizada em memória.
- Adição de navegação acessível, estados ARIA e link para pular ao conteúdo.
- Testes reais de estado, API, IA e catálogos, substituindo os testes demonstrativos.
- Auditor automatizado para sintaxe, imports, manifesto, recursos PWA e definições duplicadas de Web Components.

## Validações executadas

- Todos os arquivos JavaScript passaram na validação de sintaxe.
- Imports relativos e referências locais foram verificados.
- Manifesto e recursos do Service Worker foram verificados.
- O fluxo completo de onboarding foi testado em navegador.
- Navegação, botão Voltar, rotas protegidas e rotas inválidas foram testados.
- Troca de idiomas e diagnósticos independentes foram testados.
- Gravação simulada e cancelamento de permissão pendente do microfone foram testados.
- Layout móvel em 360 px e fallback sem `localStorage` foram testados.
- Dez testes automatizados passaram.

## Limites que dependem de backend ou serviços externos

A versão contém a base de frontend para áudio e IA, mas ainda não implementa por completo:

- transcrição Speech-to-Text;
- análise fonética e de pronúncia;
- resposta do Gemini em produção;
- síntese Text-to-Speech da resposta automática;
- autenticação segura com JWT e refresh token;
- persistência PostgreSQL/Prisma;
- sincronização entre dispositivos.

Esses itens exigem backend publicado, credenciais protegidas e definição dos provedores. A interface não apresenta essas integrações como concluídas.

## Componentes de rascunho

Alguns arquivos antigos permanecem no repositório como rascunhos, mas não são registrados no aplicativo nem incluídos no cache essencial da PWA. Consulte `components/RASCUNHOS.md` antes de reutilizá-los.


## Revisão complementar v0.6.1

A revisão complementar corrigiu problemas que não eram detectados pela auditoria anterior:

- conflito entre o link de acessibilidade e o roteamento por hash;
- IDs duplicados entre as telas de objetivos e diagnóstico;
- campos de resposta sem nome acessível;
- avaliação de três questões atribuindo incorretamente níveis C1/B2;
- omissão da lição principal na Home;
- exibição de códigos internos em inglês no Perfil;
- `getCurrentModules()` procurando uma propriedade inexistente no catálogo profissional;
- texto da área de fala sugerindo análise fonética ativa antes da integração;
- compatibilidade desnecessariamente reduzida pelo uso de `replaceAll`, `Array.at` e atribuição nula em partes ativas;
- auditoria de imports que não verificava `import()` dinâmico;
- auditoria que não detectava IDs duplicados nos módulos ativos.

A validação automatizada passou com 15 testes. O fluxo completo de onboarding e todas as rotas ativas também foram executados em navegador headless, sem erros de JavaScript, componentes indefinidos, IDs duplicados ou controles sem nome acessível.
