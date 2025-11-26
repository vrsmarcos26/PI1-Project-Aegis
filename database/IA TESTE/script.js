/* ==================================================================
   ARQUIVO DE SCRIPT PRINCIPAL (script.js)
   Controla a interatividade do dashboard:
   1. Alternador de Tema (Dark/Light)
   2. Lógica de Idioma e Tradução
   3. Carregamento e Filtro de Dados
   4. Renderização de Gráficos (Chart.js)
   ================================================================== */

// --- VARIÁVEIS GLOBAIS ---
let meuGraficoDonut = null;
let meuGraficoLinha = null;
let meuGraficoSetores = null;
let meuGraficoPaises = null;
let meuGraficoTiposVuln = null;

let DADOS_COMPLETOS_CVE = []; 
let DADOS_COMPLETOS_HIBP = [];
let DADOS_COMPLETOS_OTX = []; 
let DADOS_COMPLETOS_PAISES = []; 

// Variável dinâmica para rastrear a data mais recente encontrada em TODOS os dados carregados.
// Inicializada com 1/1/1970 (Epoch) para garantir que qualquer data real seja mais nova.
let latestDataDate = new Date(0);

// Idioma Atual (Padrão: PT-BR)
let idiomaAtual = localStorage.getItem('lang') || 'pt_br';


document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Aplicar Tema e Idioma Inicial
    iniciarTemaEIdioma();

    // 2. Configurar Listeners de Tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const novoTema = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
            aplicarTema(novoTema);
            localStorage.setItem('theme', novoTema);
        });
    }

    // 3. Configurar Listener de Filtro de Período (Apenas na página principal)
    const periodFilter = document.getElementById('period-filter');
    if (periodFilter) {
        periodFilter.addEventListener('change', (e) => {
            filtrarEAtualizarDashboard(e.target.value);
        });
    }
    
    // 4. Carga Inicial de Dados (Apenas se houver KPIs - página principal)
    if (document.querySelector('.kpi-grid')) {
        carregarDadosCVE(); 
        carregarDadosHIBP();
        carregarDadosOTX();
        // O carregamento de Países já inclui a renderização inicial
        carregarDadosPaises(); 
    }
});


// --- FUNÇÕES DE TEMA E IDIOMA ---

/**
 * Inicia o tema e o idioma salvos no localStorage.
 */
function iniciarTemaEIdioma() {
    mudarIdioma(idiomaAtual);
    const temaSalvo = localStorage.getItem('theme') || 'light';
    aplicarTema(temaSalvo, false); // Não recria gráficos no início
    displayLastUpdateDate(); // Exibir a data de atualização após a inicialização do idioma
}

/**
 * Aplica o tema Dark ou Light e recria gráficos se necessário.
 * @param {string} tema - 'dark' ou 'light'.
 * @param {boolean} recriar - Se deve forçar a recriação dos gráficos.
 */
function aplicarTema(tema, recriar = true) {
    const body = document.body;
    body.classList.toggle('dark-theme', tema === 'dark');
    atualizarBotaoTema(tema);
    
    if (recriar && document.getElementById('donutChart')) {
        recriarGraficos();
    }
}

/**
 * Atualiza o texto do botão de alternância de tema baseado no idioma.
 * @param {string} tema - O tema atual ('dark' ou 'light').
 */
function atualizarBotaoTema(tema) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle && typeof langConfig !== 'undefined') {
        themeToggle.innerText = langConfig[idiomaAtual].header.themeBtn[tema];
    }
}

/**
 * Altera o idioma da interface.
 * @param {string} lang - O código do idioma ('pt_br' ou 'en_us').
 */
function mudarIdioma(lang) {
    idiomaAtual = lang;
    localStorage.setItem('lang', lang);
    if (typeof langConfig === 'undefined') return;
    const t = langConfig[lang];
    
    // Funções de tradução que se aplicam a todas as páginas
    traduzirSidebar(t.sidebar);
    
    // Tradução específica por página (usando o ID para detecção)
    if (document.getElementById('lbl-header-title')) traduzirDashboard(t);
    if (document.getElementById('lbl-reports-title')) traduzirRelatorios(t.reportsPage);
    if (document.getElementById('lbl-sources-title')) traduzirFontes(t.sourcesPage);

    // Atualiza classes visuais dos botões de idioma
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase() === lang.split('_')[0]) {
            btn.classList.add('active');
        }
    });
    
    // Atualiza o botão de tema após a mudança de idioma
    const temaAtual = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    atualizarBotaoTema(temaAtual);
}

