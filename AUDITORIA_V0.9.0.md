# Auditoria técnica — Estudo Flex Languages 0.9.0

Data da revisão: 2026-07-21.

## Escopo

A revisão cobriu os arquivos alterados e os impactos sobre estado, roteamento, armazenamento, componentes, estilos, PWA, serviços e backend.

## Verificações automatizadas concluídas

- `npm run audit`: aprovado;
- `npm test`: 60 testes aprovados, 0 falhas;
- `npm run backend:check`: sintaxe aprovada;
- 132 arquivos JavaScript analisados;
- imports relativos existentes;
- JSON válido;
- blocos CSS balanceados;
- assets e imports CSS existentes;
- rotas coerentes com o `index.html`;
- Web Components usados e registrados;
- ausência de IDs duplicados no conjunto ativo;
- versões coerentes entre frontend, backend, manifesto, cache e diagnóstico;
- ausência de referência a `typhography`;
- identidade brasileira preservada no Welcome;
- ausência de nome pessoal fixo nos componentes ativos.

## Casos funcionais cobertos por testes

- novo idioma sem jornada presumida;
- dados e progresso independentes por idioma;
- edição de finalidade sem perda do diagnóstico;
- diagnóstico com 12 evidências e classificação conservadora;
- cumprimento isolado permanecendo em Explorando;
- impossibilidade de liberar Vivendo por um teste único;
- alternativas sem regra de “a mais longa é correta”;
- onboarding sem texto livre, com confirmação;
- tutorial e opção de descoberta posterior;
- pausa do onboarding e retorno pela Home;
- tela final usando tempo, frequência, finalidade e interesses reais;
- Perfil Vivo usando a mesma fonte de finalidade do idioma;
- exclusão e bloqueio de memória da IA;
- revisão rápida por idioma;
- Professional Lab independente por idioma;
- XP idempotente e concedido por atividade;
- Communication Lab separado do Mentor;
- atividades do Mentor, incluindo imagem;
- avatar ilustrado validado;
- conquistas dinâmicas e consistentes;
- compartilhamento baseado exclusivamente nos dados do card;
- inicialização tolerante a falha de componente opcional;
- presença dos arquivos anteriormente ausentes no GitHub Pages.

## Revisão de layout por código

A folha `css/v090.css` é carregada por último e impõe:

- shell central de até 540 px;
- ausência de overflow horizontal no documento;
- rolagem vertical interna no onboarding;
- opções e diagnóstico em uma coluna;
- Home, Professional Lab, Perfil, avatar e Passaporte container-safe;
- contraste explícito para módulo profissional selecionado;
- estatísticas de conquista em grade responsiva;
- quebra normal de palavras, sem separação vertical forçada.

## Backend

A sintaxe de `backend/src/server.js` e `backend/src/gemini-client.js` foi validada. O endpoint de descrição de imagem do Mentor usa upload com MIME permitido, contexto limitado e resposta JSON estruturada.

A instalação limpa das dependências não pôde ser concluída no ambiente da auditoria porque o registro interno de pacotes respondeu HTTP 503. Por isso, não foi afirmado teste de execução do servidor nesta revisão; o `package-lock.json` foi preservado e a sintaxe foi verificada.

## Homologações externas ainda necessárias

- microfone físico em Android, iOS e computador;
- reconhecimento de voz disponível em cada navegador;
- endpoint Gemini com credenciais e modelos realmente habilitados;
- geração e validação de avatar e conquista em produção;
- CORS com a origem final do GitHub Pages ou APK;
- Service Worker após publicação HTTPS;
- inspeção visual final nos navegadores de destino.

O navegador headless do ambiente bloqueou endereços locais por política administrativa, portanto não foi usado como evidência de homologação visual. A entrega não afirma teste visual automatizado que não ocorreu.
