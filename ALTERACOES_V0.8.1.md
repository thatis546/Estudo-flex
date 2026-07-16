# Estudo Flex Languages — correção 0.8.1

Esta versão corrige a falha de inicialização observada após a publicação da 0.8.0 no GitHub Pages.

## Causa tratada

A 0.8.0 carregava todos os Web Components por uma única cadeia de imports estáticos. Um único arquivo ausente, desatualizado ou servido por um Service Worker antigo fazia o import inteiro falhar. O resultado era uma tela vazia com a mensagem genérica de que não foi possível iniciar o aplicativo.

## Correções

- `core/bootstrap.js` limpa caches incompatíveis antes de carregar o restante do frontend.
- `index.html` usa arquivos versionados para impedir mistura entre versões.
- `components/register.js` carrega cada componente de forma isolada e registra exatamente qual arquivo falhou.
- `core/app.js` mantém o aplicativo disponível quando um módulo não essencial falha e exibe uma mensagem específica.
- `sw.js` usa estratégia network-first para JavaScript, CSS e JSON.
- O registro do Service Worker usa `updateViaCache: "none"`.
- Foi criada uma tela de recuperação que remove caches e registros antigos antes de recarregar.
- A migração de conquistas e XP aceita registros antigos ou malformados sem impedir a inicialização.

## Publicação correta

Envie o conteúdo completo da pasta `estudo-flex-languages-main-v0.8.1` para a raiz do repositório publicado. Não envie apenas a pasta externa do ZIP e não misture arquivos 0.8.0 e 0.8.1.