/**
 * Exibe a data de última atualização no cabeçalho, baseada na data mais recente encontrada.
 */
function displayLastUpdateDate() {
    const noticeEl = document.getElementById('data-update-notice');
    if (!noticeEl || typeof langConfig === 'undefined') return;

    const t = langConfig[idiomaAtual];
    const locale = idiomaAtual.replace('_', '-');
    
    if (latestDataDate.getTime() === new Date(0).getTime()) {
        // Se a data ainda for o Epoch (sem dados carregados), usa N/A
        noticeEl.innerHTML = `<span style="font-weight: 500;">${t.header.lastUpdate}:</span> N/A`;
        return;
    }

    // Formatar a data no formato local (ex: 22/11/2025)
    const formattedDate = latestDataDate.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    // Atualiza o texto, usando o campo traduzido
    noticeEl.innerHTML = `
        <span style="font-weight: 500;">${t.header.lastUpdate}:</span>
        ${formattedDate}
    `;
}

function traduzirSidebar(s) {
    setText('lbl-sidebar-dashboard', s.dashboard);
    setText('lbl-sidebar-analysis', s.analysis);
    setText('lbl-sidebar-leaks', s.leaks);
    setText('lbl-sidebar-reports', s.reports);
    setText('lbl-sidebar-settings', s.settings);
    setText('lbl-sidebar-collaborators', s.collaborators);
}

function traduzirDashboard(t) {
    // Header
    setText('lbl-header-title', t.header.title);
    setText('lbl-period-30d', t.header.period.d30);
    setText('lbl-period-90d', t.header.period.d90);
    setText('lbl-period-1y', t.header.period.y1);
    
    // KPIs
    setText('lbl-kpi-vulns', t.kpis.vulns);
    setText('lbl-kpi-leaks', t.kpis.leaks);
    setText('lbl-kpi-threat', t.kpis.threat);
    setText('lbl-kpi-sector', t.kpis.sector);
    
    // Títulos dos Gráficos
    setText('lbl-chart-trend', t.charts.trend);
    setText('lbl-chart-severity', t.charts.severity);
    setText('lbl-chart-sectors', t.charts.sectors);
    setText('lbl-chart-countries', t.charts.countries);
    setText('lbl-chart-types', t.charts.types);
    
    // Tabela
    setText('lbl-table-title', t.table.title);
    setText('lbl-col-company', t.table.cols.company);
    setText('lbl-col-sector', t.table.cols.sector);
    setText('lbl-col-accounts', t.table.cols.accounts);
    setText('lbl-table-loading', t.table.loading);
    
    recriarGraficos(); // Recria gráficos com novas labels/cores de tema
    displayLastUpdateDate(); // Atualiza a data com o novo idioma
}

