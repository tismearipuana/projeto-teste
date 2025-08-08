// Arquivo: script.js (VERSÃO FINAL E COMPLETA)

const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api',
    ROWS_PER_PAGE: 15,
    DEBOUNCE_DELAY: 400,
    STUDENT_NAME_HEADER: 'nome_aluno'
};

Chart.register(ChartDataLabels);

// --- Classes Utilitárias e Variáveis Globais ---
class LoadingManager { constructor() { this.loadingElement = document.getElementById('loading-indicator'); this.messageElement = document.getElementById('loading-message'); } show(message = 'Carregando...') { if (this.messageElement) this.messageElement.textContent = message; if (this.loadingElement) this.loadingElement.style.display = 'flex'; } hide() { if (this.loadingElement) this.loadingElement.style.display = 'none'; } }
class NotificationManager { constructor() { this.container = document.getElementById('notification-container'); } show(message, type = 'info', duration = 5000) { const notification = document.createElement('div'); notification.className = `notification ${type}`; notification.innerHTML = `<div class="notification-content"><span>${message}</span></div>`; this.container.appendChild(notification); if (duration > 0) setTimeout(() => notification.remove(), duration); } }
let allFetchedData = [];
let filteredData = [];
let currentPage = 1; let currentChart = null; let schoolPerformanceChart = null;
const loadingManager = new LoadingManager(); const notificationManager = new NotificationManager();
const elements = { dataTableContainer: document.getElementById('data-table-container'), schoolFilter: document.getElementById('school-filter'), evaluationFilter: document.getElementById('evaluation-filter'), yearFilter: document.getElementById('year-filter'), turmaFilter: document.getElementById('turma-filter'), levelFilterGroup: document.getElementById('level-filter-group'), levelFilter: document.getElementById('level-filter'), nseFilterGroup: document.getElementById('nse-filter-group'), nseFilter: document.getElementById('nse-filter'), corRacaFilterGroup: document.getElementById('cor-raca-filter-group'), corRacaFilter: document.getElementById('cor-raca-filter'), inclusaoFilterGroup: document.getElementById('inclusao-filter-group'), inclusaoFilter: document.getElementById('inclusao-filter'), transporteFilterGroup: document.getElementById('transporte-filter-group'), transporteFilter: document.getElementById('transporte-filter'), applyFiltersButton: document.getElementById('apply-filters'), clearFiltersButton: document.getElementById('clear-filters'), paginationControls: document.getElementById('pagination-controls'), themeToggle: document.getElementById('theme-toggle'), summarySection: document.getElementById('summary-section'), totalCardContent: document.getElementById('total-card-content'), distCardContent: document.getElementById('dist-card-content'), chartCardTitle: document.getElementById('chart-card-title'), schoolPerformanceSection: document.getElementById('school-performance-section'), topScrollContainer: document.getElementById('top-scroll-container'), topScrollBar: document.getElementById('top-scroll-bar'), studentSearch: document.getElementById('student-search'), rowsPerPageSelect: document.getElementById('rows-per-page') };
const LEVEL_STYLES = { 'Pré Leitor 1': { color: '#B00020', className: 'level-pre-leitor-1' }, 'Pré Leitor 2': { color: '#C62828', className: 'level-pre-leitor-2' }, 'Pré Leitor 3': { color: '#E53935', className: 'level-pre-leitor-3' }, 'Pré Leitor 4': { color: '#F57C00', className: 'level-pre-leitor-4' }, 'Pré Leitor 5': { color: '#E65100', className: 'level-pre-leitor-5' }, 'Pré Leitor 6': { color: '#689F38', className: 'level-pre-leitor-6' }, 'Abaixo do Básico': { color: '#B00020', className: 'level-abaixo-do-basico' }, 'Básico': { color: '#F4C542', className: 'level-basico' }, 'Proficiente': { color: '#43A047', className: 'level-proficiente' }, 'Avançado': { color: '#2E7D32', className: 'level-avancado' }, 'Muito Baixo': { color: '#C62828', className: 'level-muito-baixo' }, 'Baixo': { color: '#EF6C00', className: 'level-baixo' }, 'Médio': { color: '#FBC02D', className: 'level-medio' }, 'Alto': { color: '#2E7D32', className: 'level-alto' }, 'Nível 1': { color: '#B71C1C', className: 'level-nivel-1' }, 'Nível 2': { color: '#F57C00', className: 'level-nivel-2' }, 'Nível 3': { color: '#FBC02D', className: 'level-nivel-3' }, 'Nível 4': { color: '#2E7D32', className: 'level-nivel-4' }, 'Leitor 1': { color: '#C62828', className: 'level-leitor-1' }, 'Leitor 2': { color: '#EF6C00', className: 'level-leitor-2' }, 'Leitor 3': { color: '#FDD835', className: 'level-leitor-3' }, 'Leitor 4': { color: '#43A047', className: 'level-leitor-4' }, 'Defasado': { color: '#D32F2F', className: 'level-defasado' }, 'Intermediário': { color: '#FFB300', className: 'level-intermediario' }, 'Adequado': { color: '#388E3C', className: 'level-adequado' }, 'Iniciante': { color: '#29B6F6', className: 'level-iniciante-blue-2' }, 'Fluente': { color: '#1E88E5', className: 'level-fluente-blue-2' } };


