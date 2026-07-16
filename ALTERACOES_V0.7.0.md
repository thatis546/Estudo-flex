# Estudo Flex Languages — alterações da versão 0.7.0

Esta versão foi preparada a partir do projeto v0.6.1 e concentra as correções relatadas durante o uso real do aplicativo.

## 1. Cada idioma agora possui perfil próprio

Um idioma novo não recebe mais nível A1 automaticamente. Antes de liberar revisão e fala, o aplicativo exige:

- finalidade da língua;
- contexto em que será usada;
- contato anterior;
- tempo por sessão;
- frequência semanal;
- prazo;
- interesses;
- diagnóstico específico daquele idioma.

Objetivo, contexto, frequência, nível, resultado do diagnóstico, plano diário, fila de revisão e métricas ficam armazenados separadamente para cada língua.

## 2. Diagnóstico inicial mais conservador

O diagnóstico introdutório só estima A0, A1 ou A2. Saber cumprimentos ou reconhecer uma alternativa básica não leva mais diretamente ao A2.

A2 exige simultaneamente:

- acerto das questões de reconhecimento;
- produção escrita mais desenvolvida;
- evidência de contato anterior com o idioma.

O resultado é apresentado como estimativa inicial, não certificação.

## 3. Revisão de vocabulário funcional

A ação de revisão da Home agora abre uma sessão real de cartões, com:

- palavra ou expressão;
- tradução;
- exemplo;
- opções “Não lembrei”, “Difícil” e “Lembrei”;
- atualização das métricas do idioma;
- pequena recompensa de atividade ao concluir a sessão.

Foi incluído vocabulário inicial para inglês, francês, alemão, italiano e espanhol.

## 4. Perfil reorganizado

O Perfil Vivo agora exibe:

- idioma selecionado;
- nível ou diagnóstico pendente;
- finalidade específica daquela língua;
- contexto de uso;
- XP proveniente de atividades;
- sequência;
- revisões;
- quantidade de idiomas;
- estilo de aprendizagem;
- apoio e correção do mentor;
- meta de estudo;
- interesses.

O HTML foi ajustado para corresponder às classes do CSS e corrigir o avatar e o selo de nível mal posicionados.

## 5. Passaporte

O Passaporte não inventa nível para idiomas incompletos. Esses idiomas aparecem como pendentes até o diagnóstico.

O componente de conquistas já aceita os campos `image` e `imageAlt`, permitindo usar uma ilustração própria para cada conquista. O desenho final dos cards não foi fechado nesta versão porque depende da referência visual que será enviada.

## 6. Speaking com transcrição e resposta preparada

O Speaking agora tenta transcrever a fala em tempo real por meio da API de reconhecimento de voz disponível no navegador.

Fluxo implementado:

1. gravação local com `MediaRecorder`;
2. transcrição do navegador, quando suportada;
3. envio do áudio para `/api/speech/transcribe` quando a transcrição local não estiver disponível;
4. envio da transcrição para `/api/gemini`;
5. exibição da resposta;
6. leitura da resposta por síntese de voz do navegador.

A gravação continua disponível para reprodução local. O serviço de reconhecimento também possui encerramento por timeout, evitando que a tela fique presa esperando o navegador finalizar a transcrição.

### Contratos esperados do backend

`POST /api/speech/transcribe` — `multipart/form-data`

- `audio`: arquivo de áudio;
- `language`: código do idioma.

Resposta:

```json
{
  "transcript": "texto reconhecido"
}
```

`POST /api/gemini` — JSON

Resposta mínima:

```json
{
  "text": "resposta da inteligência artificial"
}
```

Sem backend publicado, a transcrição do próprio navegador ainda pode aparecer, mas a resposta real do Gemini não deve ser apresentada como disponível.

## 7. Professional Lab utilizável

Depois de selecionar uma trilha, o usuário pode abrir uma página própria de estudo, escolher módulos, iniciar uma etapa, acessar vocabulário inicial, ver um desafio, abrir a prática de fala e marcar o módulo como concluído.

A Home agora separa claramente:

- estudo do idioma geral;
- revisão de vocabulário;
- prática de fala;
- trilha profissional.

## 8. XP e conquistas

Concluir o onboarding, adicionar/configurar idioma ou selecionar uma profissão pode liberar uma conquista, mas não concede XP.

A migração da versão anterior recalcula as recompensas e remove os 50 XP do onboarding e os 150 XP da seleção profissional sem apagar XP realmente ganho em atividades.

As recompensas permanecem somente para ações reais, como concluir revisão, manter sequência ou completar sessões válidas de fala.

## 9. Arquivos principais alterados

### Componentes

- `components/home/ef-home-page.js`
- `components/languages/ef-language-card.js`
- `components/languages/ef-language-diagnostic.js`
- `components/languages/ef-language-list.js`
- `components/languages/ef-language-selector.js`
- `components/languages/ef-language-setup.js`
- `components/onboarding/ef-finish.js`
- `components/onboarding/ef-level-test.js`
- `components/onboarding/ef-onboarding.js`
- `components/passport/ef-passport-card.js`
- `components/passport/ef-stamps.js`
- `components/professional/ef-professional-page.js`
- `components/professional/ef-professional-study-page.js`
- `components/profile/ef-learning-style.js`
- `components/profile/ef-profile-card.js`
- `components/profile/ef-profile-page.js`
- `components/review/ef-review-page.js`
- `components/speaking/ef-speaking-page.js`
- `components/register.js`

### Core e serviços

- `core/app.js`
- `core/config.js`
- `core/diagnostic.js`
- `core/router.js`
- `core/state.js`
- `services/achievement-service.js`
- `services/language-profile.service.js`
- `services/professional.js`
- `services/review.service.js`
- `services/speech-conversation.service.js`
- `services/speech-recognition.service.js`

### Dados, estilos e integração

- `data/achievement-catalog.js`
- `data/starter-vocabulary.js`
- `css/home.css`
- `css/languages.css`
- `css/professional.css`
- `css/profile.css`
- `css/review.css`
- `css/speaking.css`
- `css/main.css`
- `index.html`

## 10. Validação executada

- auditoria de sintaxe e imports em 106 arquivos JavaScript;
- verificação do manifesto, PWA e referências locais;
- 20 testes automatizados aprovados;
- testes específicos para separação de dados por idioma;
- testes para impedir nível automático em idioma novo;
- testes para classificação conservadora;
- testes para migração e correção do XP.

A navegação visual completa, o microfone físico, o reconhecimento oferecido por cada navegador e os endpoints externos ainda precisam ser validados no ambiente publicado.
