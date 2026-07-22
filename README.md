# Estudo Flex Languages — versão 0.9.0

Aplicação web progressiva para aprendizagem personalizada de idiomas, com perfis independentes por língua, Mentor, Communication Lab, trilhas profissionais, revisão, Perfil Vivo e Passaporte.

## Principais recursos desta versão

- conversa inicial com tutorial, respostas exclusivamente por opções e confirmação antes do envio;
- rolagem interna do onboarding compatível com mouse, touchpad e toque;
- opção **Continuar depois pela Home**, preservando a etapa atual;
- objetivo e contexto de uso reunidos em uma única escolha, sem perguntas redundantes;
- opção de deixar o Perfil Vivo descobrir estilo de aprendizagem e interesses ao longo do uso;
- diagnóstico inicial com 12 evidências por idioma, alternativas plausíveis e classificação nas jornadas próprias do Estudo Flex;
- jornadas **Explorando, Descobrindo, Construindo, Conectando e Vivendo o idioma**;
- perfis pedagógicos, objetivos, diagnóstico, revisão, Communication Lab e Professional Lab independentes para cada idioma;
- conclusão do onboarding conectada ao tempo, frequência, finalidade e interesses realmente informados;
- Home com revisão, conteúdo, Communication Lab, Mentor e Professional Lab separados;
- Mentor textual com atividades orientadas, incluindo descrição de imagem;
- Communication Lab com oito módulos técnicos de fala, gravação e transcrição;
- Professional Lab com trilhas, módulos, respostas e progresso preservados por idioma;
- Perfil Vivo editável, exclusão de interesses, exclusão ou bloqueio de memórias da IA e exclusão integral do perfil local;
- XP apenas por atividades reais, com prevenção de duplicidade;
- Passaporte com conquistas dinâmicas, consistentes, sem dados fixos e compartilháveis;
- avatar ilustrado gerado ou enviado, com validação de um único personagem e rejeição de fotografia real;
- layout responsivo container-safe, mantendo uma experiência semelhante à do celular em telas grandes;
- PWA, Service Worker, diagnóstico de publicação, auditor estrutural e testes automatizados;
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
npm ci
cp .env.example .env
# Preencha GEMINI_API_KEY e os modelos disponíveis na conta.
npm start
```

Para apontar o frontend para o backend, defina `window.ESTUDO_FLEX_API_URL` antes do bootstrap ou altere `apiBase` em `core/config.js`.

## Publicação no GitHub Pages

Use o pacote identificado como **github-raiz** e envie o conteúdo diretamente para a raiz do repositório. Depois acesse:

```text
https://SEU-USUARIO.github.io/SEU-REPOSITORIO/diagnostico-publicacao.html
```

Consulte `DEPLOY_GITHUB_V0.9.0.md` para o procedimento completo.

## Limites desta versão

- os dados pedagógicos ainda permanecem principalmente no navegador (`localStorage`);
- autenticação, JWT, PostgreSQL e Prisma pertencem à próxima etapa;
- transcrição avançada, análise multimodal e geração de imagem exigem backend publicado e credenciais válidas;
- a transcrição ao vivo depende do reconhecimento de voz disponível no navegador;
- o Communication Lab apresenta métricas técnicas disponíveis, mas não oferece diagnóstico clínico ou fonoaudiológico;
- a geração de imagem e a detecção de conquistas dependem de validação do backend e não concedem XP automaticamente;
- chamadas reais ao Gemini e testes com microfone físico precisam ser homologados no ambiente de publicação.

Consulte `ALTERACOES_V0.9.0.md` e `AUDITORIA_V0.9.0.md` para o detalhamento da entrega.
