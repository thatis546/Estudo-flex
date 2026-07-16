const HIGH_RISK=[/\b(suic[ií]dio|me matar|quero morrer)\b/i,/\b(chacina|atirar na escola|explodir escola)\b/i,/\b(pornografia infantil|abuso sexual infantil)\b/i];
const PERSONAL=[/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/,/\b(?:senha|password)\s*[:=]\s*\S+/i];
export function moderateText(text="") {
  const input=String(text); const highRisk=HIGH_RISK.some(p=>p.test(input)); const containsPersonalData=PERSONAL.some(p=>p.test(input));
  return { allowed:!highRisk, highRisk, containsPersonalData, action:highRisk?"block_and_escalate":containsPersonalData?"warn":"allow" };
}
export function sanitizeForPrompt(text="") { return String(text).replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,"[CPF removido]").replace(/\b(?:senha|password)\s*[:=]\s*\S+/gi,"[credencial removida]").trim(); }