function traduzirRelatorios(r) {
    setText('lbl-reports-title', r.title);
    
    // Aviso HTML
    const noticeEl = document.getElementById('lbl-data-notice');
    if(noticeEl) noticeEl.innerHTML = r.notice;
    
    // Feeds
    setText('lbl-otx-title', r.feeds.otxTitle);
    setText('lbl-otx-desc', r.feeds.otxDesc);
    setText('th-otx-date', r.feeds.otxCols.date);
    setText('th-otx-threats', r.feeds.otxCols.threats);
    setText('th-otx-countries', r.feeds.otxCols.countries);
    
    setText('lbl-hibp-title', r.feeds.hibpTitle);
    setText('th-hibp-date', r.feeds.hibpCols.date);
    setText('th-hibp-service', r.feeds.hibpCols.service);
    setText('th-hibp-impact', r.feeds.hibpCols.impact);
    
    setText('lbl-nvd-title', r.feeds.nvdTitle);
    setText('th-nvd-id', r.feeds.nvdCols.id);
    setText('th-nvd-date', r.feeds.nvdCols.date);
    setText('th-nvd-type', r.feeds.nvdCols.type);
    
    // Docs
    setText('lbl-docs-title', r.docs.title);
    setText('lbl-docs-desc', r.docs.desc);
    setText('lbl-doc-vision-title', r.docs.links.vision.title);
    setText('lbl-doc-vision-sub', r.docs.links.vision.sub);
    setText('lbl-doc-plan-title', r.docs.links.plan.title);
    setText('lbl-doc-plan-sub', r.docs.links.plan.sub);
    setText('lbl-doc-arch-title', r.docs.links.arch.title);
    setText('lbl-doc-arch-sub', r.docs.links.arch.sub);
    setText('lbl-doc-repo-title', r.docs.links.repo.title);
    setText('lbl-doc-repo-sub', r.docs.links.repo.sub);

    // Filtro Select
    const sel = document.getElementById('filter-reports');
    if(sel) {
        sel.options[0].text = r.filters.all;
        sel.options[1].text = r.filters.otx;
        sel.options[2].text = r.filters.hibp;
        sel.options[3].text = r.filters.nvd;
    }
}

function traduzirFontes(s) {
    setText('lbl-sources-title', s.title);
    
    document.querySelectorAll('.lbl-btn-visit').forEach(btn => btn.innerText = s.btnVisit);
    
    setText('lbl-src-nvd-desc', s.nvd.desc);
    setText('lbl-src-nvd-detail', s.nvd.detail);
    setText('lbl-src-nvd-tag1', s.nvd.tags[0]);
    setText('lbl-src-nvd-tag2', s.nvd.tags[1]);

    setText('lbl-src-hibp-desc', s.hibp.desc);
    setText('lbl-src-hibp-detail', s.hibp.detail);
    setText('lbl-src-hibp-tag1', s.hibp.tags[0]);
    setText('lbl-src-hibp-tag2', s.hibp.tags[1]);

    setText('lbl-src-otx-desc', s.otx.desc);
    setText('lbl-src-otx-detail', s.otx.detail);
    setText('lbl-src-otx-tag1', s.otx.tags[0]);
    setText('lbl-src-otx-tag2', s.otx.tags[1]);

    setText('lbl-src-abuse-desc', s.abuse.desc);
    setText('lbl-src-abuse-detail', s.abuse.detail);
    setText('lbl-src-abuse-tag1', s.abuse.tags[0]);
    setText('lbl-src-abuse-tag2', s.abuse.tags[1]);
}


/**
 * Função utilitária para definir o innerText de um elemento.
 */
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

/**
 * Destrói e recria todos os gráficos para atualizar cores e labels.
 */
function recriarGraficos() {
    if (meuGraficoDonut) meuGraficoDonut.destroy();
    if (meuGraficoLinha) meuGraficoLinha.destroy();
    if (meuGraficoSetores) meuGraficoSetores.destroy();
    if (meuGraficoPaises) meuGraficoPaises.destroy();
    if (meuGraficoTiposVuln) meuGraficoTiposVuln.destroy();
    
    const pFilter = document.getElementById('period-filter');
    if (pFilter) {
        const periodo = pFilter.value;
        filtrarEAtualizarDashboard(periodo);
    }
}


// --- FUNÇÕES DE CARREGAMENTO DE DADOS (FETCH) ---

/**
 * Atualiza a data global de última atualização se a data fornecida for mais recente.
 * @param {Date} date - A data a ser verificada.
 */
function updateLatestDataDate(date) {
    if (date && date instanceof Date && date > latestDataDate) {
        latestDataDate = date;
    }
}

