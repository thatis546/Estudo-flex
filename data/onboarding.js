export const ONBOARDING_TUTORIAL_STEPS = Object.freeze([
    {
        icon: "☝️",
        title: "Escolha uma opção",
        description: "As respostas aparecem em cartões. Você pode trocar de opção antes de confirmar."
    },
    {
        icon: "✓",
        title: "Confirme antes de enviar",
        description: "Nada será salvo no primeiro clique. Revise a escolha e toque em “Confirmar resposta”."
    },
    {
        icon: "↩",
        title: "Volte ou continue depois",
        description: "Use Voltar para corrigir uma etapa ou pause a configuração e retome pela Home."
    }
]);

export const SUPPORT_OPTIONS = Object.freeze([
    { value: "pt", label: "Quero tudo explicado em português" },
    { value: "guided", label: "Quero frases curtas no idioma com tradução rápida" },
    { value: "immersive", label: "Pode usar mais o idioma e me ajudar quando eu travar" }
]);

export const PURPOSE_OPTIONS = Object.freeze([
    {
        value: "study",
        label: "Estudar, fazer intercâmbio ou acompanhar uma formação",
        lifeContext: "university",
        goalDescription: "Estudar e acompanhar aulas, projetos, avaliações e conversas acadêmicas.",
        useCase: "Universidade, cursos, trabalhos acadêmicos e convivência com colegas."
    },
    {
        value: "work",
        label: "Trabalhar, crescer na carreira ou atender pessoas",
        lifeContext: "work",
        goalDescription: "Usar o idioma com segurança em atividades profissionais e oportunidades de carreira.",
        useCase: "Reuniões, entrevistas, apresentações, e-mails e situações de trabalho."
    },
    {
        value: "travel",
        label: "Viajar com mais autonomia",
        lifeContext: "travel",
        goalDescription: "Viajar com autonomia e conseguir resolver situações práticas sem depender de tradução constante.",
        useCase: "Aeroporto, hospedagem, transporte, alimentação, compras e conversas durante viagens."
    },
    {
        value: "relocation",
        label: "Morar ou me preparar para viver em outro país",
        lifeContext: "immigration",
        goalDescription: "Preparar-se para morar em outro país e lidar com a vida cotidiana no idioma.",
        useCase: "Moradia, documentos, saúde, serviços, trabalho, estudos e integração social."
    },
    {
        value: "conversation",
        label: "Conversar com família, amigos ou pessoas importantes",
        lifeContext: "family",
        goalDescription: "Criar vínculos e participar de conversas com pessoas importantes usando o idioma.",
        useCase: "Conversas pessoais, encontros, mensagens, chamadas e convivência com família ou amigos."
    },
    {
        value: "culture",
        label: "Entender filmes, músicas, livros e cultura",
        lifeContext: "daily",
        goalDescription: "Aproveitar conteúdos culturais no idioma com cada vez menos dependência de tradução.",
        useCase: "Filmes, séries, músicas, livros, jogos, notícias e comunidades de interesse."
    },
    {
        value: "discover",
        label: "Ainda estou descobrindo para que quero usar esta língua",
        lifeContext: "discover",
        goalDescription: "Explorar possibilidades de uso até encontrar objetivos mais específicos.",
        useCase: "Atividades variadas para descobrir quais contextos são mais relevantes."
    }
]);

export const CONTACT_OPTIONS = Object.freeze([
    { value: "never", label: "Nunca estudei e quase não reconheço palavras" },
    { value: "basics", label: "Reconheço cumprimentos e algumas palavras isoladas" },
    { value: "sometimes", label: "Entendo frases simples, mas ainda produzo pouco" },
    { value: "frequent", label: "Consigo conversar sobre assuntos conhecidos" },
    { value: "advanced", label: "Uso o idioma com frequência para conversar ou escrever" }
]);

export const DAILY_MINUTES_OPTIONS = Object.freeze([
    { value: 10, label: "10 minutos" },
    { value: 15, label: "15 minutos" },
    { value: 20, label: "20 minutos" },
    { value: 30, label: "30 minutos" },
    { value: 45, label: "45 minutos" },
    { value: 60, label: "1 hora" }
]);

export const LEARNING_STYLE_OPTIONS = Object.freeze([
    { value: "visual", label: "Aprendo melhor vendo imagens, exemplos e esquemas" },
    { value: "auditory", label: "Aprendo melhor ouvindo e repetindo" },
    { value: "reading", label: "Aprendo melhor lendo e escrevendo" },
    { value: "practice", label: "Aprendo melhor fazendo atividades práticas" },
    { value: "mixed", label: "Gosto de misturar diferentes formas de aprender" },
    { value: "discover", label: "Ainda não sei; quero que o aplicativo descubra comigo" }
]);

export const ONBOARDING_FLOW = Object.freeze([
    "language",
    "supportMode",
    "goal",
    "contact",
    "dailyMinutes",
    "learningStyle"
]);

export function getOnboardingOption(options, value) {
    return options.find((item) => String(item.value) === String(value)) || null;
}

export function getPurposeOption(value) {
    return getOnboardingOption(PURPOSE_OPTIONS, value);
}

export function buildPurposeProfile(value) {
    const option = getPurposeOption(value);
    if (!option) {
        return {
            goal: "",
            goalDescription: "",
            useCase: "",
            lifeContext: ""
        };
    }
    return {
        goal: option.value,
        goalDescription: option.goalDescription,
        useCase: option.useCase,
        lifeContext: option.lifeContext
    };
}
