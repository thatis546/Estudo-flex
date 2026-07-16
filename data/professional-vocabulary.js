export const PROFESSIONAL_VOCABULARY = {
    en: [["meeting", "reunião"], ["deadline", "prazo"], ["budget", "orçamento"], ["report", "relatório"], ["feedback", "retorno"], ["stakeholder", "parte interessada"], ["scope", "escopo"], ["deliverable", "entrega"]],
    fr: [["réunion", "reunião"], ["date limite", "prazo"], ["budget", "orçamento"], ["rapport", "relatório"], ["retour", "retorno"], ["partie prenante", "parte interessada"], ["périmètre", "escopo"], ["livrable", "entrega"]],
    de: [["Besprechung", "reunião"], ["Frist", "prazo"], ["Budget", "orçamento"], ["Bericht", "relatório"], ["Rückmeldung", "retorno"], ["Stakeholder", "parte interessada"], ["Umfang", "escopo"], ["Lieferergebnis", "entrega"]],
    it: [["riunione", "reunião"], ["scadenza", "prazo"], ["budget", "orçamento"], ["rapporto", "relatório"], ["feedback", "retorno"], ["parte interessata", "parte interessada"], ["ambito", "escopo"], ["risultato", "entrega"]],
    es: [["reunión", "reunião"], ["fecha límite", "prazo"], ["presupuesto", "orçamento"], ["informe", "relatório"], ["retroalimentación", "retorno"], ["parte interesada", "parte interessada"], ["alcance", "escopo"], ["entregable", "entrega"]]
};

export function getProfessionalVocabulary(languageCode) {
    return PROFESSIONAL_VOCABULARY[String(languageCode || "").toLowerCase()] || PROFESSIONAL_VOCABULARY.en;
}
