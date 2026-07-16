export const EF_LANGUAGES = {
    en: {
        name: "Inglês",
        flag: "🇬🇧",
        country: "Reino Unido",
        mentor: "Emily",

        questions: {
            goal: "What is your main goal with English?",
            contact: "How often do you practice English?",
            dailyMinutes: "How many minutes can you study each day?",
            lifeContext: "Where do you want to use English?",
            learningStyle: "How do you learn best?"
        },

        ptQuestions: {
            goal: "Qual é seu principal objetivo com o inglês?",
            contact: "Com que frequência você pratica inglês?",
            dailyMinutes: "Quantos minutos você pode estudar por dia?",
            lifeContext: "Onde pretende usar o inglês?",
            learningStyle: "Como você aprende melhor?"
        },

        options: {
            goal: [
                "Travel",
                "Work",
                "Study",
                "Conversation"
            ],

            contact: [
                "Never",
                "Sometimes",
                "Frequently"
            ],

            dailyMinutes: [
                "10",
                "20",
                "30",
                "60"
            ],

            lifeContext: [
                "Work",
                "College",
                "Travel",
                "Daily life"
            ],

            learningStyle: [
                "Visual",
                "Listening",
                "Reading",
                "Practice"
            ]
        },

        ptOptions: {
            goal: [
                "Viagem",
                "Trabalho",
                "Estudos",
                "Conversação"
            ],

            contact: [
                "Nunca",
                "Às vezes",
                "Frequentemente"
            ],

            dailyMinutes: [
                "10 minutos",
                "20 minutos",
                "30 minutos",
                "1 hora"
            ],

            lifeContext: [
                "Trabalho",
                "Faculdade",
                "Viagens",
                "Dia a dia"
            ],

            learningStyle: [
                "Visual",
                "Auditivo",
                "Leitura",
                "Prática"
            ]
        },

        diagnostic: [
            {
                title: "Vocabulário",
                prompt: "Como se diz 'Bom dia' em inglês?",
                type: "choice",

                options: [
                    ["Good morning", 3],
                    ["Good night", 1],
                    ["Good afternoon", 2]
                ]
            },

            {
                title: "Gramática",
                prompt: "Complete: She ____ a student.",
                type: "choice",

                options: [
                    ["is", 3],
                    ["are", 1],
                    ["am", 1]
                ]
            },

            {
                title: "Produção",
                prompt: "Escreva uma frase curta em inglês.",
                type: "text"
            }
        ]
    },

    fr: {
        name: "Francês",
        flag: "🇫🇷",
        country: "França",
        mentor: "Sophie",

        questions: {
            goal: "Quel est votre objectif principal avec le français ?",
            contact: "À quelle fréquence pratiquez-vous le français ?",
            dailyMinutes: "Combien de minutes pouvez-vous étudier chaque jour ?",
            lifeContext: "Où souhaitez-vous utiliser le français ?",
            learningStyle: "Comment apprenez-vous le mieux ?"
        },

        ptQuestions: {
            goal: "Qual é seu principal objetivo com o francês?",
            contact: "Com que frequência você pratica francês?",
            dailyMinutes: "Quantos minutos você pode estudar por dia?",
            lifeContext: "Onde pretende usar o francês?",
            learningStyle: "Como você aprende melhor?"
        },

        options: {
            goal: [
                "Voyage",
                "Travail",
                "Études",
                "Conversation"
            ],

            contact: [
                "Jamais",
                "Parfois",
                "Souvent"
            ],

            dailyMinutes: [
                "10",
                "20",
                "30",
                "60"
            ],

            lifeContext: [
                "Travail",
                "Université",
                "Voyages",
                "Vie quotidienne"
            ],

            learningStyle: [
                "Visuel",
                "Écoute",
                "Lecture",
                "Pratique"
            ]
        },

        ptOptions: {
            goal: [
                "Viagem",
                "Trabalho",
                "Estudos",
                "Conversação"
            ],

            contact: [
                "Nunca",
                "Às vezes",
                "Frequentemente"
            ],

            dailyMinutes: [
                "10 minutos",
                "20 minutos",
                "30 minutos",
                "1 hora"
            ],

            lifeContext: [
                "Trabalho",
                "Universidade",
                "Viagens",
                "Dia a dia"
            ],

            learningStyle: [
                "Visual",
                "Auditivo",
                "Leitura",
                "Prática"
            ]
        },

        diagnostic: [
            {
                title: "Vocabulário",
                prompt: "Como se diz 'Olá' em francês?",
                type: "choice",

                options: [
                    ["Bonjour", 3],
                    ["Bonsoir", 2],
                    ["Merci", 1]
                ]
            },

            {
                title: "Gramática",
                prompt: "Complete: Je ____ étudiant.",
                type: "choice",

                options: [
                    ["suis", 3],
                    ["es", 1],
                    ["est", 1]
                ]
            },

            {
                title: "Produção",
                prompt: "Escreva uma frase curta em francês.",
                type: "text"
            }
        ]
    },

    de: {
        name: "Alemão",
        flag: "🇩🇪",
        country: "Alemanha",
        mentor: "Lukas",

        questions: {
            goal: "Was ist dein Hauptziel mit Deutsch?",
            contact: "Wie oft übst du Deutsch?",
            dailyMinutes: "Wie viele Minuten kannst du jeden Tag lernen?",
            lifeContext: "Wo möchtest du Deutsch verwenden?",
            learningStyle: "Wie lernst du am besten?"
        },

        ptQuestions: {
            goal: "Qual é seu principal objetivo com o alemão?",
            contact: "Com que frequência você pratica alemão?",
            dailyMinutes: "Quantos minutos você pode estudar por dia?",
            lifeContext: "Onde pretende usar o alemão?",
            learningStyle: "Como você aprende melhor?"
        },

        options: {
            goal: [
                "Reisen",
                "Arbeit",
                "Studium",
                "Konversation"
            ],

            contact: [
                "Nie",
                "Manchmal",
                "Häufig"
            ],

            dailyMinutes: [
                "10",
                "20",
                "30",
                "60"
            ],

            lifeContext: [
                "Arbeit",
                "Universität",
                "Reisen",
                "Alltag"
            ],

            learningStyle: [
                "Visuell",
                "Hören",
                "Lesen",
                "Üben"
            ]
        },

        ptOptions: {
            goal: [
                "Viagem",
                "Trabalho",
                "Estudos",
                "Conversação"
            ],

            contact: [
                "Nunca",
                "Às vezes",
                "Frequentemente"
            ],

            dailyMinutes: [
                "10 minutos",
                "20 minutos",
                "30 minutos",
                "1 hora"
            ],

            lifeContext: [
                "Trabalho",
                "Universidade",
                "Viagens",
                "Dia a dia"
            ],

            learningStyle: [
                "Visual",
                "Auditivo",
                "Leitura",
                "Prática"
            ]
        },

        diagnostic: [
            {
                title: "Vocabulário",
                prompt: "Como se diz 'Bom dia' em alemão?",
                type: "choice",

                options: [
                    ["Guten Morgen", 3],
                    ["Gute Nacht", 1],
                    ["Guten Abend", 2]
                ]
            },

            {
                title: "Gramática",
                prompt: "Complete: Ich ____ Student.",
                type: "choice",

                options: [
                    ["bin", 3],
                    ["bist", 1],
                    ["ist", 1]
                ]
            },

            {
                title: "Produção",
                prompt: "Escreva uma frase curta em alemão.",
                type: "text"
            }
        ]
    },

    it: {
        name: "Italiano",
        flag: "🇮🇹",
        country: "Itália",
        mentor: "Giulia",

        questions: {
            goal: "Qual è il tuo obiettivo principale con l'italiano?",
            contact: "Con quale frequenza pratichi l'italiano?",
            dailyMinutes: "Quanti minuti puoi studiare ogni giorno?",
            lifeContext: "Dove vuoi usare l'italiano?",
            learningStyle: "Come impari meglio?"
        },

        ptQuestions: {
            goal: "Qual é seu principal objetivo com o italiano?",
            contact: "Com que frequência você pratica italiano?",
            dailyMinutes: "Quantos minutos você pode estudar por dia?",
            lifeContext: "Onde pretende usar o italiano?",
            learningStyle: "Como você aprende melhor?"
        },

        options: {
            goal: [
                "Viaggi",
                "Lavoro",
                "Studio",
                "Conversazione"
            ],

            contact: [
                "Mai",
                "A volte",
                "Spesso"
            ],

            dailyMinutes: [
                "10",
                "20",
                "30",
                "60"
            ],

            lifeContext: [
                "Lavoro",
                "Università",
                "Viaggi",
                "Vita quotidiana"
            ],

            learningStyle: [
                "Visivo",
                "Ascolto",
                "Lettura",
                "Pratica"
            ]
        },

        ptOptions: {
            goal: [
                "Viagem",
                "Trabalho",
                "Estudos",
                "Conversação"
            ],

            contact: [
                "Nunca",
                "Às vezes",
                "Frequentemente"
            ],

            dailyMinutes: [
                "10 minutos",
                "20 minutos",
                "30 minutos",
                "1 hora"
            ],

            lifeContext: [
                "Trabalho",
                "Universidade",
                "Viagens",
                "Dia a dia"
            ],

            learningStyle: [
                "Visual",
                "Auditivo",
                "Leitura",
                "Prática"
            ]
        },

        diagnostic: [
            {
                title: "Vocabulário",
                prompt: "Como se diz 'Bom dia' em italiano?",
                type: "choice",

                options: [
                    ["Buongiorno", 3],
                    ["Buonanotte", 1],
                    ["Buonasera", 2]
                ]
            },

            {
                title: "Gramática",
                prompt: "Complete: Io ____ studente.",
                type: "choice",

                options: [
                    ["sono", 3],
                    ["sei", 1],
                    ["è", 1]
                ]
            },

            {
                title: "Produção",
                prompt: "Escreva uma frase curta em italiano.",
                type: "text"
            }
        ]
    },

    es: {
        name: "Espanhol",
        flag: "🇪🇸",
        country: "Espanha",
        mentor: "Carlos",

        questions: {
            goal: "¿Cuál es tu principal objetivo con el español?",
            contact: "¿Con qué frecuencia practicas español?",
            dailyMinutes: "¿Cuántos minutos puedes estudiar al día?",
            lifeContext: "¿Dónde quieres usar el español?",
            learningStyle: "¿Cómo aprendes mejor?"
        },

        ptQuestions: {
            goal: "Qual é seu principal objetivo com o espanhol?",
            contact: "Com que frequência você pratica espanhol?",
            dailyMinutes: "Quantos minutos você pode estudar por dia?",
            lifeContext: "Onde pretende usar o espanhol?",
            learningStyle: "Como você aprende melhor?"
        },

        options: {
            goal: [
                "Viajes",
                "Trabajo",
                "Estudios",
                "Conversación"
            ],

            contact: [
                "Nunca",
                "A veces",
                "Frecuentemente"
            ],

            dailyMinutes: [
                "10",
                "20",
                "30",
                "60"
            ],

            lifeContext: [
                "Trabajo",
                "Universidad",
                "Viajes",
                "Vida cotidiana"
            ],

            learningStyle: [
                "Visual",
                "Auditivo",
                "Lectura",
                "Práctica"
            ]
        },

        ptOptions: {
            goal: [
                "Viagem",
                "Trabalho",
                "Estudos",
                "Conversação"
            ],

            contact: [
                "Nunca",
                "Às vezes",
                "Frequentemente"
            ],

            dailyMinutes: [
                "10 minutos",
                "20 minutos",
                "30 minutos",
                "1 hora"
            ],

            lifeContext: [
                "Trabalho",
                "Universidade",
                "Viagens",
                "Dia a dia"
            ],

            learningStyle: [
                "Visual",
                "Auditivo",
                "Leitura",
                "Prática"
            ]
        },

        diagnostic: [
            {
                title: "Vocabulário",
                prompt: "Como se diz 'Bom dia' em espanhol?",
                type: "choice",

                options: [
                    ["Buenos días", 3],
                    ["Buenas noches", 1],
                    ["Buenas tardes", 2]
                ]
            },

            {
                title: "Gramática",
                prompt: "Complete: Yo ____ estudiante.",
                type: "choice",

                options: [
                    ["soy", 3],
                    ["eres", 1],
                    ["es", 1]
                ]
            },

            {
                title: "Produção",
                prompt: "Escreva uma frase curta em espanhol.",
                type: "text"
            }
        ]
    }
};
