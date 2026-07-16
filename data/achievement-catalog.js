/**
 * Catálogo de conquistas do Estudo Flex Languages.
 *
 * Cada conquista pode ser liberada por:
 * - event: evento específico do produto;
 * - metric + target: valor numérico acumulado;
 * - metric + value: valor exato.
 */
export const ACHIEVEMENT_CATALOG = [
    {
        id: "first_steps",
        title: "Primeiros Passos",
        description:
            "Você completou o onboarding inicial. Bem-vindo!",
        icon: "🚀",
        xp: 50,
        category: "onboarding",
        type: "milestone",
        scope: "global",
        requirement: {
            event: "onboarding-completed"
        }
    },
    {
        id: "streak_3",
        title: "Ritmo Inicial",
        description:
            "Manteve uma sequência de 3 dias de estudo.",
        icon: "🔥",
        xp: 100,
        category: "consistency",
        type: "streak",
        scope: "global",
        requirement: {
            metric: "streakDays",
            target: 3
        }
    },
    {
        id: "streak_7",
        title: "Estudante Dedicado",
        description:
            "Concluiu atividades em sete dias de estudo.",
        icon: "📅",
        xp: 250,
        category: "consistency",
        type: "streak",
        scope: "global",
        requirement: {
            metric: "streakDays",
            target: 7
        }
    },
    {
        id: "pro_explorer",
        title: "Explorador Profissional",
        description:
            "Iniciou sua primeira trilha profissional.",
        icon: "💼",
        xp: 150,
        category: "professional",
        type: "challenge",
        scope: "global",
        requirement: {
            event: "professional-track-started"
        }
    },
    {
        id: "fluent_future",
        title: "Primeira Conversa",
        description:
            "Concluiu sua primeira sessão de fala neste idioma.",
        icon: "🗣️",
        xp: 200,
        category: "speaking",
        type: "learning",
        scope: "language",
        requirement: {
            event: "conversation-completed"
        }
    },
    {
        id: "conversation_15_minutes",
        title: "Voz em Movimento",
        description:
            "Acumulou 15 minutos de prática de fala neste idioma.",
        icon: "🎙️",
        xp: 250,
        category: "speaking",
        type: "milestone",
        scope: "language",
        requirement: {
            metric: "conversationMinutes",
            target: 15
        }
    },
    {
        id: "polyglot_rookie",
        title: "Poliglota Iniciante",
        description:
            "Adicionou seu segundo idioma ao passaporte.",
        icon: "🌍",
        xp: 300,
        category: "passport",
        type: "experience",
        scope: "global",
        requirement: {
            metric: "languagesCount",
            target: 2
        }
    }
];

export function getAchievementById(id) {
    return ACHIEVEMENT_CATALOG.find(
        (achievement) => achievement.id === id
    ) || null;
}
