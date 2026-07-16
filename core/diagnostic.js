import { getJourneyLabel } from "../data/journeys.js";

function normalize(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function countWords(value) {
    return String(value ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function noPreviousContact(value) {
    return ["never", "nunca", "jamais", "nie", "mai", "ninguno", "nenhum"].includes(normalize(value));
}

function scoreTextAnswer(answer, question) {
    const words = countWords(answer);
    const target = Math.max(4, Number(question?.minimumWords) || 8);
    if (!words) return 0;
    if (words >= target) return 4;
    if (words >= Math.ceil(target * 0.65)) return 3;
    if (words >= Math.ceil(target * 0.35)) return 2;
    return 1;
}

function categoryLabel(category) {
    return {
        vocabulary: "Vocabulário essencial",
        grammar: "Estruturas e construção de frases",
        comprehension: "Compreensão de mensagens",
        context: "Uso do idioma em situações reais",
        register: "Adequação e comunicação diplomática",
        production: "Produção própria"
    }[category] || category;
}

/**
 * Avaliação inicial do Estudo Flex.
 *
 * A jornada não equivale diretamente ao CEFR e não é uma certificação.
 * “Vivendo o idioma” nunca é concedido em um único diagnóstico: exige
 * evidências longitudinais de uso real registradas no Perfil Vivo.
 */
export function evaluateLanguageDiagnostic({ questions = [], answers = [], scores = [], contact = "" } = {}) {
    const safeQuestions = Array.isArray(questions) ? questions : [];
    const safeAnswers = Array.isArray(answers) ? answers : [];
    const providedScores = Array.isArray(scores) ? scores : [];

    const evidence = safeQuestions.map((question, index) => {
        const answer = safeAnswers[index] ?? "";
        const score = question?.type === "text"
            ? scoreTextAnswer(answer, question)
            : Math.max(0, Math.min(4, Number(providedScores[index]) || 0));
        return {
            id: question?.id || `q-${index + 1}`,
            category: question?.category || "general",
            difficulty: Math.max(1, Math.min(5, Number(question?.difficulty) || 1)),
            score,
            answered: Boolean(String(answer).trim()),
            words: question?.type === "text" ? countWords(answer) : 0
        };
    });

    const answered = evidence.filter((item) => item.answered).length;
    const totalPoints = evidence.reduce((sum, item) => sum + item.score, 0);
    const maximumPoints = Math.max(1, evidence.length * 4);
    const ratio = totalPoints / maximumPoints;
    const categoryScores = {};
    evidence.forEach((item) => {
        const bucket = categoryScores[item.category] || { points: 0, maximum: 0, answered: 0 };
        bucket.points += item.score;
        bucket.maximum += 4;
        bucket.answered += item.answered ? 1 : 0;
        categoryScores[item.category] = bucket;
    });

    const production = evidence.filter((item) => item.category === "production");
    const productionWords = production.reduce((sum, item) => sum + item.words, 0);
    const developedProductions = production.filter((item) => item.score >= 3).length;
    const advancedEvidence = evidence.filter((item) => item.difficulty >= 4 && item.score >= 3).length;
    const basicEvidence = evidence.filter((item) => item.difficulty <= 2 && item.score >= 3).length;
    const completionRatio = evidence.length ? answered / evidence.length : 0;

    let journeyId = "explorando";
    if (completionRatio >= 0.75 && ratio >= 0.28 && basicEvidence >= 3 && productionWords >= 4) {
        journeyId = "descobrindo";
    }
    if (completionRatio >= 0.9 && ratio >= 0.52 && basicEvidence >= 5 && developedProductions >= 1 && productionWords >= 12) {
        journeyId = "construindo";
    }
    if (
        completionRatio >= 0.95 &&
        ratio >= 0.72 &&
        advancedEvidence >= 3 &&
        developedProductions >= 2 &&
        productionWords >= 35 &&
        !noPreviousContact(contact)
    ) {
        journeyId = "conectando";
    }

    const categories = Object.entries(categoryScores).map(([category, values]) => ({
        category,
        ratio: values.maximum ? values.points / values.maximum : 0,
        answered: values.answered
    }));
    const strengths = categories.filter((item) => item.ratio >= 0.7).map((item) => categoryLabel(item.category));
    const developmentAreas = categories.filter((item) => item.ratio < 0.55).map((item) => categoryLabel(item.category));
    if (journeyId === "explorando" && !strengths.length) strengths.push("Disponibilidade para iniciar a jornada");
    if (noPreviousContact(contact)) developmentAreas.push("Contato prático e familiaridade com o idioma");

    const confidence = Number(Math.min(
        journeyId === "conectando" ? 0.78 : 0.86,
        0.28 + completionRatio * 0.34 + Math.min(0.2, evidence.length / 60) + (productionWords >= 12 ? 0.08 : 0)
    ).toFixed(2));

    return {
        journeyId,
        journeyLabel: getJourneyLabel(journeyId),
        score: totalPoints,
        maximumScore: maximumPoints,
        scoreRatio: Number(ratio.toFixed(3)),
        confidence,
        strengths: [...new Set(strengths)],
        developmentAreas: [...new Set(developmentAreas)],
        answeredQuestions: answered,
        evidence: {
            totalQuestions: evidence.length,
            completionRatio: Number(completionRatio.toFixed(3)),
            basicEvidence,
            advancedEvidence,
            productionWords,
            developedProductions,
            categories: categoryScores,
            answers: evidence
        }
    };
}

export function scoreDiagnosticAnswer(question, answer, selectedPoints = 0) {
    return question?.type === "text"
        ? scoreTextAnswer(answer, question)
        : Math.max(0, Math.min(4, Number(selectedPoints) || 0));
}

// Compatibilidade com chamadas antigas; resultado deliberadamente conservador.
export function evaluateShortDiagnostic(scores = [], totalQuestions = scores.length) {
    const questions = Array.from({ length: Math.max(0, Number(totalQuestions) || 0) }, (_, index) => ({
        id: `legacy-${index + 1}`,
        type: "choice",
        category: "general",
        difficulty: 1
    }));
    return evaluateLanguageDiagnostic({ questions, answers: scores.map(() => "respondida"), scores, contact: "" });
}
