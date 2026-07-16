export const COMMUNICATION_MODULES = [
    {
        id: "pronunciation",
        icon: "🗣️",
        title: "Pronúncia e sons",
        description: "Trabalha sons-alvo, pares mínimos e inteligibilidade.",
        prompt: "Fale por pelo menos 30 segundos sobre como foi o seu dia, articulando cada palavra com calma.",
        metrics: ["transcrição", "clareza percebida", "palavras reconhecidas"]
    },
    {
        id: "projection",
        icon: "📣",
        title: "Projeção e presença de voz",
        description: "Treina volume estável, apoio respiratório e presença.",
        prompt: "Apresente uma ideia como se estivesse falando para uma pequena sala, mantendo volume estável.",
        metrics: ["volume médio", "variação de volume", "tempo de fala"]
    },
    {
        id: "clarity",
        icon: "💎",
        title: "Clareza e articulação",
        description: "Organiza a mensagem e reduz trechos pouco compreensíveis.",
        prompt: "Explique um processo simples em três etapas: começo, desenvolvimento e resultado.",
        metrics: ["estrutura", "frases completas", "densidade de informação"]
    },
    {
        id: "rhythm",
        icon: "⏱️",
        title: "Ritmo, pausas e velocidade",
        description: "Equilibra velocidade, silêncio e respiração.",
        prompt: "Conte uma história curta, usando pausas naturais entre as ideias.",
        metrics: ["palavras por minuto", "pausas", "duração"]
    },
    {
        id: "fillers",
        icon: "🧹",
        title: "Vícios e muletas",
        description: "Identifica termos de preenchimento e hesitações repetidas.",
        prompt: "Dê sua opinião sobre um tema de que gosta sem preparar um roteiro.",
        metrics: ["muletas", "hesitações", "frequência por minuto"]
    },
    {
        id: "repetition",
        icon: "🔁",
        title: "Repetição e variedade lexical",
        description: "Mostra palavras excessivamente repetidas e sugere variedade.",
        prompt: "Descreva um lugar importante para você usando detalhes e exemplos.",
        metrics: ["palavras repetidas", "variedade lexical", "vocabulário ativo"]
    },
    {
        id: "intonation",
        icon: "🎼",
        title: "Entonação e expressividade",
        description: "Treina ênfase, intenção e expressividade.",
        prompt: "Conte uma notícia boa e depois uma preocupação, mudando a intenção da voz.",
        metrics: ["variação de energia", "ênfase", "expressividade"]
    },
    {
        id: "professional",
        icon: "💼",
        title: "Oratória profissional",
        description: "Pratica apresentações, reuniões e comunicação assertiva.",
        prompt: "Apresente um resultado profissional, explique seu impacto e proponha um próximo passo.",
        metrics: ["objetividade", "estrutura", "clareza profissional"]
    }
];

export function getCommunicationModule(id) {
    return COMMUNICATION_MODULES.find((module) => module.id === id) || COMMUNICATION_MODULES[0];
}
