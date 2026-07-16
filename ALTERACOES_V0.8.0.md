# Estudo Flex Languages — alterações da versão 0.8.0

A versão 0.8.0 consolida as correções solicitadas após o uso da versão 0.7.0. O trabalho foi realizado sobre o projeto completo, considerando impactos entre estado, serviços, rotas, componentes, estilos, PWA, backend e testes.

## 1. Idiomas realmente independentes

Cada idioma possui seu próprio registro pedagógico, incluindo:

- finalidade e explicação detalhada do objetivo;
- contexto e situação concreta de uso;
- contato anterior;
- tempo por sessão, frequência e prazo;
- interesses gerais e personalizados;
- diagnóstico, jornada e evidências;
- Daily Plan, vocabulário e revisões;
- métricas, XP e histórico;
- Communication Lab;
- trilha profissional e progresso.

Selecionar uma nova língua não atribui jornada, nível ou conhecimento presumido. O estudante precisa concluir a configuração e o diagnóstico daquela língua. Editar objetivo, contexto ou interesses não apaga um diagnóstico concluído; refazer a avaliação é uma ação separada.

## 2. Diagnóstico amplo e jornadas próprias

O teste introdutório deixou de usar três perguntas e deixou de exibir A0–C2 como identidade principal do estudante. Cada idioma possui um banco de 12 evidências que combina reconhecimento, compreensão, estrutura, registro e produção.

As jornadas do produto são:

1. **Explorando**;
2. **Descobrindo**;
3. **Construindo**;
4. **Conectando**;
5. **Vivendo o idioma**.

Cumprimentos ou palavras isoladas mantêm a pessoa em Explorando. O diagnóstico inicial pode chegar no máximo a Conectando. Vivendo o idioma exige evidências longitudinais de uso real e não pode ser concedido por um questionário inicial.

## 3. Revisão rápida funcional

O botão da Home abre uma sessão real com:

- palavra ou expressão;
- tradução e exemplo;
- revelação da resposta;
- avaliações “Não lembrei”, “Difícil” e “Lembrei”;
- atualização do próximo intervalo;
- fila e estatísticas independentes por idioma;
- XP idempotente somente ao concluir a sessão;
- atualização de sequência e tempo efetivamente estudado.

## 4. Perfil Vivo completo e controlável

O perfil mostra identidade, avatar, idioma atual, jornada, XP, sequência, tempo estudado, revisões, objetivos, contexto, rotina, contato anterior, interesses, pontos observados, pontos a desenvolver, histórico, trilha profissional e preferências do Mentor.

Também exibe um resumo separado de cada idioma configurado.

O estudante pode:

- excluir um interesse específico;
- excluir um aprendizado da IA permitindo reaprendizado posterior;
- excluir e bloquear o reaprendizado do mesmo conteúdo;
- limpar a memória da IA;
- reativar aprendizados anteriormente bloqueados;
- desligar totalmente a memória;
- excluir integralmente o perfil local.

## 5. Mentor separado da oratória

Foi criada uma rota própria para conversar com o Mentor em texto. O Mentor recebe somente o contexto autorizado e não deve inventar nível, conquista, memória ou atividade concluída.

As memórias sugeridas pela IA são registradas pelo serviço de privacidade e permanecem visíveis e removíveis no Perfil Vivo.

## 6. Communication Lab

A antiga tela genérica de fala passou a ser um laboratório técnico de comunicação. Os oito módulos são:

- pronúncia e sons;
- projeção e presença de voz;
- clareza e articulação;
- ritmo, pausas e velocidade;
- vícios e muletas linguísticas;
- repetição e variedade lexical;
- entonação e expressividade;
- oratória profissional.

O fluxo captura áudio real, mostra intensidade do microfone, tenta transcrição ao vivo, envia o arquivo final ao backend quando necessário, permite corrigir a transcrição e produz relatório de palavras por minuto, repetições, muletas, variedade lexical, volume e silêncio.

