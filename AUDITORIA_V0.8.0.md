# Auditoria técnica — Estudo Flex Languages 0.8.0

**Data:** 16 de julho de 2026  
**Base comparada:** versão 0.7.0  
**Objetivo:** revisar os arquivos afetados, corrigir integrações cruzadas e validar a entrega antes do empacotamento.

## Validações automatizadas

Comando executado:

```bash
npm run check
```

Resultado final:

- 128 arquivos JavaScript/MJS auditados;
- sintaxe válida;
- imports relativos existentes;
- rotas do roteador compatíveis com as páginas do HTML;
- Web Components ativos registrados;
- IDs estáticos sem duplicidade detectada;
- CSS com blocos balanceados e assets locais existentes;
- imports do `main.css` válidos;
- manifesto, Service Worker e recursos da PWA válidos;
- versões 0.8.0 consistentes entre frontend, manifesto, cache e backend;
- `typhography.css` e referências antigas ausentes;
- nenhuma referência ativa à bandeira dos Estados Unidos no Welcome;
- nenhuma ocorrência fixa do nome “Thamiris” no código do produto;
- operadores de atribuição lógica removidos do código destinado ao navegador;
- sintaxe do backend aprovada;
- 43 testes automatizados aprovados, sem falhas.

## Testes cobertos

- migração de XP antigo;
- XP sem duplicidade;
- sequência e tempo de estudo;
- separação de dados e diagnóstico entre idiomas;
- preservação do diagnóstico ao editar configuração;
- 12 evidências por idioma;
- classificação conservadora nas jornadas próprias;
- interesses removíveis;
- memória removível, bloqueável, desativável e reaprendível quando autorizado;
- oito módulos do Communication Lab;
- análise de repetição, muletas, ritmo e limitações fonéticas honestas;
- trilhas profissionais separadas e conclusão idempotente;
- revisão rápida por idioma;
- avatar ilustrado válido e rejeição sem substituição do anterior;
- consistência de conquista, idioma, nome e avatar;
- geração do arquivo compartilhável sem dados fixos;
- estado, armazenamento e API do frontend.

## Teste do servidor local

As dependências do backend foram instaladas sem vulnerabilidades relatadas pelo `npm audit` no momento da execução. O servidor foi iniciado com variáveis de ambiente de teste e respondeu:

```json
{"ok":true,"service":"estudo-flex-languages","version":"0.8.0"}
```

Esse teste confirma inicialização, middleware e rota de saúde. Não chama o provedor de IA.

## Revisão de impacto entre arquivos

A auditoria verificou especificamente:

- estado e migrações após introdução de perfis por idioma;
- compatibilidade de Home, Perfil, Passaporte, Mentor, revisão, Communication Lab e Professional Lab;
- persistência e emissão de eventos após alterações;
- prevenção de duplicidade de XP e módulos;
- cancelamento e liberação do microfone ao trocar de rota;
- consistência entre catálogo de idiomas, jornadas, diagnósticos e cards;
- geração de imagem sem texto embutido;
- fallback de compartilhamento;
- segurança básica do gateway de IA;
- invalidação do cache por mudança de versão.

## Limitações do ambiente de teste

Não foi possível executar uma validação visual automatizada completa em Chromium porque o ambiente bloqueou o acesso do navegador ao servidor local. Também não havia microfone físico nem credenciais Gemini de produção.

Por isso, permanecem testes de homologação obrigatórios após publicação:

1. fluxo visual completo em celular Android e desktop;
2. permissão, gravação e liberação do microfone em HTTPS;
3. reconhecimento de voz disponível no navegador;
4. fallback de transcrição pelo backend;
5. resposta do Mentor com modelos reais;
6. geração/validação de avatar;
7. geração/validação da ilustração de conquista;
8. compartilhamento nativo em Android/iOS;
9. instalação e atualização da PWA no GitHub Pages.

Nenhuma dessas limitações foi apresentada no frontend como funcionalidade garantida sem backend.
