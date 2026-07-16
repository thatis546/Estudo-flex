# Componentes de rascunho e legado

O aplicativo registra somente os componentes importados por `components/register.js`.

Os arquivos não importados nesse registro são protótipos, ideias antigas ou componentes ainda sem rota. Eles não devem ser considerados parte funcional da versão 0.6.1 até serem revisados e conectados ao estado atual.

Antes de ativar qualquer rascunho:

1. substitua dados fixos por dados do `state`;
2. use os serviços oficiais em `services/`;
3. confirme que não há uma implementação equivalente já registrada;
4. acrescente tratamento de erro, acessibilidade e testes;
5. importe o componente em `components/register.js` somente depois da revisão.

Entre os rascunhos estão componentes antigos de gramática, configurações, mentor, gravação e elementos de layout que não participam das rotas atuais.
