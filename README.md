# Estudo Flex Languages — versão 0.8.0

Aplicação web progressiva para aprendizagem personalizada de idiomas. Esta versão estabiliza o frontend, separa os perfis pedagógicos por idioma e adiciona a primeira camada full-stack para Mentor, transcrição, avatares e conquistas geradas por IA.

## O que está implementado

- onboarding e diagnóstico próprios para cada idioma;
- jornadas **Explorando, Descobrindo, Construindo, Conectando e Vivendo o idioma**;
- diagnóstico inicial com 12 evidências por idioma e classificação conservadora;
- revisão rápida funcional e repetição espaçada básica;
- Perfil Vivo editável, interesses removíveis, memória da IA controlável e exclusão integral do perfil local;
- Mentor em rota separada;
- Communication Lab separado do Mentor, com oito módulos técnicos, gravação, transcrição e relatórios;
- Professional Lab com trilhas, módulos, respostas e progresso independentes por idioma;
- XP somente por atividades reais, com prevenção de duplicidade, sequência e tempo de estudo;
- Passaporte com conquistas dinâmicas, ilustração validada e compartilhamento;
- avatar ilustrado gerado ou enviado, com validação de um único rosto e rejeição de fotografia real;
- PWA, Service Worker, auditor estrutural e testes automatizados;
- backend Node.js para proteger a chave do Gemini e processar texto, áudio e imagens.

## Executar o frontend

O projeto usa módulos ES e deve ser aberto por um servidor HTTP, não diretamente por `file://`.

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Validar o projeto

Requer Node.js 20 ou superior.

```bash
npm run check
```

O comando verifica sintaxe, imports, rotas, Web Components, CSS, assets, versões, manifesto, PWA, testes e sintaxe do backend.

## Executar o backend

```bash
cd backend
npm install
cp .env.example .env
# Preencha GEMINI_API_KEY e os nomes dos modelos disponíveis na sua conta.
npm start
```

Para apontar o frontend publicado para o backend, defina `window.ESTUDO_FLEX_API_URL` antes de carregar `core/app.js`, ou altere `apiBase` em `core/config.js`.

## Limites desta versão

- os dados pedagógicos ainda permanecem principalmente no navegador (`localStorage`);
- autenticação, JWT, PostgreSQL e Prisma pertencem à próxima etapa;
- transcrição avançada, análise multimodal e geração de imagem exigem o backend publicado e credenciais válidas;
- a transcrição ao vivo depende da implementação de reconhecimento de voz do navegador;
- o Communication Lab analisa métricas objetivas disponíveis, mas não afirma oferecer diagnóstico clínico ou fonético completo.

Consulte `ALTERACOES_V0.8.0.md` e `AUDITORIA_V0.8.0.md` para o detalhamento da entrega.
