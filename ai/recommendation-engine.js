export function recommendNextActivities({ language = {}, profile = {}, recentPerformance = {} } = {}) {
  const minutes=normalizeMinutes(language.dailyMinutes||profile.dailyMinutes); const activities=[];
  if(recentPerformance.needsReview) activities.push(item("review","Revisão rápida",Math.min(5,minutes),"Revisar conteúdo recente"));
  if((language.journey||"Explorando")==="Explorando") activities.push(item("foundation","Base essencial",Math.min(8,minutes),"Cumprimentos e apresentação"));
  else activities.push(item("conversation","Uso guiado",Math.min(10,minutes),"Produzir frases no idioma"));
  if(language.goal) activities.push(item("goal","Objetivo pessoal",Math.min(7,minutes),`Prática ligada a: ${language.goal}`));
  return fit(activities,minutes);
}
const item=(id,title,minutes,description)=>({id,title,minutes,description});
const normalizeMinutes=v=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):20;
function fit(items,max){const result=[];let total=0;for(const i of items){if(total>=max)break;const m=Math.min(i.minutes,max-total);result.push({...i,minutes:m});total+=m;}return result;}
