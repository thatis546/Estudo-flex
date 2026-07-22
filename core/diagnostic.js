import { getJourneyLabel } from "../data/journeys.js";

function normalize(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(value) {
    return normalize(value)
        .replace(/[^a-zA-ZÀ-ÿß'’-]+/g, " ")
        .split(/\s+/)
        .filter(Boolean);
}

function countWords(value) { return tokenize(value).length; }

function noPreviousContact(value) {
    return ["never", "nunca", "jamais", "nie", "mai", "ninguno", "nenhum"].includes(normalize(value));
}

const LANGUAGE_MARKERS = Object.freeze({
    en: ["i", "am", "is", "are", "the", "and", "because", "have", "my", "with", "was", "would", "can"],
    fr: ["je", "suis", "est", "le", "la", "et", "parce", "avec", "mon", "une", "dans", "mais", "peux"],
    de: ["ich", "bin", "ist", "der", "die", "das", "und", "weil", "mit", "mein", "aber", "kann", "habe"],
    it: ["io", "sono", "è", "il", "la", "e", "perché", "con", "mio", "una", "ma", "posso", "ho"],
    es: ["yo", "soy", "es", "el", "la", "y", "porque", "con", "mi", "una", "pero", "puedo", "he"]
});

function languageCodeFromQuestion(question) {
    const prefix = String(question?.id || "").split("-")[0].toLowerCase();
    return LANGUAGE_MARKERS[prefix] ? prefix : "";
}

function scoreTextAnswer(answer, question) {
    const words = tokenize(answer);
    const total = words.length;
    if (!total) return 0;

    const unique = new Set(words).size;
    const diversity = unique / total;
    const target = Math.max(5, Number(question?.minimumWords) || 8);
    const languageCode = languageCodeFromQuestion(question);
    const markers = LANGUAGE_MARKERS[languageCode] || [];
    const markerCount = words.filter((word) => markers.includes(word)).length;
    const repeatedSingleWord = unique <= 2 && total >= 4;
    const mostlyPortuguese = languageCode && markerCount === 0 && total >= 5;

    if (repeatedSingleWord || mostlyPortuguese) return 1;

    let score = 1;
    if (total >= Math.ceil(target * 0.45) && diversity >= 0.55) score = 2;
    if (total >= Math.ceil(target * 0.8) && diversity >= 0.6 && markerCount >= 1) score = 3;
    if (total >= target && diversity >= 0.65 && markerCount >= 2) score = 4;

    // O avaliador local é deliberadamente conservador. Uma resposta longa não
    // recebe pontuação alta apenas por tamanho; ela precisa conter sinais do idioma.
    return score;
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
 * A jornada não equivale diretamente ao CEFR e não é uma certificação.
 * “Vivendo o idioma” exige evidências longitudinais e nunca é concedido aqui.
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
    if (completionRatio >= 0.83 && ratio >= 0.32 && basicEvidence >= 4 && productionWords >= 6) {
        journeyId = "descobrindo";
    }
    if (completionRatio >= 0.92 && ratio >= 0.56 && basicEvidence >= 5 && developedProductions >= 1 && productionWords >= 18) {
        journeyId = "construindo";
    }
    if (
        completionRatio >= 0.98 && ratio >= 0.76 && advancedEvidence >= 3 &&
        developedProductions >= 2 && productionWords >= 45 && !noPreviousContact(contact)
    ) {
        journeyId = "conectando";
    }

    const categories = Object.entries(categoryScores).map(([category, values]) => ({
        category,
        ratio: values.maximum ? values.points / values.maximum : 0,
        answered: values.answered
    }));
    const strengths = categories.filter((item) => item.ratio >= 0.72).map((item) => categoryLabel(item.category));
    const developmentAreas = categories.filter((item) => item.ratio < 0.58).map((item) => categoryLabel(item.category));
    if (journeyId === "explorando" && !strengths.length) strengths.push("Primeiras referências do idioma");
    if (noPreviousContact(contact)) developmentAreas.push("Contato prático e familiaridade com o idioma");

    const confidence = Number(Math.min(
        journeyId === "conectando" ? 0.78 : 0.84,
        0.25 + completionRatio * 0.35 + Math.min(0.16, evidence.length / 75) + (developedProductions >= 1 ? 0.06 : 0)
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

export function evaluateShortDiagnostic(scores = [], totalQuestions = scores.length) {
    const questions = Array.from({ length: Math.max(0, Number(totalQuestions) || 0) }, (_, index) => ({
        id: `legacy-${index + 1}`,
        type: "choice",
        category: "general",
        difficulty: 1
    }));
    return evaluateLanguageDiagnostic({ questions, answers: scores.map(() => "respondida"), scores, contact: "" });
}