// --- LÓGICA DE DADOS ---

async function populateInitialFilters() {
    try {
        const [escolasRes, geraisRes, demograficosRes] = await Promise.all([
            fetch(`${CONFIG.API_BASE_URL}/filtros/escolas`),
            fetch(`${CONFIG.API_BASE_URL}/filtros/gerais`),
            fetch(`${CONFIG.API_BASE_URL}/filtros/demograficos`)
        ]);
        if (!escolasRes.ok || !geraisRes.ok || !demograficosRes.ok) throw new Error("Falha ao buscar dados para os filtros.");
        
        const escolas = await escolasRes.json();
        const gerais = await geraisRes.json();
        const demograficos = await demograficosRes.json();

        populateSelect(elements.schoolFilter, escolas, 'Todas as Escolas', 'id_escola', 'nome_escola');
        populateSelect(elements.turmaFilter, gerais.turmas, 'Todas as Turmas', 'id_turma', 'nome_turma');
        populateSelect(elements.yearFilter, gerais.etapas, 'Todas as Etapas', 'id_etapa', 'nome_etapa');
        populateSelect(elements.evaluationFilter, gerais.avaliacoes, 'Todas as Avaliações');
        
        populateSelect(elements.nseFilter, demograficos.beneficiario, 'Todos');
        populateSelect(elements.corRacaFilter, demograficos.cor_raca, 'Todas as Cores/Raças');
        populateSelect(elements.inclusaoFilter, demograficos.pcd, 'Todos');
        populateSelect(elements.transporteFilter, demograficos.transporte, 'Todos');

    } catch (error) {
        notificationManager.show('Não foi possível carregar as opções de filtro', 'error');
        console.error('Erro ao popular filtros:', error);
    }
}

