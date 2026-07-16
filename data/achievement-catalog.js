/**
 * Conquistas são registros de marcos, não uma moeda. Por decisão de produto,
 * nenhuma entrada deste catálogo concede XP automaticamente. O XP é concedido
 * apenas por atividades concluídas através do ledger idempotente.
 */
export const ACHIEVEMENT_CATALOG = [
    {
        id: "first_steps",
        title: "Primeiros passos",
        description: "Você concluiu a configuração inicial do Estudo Flex.",
        icon: "🚀",
        xp: 0,
        category: "onboarding",
        type: "milestone",
        scope: "global",
        requirement: { event: "onboarding-completed" }
    },
    {
        id: "streak_3",
        title: "Ritmo inicial",
        description: "Você concluiu atividades em três dias diferentes.",
        icon: "🔥",
        xp: 0,
        category: "consistência",
        type: "streak",
        scope: "global",
        requirement: { metric: "streakDays", target: 3 }
    },
    {
        id: "streak_7",
        title: "Estudante dedicado",
        description: "Você concluiu atividades em sete dias diferentes.",
        icon: "📅",
        xp: 0,
        category: "consistência",
        type: "streak",
        scope: "global",
        requirement: { metric: "streakDays", target: 7 }
    },
    {
        id: "pro_explorer",
        title: "Explorador profissional",
        description: "Você preparou sua primeira trilha profissional.",
        icon: "💼",
        xp: 0,
        category: "profissional",
        type: "milestone",
        scope: "language",
        requirement: { event: "professional-track-started" }
    },
    {
        id: "first_communication_lab",
        title: "Primeira análise de oratória",
        description: "Você concluiu sua primeira sessão no Communication Lab.",
        icon: "🎙️",
        xp: 0,
        category: "oratória",
        type: "learning",
        scope: "language",
        requirement: { event: "communication-lab-completed" }
    },
    {
        id: "communication_15_minutes",
        title: "Voz em movimento",
        description: "Você acumulou quinze minutos de treino técnico de fala.",
        icon: "🗣️",
        xp: 0,
        category: "oratória",
        type: "milestone",
        scope: "language",
        requirement: { metric: "communicationMinutes", target: 15 }
    },
    {
        id: "polyglot_rookie",
        title: "Novos horizontes",
        description: "Você iniciou a configuração de um segundo idioma.",
        icon: "🌍",
        xp: 0,
        category: "passaporte",
        type: "experience",
        scope: "global",
        requirement: { metric: "languagesCount", target: 2 }
    }
];

export function getAchievementById(id) {
    return ACHIEVEMENT_CATALOG.find((achievement) => achievement.id === id) || null;
}
