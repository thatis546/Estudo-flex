import {
    CONTACT_OPTIONS,
    LEARNING_STYLE_OPTIONS,
    PURPOSE_OPTIONS,
    getPurposeOption
} from "../data/onboarding.js";

function normalize(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

const GOAL_ALIASES = new Map([
    ["travel", "travel"], ["viagem", "travel"], ["voyage", "travel"], ["reisen", "travel"], ["viaggi", "travel"], ["viajes", "travel"],
    ["work", "work"], ["trabalho", "work"], ["travail", "work"], ["arbeit", "work"], ["lavoro", "work"], ["trabajo", "work"],
    ["study", "study"], ["estudo", "study"], ["estudos", "study"], ["etudes", "study"], ["studium", "study"], ["studio", "study"], ["estudios", "study"],
    ["conversation", "conversation"], ["conversacao", "conversation"], ["konversation", "conversation"], ["conversazione", "conversation"], ["conversacion", "conversation"],
    ["relocation", "relocation"], ["morar em outro pais", "relocation"], ["immigration", "relocation"], ["imigracao", "relocation"],
    ["culture", "culture"], ["cultura", "culture"], ["entertainment", "culture"], ["entretenimento", "culture"],
    ["discover", "discover"], ["ainda estou descobrindo", "discover"]
]);

const CONTACT_ALIASES = new Map([
    ["never", "never"], ["nunca", "never"], ["jamais", "never"], ["nie", "never"], ["mai", "never"],
    ["basics", "basics"], ["cumprimentos", "basics"], ["palavras e cumprimentos", "basics"],
    ["sometimes", "sometimes"], ["as vezes", "sometimes"], ["parfois", "sometimes"], ["manchmal", "sometimes"], ["a volte", "sometimes"],
    ["frequent", "frequent"], ["frequently", "frequent"], ["frequentemente", "frequent"], ["souvent", "frequent"], ["haufig", "frequent"], ["spesso", "frequent"],
    ["advanced", "advanced"], ["uso frequente", "advanced"]
]);

const CONTEXT_ALIASES = new Map([
    ["work", "work"], ["trabalho", "work"], ["travail", "work"], ["arbeit", "work"], ["lavoro", "work"], ["trabajo", "work"],
    ["college", "university"], ["faculdade", "university"], ["universidade", "university"], ["universite", "university"], ["universitat", "university"],
    ["travel", "travel"], ["viagem", "travel"], ["viagens", "travel"], ["voyages", "travel"], ["reisen", "travel"], ["viaggi", "travel"], ["viajes", "travel"],
    ["daily life", "daily"], ["dia a dia", "daily"], ["vie quotidienne", "daily"], ["alltag", "daily"], ["vita quotidiana", "daily"], ["vida diaria", "daily"],
    ["immigration", "immigration"], ["imigracao", "immigration"],
    ["family", "family"], ["familia", "family"],
    ["discover", "discover"]
]);

const STYLE_ALIASES = new Map([
    ["visual", "visual"], ["visuel", "visual"], ["visuell", "visual"], ["visivo", "visual"],
    ["listening", "auditory"], ["auditivo", "auditory"], ["ecoute", "auditory"], ["horen", "auditory"], ["ascolto", "auditory"], ["escucha", "auditory"],
    ["reading", "reading"], ["leitura", "reading"], ["lecture", "reading"], ["lesen", "reading"], ["lettura", "reading"], ["lectura", "reading"],
    ["practice", "practice"], ["pratica", "practice"], ["pratique", "practice"], ["uben", "practice"], ["pratica", "practice"],
    ["mixed", "mixed"], ["misto", "mixed"],
    ["discover", "discover"], ["descobrir depois", "discover"], ["ainda nao sei", "discover"]
]);

const LABELS = Object.freeze({
    goal: {
        travel: "Viagens",
        work: "Trabalho",
        study: "Estudos e formação",
        relocation: "Morar em outro país",
        conversation: "Conversação e relações pessoais",
        culture: "Cultura e entretenimento",
        discover: "Objetivo a descobrir"
    },
    contact: Object.fromEntries(CONTACT_OPTIONS.map((item) => [item.value, item.label])),
    learningStyle: {
        visual: "Visual",
        auditory: "Auditivo",
        reading: "Leitura e escrita",
        practice: "Prático",
        mixed: "Misto",
        discover: "A descobrir"
    },
    lifeContext: {
        work: "Trabalho",
        university: "Universidade e formação",
        travel: "Viagens",
        daily: "Cultura e dia a dia",
        immigration: "Moradia e integração em outro país",
        family: "Família e relações pessoais",
        discover: "A descobrir com o uso"
    }
});

export function canonicalizeProfileOption(field, value) {
    const normalized = normalize(value);
    if (!normalized) return "";
    if (field === "goal") return GOAL_ALIASES.get(normalized) || normalized;
    if (field === "contact") return CONTACT_ALIASES.get(normalized) || normalized;
    if (field === "lifeContext") return CONTEXT_ALIASES.get(normalized) || normalized;
    if (field === "learningStyle") return STYLE_ALIASES.get(normalized) || normalized;
    return String(value ?? "").trim();
}

export function getProfileOptionLabel(_languageCode, field, value) {
    const canonical = canonicalizeProfileOption(field, value);
    return LABELS[field]?.[canonical] || String(value ?? "").trim();
}

export function getPurposeSummary(value) {
    const canonical = canonicalizeProfileOption("goal", value);
    return getPurposeOption(canonical) || null;
}

export function getLearningStyleLabel(value) {
    return getProfileOptionLabel("", "learningStyle", value) || "Ainda não definido";
}
