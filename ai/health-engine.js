const MESSAGES=["Que tal beber um pouco de água antes de começar?","Uma pausa curta pode ajudar quando a atenção cair.","Sono e descanso também fazem parte do aprendizado.","Movimentar o corpo por alguns minutos pode ajudar a recuperar o foco.","Comer regularmente pode facilitar a concentração durante os estudos."];
export function getHealthyStudyNote({ lastNoteAt=null, now=new Date(), minimumIntervalHours=20 }={}) {
  if(lastNoteAt && now-new Date(lastNoteAt)<minimumIntervalHours*3600000) return null;
  const start=new Date(now.getFullYear(),0,0); const index=Math.floor((now-start)/86400000)%MESSAGES.length;
  return { text:MESSAGES[index], disclaimer:"Lembrete geral; não substitui orientação profissional.", createdAt:now.toISOString() };
}