async function carregarDadosCVE() {
    try {
        const response = await fetch(`cve_kpis.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`Erro ao carregar cve_kpis.json`);
        
        const data = await response.json(); 
        
        let newestDate = latestDataDate;

        DADOS_COMPLETOS_CVE = data.map(item => {
            // Converter string de data para Objeto Date
            const pubDate = new Date(item.data_publicacao + "T00:00:00"); 
            item.data_publicacao = pubDate;
            
            updateLatestDataDate(pubDate); // Verifica e atualiza a data global
            
            return item;
        });
        console.log(`Sucesso! Carregados ${DADOS_COMPLETOS_CVE.length} registros de CVEs.`);
        atualizarTelaSePossivel();
        displayLastUpdateDate();
    } catch (e) { console.error("Erro CVE:", e); }
}

async function carregarDadosHIBP() {
    try {
        const response = await fetch(`hibp_kpis.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`Erro ao carregar hibp_kpis.json`);
        const data = await response.json();
        
        let listaBruta = Array.isArray(data) ? data : (data.vazamentos_recentes_tabela || []);

        DADOS_COMPLETOS_HIBP = listaBruta.map(item => {
            if (item.data_vazamento) {
                const dataStr = item.data_vazamento.includes('T') ? item.data_vazamento : item.data_vazamento + "T00:00:00";
                const leakDate = new Date(dataStr);
                item.data_vazamento = leakDate;
                
                updateLatestDataDate(leakDate); // Verifica e atualiza a data global
            }
            return item;
        });
        console.log(`Sucesso! Carregados ${DADOS_COMPLETOS_HIBP.length} registros de Vazamentos.`);
        atualizarTelaSePossivel();
        displayLastUpdateDate();
    } catch (e) { console.error("Erro HIBP:", e); }
}

async function carregarDadosOTX() {
    try {
        const response = await fetch(`otx_kpis.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`Erro ao carregar otx_kpis.json`);
        const data = await response.json();
        
        DADOS_COMPLETOS_OTX = data.map(item => {
            if (item.data_criacao) {
                const dataStr = item.data_criacao.includes('T') ? item.data_criacao : item.data_criacao + "T00:00:00";
                const createDate = new Date(dataStr);
                item.data_criacao = createDate;
                
                updateLatestDataDate(createDate); // Verifica e atualiza a data global
            }
            return item;
        });
        console.log(`Sucesso! Carregados ${DADOS_COMPLETOS_OTX.length} pulsos OTX.`);
        atualizarTelaSePossivel();
        displayLastUpdateDate();
    } catch (e) { console.error("Erro OTX:", e); }
}

async function carregarDadosPaises() {
    try {
        const response = await fetch(`paises_kpis.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`Erro ao carregar paises_kpis.json`);
        const data = await response.json();

        DADOS_COMPLETOS_PAISES = data.map(item => {
            if (item.data_report && item.data_report !== "N/A") {
                const dataStr = item.data_report.includes('T') ? item.data_report : item.data_report + "T00:00:00";
                const reportDate = new Date(dataStr);
                item.data_report = reportDate;
                
                updateLatestDataDate(reportDate); // Verifica e atualiza a data global
            }
            return item;
        });
        
        // Renderiza direto para garantir que o gráfico de países seja carregado
        const periodoElem = document.getElementById('period-filter');
        if (periodoElem) filtrarEAtualizarDashboard(periodoElem.value);
        displayLastUpdateDate();
    } catch (e) { console.error("Erro Países:", e); }
}

/**
 * Função auxiliar para chamar o filtro apenas quando tivermos dados.
 */
function atualizarTelaSePossivel() {
    const periodoElem = document.getElementById('period-filter');
    if (periodoElem) filtrarEAtualizarDashboard(periodoElem.value);
}


// --- FUNÇÃO CENTRAL DE FILTRAGEM E ATUALIZAÇÃO ---

/**
 * Filtra todos os dados brutos pelo período selecionado e atualiza todos os componentes.
 * @param {string} periodo - '30d', '90d', ou '1ano'.
 */
