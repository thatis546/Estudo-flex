# Auditoria técnica — Estudo Flex Languages v0.7.0

Data: 15/07/2026

## Escopo

A revisão foi orientada pelos problemas encontrados durante o uso da versão 0.6.1: nível presumido em novos idiomas, ausência de revisão funcional, Perfil Vivo inconsistente, fala sem transcrição, trilha profissional sem continuidade e XP excessivo por ações de configuração.

## Resultado

- Cada idioma possui onboarding, objetivo, contexto, frequência, diagnóstico e progresso próprios.
- Idioma recém-adicionado permanece com `level: ""` e `setupComplete: false`.
- O estado global também pode limpar `levelTag`; isso corrige um vazamento adicional de A1 encontrado pelos novos testes.
- O diagnóstico curto não concede A2 por cumprimentos isolados.
- A revisão da Home abre cartões funcionais.
- A trilha profissional abre uma tela própria de estudo.
- O Speaking tenta transcrição local e está preparado para STT e Gemini pelo backend.
- Recompensas antigas de onboarding e profissão são migradas para zero, preservando XP de atividade.

## Verificações automáticas

- 106 arquivos JavaScript auditados.
- Imports relativos válidos.
- Manifesto, Service Worker e referências locais válidos.
- 20 de 20 testes automatizados aprovados.

## Limites da validação

Não foi possível confirmar neste ambiente:

- captação por um microfone físico;
- comportamento do reconhecimento de fala em todos os navegadores;
- resposta de `/api/speech/transcribe`;
- resposta de `/api/gemini`;
- aparência final em todos os tamanhos de tela.

Esses itens dependem de navegador, dispositivo e backend publicados. O card final de conquistas também permanece aguardando a referência visual mencionada pela responsável pelo produto.