async function updateDynamicFilters() {
    const evaluationName = elements.evaluationFilter.value;
    const dynamicGroups = [elements.nseFilterGroup, elements.corRacaFilterGroup, elements.inclusaoFilterGroup, elements.transporteFilterGroup, elements.levelFilterGroup];

    if (!evaluationName) {
        dynamicGroups.forEach(group => { if(group) group.style.display = 'none' });
        return;
    }

    dynamicGroups.forEach(group => { if(group) group.style.display = 'block' });
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/niveis-por-avaliacao?id_avaliacao=${elements.evaluationFilter.options[elements.evaluationFilter.selectedIndex].value}`);
        if (!response.ok) throw new Error("Falha ao buscar níveis da avaliação.");
        const data = await response.json();
        populateSelect(elements.levelFilter, data, 'Todos os Níveis', 'id_nivel', 'descricao_resultado');
    } catch(error) {
        notificationManager.show(error.message, 'error');
    }
}

async function applyFiltersAndSearch() {
    loadingManager.show('Buscando dados...');
    
    const params = new URLSearchParams();
    const evaluationName = elements.evaluationFilter.value;
    if (elements.schoolFilter.value) params.append('escola', elements.schoolFilter.options[elements.schoolFilter.selectedIndex].text);
    if (elements.turmaFilter.value) params.append('turma', elements.turmaFilter.options[elements.turmaFilter.selectedIndex].text);
    if (elements.yearFilter.value) params.append('etapa', elements.yearFilter.options[elements.yearFilter.selectedIndex].text);
    if (evaluationName) params.append('avaliacao', evaluationName);
    if (elements.levelFilter.value) params.append('nivel', elements.levelFilter.options[elements.levelFilter.selectedIndex].text);
    if (elements.nseFilter.value) params.append('beneficiario', elements.nseFilter.value);
    if (elements.corRacaFilter.value) params.append('cor_raca', elements.corRacaFilter.value);
    if (elements.inclusaoFilter.value) params.append('pcd', elements.inclusaoFilter.value);
    if (elements.transporteFilter.value) params.append('transporte', elements.transporteFilter.value);
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/dados-dashboard?${params.toString()}`);
        if (!response.ok) throw new Error('A resposta da API não foi bem-sucedida.');
        allFetchedData = await response.json();
        filterLocalData();
        displaySummaryStatistics(filteredData, evaluationName);
        drawChart(filteredData, evaluationName);
        drawSchoolPerformanceChart(filteredData, evaluationName);
        notificationManager.show(`${filteredData.length} registros encontrados.`, 'info');
    } catch (error) {
        notificationManager.show("Erro ao buscar dados.", "error");
    } finally {
        loadingManager.hide();
    }
}