function filtrarEAtualizarDashboard(periodo) {
    
    // 1. Calcular a Data de Corte
    const agora = new Date();
    let dias = 30;
    if (periodo === '90d') dias = 90;
    if (periodo === '1ano') dias = 365;
    
    const dataLimite = new Date();
    dataLimite.setDate(agora.getDate() - dias);

    // --- ATUALIZAR CVE (NVD) ---
    if (DADOS_COMPLETOS_CVE.length > 0) {
        const filtrados = DADOS_COMPLETOS_CVE.filter(x => x.data_publicacao >= dataLimite);
        
        const kpiVulnsEl = document.getElementById('kpi-novas-vulns');
        if(kpiVulnsEl) kpiVulnsEl.innerText = filtrados.length.toLocaleString('pt-BR');
        
        // Donut (Severidade)
        const sevCounts = { 'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'NONE': 0 };
        filtrados.forEach(x => { if(sevCounts.hasOwnProperty(x.severidade)) sevCounts[x.severidade]++; });
        renderizarGraficoSeveridade(sevCounts);

        // Linha (Tendência de Críticas)
        const timeline = {};
        const criticos = filtrados.filter(x => x.severidade === 'CRITICAL');
        criticos.sort((a, b) => a.data_publicacao - b.data_publicacao);
        criticos.forEach(x => {
            const dia = x.data_publicacao.toISOString().split('T')[0];
            timeline[dia] = (timeline[dia] || 0) + 1;
        });
        renderizarGraficoLinha(timeline);

        // Vertical (Tipos de Vulnerabilidade)
        const tiposCounts = {};
        filtrados.forEach(x => { 
            const t = x.tipo_falha || 'Outros'; 
            if (t !== 'Outros') tiposCounts[t] = (tiposCounts[t] || 0) + 1;
        });
        const topTipos = Object.entries(tiposCounts).sort((a,b) => b[1]-a[1]).slice(0, 6);
        renderizarGraficoVertical('tiposVulnChart', meuGraficoTiposVuln, Object.fromEntries(topTipos), langConfig[idiomaAtual].chartLabels.occurrences);
    }

    // --- ATUALIZAR VAZAMENTOS (HIBP) ---
    if (DADOS_COMPLETOS_HIBP.length > 0) {
        const filtrados = DADOS_COMPLETOS_HIBP.filter(x => x.data_vazamento && x.data_vazamento >= dataLimite);
        
        // KPI Total Contas
        const totalContas = filtrados.reduce((acc, curr) => acc + (curr.contas_afetadas || 0), 0);
        let formatado = totalContas.toLocaleString('pt-BR');
        if (totalContas > 1000000) formatado = (totalContas/1000000).toFixed(1) + " Milhões";
        else if (totalContas > 1000) formatado = (totalContas/1000).toFixed(1) + " Mil";
        
        const kpiContasEl = document.getElementById('kpi-contas-vazadas');
        if(kpiContasEl) kpiContasEl.innerText = formatado;

        // Tabela Recentes (Apenas na página principal)
        const tabela = document.querySelector("#tabela-vazamentos tbody");
        if (tabela) {
            tabela.innerHTML = '';
            const topVaz = filtrados.sort((a,b) => b.contas_afetadas - a.contas_afetadas).slice(0, 5);
            
            if (topVaz.length === 0) {
                tabela.innerHTML = `<tr><td colspan="3">${langConfig[idiomaAtual].table.empty}</td></tr>`;
            } else {
                const locale = idiomaAtual.replace('_', '-');
                topVaz.forEach(v => {
                    const tr = document.createElement('tr');
                    const dataFmt = v.data_vazamento ? v.data_vazamento.toLocaleDateString(locale) : "N/A";
                    tr.innerHTML = `
                        <td><strong>${v.nome_vazamento}</strong><br><span style="font-size:0.8em;color:var(--cor-texto-secundario)">${dataFmt}</span></td>
                        <td>${v.setor||'N/A'}</td>
                        <td>${(v.contas_afetadas||0).toLocaleString(locale)}</td>`;
                    tabela.appendChild(tr);
                });
            }
        }
    }

    // --- ATUALIZAR OTX (Ameaças e Setores) ---
    if (DADOS_COMPLETOS_OTX.length > 0) {
        const filtrados = DADOS_COMPLETOS_OTX.filter(x => x.data_criacao && x.data_criacao >= dataLimite);
        
        const contAmeacas = {}, contSetores = {};
        filtrados.forEach(p => {
            if(p.ameacas) p.ameacas.forEach(t => contAmeacas[t.toLowerCase().trim()] = (contAmeacas[t.toLowerCase().trim()] || 0) + 1);
            if(p.setores) p.setores.forEach(s => contSetores[s.trim()] = (contSetores[s.trim()] || 0) + 1);
        });

        const getTop = (o) => Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,5).reduce((r,[k,v])=>({...r,[k]:v}),{});
        const topA = getTop(contAmeacas), topS = getTop(contSetores);

        // KPIs
        const kpiA = document.getElementById('kpi-ameaca-comum');
        if(kpiA) kpiA.innerText = Object.keys(topA)[0] || "N/A";
        
        const kpiS = document.getElementById('kpi-setor-atacado');
        if(kpiS) kpiS.innerText = Object.keys(topS)[0] || "N/A";
        
        // Gráfico de Barras (Setores)
        renderizarGraficoBarras('setoresChart', meuGraficoSetores, topS, langConfig[idiomaAtual].charts.sectors);
    }

    // --- ATUALIZAR PAÍSES (AbuseIPDB) ---
    if (DADOS_COMPLETOS_PAISES.length > 0) {
        const filtrados = DADOS_COMPLETOS_PAISES.filter(x => x.data_report && x.data_report >= dataLimite);
        
        const contPaises = {};
        filtrados.forEach(item => {
            if (item.pais) {
                const p = item.pais.trim();
                contPaises[p] = (contPaises[p] || 0) + 1;
            }
        });

        const topPaises = Object.entries(contPaises)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

        renderizarGraficoBarras('paisesChart', meuGraficoPaises, topPaises, langConfig[idiomaAtual].charts.countries);
    }
}


