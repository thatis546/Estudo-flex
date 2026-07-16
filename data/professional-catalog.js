/**
 * Catálogo de Trilhas Profissionais
 *
 * Estrutura:
 * - id: identificador único da trilha
 * - title: nome exibido
 * - description: resumo da trilha
 * - icon: ícone da área
 * - difficulty: nível recomendado para iniciar
 * - subareas: especializações disponíveis dentro da profissão
 */

export const PROFESSIONAL_CATALOG = [
    {
        id: "business",
        title: "Negócios e Administração",
        description:
            "Comunicação para reuniões, liderança, planejamento estratégico e rotina empresarial.",
        icon: "💼",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "business-administration",
                title: "Administração de Empresas"
            },
            {
                id: "business-strategy",
                title: "Estratégia Empresarial"
            },
            {
                id: "business-analysis",
                title: "Análise de Negócios"
            },
            {
                id: "operations-management",
                title: "Gestão de Operações"
            },
            {
                id: "corporate-communication",
                title: "Comunicação Corporativa"
            },
            {
                id: "leadership-management",
                title: "Liderança e Gestão"
            },
            {
                id: "international-business",
                title: "Negócios Internacionais"
            }
        ]
    },

    {
        id: "project-management",
        title: "Gestão de Projetos",
        description:
            "Vocabulário para planejamento, equipes, cronogramas, riscos e entregas de projetos.",
        icon: "📋",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "traditional-project-management",
                title: "Gestão Tradicional de Projetos"
            },
            {
                id: "agile-project-management",
                title: "Métodos Ágeis"
            },
            {
                id: "scrum-management",
                title: "Scrum"
            },
            {
                id: "project-planning",
                title: "Planejamento e Cronogramas"
            },
            {
                id: "project-risk",
                title: "Gestão de Riscos"
            },
            {
                id: "project-costs",
                title: "Custos e Orçamentos"
            },
            {
                id: "project-leadership",
                title: "Liderança de Equipes"
            }
        ]
    },

    {
        id: "entrepreneurship",
        title: "Empreendedorismo",
        description:
            "Comunicação para criação de empresas, validação de ideias, investidores e crescimento.",
        icon: "🚀",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "business-model",
                title: "Modelo de Negócios"
            },
            {
                id: "startup-management",
                title: "Gestão de Startups"
            },
            {
                id: "market-validation",
                title: "Validação de Mercado"
            },
            {
                id: "business-pitch",
                title: "Pitch para Investidores"
            },
            {
                id: "innovation-management",
                title: "Gestão da Inovação"
            },
            {
                id: "small-business",
                title: "Pequenos Negócios"
            },
            {
                id: "social-entrepreneurship",
                title: "Empreendedorismo Social"
            }
        ]
    },

    {
        id: "tech",
        title: "Tecnologia e TI",
        description:
            "Terminologia para desenvolvimento, suporte técnico, infraestrutura e produtos digitais.",
        icon: "💻",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "software-development",
                title: "Desenvolvimento de Software"
            },
            {
                id: "web-development",
                title: "Desenvolvimento Web"
            },
            {
                id: "mobile-development",
                title: "Desenvolvimento Mobile"
            },
            {
                id: "technical-support",
                title: "Suporte Técnico"
            },
            {
                id: "cybersecurity",
                title: "Cibersegurança"
            },
            {
                id: "cloud-computing",
                title: "Computação em Nuvem"
            },
            {
                id: "devops",
                title: "DevOps"
            },
            {
                id: "ux-ui",
                title: "UX e UI Design"
            }
        ]
    },

    {
        id: "data-ai",
        title: "Dados e Inteligência Artificial",
        description:
            "Vocabulário para análise de dados, modelos de IA, automação e apresentação de resultados.",
        icon: "🤖",
        difficulty: "Avançado",

        subareas: [
            {
                id: "data-analysis",
                title: "Análise de Dados"
            },
            {
                id: "data-science",
                title: "Ciência de Dados"
            },
            {
                id: "business-intelligence",
                title: "Business Intelligence"
            },
            {
                id: "machine-learning",
                title: "Machine Learning"
            },
            {
                id: "artificial-intelligence",
                title: "Inteligência Artificial"
            },
            {
                id: "data-engineering",
                title: "Engenharia de Dados"
            },
            {
                id: "ai-product",
                title: "Produtos com IA"
            }
        ]
    },

    {
        id: "marketing",
        title: "Marketing e Vendas",
        description:
            "Comunicação para campanhas, conteúdo, métricas, clientes e processos comerciais.",
        icon: "📈",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "digital-marketing",
                title: "Marketing Digital"
            },
            {
                id: "content-marketing",
                title: "Marketing de Conteúdo"
            },
            {
                id: "social-media",
                title: "Redes Sociais"
            },
            {
                id: "branding",
                title: "Branding"
            },
            {
                id: "market-research",
                title: "Pesquisa de Mercado"
            },
            {
                id: "sales",
                title: "Vendas"
            },
            {
                id: "customer-success",
                title: "Customer Success"
            },
            {
                id: "copywriting",
                title: "Copywriting"
            }
        ]
    },

    {
        id: "healthcare",
        title: "Medicina e Saúde",
        description:
            "Idioma profissional para consultas, prontuários, atendimento e comunicação clínica.",
        icon: "🏥",
        difficulty: "Avançado",

        subareas: [
            {
                id: "general-medicine",
                title: "Medicina Geral"
            },
            {
                id: "emergency-medicine",
                title: "Emergência e Urgência"
            },
            {
                id: "pediatrics",
                title: "Pediatria"
            },
            {
                id: "cardiology",
                title: "Cardiologia"
            },
            {
                id: "mental-health",
                title: "Saúde Mental"
            },
            {
                id: "physiotherapy",
                title: "Fisioterapia"
            },
            {
                id: "pharmacy",
                title: "Farmácia"
            },
            {
                id: "dentistry",
                title: "Odontologia"
            }
        ]
    },

    {
        id: "nursing",
        title: "Enfermagem",
        description:
            "Vocabulário para cuidados, procedimentos, administração de medicamentos e comunicação com pacientes.",
        icon: "🩺",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "clinical-nursing",
                title: "Enfermagem Clínica"
            },
            {
                id: "emergency-nursing",
                title: "Enfermagem de Emergência"
            },
            {
                id: "surgical-nursing",
                title: "Enfermagem Cirúrgica"
            },
            {
                id: "pediatric-nursing",
                title: "Enfermagem Pediátrica"
            },
            {
                id: "elderly-care",
                title: "Cuidados com Idosos"
            },
            {
                id: "home-care",
                title: "Assistência Domiciliar"
            },
            {
                id: "public-health-nursing",
                title: "Saúde Pública"
            }
        ]
    },

    {
        id: "finance",
        title: "Finanças e Contabilidade",
        description:
            "Contabilidade, relatórios financeiros, controladoria, orçamento e mercado de capitais.",
        icon: "📊",
        difficulty: "Avançado",

        subareas: [
            {
                id: "financial-management",
                title: "Gestão Financeira"
            },
            {
                id: "accounting",
                title: "Contabilidade"
            },
            {
                id: "controllership",
                title: "Controladoria"
            },
            {
                id: "accounts-payable-receivable",
                title: "Contas a Pagar e Receber"
            },
            {
                id: "treasury",
                title: "Tesouraria"
            },
            {
                id: "financial-analysis",
                title: "Análise Financeira"
            },
            {
                id: "audit",
                title: "Auditoria"
            },
            {
                id: "tax-accounting",
                title: "Contabilidade Tributária"
            },
            {
                id: "capital-markets",
                title: "Mercado de Capitais"
            },
            {
                id: "cost-accounting",
                title: "Custos e Formação de Preços"
            }
        ]
    },

    {
        id: "law",
        title: "Direito",
        description:
            "Vocabulário para documentos jurídicos, contratos, negociações e atendimento a clientes.",
        icon: "⚖️",
        difficulty: "Avançado",

        subareas: [
            {
                id: "civil-law",
                title: "Direito Civil"
            },
            {
                id: "corporate-law",
                title: "Direito Empresarial"
            },
            {
                id: "labor-law",
                title: "Direito do Trabalho"
            },
            {
                id: "criminal-law",
                title: "Direito Penal"
            },
            {
                id: "tax-law",
                title: "Direito Tributário"
            },
            {
                id: "international-law",
                title: "Direito Internacional"
            },
            {
                id: "contract-law",
                title: "Contratos"
            },
            {
                id: "compliance-law",
                title: "Compliance e Proteção de Dados"
            }
        ]
    },

    {
        id: "engineering",
        title: "Engenharia",
        description:
            "Comunicação técnica para projetos, cálculos, segurança, manutenção e produção industrial.",
        icon: "⚙️",
        difficulty: "Avançado",

        subareas: [
            {
                id: "mechanical-engineering",
                title: "Engenharia Mecânica"
            },
            {
                id: "civil-engineering",
                title: "Engenharia Civil"
            },
            {
                id: "electrical-engineering",
                title: "Engenharia Elétrica"
            },
            {
                id: "production-engineering",
                title: "Engenharia de Produção"
            },
            {
                id: "chemical-engineering",
                title: "Engenharia Química"
            },
            {
                id: "energy-engineering",
                title: "Engenharia de Energia"
            },
            {
                id: "nuclear-engineering",
                title: "Engenharia Nuclear"
            },
            {
                id: "environmental-engineering",
                title: "Engenharia Ambiental"
            },
            {
                id: "automotive-engineering",
                title: "Engenharia Automotiva"
            },
            {
                id: "aerospace-engineering",
                title: "Engenharia Aeroespacial"
            },
            {
                id: "maintenance-engineering",
                title: "Engenharia de Manutenção"
            }
        ]
    },

    {
        id: "architecture-construction",
        title: "Arquitetura e Construção",
        description:
            "Vocabulário para projetos arquitetônicos, obras, materiais, planejamento e segurança.",
        icon: "🏗️",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "architecture",
                title: "Arquitetura"
            },
            {
                id: "urban-planning",
                title: "Urbanismo"
            },
            {
                id: "construction-management",
                title: "Gestão de Obras"
            },
            {
                id: "construction-budget",
                title: "Orçamento de Obras"
            },
            {
                id: "construction-planning",
                title: "Planejamento de Obras"
            },
            {
                id: "building-information-modeling",
                title: "BIM"
            },
            {
                id: "workplace-safety",
                title: "Segurança do Trabalho"
            },
            {
                id: "sustainable-construction",
                title: "Construção Sustentável"
            }
        ]
    },

    {
        id: "real-estate",
        title: "Mercado Imobiliário",
        description:
            "Comunicação para venda, locação, avaliação, contratos e administração de imóveis.",
        icon: "🏢",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "real-estate-sales",
                title: "Venda de Imóveis"
            },
            {
                id: "property-rental",
                title: "Locação de Imóveis"
            },
            {
                id: "property-management",
                title: "Administração de Imóveis"
            },
            {
                id: "real-estate-development",
                title: "Incorporação Imobiliária"
            },
            {
                id: "property-valuation",
                title: "Avaliação de Imóveis"
            },
            {
                id: "real-estate-finance",
                title: "Financiamento Imobiliário"
            },
            {
                id: "real-estate-contracts",
                title: "Contratos Imobiliários"
            }
        ]
    },

    {
        id: "hr",
        title: "Recursos Humanos",
        description:
            "Comunicação para recrutamento, entrevistas, treinamento e gestão de pessoas.",
        icon: "👥",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "recruitment",
                title: "Recrutamento e Seleção"
            },
            {
                id: "talent-management",
                title: "Gestão de Talentos"
            },
            {
                id: "training-development",
                title: "Treinamento e Desenvolvimento"
            },
            {
                id: "payroll",
                title: "Departamento Pessoal"
            },
            {
                id: "performance-management",
                title: "Gestão de Desempenho"
            },
            {
                id: "organizational-culture",
                title: "Cultura Organizacional"
            },
            {
                id: "people-analytics",
                title: "People Analytics"
            }
        ]
    },

    {
        id: "logistics",
        title: "Logística e Suprimentos",
        description:
            "Vocabulário para compras, fornecedores, estoques, transporte e cadeia de suprimentos.",
        icon: "🚚",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "procurement",
                title: "Compras e Suprimentos"
            },
            {
                id: "supplier-management",
                title: "Gestão de Fornecedores"
            },
            {
                id: "inventory-management",
                title: "Gestão de Estoques"
            },
            {
                id: "transport-logistics",
                title: "Transportes"
            },
            {
                id: "supply-chain",
                title: "Supply Chain"
            },
            {
                id: "international-trade",
                title: "Comércio Exterior"
            },
            {
                id: "warehouse-management",
                title: "Gestão de Armazéns"
            }
        ]
    },

    {
        id: "education",
        title: "Educação",
        description:
            "Idioma para aulas, materiais didáticos, pesquisa, orientação e ambiente acadêmico.",
        icon: "📚",
        difficulty: "Intermediário",

        subareas: [
            {
                id: "language-teaching",
                title: "Ensino de Idiomas"
            },
            {
                id: "school-education",
                title: "Educação Escolar"
            },
            {
                id: "higher-education",
                title: "Ensino Superior"
            },
            {
                id: "academic-research",
                title: "Pesquisa Acadêmica"
            },
            {
                id: "educational-coordination",
                title: "Coordenação Pedagógica"
            },
            {
                id: "online-education",
                title: "Educação Online"
            },
            {
                id: "corporate-training",
                title: "Educação Corporativa"
            }
        ]
    },

    {
        id: "tourism",
        title: "Turismo, Hotelaria e Gastronomia",
        description:
            "Comunicação para recepção, viagens, hospedagem, restaurantes e experiências turísticas.",
        icon: "🧳",
        difficulty: "Básico",

        subareas: [
            {
                id: "tourism-services",
                title: "Atendimento Turístico"
            },
            {
                id: "travel-agency",
                title: "Agências de Viagem"
            },
            {
                id: "hotel-management",
                title: "Hotelaria"
            },
            {
                id: "hotel-reception",
                title: "Recepção de Hotel"
            },
            {
                id: "tour-guiding",
                title: "Guia de Turismo"
            },
            {
                id: "restaurant-service",
                title: "Atendimento em Restaurantes"
            },
            {
                id: "gastronomy",
                title: "Gastronomia"
            },
            {
                id: "event-tourism",
                title: "Eventos e Turismo de Negócios"
            }
        ]
    },

    {
        id: "customer-service",
        title: "Atendimento ao Cliente",
        description:
            "Comunicação para suporte, resolução de problemas, reclamações e relacionamento.",
        icon: "🎧",
        difficulty: "Básico",

        subareas: [
            {
                id: "in-person-service",
                title: "Atendimento Presencial"
            },
            {
                id: "phone-support",
                title: "Atendimento Telefônico"
            },
            {
                id: "chat-support",
                title: "Atendimento por Chat"
            },
            {
                id: "technical-customer-support",
                title: "Suporte Técnico ao Cliente"
            },
            {
                id: "complaint-management",
                title: "Gestão de Reclamações"
            },
            {
                id: "customer-experience",
                title: "Experiência do Cliente"
            },
            {
                id: "after-sales",
                title: "Pós-venda"
            }
        ]
    },

    {
        id: "science-research",
        title: "Ciência e Pesquisa",
        description:
            "Comunicação para laboratórios, artigos científicos, congressos e projetos de pesquisa.",
        icon: "🔬",
        difficulty: "Avançado",

        subareas: [
            {
                id: "scientific-writing",
                title: "Escrita Científica"
            },
            {
                id: "laboratory-communication",
                title: "Rotina de Laboratório"
            },
            {
                id: "research-methodology",
                title: "Metodologia de Pesquisa"
            },
            {
                id: "scientific-presentations",
                title: "Apresentações Científicas"
            },
            {
                id: "biology-research",
                title: "Biologia"
            },
            {
                id: "chemistry-research",
                title: "Química"
            },
            {
                id: "physics-research",
                title: "Física"
            },
            {
                id: "environmental-science",
                title: "Ciências Ambientais"
            }
        ]
    },

    {
        id: "international-relations",
        title: "Relações Internacionais e Setor Público",
        description:
            "Vocabulário para diplomacia, políticas públicas, organismos internacionais e cooperação.",
        icon: "🌐",
        difficulty: "Avançado",

        subareas: [
            {
                id: "diplomacy",
                title: "Diplomacia"
            },
            {
                id: "international-cooperation",
                title: "Cooperação Internacional"
            },
            {
                id: "public-administration",
                title: "Administração Pública"
            },
            {
                id: "public-policy",
                title: "Políticas Públicas"
            },
            {
                id: "international-organizations",
                title: "Organizações Internacionais"
            },
            {
                id: "foreign-trade-policy",
                title: "Política de Comércio Exterior"
            },
            {
                id: "humanitarian-affairs",
                title: "Assuntos Humanitários"
            }
        ]
    }
];


/**
 * Retorna uma trilha profissional pelo ID.
 */
export function getProfessionalTrackById(trackId) {
    return (
        PROFESSIONAL_CATALOG.find(
            (track) => track.id === trackId
        ) || null
    );
}


/**
 * Retorna uma subárea específica.
 */
export function getProfessionalSubarea(
    trackId,
    subareaId
) {
    const track =
        getProfessionalTrackById(trackId);

    if (!track) {
        return null;
    }

    return (
        track.subareas.find(
            (subarea) =>
                subarea.id === subareaId
        ) || null
    );
}


/**
 * Retorna todas as subáreas em uma lista única.
 */
export function getAllProfessionalSubareas() {
    return PROFESSIONAL_CATALOG.flatMap(
        (track) =>
            track.subareas.map(
                (subarea) => ({
                    ...subarea,
                    trackId: track.id,
                    trackTitle: track.title,
                    trackIcon: track.icon
                })
            )
    );
}