function filterLocalData() { const searchQuery = elements.studentSearch.value.toLowerCase().trim(); if (searchQuery) { filteredData = allFetchedData.filter(row => row[CONFIG.STUDENT_NAME_HEADER].toLowerCase().includes(searchQuery)); } else { filteredData = [...allFetchedData]; } currentPage = 1; displayData(); }
function setupScrollSynchronization() { const dataTable = elements.dataTableContainer.querySelector('table'); if (dataTable && elements.topScrollContainer && elements.topScrollBar) { const hasHorizontalScroll = dataTable.scrollWidth > elements.dataTableContainer.clientWidth; elements.topScrollContainer.style.display = hasHorizontalScroll ? 'block' : 'none'; elements.topScrollBar.style.width = dataTable.scrollWidth + 'px'; elements.topScrollContainer.onscroll = () => { elements.dataTableContainer.scrollLeft = elements.topScrollContainer.scrollLeft; }; elements.dataTableContainer.onscroll = () => { elements.topScrollContainer.scrollLeft = elements.topScrollContainer.scrollLeft; }; } }
function displayData() { const container = elements.dataTableContainer; if (!filteredData || filteredData.length === 0) { container.innerHTML = `<div class="info-message"><span>🔍</span> Nenhum dado encontrado.</div>`; if (elements.paginationControls) elements.paginationControls.innerHTML = ''; return; } const rowsPerPage = parseInt(elements.rowsPerPageSelect.value, 10); const startIndex = (currentPage - 1) * rowsPerPage; const endIndex = startIndex + rowsPerPage; const paginatedData = filteredData.slice(startIndex, endIndex); const evaluationSelected = !!elements.evaluationFilter.value; let headersToShow = ['ESCOLA', CONFIG.STUDENT_NAME_HEADER, 'ETAPA DE ENSINO', 'TURMA']; if (evaluationSelected) { headersToShow = ['ESCOLA', CONFIG.STUDENT_NAME_HEADER, 'resultado', 'BENEFICIÁRIO SOCIAL?', 'COR/RAÇA', 'ALUNO PCD?', 'UTILIZA TRANSPORTE ESCOLAR']; } let tableHTML = `<table><thead><tr><th>#</th>`; headersToShow.forEach(h => tableHTML += `<th>${toTitleCase(h.replace(/_/g, ' '))}</th>`); tableHTML += `</tr></thead><tbody>`; paginatedData.forEach((row, index) => { const rowClass = getLevelClassName(row.resultado); tableHTML += `<tr class="${rowClass}"><td>${startIndex + index + 1}</td>`; headersToShow.forEach(header => { const cellValue = row[header] || '-'; if (header === CONFIG.STUDENT_NAME_HEADER) { tableHTML += `<td><a href="#" class="student-link" onclick="openStudentDetail('${row.INEP}'); return false;">${toTitleCase(cellValue)}</a></td>`; } else { tableHTML += `<td>${toTitleCase(cellValue)}</td>`; } }); tableHTML += `</tr>`; }); tableHTML += `</tbody></table>`; container.innerHTML = tableHTML; renderPaginationControls(filteredData.length); setupScrollSynchronization(); }
function renderPaginationControls(totalRows) { const container = elements.paginationControls; if(!container) return; container.innerHTML = ''; const rowsPerPage = parseInt(elements.rowsPerPageSelect.value, 10); const totalPages = Math.ceil(totalRows / rowsPerPage); if (totalPages <= 1) return; for (let i = 1; i <= totalPages; i++) { const btn = document.createElement('button'); btn.className = `page-btn ${i === currentPage ? 'active' : ''}`; btn.innerText = i; btn.onclick = () => { currentPage = i; displayData(); }; container.appendChild(btn); } }
function displaySummaryStatistics(data, evaluationName) { if (!evaluationName || data.length === 0) { if(elements.summarySection) elements.summarySection.style.display = 'none'; return; } if(elements.summarySection) elements.summarySection.style.display = 'block'; const total = data.length; const levelCounts = data.reduce((acc, row) => { const level = row.resultado; if (level) acc[level] = (acc[level] || 0) + 1; return acc; }, {}); if(elements.totalCardContent) elements.totalCardContent.innerHTML = `<span class="value">${total}</span>`; let listHTML = '<ul class="level-distribution-list">'; Object.keys(levelCounts).sort().forEach(level => { const count = levelCounts[level]; const percentage = ((count / total) * 100).toFixed(1); listHTML += `<li><strong>${toTitleCase(level)}:</strong> ${count} (${percentage}%)</li>`; }); listHTML += '</ul>'; if(elements.distCardContent) elements.distCardContent.innerHTML = listHTML; }
function drawChart(data, evaluationName) { if (currentChart) currentChart.destroy(); if (!evaluationName || data.length === 0) return; if(elements.chartCardTitle) elements.chartCardTitle.textContent = `Distribuição - ${toTitleCase(evaluationName)}`; const levelCounts = data.reduce((acc, row) => { const level = row.resultado; if (level) acc[level] = (acc[level] || 0) + 1; return acc; }, {}); const labels = Object.keys(levelCounts).sort(); const chartData = labels.map(label => levelCounts[label]); const backgroundColors = labels.map(label => LEVEL_STYLES[label]?.color || '#CCCCCC'); const ctx = document.getElementById('fluenciaChart')?.getContext('2d'); if (!ctx) return; currentChart = new Chart(ctx, { type: 'pie', data: { labels: labels.map(toTitleCase), datasets: [{ data: chartData, backgroundColor: backgroundColors, borderColor: '#fff', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, datalabels: { formatter: (value, ctx) => { let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); let percentage = (value * 100 / sum).toFixed(1) + '%'; return percentage; }, color: '#fff', } } } }); }
function drawSchoolPerformanceChart(data, evaluationName) { if (schoolPerformanceChart) schoolPerformanceChart.destroy(); const section = elements.schoolPerformanceSection; if (!evaluationName || data.length === 0) { if(section) section.style.display = 'none'; return; } if(section) section.style.display = 'block'; const schoolLevelCounts = data.reduce((acc, row) => { const school = row['ESCOLA']; const level = row['resultado']; if (school && level) { if (!acc[school]) acc[school] = {}; acc[school][level] = (acc[school][level] || 0) + 1; } return acc; }, {}); const schools = Object.keys(schoolLevelCounts); const allLevels = [...new Set(data.map(r => r.resultado))].sort(); const datasets = allLevels.map(level => ({ label: toTitleCase(level), data: schools.map(school => { const total = Object.values(schoolLevelCounts[school]).reduce((a, b) => a + b, 0); const count = schoolLevelCounts[school][level] || 0; return total > 0 ? (count / total) * 100 : 0; }), rawCounts: schools.map(school => schoolLevelCounts[school][level] || 0), backgroundColor: LEVEL_STYLES[level]?.color || '#CCCCCC' })); const ctx = document.getElementById('schoolPerformanceChart')?.getContext('2d'); if (!ctx) return; schoolPerformanceChart = new Chart(ctx, { type: 'bar', data: { labels: schools, datasets: datasets }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, max: 100 }, y: { stacked: true } }, plugins: { tooltip: { callbacks: { label: function(context) { const dataset = context.dataset; const label = dataset.label || ''; const rawCount = dataset.rawCounts[context.dataIndex]; const percentage = context.parsed.x.toFixed(1); return `${label}: ${rawCount} aluno(s) (${percentage}%)`; } } }, datalabels: { formatter: (value) => value > 5 ? `${value.toFixed(0)}%` : '', color: '#fff' } } } }); }
function openStudentDetail(inep) { if (!inep || inep === 'null' || inep === 'undefined') { notificationManager.show('Este aluno não possui um INEP válido para consulta.', 'warning'); return; } window.open(`student_detail.html?inep=${inep}`, '_blank'); }
function debounce(func, delay) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; }
function populateSelect(selectElement, options, defaultText, valueKey = null, textKey = null) { if (!selectElement) return; selectElement.innerHTML = `<option value="">${defaultText}</option>`; options.forEach(option => { const optionElement = document.createElement('option'); if (typeof option === 'object' && valueKey && textKey) { optionElement.value = option[valueKey]; optionElement.textContent = option[textKey]; } else { optionElement.value = option; optionElement.textContent = option; } selectElement.appendChild(optionElement); }); }
function getLevelClassName(levelValue) { if (!levelValue) return 'level-sem-dados'; const style = LEVEL_STYLES[levelValue.trim()]; return style ? `level-default ${style.className}` : 'level-sem-dados'; }
function toTitleCase(str) { if (!str || typeof str !== 'string') return ''; return str.toLowerCase().split(' ').map(word => ['de','da','do','dos','das','e','a','o'].includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }
function clearFilters() { document.querySelectorAll('.filters select, .search-container input').forEach(s => s.value = ''); allFetchedData = []; filteredData = []; displayData(); updateDynamicFilters(); displaySummaryStatistics([], ''); drawChart([], ''); drawSchoolPerformanceChart([], ''); }

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); if (elements.themeToggle) elements.themeToggle.checked = true; }
    if (elements.themeToggle) { elements.themeToggle.addEventListener('change', () => { const isDark = elements.themeToggle.checked; document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); }); }
    
    loadingManager.show('Carregando filtros...');
    populateInitialFilters().then(() => {
        loadingManager.hide();
        elements.dataTableContainer.innerHTML = `<div class="info-message"><span>👆</span> Selecione os filtros para iniciar a busca.</div>`;
    });
    
    const debouncedFilter = debounce(applyFiltersAndSearch, CONFIG.DEBOUNCE_DELAY);
    document.querySelector('.filters').addEventListener('change', (event) => {
        if (event.target.tagName === 'SELECT') {
            if (event.target.id === 'evaluation-filter') {
                updateDynamicFilters();
            }
            debouncedFilter();
        }
    });
    elements.studentSearch.addEventListener('input', debounce(filterLocalData, CONFIG.DEBOUNCE_DELAY));
    elements.rowsPerPageSelect.addEventListener('change', () => {
        currentPage = 1;
        displayData();
    });
    if(elements.applyFiltersButton) elements.applyFiltersButton.style.display = 'none';
    if(elements.clearFiltersButton) elements.clearFiltersButton.addEventListener('click', clearFilters);
});