// --- FUNÇÕES DE RENDERIZAÇÃO DE GRÁFICOS (Chart.js) ---

function getChartColors() {
    const style = getComputedStyle(document.body);
    return {
        corPrimaria: style.getPropertyValue('--cor-primaria').trim(),
        corSecundaria: style.getPropertyValue('--cor-secundaria').trim(),
        corPerigo: style.getPropertyValue('--cor-perigo').trim(),
        corAviso: style.getPropertyValue('--cor-aviso').trim(),
        corNeutra: style.getPropertyValue('--cor-neutra').trim(),
        corGrid: style.getPropertyValue('--cor-grafico-grid').trim(),
        corTexto: style.getPropertyValue('--cor-texto-secundario').trim(),
        corFundoCard: style.getPropertyValue('--cor-fundo-card').trim(),
    };
}


function renderizarGraficoBarras(canvasId, chartInstance, dados, label) {
    const canvasEl = document.getElementById(canvasId);
    if (!canvasEl) return;

    if (!dados || Object.keys(dados).length === 0) {
        if (chartInstance) chartInstance.destroy();
        return;
    }

    const { corPrimaria, corGrid, corTexto } = getChartColors();
    const labels = Object.keys(dados);
    const dataPoints = Object.values(dados);
    
    if (chartInstance) chartInstance.destroy();

    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: dataPoints,
                backgroundColor: `${corPrimaria}B3`,
                borderColor: corPrimaria,
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y', // Barras horizontais
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: corGrid }, ticks: { color: corTexto, font: { family: "'Roboto', sans-serif" } } },
                y: { grid: { display: false }, ticks: { color: corTexto, font: { family: "'Roboto', sans-serif" } } }
            }
        }
    };

    const chart = new Chart(canvasEl, config);
    
    // Atualizar referência global
    if(canvasId === 'setoresChart') meuGraficoSetores = chart;
    if(canvasId === 'paisesChart') meuGraficoPaises = chart;
}

function renderizarGraficoVertical(canvasId, chartInstance, dados, label) {
    const canvasEl = document.getElementById(canvasId);
    if (!canvasEl) return;

    if (!dados || Object.keys(dados).length === 0) {
        if (chartInstance) chartInstance.destroy();
        return;
    }

    const { corSecundaria, corGrid, corTexto } = getChartColors();
    const labels = Object.keys(dados);
    const dataPoints = Object.values(dados);
    
    if (meuGraficoTiposVuln) meuGraficoTiposVuln.destroy();

    meuGraficoTiposVuln = new Chart(canvasEl, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: dataPoints,
                backgroundColor: `${corSecundaria}B3`, 
                borderColor: corSecundaria,
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'x', // Barras verticais
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: corGrid }, ticks: { color: corTexto } },
                x: { grid: { display: false }, ticks: { color: corTexto, font: { size: 10 } } }
            }
        }
    });
}

