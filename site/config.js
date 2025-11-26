const langConfig = {
    // --- Português (Brasil) ---
    pt_br: {
        sidebar: {
            dashboard: "Dashboard Principal",
            analysis: "Análise de CVEs",
            leaks: "Vazamentos",
            reports: "Relatórios",
            settings: "Fonte dos Dados",
            collaborators: "Colaboradores"
        },
        header: {
            title: "Painel de Inteligência de Ameaças",
            period: { d30: "Últimos 30 dias", d90: "Últimos 90 dias", y1: "Último Ano" },
            themeBtn: { light: "Modo Claro", dark: "Modo Escuro" },
            lastUpdate: "Dados atualizados em"
        },
        kpis: {
            vulns: "Novas Vulnerabilidades",
            leaks: "Contas Vazadas",
            threat: "Ameaça Mais Comum",
            sector: "Setor Mais Atacado"
        },
        charts: {
            trend: "Tendência de Vulnerabilidades Críticas",
            severity: "Distribuição de Severidade",
            sectors: "Setores Mais Atacados (OTX)",
            countries: "Top 5 Países (AbuseIPDB - Hoje)",
            types: "Principais Tipos de Vulnerabilidade"
        },
        table: {
            title: "Grandes Vazamentos de Dados Recentes",
            cols: { company: "Empresa", sector: "Setor", accounts: "Contas Afetadas" },
            loading: "Carregando dados...",
            empty: "Nenhum dado encontrado."
        },
        chartLabels: { occurrences: "Ocorrências", criticals: "Críticas" },
        cveSearch: {
            title: "Buscador de Vulnerabilidades",
            placeholder: "Digite o ID da CVE (ex: CVE-2021-44228)...",
            btnSearch: "Investigar",
            resultTitle: "Descrição Técnica",
            resultVector: "Vetor de Ataque (CVSS v3)",
            resultLink: "Ver no NVD NIST →",
            publishedLabel: "Publicado em:",
            errors: {
                invalidFormat: "Por favor, digite um formato válido (ex: CVE-2023-1234)",
                notFound: "CVE não encontrada na base de dados.",
                apiError: "Erro ao conectar com a API."
            }
        },
        leaksPage: {
            title: "Verificador de Segurança",
            boxTitle: "Você usa algum destes serviços?",
            boxDesc: "Digite o nome de um site ou aplicativo (ex: \"Adobe\", \"LinkedIn\", \"Canva\") para ver se ele consta na nossa base de dados de vazamentos confirmados.",
            placeholder: "Digite o nome do serviço...",
            btnCheck: "Verificar",
            disclaimer: "* Esta ferramenta verifica apenas vazamentos públicos catalogados na nossa base de dados (HIBP).",
            errors: { minChars: "Por favor, digite pelo menos 2 letras." },
            results: {
                safeTitle: "✅ Nada consta para",
                safeDesc: "Não encontramos registros de vazamentos para este serviço na nossa base de dados atual. Continue vigilante!",
                dangerTitle: "⚠️ Atenção: Vazamento Encontrado em",
                dangerDescPart1: "Este serviço sofreu um incidente de segurança registrado em",
                dangerDescPart2: "Cerca de",
                dangerDescPart3: "contas foram afetadas.",
                recTitle: "Recomendação:",
                recDesc: "Se você tinha conta neste serviço antes dessa data, mude sua senha imediatamente."
            }
        },
        reportsPage: {
            title: "Central de Relatórios",
            notice: "<strong>Nota sobre os Dados:</strong> As informações exibidas neste dashboard são uma <em>amostra representativa</em> coletada em tempo real das fontes abaixo. Devido a limites de API e performance, não exibimos a totalidade histórica de todos os registros mundiais, mas sim um recorte focado nas ameaças mais recentes e relevantes para o período selecionado.",
            filters: { all: "Todas as Fontes", otx: "AlienVault OTX", hibp: "Vazamentos (HIBP)", nvd: "Vulnerabilidades (NVD)" },
            feeds: {
                otxTitle: "Feed de Inteligência (AlienVault OTX)",
                otxDesc: "Últimos pulsos e campanhas de ameaça detectados globalmente.",
                otxCols: { date: "Data", threats: "Ameaças (Tags)", countries: "Países Alvo" },
                hibpTitle: "Registro de Vazamentos (HIBP)",
                hibpCols: { date: "Data", service: "Empresa/Serviço", impact: "Impacto (Contas)" },
                nvdTitle: "Últimas CVEs Críticas (NVD)",
                nvdCols: { id: "ID CVE", date: "Data", type: "Tipo de Falha" }
            },
            docs: {
                title: "Documentação do Projeto",
                desc: "Acesse os arquivos oficiais e entregáveis do PI 1 diretamente no nosso repositório.",
                links: {
                    vision: { title: "Visão do Produto", sub: "Escopo e Personas" },
                    plan: { title: "Plano de Projeto", sub: "Cronograma e Riscos" },
                    arch: { title: "Arquitetura de Dados", sub: "Diagrama de Fluxo" },
                    repo: { title: "Ver Pasta Completa", sub: "Acessar GitHub /docs" }
                }
            }
        },
        sourcesPage: {
            title: "Nossas Fontes de Inteligência",
            btnVisit: "Visitar Fonte",
            nvd: {
                desc: "National Vulnerability Database",
                detail: "Fonte primária do governo dos EUA para gerenciamento de dados de vulnerabilidades (CVEs).",
                tags: ["Vulnerabilidades", "Scores CVSS"]
            },
            hibp: {
                desc: "HIBP API v3",
                detail: "Serviço global que agrega dados de vazamentos de dados (Data Breaches) confirmados.",
                tags: ["Vazamentos", "Contas Comprometidas"]
            },
            otx: {
                desc: "Open Threat Exchange",
                detail: "A maior comunidade de inteligência de ameaças colaborativa do mundo, fornecendo IoCs em tempo real.",
                tags: ["Setores Alvo", "Ameaças Ativas"]
            },
            abuse: {
                desc: "IP Reputation Database",
                detail: "Projeto dedicado a rastrear e denunciar endereços IP envolvidos em atividades maliciosas.",
                tags: ["Geolocalização", "Reputação de IP"]
            }
        },

        collaboratorsPage: {
            pageTitle: "Colaboradores | Project Aegis",
            title: "Nosso Time",
            btnGitHub: "Ver GitHub",
            colab1: {
                name: "Marcos Vinícius",
                link: "https://github.com/vrsmarcos26",
                role: "Líder de Projeto / Arquiteto de Dados / Desenvolvedor Full-Stack",
                desc: "Responsável pela arquitetura completa do dashboard, coleta de dados (ETL) e gestão técnica do escopo."
            },
            colab2: {
                name: "João Marcelo",
                link: "https://github.com/joaomarcelo11",
                role: "Tester de QA / Documentação Técnica (Principal)",
                desc: "Focado na garantia de qualidade (QA) do produto e na criação e manutenção da documentação técnica principal."
            },
            colab3: {
                name: "Davi Maia",
                link: "https://github.com/davu123",
                role: "Tester de QA / Documentação Técnica (Secundário)",
                desc: "Contribui com testes rigorosos, validação de funcionalidades e suporte na elaboração da documentação secundária."
            },
            colab4: {
                name: "Felipe Barcelos",
                link: "https://github.com/felpsdc",
                role: "Desenvolvedor de IA (Inteligência Artificial)",
                desc: "Especializado na integração de modelos de IA para análise preditiva de ameaças e otimização de dados."
            },
            colab5: {
                name: "Eduardo Uchoa",
                link: "https://github.com/edu-uchoa",
                role: "Desenvolvedor Back-end",
                desc: "Responsável por toda a infraestrutura de servidor, rotas de API e otimização de performance do lado do servidor."
            }
        }
    },

    // --- Inglês (Estados Unidos) ---
    en_us: {
        sidebar: {
            dashboard: "Main Dashboard",
            analysis: "CVE Analysis",
            leaks: "Data Leaks",
            reports: "Reports",
            settings: "Data Source",
            collaborators: "Collaborators"
        },
        header: {
            title: "Threat Intelligence Dashboard",
            period: { d30: "Last 30 days", d90: "Last 90 days", y1: "Last Year" },
            themeBtn: { light: "Light Mode", dark: "Dark Mode" },
            lastUpdate: "Data last updated on"
        },
        kpis: {
            vulns: "New Vulnerabilities",
            leaks: "Leaked Accounts",
            threat: "Most Common Threat",
            sector: "Most Attacked Sector"
        },
        charts: {
            trend: "Critical Vulnerabilities Trend",
            severity: "Severity Distribution",
            sectors: "Most Attacked Sectors (OTX)",
            countries: "Top 5 Countries (AbuseIPDB - Today)",
            types: "Top Vulnerability Types"
        },
        table: {
            title: "Recent Major Data Breaches",
            cols: { company: "Company", sector: "Sector", accounts: "Affected Accounts" },
            loading: "Loading data...",
            empty: "No data found."
        },
        chartLabels: { occurrences: "Occurrences", criticals: "Criticals" },
        cveSearch: {
            title: "Vulnerability Search Engine",
            placeholder: "Enter CVE ID (e.g., CVE-2021-44228)...",
            btnSearch: "Investigate",
            resultTitle: "Technical Description",
            resultVector: "Attack Vector (CVSS v3)",
            resultLink: "View on NVD NIST →",
            publishedLabel: "Published on:",
            errors: {
                invalidFormat: "Please enter a valid format (e.g., CVE-2023-1234)",
                notFound: "CVE not found in the database.",
                apiError: "Error connecting to API."
            }
        },
        leaksPage: {
            title: "Security Checker",
            boxTitle: "Do you use any of these services?",
            boxDesc: "Enter the name of a website or app (e.g., \"Adobe\", \"LinkedIn\", \"Canva\") to see if it appears in our database of confirmed breaches.",
            placeholder: "Enter service name...",
            btnCheck: "Check",
            disclaimer: "* This tool checks only for public breaches cataloged in our database (HIBP).",
            errors: { minChars: "Please enter at least 2 characters." },
            results: {
                safeTitle: "✅ No records for",
                safeDesc: "We found no leak records for this service in our current database. Stay vigilant!",
                dangerTitle: "⚠️ Warning: Leak Found in",
                dangerDescPart1: "This service suffered a security incident recorded on",
                dangerDescPart2: "About",
                dangerDescPart3: "accounts were affected.",
                recTitle: "Recommendation:",
                recDesc: "If you had an account with this service before this date, change your password immediately."
            }
        },
        reportsPage: {
            title: "Reports Central",
            notice: "<strong>Data Note:</strong> The information displayed on this dashboard is a <em>representative sample</em> collected in real-time from the sources below. Due to API limits and performance, we do not display the complete historical record of all global entries, but rather a snapshot focused on the most recent and relevant threats for the selected period.",
            filters: { all: "All Sources", otx: "AlienVault OTX", hibp: "Leaks (HIBP)", nvd: "Vulnerabilities (NVD)" },
            feeds: {
                otxTitle: "Intelligence Feed (AlienVault OTX)",
                otxDesc: "Latest threat pulses and campaigns detected globally.",
                otxCols: { date: "Date", threats: "Threats (Tags)", countries: "Target Countries" },
                hibpTitle: "Data Breach Registry (HIBP)",
                hibpCols: { date: "Date", service: "Company/Service", impact: "Impact (Accounts)" },
                nvdTitle: "Latest Critical CVEs (NVD)",
                nvdCols: { id: "CVE ID", date: "Date", type: "Flaw Type" }
            },
            docs: {
                title: "Project Documentation",
                desc: "Access official PI 1 files and deliverables directly from our repository.",
                links: {
                    vision: { title: "Product Vision", sub: "Scope and Personas" },
                    plan: { title: "Project Plan", sub: "Schedule and Risks" },
                    arch: { title: "Data Architecture", sub: "Flow Diagram" },
                    repo: { title: "View Full Folder", sub: "Access GitHub /docs" }
                }
            }
        },
        sourcesPage: {
            title: "Our Intelligence Sources",
            btnVisit: "Visit Source",
            nvd: {
                desc: "National Vulnerability Database",
                detail: "Primary US government source for vulnerability data management (CVEs).",
                tags: ["Vulnerabilities", "CVSS Scores"]
            },
            hibp: {
                desc: "HIBP API v3",
                detail: "Global service aggregating confirmed Data Breach data.",
                tags: ["Leaks", "Compromised Accounts"]
            },
            otx: {
                desc: "Open Threat Exchange",
                detail: "The world's largest collaborative threat intelligence community, providing real-time IoCs.",
                tags: ["Target Sectors", "Active Threats"]
            },
            abuse: {
                desc: "IP Reputation Database",
                detail: "Project dedicated to tracking and reporting IP addresses involved in malicious activity.",
                tags: ["Geolocation", "IP Reputation"]
            }
        },
        
        collaboratorsPage: {
            pageTitle: "Collaborators | Project Aegis",
            title: "Our Team",
            btnGitHub: "View GitHub",
            colab1: {
                name: "Marcos Vinícius",
                link: "https://github.com/vrsmarcos26",
                role: "Project Leader / Data Architect / Full-Stack Developer",
                desc: "Responsible for the complete dashboard architecture, data collection (ETL), and technical scope management."
            },
            colab2: {
                name: "João Marcelo",
                link: "https://github.com/joaomarcelo11",
                role: "QA Tester / Technical Documentation (Primary)",
                desc: "Focused on product quality assurance (QA) and the creation and maintenance of primary technical documentation."
            },
            colab3: {
                name: "Davi Maia",
                link: "https://github.com/davu123",
                role: "QA Tester / Technical Documentation (Secondary)",
                desc: "Contributes with rigorous testing, feature validation, and support in secondary documentation."
            },
            colab4: {
                name: "Felipe Barcelos",
                link: "https://github.com/felpsdc",
                role: "AI Developer (Artificial Intelligence)",
                desc: "Specializes in integrating AI models for predictive threat analysis and data optimization."
            },
            colab5: {
                name: "Eduardo Uchoa",
                link: "https://github.com/edu-uchoa",
                role: "Back-end Developer",
                desc: "Responsible for all server infrastructure, API routes, and server-side performance optimization."
            }
        }
    }
};
