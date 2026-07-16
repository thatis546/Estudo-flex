# Backend Estudo Flex Languages 0.8.2

Gateway Node.js separado do GitHub Pages. Ele protege a chave do provedor e processa texto, áudio e imagens sem expor credenciais no navegador.

## Requisitos

- Node.js 20 ou superior;
- chave Gemini válida;
- modelos de texto, multimodal e imagem disponíveis na conta usada no deploy.

## Instalação

```bash
npm install
cp .env.example .env
npm start
```

## Variáveis

- `PORT`: porta HTTP;
- `NODE_ENV`: use `production` no deploy;
- `ALLOWED_ORIGINS`: origens separadas por vírgula;
- `TRUST_PROXY`: `true` quando o provedor usa proxy reverso;
- `GEMINI_API_KEY`: chave somente do backend;
- `GEMINI_TEXT_MODEL`: modelo de texto;
- `GEMINI_MULTIMODAL_MODEL`: modelo capaz de analisar áudio/imagem;
- `GEMINI_IMAGE_MODEL`: modelo capaz de gerar imagens;
- `MAX_REQUESTS_PER_MINUTE`: limite simples por IP.

## Endpoints

### `GET /api/health`

Verifica se o servidor está ativo.

### `POST /api/gemini`

Recebe mensagens e contexto autorizado do Mentor. Retorna resposta textual estruturada, sugestões de memória e possível candidato a conquista. O frontend ainda valida e registra cada resultado.

### `POST /api/speech/transcribe`

`multipart/form-data`:

- `audio`: arquivo de até 10 MB;
- `language`: código do idioma.

Retorna transcrição, idioma detectado e confiança estimada.

### `POST /api/avatar/validate`

`multipart/form-data`:

- `avatar`: PNG, JPEG ou WebP.

Valida um único rosto ilustrado e rejeita fotografia real.

### `POST /api/avatar/generate`

Gera um avatar a partir das características escolhidas e executa uma segunda validação multimodal antes de devolver a imagem.

### `POST /api/achievement/image`

Gera somente a ilustração central de uma conquista. Em seguida, verifica ação, contexto linguístico, avatar, personagens extras, texto e bandeiras contraditórias.

### `POST /api/achievements/detect`

Analisa uma mensagem literal e só sugere conquista quando existe ação concreta já realizada.

## Segurança desta etapa

- chave enviada ao provedor por cabeçalho e nunca pelo frontend;
- Helmet e CORS configurável;
- JSON estrito e limite de corpo;
- upload em memória com limite de tamanho e MIME permitido;
- limite de requisições por IP;
- mensagens de erro internas ocultadas em falhas 5xx.

Para produção completa ainda serão necessários autenticação, autorização por usuário, persistência, logs estruturados, armazenamento seguro de arquivos, fila de processamento e rate limiting distribuído.