function renderizarGraficoSeveridade(dados) {
    const canvasEl = document.getElementById('donutChart');
    if (!canvasEl) return;

    const { corPerigo, corAviso, corPrimaria, corNeutra, corTexto, corFundoCard } = getChartColors();
    const labels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];
    const dataPoints = labels.map(l => dados[l] || 0);

    const colors = [
        corPerigo, // CRITICAL
        corAviso, // HIGH
        corPrimaria, // MEDIUM
        corNeutra, // LOW
        '#808080' // NONE
    ];

    if (meuGraficoDonut) meuGraficoDonut.destroy();

    meuGraficoDonut = new Chart(canvasEl, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataPoints,
                backgroundColor: colors,
                borderColor: corFundoCard, // Usa a cor do card para borda (melhor contraste)
                borderWidth: 4,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { 
                    position: 'right', 
                    labels: { 
                        color: corTexto, 
                        font: { size: 12 }, 
                        boxWidth: 12 
                    } 
                }
            }
        }
    });
}

function renderizarGraficoLinha(dadosDiarios) {
    const canvasEl = document.getElementById('lineChart');
    if (!canvasEl) return; 

    const { corPerigo, corGrid, corTexto } = getChartColors();
    const labels = Object.keys(dadosDiarios);
    const dataPoints = Object.values(dadosDiarios);
    
    const corSegura = corPerigo || '#ff4d4f';
    // Adiciona transparência à cor segura para o gradiente de fundo
    const corFundo1 = corSegura + '80';
    const corFundo2 = corSegura + '00';

    if (meuGraficoLinha) meuGraficoLinha.destroy();

    meuGraficoLinha = new Chart(canvasEl, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: langConfig[idiomaAtual].chartLabels.criticals, // Label traduzida
                data: dataPoints,
                fill: true,
                backgroundColor: (ctx) => {
                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                    try {
                        gradient.addColorStop(0, corFundo1);
                        gradient.addColorStop(1, corFundo2);
                    } catch(e) { return corSegura; }
                    return gradient;
                },
                borderColor: corSegura,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: corSegura
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { 
                    type: 'time', 
                    time: { 
                        unit: 'week', 
                        tooltipFormat: 'dd/MM/yyyy' 
                    }, 
                    grid: { color: corGrid }, 
                    ticks: { color: corTexto } 
                },
                y: { 
                    beginAtZero: true, 
                    grid: { color: corGrid }, 
                    ticks: { color: corTexto } 
                }
            }
        }
    });
}

function toggleChat() {
    const chat = document.getElementById('chatbot-window');
    chat.classList.toggle('hidden');
}

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

function sendMessage() {
    const input = document.getElementById('user-input');
    const msg = input.value.trim().toLowerCase();
    const chatBody = document.getElementById('chat-messages');

    if (msg === "") return;

    // 1. Adiciona mensagem do usuário
    chatBody.innerHTML += `<div class="msg user">${input.value}</div>`;
    input.value = "";

    // 2. Lógica "Burra" mas Eficiente (Switch Case)
    let resposta = "Desculpe, não entendi. Tente 'O que é CVE' ou 'Quem criou o Aegis'.";

    if (msg.includes("cve")) {
        resposta = "CVE (Common Vulnerabilities and Exposures) é uma lista de falhas de segurança conhecidas publicamente.";
    } else if (msg.includes("vazamento") || msg.includes("dados")) {
        resposta = "Vazamentos ocorrem quando dados confidenciais são expostos. Use nosso painel para ver empresas afetadas.";
    } else if (msg.includes("aegis") || msg.includes("criou")) {
        resposta = "O Project Aegis foi criado pela equipe de Ciência da Computação do UniCEUB!";
    } else if (msg.includes("ola") || msg.includes("oi")) {
        resposta = "Olá! Como posso ajudar você a entender o dashboard hoje?";
    }

    // 3. Simula delay de digitação e responde
    chatBody.scrollTop = chatBody.scrollHeight;
    setTimeout(() => {
        chatBody.innerHTML += `<div class="msg bot">${resposta}</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 600);
}