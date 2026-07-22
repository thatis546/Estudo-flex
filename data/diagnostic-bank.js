function choice(id, category, prompt, options, difficulty = 1) {
    return { id, type: "choice", category, prompt, options, difficulty };
}

function text(id, category, prompt, minimumWords, difficulty = 2) {
    return { id, type: "text", category, prompt, minimumWords, difficulty };
}

const q = (code, data) => [
    choice(`${code}-vocabulary-1`, "vocabulary", data.q1, data.o1, 1),
    choice(`${code}-context-1`, "context", data.q2, data.o2, 1),
    choice(`${code}-grammar-1`, "grammar", data.q3, data.o3, 1),
    choice(`${code}-comprehension-1`, "comprehension", data.q4, data.o4, 2),
    choice(`${code}-grammar-2`, "grammar", data.q5, data.o5, 2),
    text(`${code}-production-1`, "production", data.p1, 10, 2),
    choice(`${code}-context-2`, "context", data.q7, data.o7, 3),
    choice(`${code}-comprehension-2`, "comprehension", data.q8, data.o8, 3),
    choice(`${code}-grammar-3`, "grammar", data.q9, data.o9, 4),
    text(`${code}-production-2`, "production", data.p2, 22, 4),
    choice(`${code}-register-1`, "register", data.q11, data.o11, 4),
    text(`${code}-production-3`, "production", data.p3, 34, 5)
];

