# Publicação no GitHub Pages — versão 0.9.0

## Pacote correto

Use o arquivo `estudo-flex-languages-v0.9.0-github-raiz.zip`.

Ao abrir o ZIP, estes itens devem aparecer diretamente na primeira camada:

```text
index.html
manifest.json
sw.js
version.json
core/
components/
services/
data/
css/
assets/
backend/
```

Não envie uma pasta externa envolvendo o projeto.

## Procedimento recomendado

1. Faça uma cópia do repositório atual.
2. Apague da raiz os arquivos da versão anterior, preservando apenas arquivos externos ao projeto que você reconheça.
3. Extraia o ZIP `github-raiz`.
4. Envie todo o conteúdo extraído para a raiz do repositório.
5. Aguarde o GitHub Pages concluir a publicação.
6. Abra `diagnostico-publicacao.html` no endereço publicado.
7. Confirme que todos os arquivos retornam **OK 200**.
8. Abra o aplicativo em janela privativa.
9. Caso uma versão antiga ainda apareça, use o botão de recuperação da tela de erro ou limpe os dados do site.

## Arquivo de diagnóstico

```text
https://SEU-USUARIO.github.io/SEU-REPOSITORIO/diagnostico-publicacao.html
```

## Backend

A pasta `backend/` não é executada pelo GitHub Pages. Publique-a separadamente em Cloud Run, Render, Railway ou serviço equivalente. Configure a URL da API no frontend e restrinja `ALLOWED_ORIGINS` à origem publicada.

Nunca coloque `GEMINI_API_KEY` no GitHub Pages, no JavaScript do frontend ou dentro de um APK.
