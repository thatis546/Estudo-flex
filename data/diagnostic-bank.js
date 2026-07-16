const choice = (id, category, prompt, options, difficulty = 1) => ({ id, type: "choice", category, prompt, options, difficulty, maxPoints: 4 });
const text = (id, category, prompt, minimumWords, difficulty = 1) => ({ id, type: "text", category, prompt, minimumWords, difficulty, maxPoints: 4 });

export const DIAGNOSTIC_BANK = {
    en: [
        choice("en-vocab-1", "vocabulary", "Qual opção significa “Bom dia”?", [["Good morning", 4], ["Good night", 0], ["See you", 1]], 1),
        choice("en-context-1", "context", "Você chega a uma cafeteria. Como pede um café com educação?", [["A coffee, please.", 4], ["I coffee.", 1], ["Coffee yesterday.", 0]], 1),
        choice("en-grammar-1", "grammar", "Complete: She ___ a student.", [["is", 4], ["are", 0], ["am", 0]], 1),
        choice("en-comprehension-1", "comprehension", "“The meeting was moved to Friday.” O que aconteceu?", [["A reunião foi transferida para sexta-feira.", 4], ["A reunião foi cancelada.", 1], ["A reunião ocorreu na sexta passada.", 0]], 2),
        choice("en-grammar-2", "grammar", "Complete: I have lived here ___ 2022.", [["since", 4], ["for", 1], ["during", 0]], 2),
        text("en-production-1", "production", "Apresente-se em inglês em pelo menos duas frases.", 8, 2),
        choice("en-context-2", "context", "Qual frase é mais adequada em um e-mail profissional?", [["Could you please confirm the deadline?", 4], ["Tell me the deadline now.", 1], ["Deadline???", 0]], 3),
        choice("en-comprehension-2", "comprehension", "“Although the train was delayed, we arrived on time.” Qual é a ideia principal?", [["Houve atraso, mas a chegada foi pontual.", 4], ["O trem chegou antes do horário.", 0], ["A viagem foi cancelada.", 0]], 3),
        choice("en-grammar-3", "grammar", "Choose the best option: If I had known, I ___ you.", [["would have called", 4], ["will call", 1], ["called", 1]], 4),
        text("en-production-2", "production", "Conte em inglês uma experiência recente e explique como você se sentiu.", 18, 4),
        choice("en-register-1", "register", "Você discorda de um colega em reunião. Qual resposta é mais diplomática?", [["I see your point, but I would suggest another approach.", 4], ["You are wrong.", 0], ["No way.", 0]], 4),
        text("en-production-3", "production", "Defenda uma opinião em inglês usando pelo menos um argumento e um exemplo.", 28, 5)
    ],
    fr: [
        choice("fr-vocab-1", "vocabulary", "Qual opção significa “Bom dia”?", [["Bonjour", 4], ["Bonne nuit", 0], ["Au revoir", 1]], 1),
        choice("fr-context-1", "context", "Como pedir um café com educação?", [["Un café, s'il vous plaît.", 4], ["Je café.", 0], ["Café hier.", 0]], 1),
        choice("fr-grammar-1", "grammar", "Complete: Elle ___ étudiante.", [["est", 4], ["sont", 0], ["es", 1]], 1),
        choice("fr-comprehension-1", "comprehension", "“Le rendez-vous a été déplacé à vendredi.” O que aconteceu?", [["O compromisso foi transferido para sexta-feira.", 4], ["Foi cancelado.", 1], ["Aconteceu ontem.", 0]], 2),
        choice("fr-grammar-2", "grammar", "Complete: J'habite ici ___ 2022.", [["depuis", 4], ["pendant", 1], ["pour", 0]], 2),
        text("fr-production-1", "production", "Apresente-se em francês em pelo menos duas frases.", 8, 2),
        choice("fr-context-2", "context", "Qual frase é mais adequada em um e-mail profissional?", [["Pourriez-vous confirmer la date limite, s'il vous plaît ?", 4], ["Donnez-moi la date maintenant.", 1], ["La date???", 0]], 3),
        choice("fr-comprehension-2", "comprehension", "“Même si le train était en retard, nous sommes arrivés à l'heure.” Qual é a ideia?", [["O trem atrasou, mas chegaram no horário.", 4], ["O trem chegou cedo.", 0], ["A viagem foi cancelada.", 0]], 3),
        choice("fr-grammar-3", "grammar", "Complete: Si j'avais su, je vous ___.", [["aurais appelé", 4], ["appellerai", 1], ["appelais", 1]], 4),
        text("fr-production-2", "production", "Conte uma experiência recente em francês e explique como se sentiu.", 18, 4),
        choice("fr-register-1", "register", "Como discordar com diplomacia em uma reunião?", [["Je comprends votre point de vue, mais je proposerais une autre approche.", 4], ["Vous avez tort.", 0], ["Impossible.", 0]], 4),
        text("fr-production-3", "production", "Defenda uma opinião em francês usando um argumento e um exemplo.", 28, 5)
    ],
    de: [
        choice("de-vocab-1", "vocabulary", "Qual opção significa “Bom dia”?", [["Guten Morgen", 4], ["Gute Nacht", 0], ["Auf Wiedersehen", 1]], 1),
        choice("de-context-1", "context", "Como pedir um café com educação?", [["Einen Kaffee, bitte.", 4], ["Ich Kaffee.", 0], ["Kaffee gestern.", 0]], 1),
        choice("de-grammar-1", "grammar", "Complete: Sie ___ Studentin.", [["ist", 4], ["sind", 1], ["bin", 0]], 1),
        choice("de-comprehension-1", "comprehension", "“Der Termin wurde auf Freitag verschoben.” O que aconteceu?", [["O compromisso foi transferido para sexta-feira.", 4], ["Foi cancelado.", 1], ["Aconteceu ontem.", 0]], 2),
        choice("de-grammar-2", "grammar", "Complete: Ich wohne ___ 2022 hier.", [["seit", 4], ["für", 1], ["während", 0]], 2),
        text("de-production-1", "production", "Apresente-se em alemão em pelo menos duas frases.", 8, 2),
        choice("de-context-2", "context", "Qual frase é mais adequada em um e-mail profissional?", [["Könnten Sie bitte die Frist bestätigen?", 4], ["Sag mir jetzt die Frist.", 1], ["Frist???", 0]], 3),
        choice("de-comprehension-2", "comprehension", "“Obwohl der Zug verspätet war, kamen wir pünktlich an.” Qual é a ideia?", [["O trem atrasou, mas chegaram pontualmente.", 4], ["O trem chegou cedo.", 0], ["A viagem foi cancelada.", 0]], 3),
        choice("de-grammar-3", "grammar", "Complete: Wenn ich das gewusst hätte, ___ ich angerufen.", [["hätte", 4], ["werde", 1], ["habe", 1]], 4),
        text("de-production-2", "production", "Conte uma experiência recente em alemão e explique como se sentiu.", 18, 4),
        choice("de-register-1", "register", "Como discordar com diplomacia?", [["Ich verstehe Ihren Standpunkt, würde aber einen anderen Ansatz vorschlagen.", 4], ["Sie liegen falsch.", 0], ["Nein.", 0]], 4),
        text("de-production-3", "production", "Defenda uma opinião em alemão usando um argumento e um exemplo.", 28, 5)
    ],
    it: [
        choice("it-vocab-1", "vocabulary", "Qual opção significa “Bom dia”?", [["Buongiorno", 4], ["Buonanotte", 0], ["Arrivederci", 1]], 1),
        choice("it-context-1", "context", "Como pedir um café com educação?", [["Un caffè, per favore.", 4], ["Io caffè.", 0], ["Caffè ieri.", 0]], 1),
        choice("it-grammar-1", "grammar", "Complete: Lei ___ una studentessa.", [["è", 4], ["sono", 0], ["sei", 1]], 1),
        choice("it-comprehension-1", "comprehension", "“L'appuntamento è stato spostato a venerdì.” O que aconteceu?", [["O compromisso foi transferido para sexta-feira.", 4], ["Foi cancelado.", 1], ["Aconteceu ontem.", 0]], 2),
        choice("it-grammar-2", "grammar", "Complete: Vivo qui ___ 2022.", [["dal", 4], ["per", 1], ["durante", 0]], 2),
        text("it-production-1", "production", "Apresente-se em italiano em pelo menos duas frases.", 8, 2),
        choice("it-context-2", "context", "Qual frase é mais adequada em um e-mail profissional?", [["Potrebbe confermare la scadenza, per favore?", 4], ["Dimmi subito la scadenza.", 1], ["Scadenza???", 0]], 3),
        choice("it-comprehension-2", "comprehension", "“Anche se il treno era in ritardo, siamo arrivati in orario.” Qual é a ideia?", [["O trem atrasou, mas chegaram no horário.", 4], ["O trem chegou cedo.", 0], ["A viagem foi cancelada.", 0]], 3),
        choice("it-grammar-3", "grammar", "Complete: Se l'avessi saputo, ti ___.", [["avrei chiamato", 4], ["chiamerò", 1], ["chiamavo", 1]], 4),
        text("it-production-2", "production", "Conte uma experiência recente em italiano e explique como se sentiu.", 18, 4),
        choice("it-register-1", "register", "Como discordar com diplomacia em uma reunião?", [["Capisco il suo punto di vista, ma suggerirei un altro approccio.", 4], ["Ha torto.", 0], ["No.", 0]], 4),
        text("it-production-3", "production", "Defenda uma opinião em italiano usando um argumento e um exemplo.", 28, 5)
    ],
    es: [
        choice("es-vocab-1", "vocabulary", "Qual opção significa “Bom dia”?", [["Buenos días", 4], ["Buenas noches", 0], ["Hasta luego", 1]], 1),
        choice("es-context-1", "context", "Como pedir um café com educação?", [["Un café, por favor.", 4], ["Yo café.", 0], ["Café ayer.", 0]], 1),
        choice("es-grammar-1", "grammar", "Complete: Ella ___ estudiante.", [["es", 4], ["son", 0], ["soy", 0]], 1),
        choice("es-comprehension-1", "comprehension", "“La reunión se trasladó al viernes.” O que aconteceu?", [["A reunião foi transferida para sexta-feira.", 4], ["Foi cancelada.", 1], ["Aconteceu ontem.", 0]], 2),
        choice("es-grammar-2", "grammar", "Complete: Vivo aquí ___ 2022.", [["desde", 4], ["por", 1], ["durante", 0]], 2),
        text("es-production-1", "production", "Apresente-se em espanhol em pelo menos duas frases.", 8, 2),
        choice("es-context-2", "context", "Qual frase é mais adequada em um e-mail profissional?", [["¿Podría confirmar la fecha límite, por favor?", 4], ["Dime la fecha ahora.", 1], ["¿Fecha???", 0]], 3),
        choice("es-comprehension-2", "comprehension", "“Aunque el tren se retrasó, llegamos a tiempo.” Qual é a ideia?", [["O trem atrasou, mas chegaram no horário.", 4], ["O trem chegou cedo.", 0], ["A viagem foi cancelada.", 0]], 3),
        choice("es-grammar-3", "grammar", "Complete: Si lo hubiera sabido, te ___.", [["habría llamado", 4], ["llamaré", 1], ["llamaba", 1]], 4),
        text("es-production-2", "production", "Conte uma experiência recente em espanhol e explique como se sentiu.", 18, 4),
        choice("es-register-1", "register", "Como discordar com diplomacia em uma reunião?", [["Entiendo tu punto, pero propondría otro enfoque.", 4], ["Estás equivocado.", 0], ["No.", 0]], 4),
        text("es-production-3", "production", "Defenda uma opinião em espanhol usando um argumento e um exemplo.", 28, 5)
    ]
};

export function getDiagnosticQuestions(languageCode) {
    return DIAGNOSTIC_BANK[String(languageCode ?? "").toLowerCase()] || [];
}
