# Sprint 5 — pasta `ai/`

Contém a primeira camada de inteligência do Estudo Flex:

- `gemini.js`: cliente do frontend para um backend seguro.
- `mentor-engine.js`: conversa, prompt, memória e moderação.
- `prompt-builder.js`: instruções do mentor.
- `memory.js`: memória local e regras de retenção.
- `moderation.js`: filtro local auxiliar.
- `recommendation-engine.js`: atividades do dia.
- `health-engine.js`: lembretes leves de hábitos.
- `roadmap-engine.js`: fundamentos por jornada.
- `speech-engine.js`: síntese de voz nativa do navegador.

## Segurança

A chave do Gemini **não entra nesta pasta**. O frontend chama `POST /api/gemini`; a chave fica no backend como variável de ambiente.

## Uso

```html
<script type="module" src="./js/app.js"></script>
```

```js
import { MentorEngine } from "../ai/mentor-engine.js";
const mentor = new MentorEngine();
```

## Limitações

- O endpoint `/api/gemini` ainda precisa ser criado.
- A moderação local não substitui a moderação do backend.
- A memória ainda fica no navegador.
- Reconhecimento de fala não está incluído nesta sprint.