O Communication Lab não simula conversa automática com o Mentor. Seu objetivo é orientar os módulos técnicos de fala. A conversa com Mentor está em aba separada.

## 7. Professional Lab utilizável

As trilhas são independentes por idioma. O estudante pode selecionar uma área, abrir a página de estudo, escolher módulos, consultar vocabulário, responder desafios, concluir etapas e retomar depois.

Trocar de trilha não apaga o progresso anterior. Atualizar a resposta de um módulo já concluído não duplica lições nem XP.

## 8. XP, sequência e tempo de estudo

Não há XP por concluir onboarding, configurar idioma, escolher profissão ou selecionar trilha.

XP é concedido apenas por atividade efetivamente concluída, sempre com chave idempotente. A mesma ação não pode ser premiada duas vezes por recarregamento ou clique repetido.

Atividades reais atualizam:

- XP geral e XP do idioma;
- histórico recente;
- sequência diária;
- última data de estudo;
- tempo estudado quando a duração está disponível.

Pausas superiores a um dia reiniciam a sequência sem punição adicional.

## 9. Avatar ilustrado

O padrão do produto é um bonequinho ilustrado, não uma fotografia real. O estudante pode descrever e gerar seu avatar ou enviar um arquivo próprio.

A validação exige:

- exatamente um personagem;
- rosto visível;
- imagem ilustrada;
- enquadramento utilizável;
- ausência de fotografia real;
- ausência de múltiplas pessoas;
- ausência de conteúdo impróprio.

O avatar anterior é preservado quando uma nova geração ou um novo arquivo não passa na validação.

## 10. Conquistas e Passaporte

Os cards são montados pelo frontend a partir de um único objeto consistente. Nome, idioma, bandeira, ação, descrição, data, XP, sequência, avatar e imagem não são fixos no componente.

A imagem de IA contém apenas a cena ilustrada. Todo texto é sobreposto pelo frontend para evitar erros tipográficos ou contradições produzidas pelo gerador.

A validação rejeita:

- idioma diferente da ação descrita;
- bandeira ou país contraditório;
- texto, letras, números, logotipos ou marcas na imagem;
- personagem central adicional;
- cena incompatível com a conquista;
- avatar sem correspondência.

Conquistas detectadas numa conversa exigem uma evidência literal de ação concluída. Intenções, planos e declarações vagas não contam.

O card pode ser compartilhado como PNG quando o navegador oferece canvas e compartilhamento de arquivos, com SVG/download como alternativa.

## 11. Welcome com identidade brasileira

A bandeira dos Estados Unidos foi removida do CSS. A bandeira do Brasil está explícita no HTML como satélite do globo, acompanhada da mensagem “Do Brasil para o mundo”.

## 12. Backend de IA

Foi adicionado um backend Node.js separado do GitHub Pages para proteger a chave e atender:

- Mentor textual estruturado;
- transcrição de áudio;
- validação e geração de avatar;
- geração e segunda validação da ilustração de conquista;
- detecção de conquista em mensagem.

O backend possui CORS configurável, Helmet, limite de requisições, limite de upload, validação MIME, JSON estrito, respostas estruturadas e chave enviada pelo cabeçalho seguro ao provedor.

## 13. Compatibilidade, PWA e auditoria

Foram eliminados operadores de atribuição lógica desnecessários do código de navegador, corrigidas referências de estado e armazenamento, revisados componentes ativos, rotas, CSS, manifesto e cache.

O auditor verifica sintaxe, imports, rotas, Web Components, IDs, assets, `@import`, versões, PWA, ausência de `typhography`, ausência da bandeira dos EUA no Welcome e ausência de dados pessoais fixos.

## 14. O que permanece para as próximas etapas

- autenticação, JWT, Prisma e PostgreSQL;
- sincronização multi-dispositivo;
- processamento em streaming de áudio de baixa latência;
- validação em microfone físico e navegadores móveis reais;
- testes ao vivo com uma chave Gemini e modelos habilitados na conta de implantação;
- revisão humana e política de moderação antes de publicar imagens compartilháveis em produção.
