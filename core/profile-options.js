import { EF_LANGUAGES } from "../data/languages.js";

const FALLBACK_LABELS = {
    goal: {
        Travel: "Viagem",
        Work: "Trabalho",
        Study: "Estudos",
        Conversation: "Conversação"
    },
    contact: {
        Never: "Nunca",
        Sometimes: "Às vezes",
        Frequently: "Frequentemente"
    },
    lifeContext: {
        Work: "Trabalho",
        College: "Faculdade",
        Travel: "Viagens",
        "Daily life": "Dia a dia"
    },
    learningStyle: {
        Visual: "Visual",
        Listening: "Auditivo",
        Reading: "Leitura",
        Practice: "Prática"
    }
};

export function getProfileOptionLabel(languageCode, field, value) {
    const normalizedValue = String(value ?? "").trim();
    if (!normalizedValue) return "";

    const language = EF_LANGUAGES[String(languageCode ?? "").trim().toLowerCase()];
    const sourceOptions = Array.isArray(language?.options?.[field])
        ? language.options[field]
        : [];
    const translatedOptions = Array.isArray(language?.ptOptions?.[field])
        ? language.ptOptions[field]
        : [];
    const index = sourceOptions.findIndex((option) => String(option) === normalizedValue);

    if (index >= 0 && translatedOptions[index]) {
        return translatedOptions[index];
    }

    return FALLBACK_LABELS[field]?.[normalizedValue] || normalizedValue;
}