export const DIAGNOSTIC_BANK = {
    en: q("en", {
        q1: "Você recebe a mensagem: “I’m running late.” O que a pessoa quis dizer?",
        o1: [["Ela chegará um pouco atrasada.", 4], ["Ela terminou de correr agora.", 1], ["Ela vai sair mais cedo hoje.", 0]],
        q2: "Você quer confirmar se uma cadeira está livre. Qual pergunta combina com a situação?",
        o2: [["Are you sitting over there?", 1], ["Is anyone sitting here?", 4], ["Do you sit here every day?", 1]],
        q3: "Complete: My brother and I ___ near the university.",
        o3: [["lives", 0], ["are living", 2], ["live", 4]],
        q4: "“Maya missed the bus, so she called a taxi.” O que aconteceu depois de ela perder o ônibus?",
        o4: [["Ela decidiu esperar outro ônibus.", 1], ["Ela pediu um táxi para continuar.", 4], ["Ela telefonou para cancelar a viagem.", 0]],
        q5: "Complete: I’ve known Daniel ___ we were children.",
        o5: [["during", 0], ["since", 4], ["for", 2]],
        p1: "Apresente-se em inglês e mencione algo que faz parte da sua rotina.",
        q7: "Você precisa pedir mais prazo sem soar rude. Qual opção é mais adequada?",
        o7: [["Could we discuss a short extension for this task?", 4], ["I need more time, so change the deadline.", 1], ["The deadline is impossible and must be different.", 1]],
        q8: "“The report was accurate; however, it arrived too late to be used.” Qual avaliação está correta?",
        o8: [["O relatório chegou cedo, mas tinha erros.", 0], ["O relatório estava correto, mas perdeu a utilidade pelo atraso.", 4], ["O relatório foi usado apesar de estar incompleto.", 1]],
        q9: "Complete: If the team had tested the update, it ___ the error earlier.",
        o9: [["would detect", 1], ["would have detected", 4], ["had detected", 2]],
        p2: "Conte em inglês uma situação recente, explique o que aconteceu e como você reagiu.",
        q11: "Em uma reunião, você discorda da proposta. Qual resposta preserva a colaboração?",
        o11: [["I understand the goal, but could we compare it with another approach?", 4], ["I cannot agree because this proposal clearly makes no sense.", 1], ["Your idea is not the one we should use in this project.", 1]],
        p3: "Defenda uma opinião em inglês, apresente uma razão, um exemplo e reconheça um possível contraponto."
    }),
    fr: q("fr", {
        q1: "Você recebe: « Je serai un peu en retard. » O que a pessoa informou?",
        o1: [["Ela chegará um pouco atrasada.", 4], ["Ela precisa sair um pouco cedo.", 1], ["Ela já chegou ao local combinado.", 0]],
        q2: "Você quer saber se uma cadeira está livre. Qual pergunta se encaixa melhor?",
        o2: [["Vous vous asseyez toujours ici ?", 1], ["Cette place est libre ?", 4], ["Vous cherchez cette chaise ?", 1]],
        q3: "Complete: Mon frère et moi, nous ___ près de l’université.",
        o3: [["habitons", 4], ["habite", 0], ["habitez", 1]],
        q4: "« Maya a raté le bus, alors elle a appelé un taxi. » O que aconteceu depois?",
        o4: [["Ela chamou um táxi para continuar.", 4], ["Ela esperou o ônibus no mesmo lugar.", 1], ["Ela ligou para cancelar o compromisso.", 0]],
        q5: "Complete: Je connais Daniel ___ notre enfance.",
        o5: [["pendant", 1], ["depuis", 4], ["pour", 0]],
        p1: "Apresente-se em francês e mencione algo que faz parte da sua rotina.",
        q7: "Você precisa pedir um pequeno adiamento com educação. Qual opção é mais adequada?",
        o7: [["Pourrions-nous discuter d’un court délai supplémentaire ?", 4], ["J’ai besoin de temps, alors changez la date prévue.", 1], ["Cette date est impossible et doit être remplacée.", 1]],
        q8: "« Le rapport était précis ; pourtant, il est arrivé trop tard pour être utilisé. » Qual leitura está correta?",
        o8: [["O relatório estava correto, mas o atraso impediu seu uso.", 4], ["O relatório foi usado apesar de conter vários erros.", 1], ["O relatório chegou cedo, porém estava incompleto.", 0]],
        q9: "Complete: Si l’équipe avait testé la mise à jour, elle ___ l’erreur plus tôt.",
        o9: [["aurait détecté", 4], ["détecterait", 1], ["avait détecté", 2]],
        p2: "Conte em francês uma situação recente, explique o que ocorreu e como você reagiu.",
        q11: "Em uma reunião, qual resposta expressa discordância sem romper a colaboração?",
        o11: [["Je comprends l’objectif, mais pourrions-nous comparer une autre approche ?", 4], ["Je ne suis pas d’accord, car cette proposition n’a aucun sens.", 1], ["Votre idée n’est pas celle que nous devons utiliser ici.", 1]],
        p3: "Defenda uma opinião em francês, apresente uma razão, um exemplo e reconheça um possível contraponto."
    }),
    de: q("de", {
        q1: "Você recebe: „Ich komme etwas später.“ O que a pessoa informou?",
        o1: [["Ela chegará um pouco mais tarde.", 4], ["Ela precisa sair um pouco antes.", 1], ["Ela já chegou ao lugar marcado.", 0]],
        q2: "Você quer saber se uma cadeira está livre. Qual pergunta combina com a situação?",
        o2: [["Sitzen Sie jeden Tag hier?", 1], ["Ist dieser Platz noch frei?", 4], ["Suchen Sie gerade diesen Stuhl?", 1]],
        q3: "Complete: Mein Bruder und ich ___ in der Nähe der Universität.",
        o3: [["wohnt", 0], ["wohnen", 4], ["wohnt ihr", 1]],
        q4: "„Maya hat den Bus verpasst, deshalb hat sie ein Taxi gerufen.“ O que ocorreu depois?",
        o4: [["Ela chamou um táxi para continuar.", 4], ["Ela esperou outro ônibus no local.", 1], ["Ela telefonou para cancelar a viagem.", 0]],
        q5: "Complete: Ich kenne Daniel ___ unserer Kindheit.",
        o5: [["für", 1], ["seit", 4], ["während", 0]],
        p1: "Apresente-se em alemão e mencione algo que faz parte da sua rotina.",
        q7: "Você precisa pedir um pequeno adiamento com educação. Qual opção é mais adequada?",
        o7: [["Könnten wir über eine kurze Verlängerung sprechen?", 4], ["Ich brauche mehr Zeit, also ändern Sie die Frist.", 1], ["Diese Frist ist unmöglich und muss ersetzt werden.", 1]],
        q8: "„Der Bericht war korrekt; allerdings kam er zu spät, um verwendet zu werden.“ Qual leitura está correta?",
        o8: [["O relatório estava correto, mas o atraso impediu seu uso.", 4], ["O relatório foi usado apesar de conter vários erros.", 1], ["O relatório chegou cedo, porém estava incompleto.", 0]],
        q9: "Complete: Wenn das Team das Update getestet hätte, ___ es den Fehler früher entdeckt.",
        o9: [["würde", 1], ["hätte", 4], ["hat", 0]],
        p2: "Conte em alemão uma situação recente, explique o que ocorreu e como você reagiu.",
        q11: "Em uma reunião, qual resposta expressa discordância de forma colaborativa?",
        o11: [["Ich verstehe das Ziel, aber könnten wir einen anderen Ansatz vergleichen?", 4], ["Ich stimme nicht zu, weil dieser Vorschlag keinen Sinn ergibt.", 1], ["Ihre Idee ist nicht die, die wir hier verwenden sollten.", 1]],
        p3: "Defenda uma opinião em alemão, apresente uma razão, um exemplo e reconheça um possível contraponto."
    }),
    it: q("it", {
        q1: "Você recebe: « Arriverò con un po’ di ritardo. » O que a pessoa informou?",
        o1: [["Ela chegará com um pequeno atraso.", 4], ["Ela precisará sair um pouco antes.", 1], ["Ela já chegou ao lugar combinado.", 0]],
        q2: "Você quer saber se uma cadeira está livre. Qual pergunta combina com a situação?",
        o2: [["Ti siedi sempre in questo posto?", 1], ["È libero questo posto?", 4], ["Stai cercando proprio questa sedia?", 1]],
        q3: "Complete: Mio fratello e io ___ vicino all’università.",
        o3: [["vive", 0], ["viviamo", 4], ["vivete", 1]],
        q4: "« Maya ha perso l’autobus, quindi ha chiamato un taxi. » O que aconteceu depois?",
        o4: [["Ela chamou um táxi para continuar.", 4], ["Ela esperou outro ônibus no local.", 1], ["Ela telefonou para cancelar a viagem.", 0]],
        q5: "Complete: Conosco Daniel ___ quando eravamo bambini.",
        o5: [["da", 4], ["per", 1], ["durante", 0]],
        p1: "Apresente-se em italiano e mencione algo que faz parte da sua rotina.",
        q7: "Você precisa pedir um pequeno adiamento com educação. Qual opção é mais adequada?",
        o7: [["Potremmo discutere una breve proroga per questo compito?", 4], ["Mi serve più tempo, quindi cambiate la scadenza prevista.", 1], ["Questa scadenza è impossibile e deve essere sostituita.", 1]],
        q8: "« Il rapporto era preciso; tuttavia, è arrivato troppo tardi per essere utilizzato. » Qual leitura está correta?",
        o8: [["O relatório estava correto, mas o atraso impediu seu uso.", 4], ["O relatório foi usado apesar de conter vários erros.", 1], ["O relatório chegou cedo, porém estava incompleto.", 0]],
        q9: "Complete: Se il gruppo avesse provato l’aggiornamento, ___ l’errore prima.",
        o9: [["avrebbe individuato", 4], ["individuerebbe", 1], ["aveva individuato", 2]],
        p2: "Conte em italiano uma situação recente, explique o que ocorreu e como você reagiu.",
        q11: "Em uma reunião, qual resposta expressa discordância de modo colaborativo?",
        o11: [["Capisco l’obiettivo, ma potremmo confrontarlo con un altro approccio?", 4], ["Non sono d’accordo perché questa proposta non ha alcun senso.", 1], ["La sua idea non è quella che dovremmo usare in questo progetto.", 1]],
        p3: "Defenda uma opinião em italiano, apresente uma razão, um exemplo e reconheça um possível contraponto."
    }),
    es: q("es", {
        q1: "Você recebe: « Voy a llegar un poco tarde. » O que a pessoa informou?",
        o1: [["Ela chegará com um pequeno atraso.", 4], ["Ela precisará sair um pouco antes.", 1], ["Ela já chegou ao local combinado.", 0]],
        q2: "Você quer saber se uma cadeira está livre. Qual pergunta combina com a situação?",
        o2: [["¿Te sientas aquí todos los días?", 1], ["¿Está libre este asiento?", 4], ["¿Estás buscando precisamente esta silla?", 1]],
        q3: "Complete: Mi hermano y yo ___ cerca de la universidad.",
        o3: [["vive", 0], ["vivimos", 4], ["vivís", 1]],
        q4: "« Maya perdió el autobús, así que llamó a un taxi. » O que aconteceu depois?",
        o4: [["Ela chamou um táxi para continuar.", 4], ["Ela esperou outro ônibus no local.", 1], ["Ela telefonou para cancelar a viagem.", 0]],
        q5: "Complete: Conozco a Daniel ___ que éramos niños.",
        o5: [["desde", 4], ["por", 1], ["durante", 0]],
        p1: "Apresente-se em espanhol e mencione algo que faz parte da sua rotina.",
        q7: "Você precisa pedir um pequeno adiamento com educação. Qual opção é mais adequada?",
        o7: [["¿Podríamos hablar de una breve ampliación del plazo?", 4], ["Necesito más tiempo, así que cambie la fecha prevista.", 1], ["Este plazo es imposible y debe ser sustituido ahora.", 1]],
        q8: "« El informe era preciso; sin embargo, llegó demasiado tarde para utilizarlo. » Qual leitura está correta?",
        o8: [["O relatório estava correto, mas o atraso impediu seu uso.", 4], ["O relatório foi usado apesar de conter vários erros.", 1], ["O relatório chegou cedo, porém estava incompleto.", 0]],
        q9: "Complete: Si el equipo hubiera probado la actualización, ___ el error antes.",
        o9: [["habría detectado", 4], ["detectaría", 1], ["había detectado", 2]],
        p2: "Conte em espanhol uma situação recente, explique o que ocorreu e como você reagiu.",
        q11: "Em uma reunião, qual resposta expressa discordância de forma colaborativa?",
        o11: [["Entiendo el objetivo, pero ¿podríamos compararlo con otro enfoque?", 4], ["No estoy de acuerdo porque esta propuesta no tiene ningún sentido.", 1], ["Su idea no es la que deberíamos usar en este proyecto.", 1]],
        p3: "Defenda uma opinião em espanhol, apresente uma razão, um exemplo e reconheça um possível contraponto."
    })
};

export function getDiagnosticQuestions(languageCode) {
    return DIAGNOSTIC_BANK[String(languageCode ?? "").toLowerCase()] || [];
}
