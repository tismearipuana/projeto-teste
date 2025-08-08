// Arquivo: student_script.js (CORRIGIDO ORDENAÇÃO DO GRÁFICO)

// --- CONFIGURAÇÃO, CONSTANTES, VARIÁVEIS, REFERÊNCIAS (sem alterações) ---
const CONFIG = { API_BASE_URL: 'http://localhost:3000/api' };
const LEVEL_SCORES = { 'Pré Leitor 1': 1, 'Pré Leitor 2': 2, 'Pré Leitor 3': 3, 'Pré Leitor 4': 4, 'Pré Leitor 5': 5, 'Pré Leitor 6': 6, 'Abaixo do Básico': 1, 'Básico': 2, 'Proficiente': 3, 'Avançado': 4, 'Muito Baixo': 1, 'Baixo': 2, 'Médio': 3, 'Alto': 4, 'Nível 1': 1, 'Nível 2': 2, 'Nível 3': 3, 'Nível 4': 4, 'Leitor 1': 1, 'Leitor 2': 2, 'Leitor 3': 3, 'Leitor 4': 4, 'Defasado': 1, 'Intermediário': 2, 'Adequado': 3, 'Iniciante': 7, 'Fluente': 8, };
const LEVEL_STYLES = { 'Pré Leitor 1': { className: 'level-pre-leitor-1' }, 'Pré Leitor 2': { className: 'level-pre-leitor-2' }, 'Pré Leitor 3': { className: 'level-pre-leitor-3' }, 'Pré Leitor 4': { className: 'level-pre-leitor-4' }, 'Pré Leitor 5': { className: 'level-pre-leitor-5' }, 'Pré Leitor 6': { className: 'level-pre-leitor-6' }, 'Abaixo do Básico': { className: 'level-abaixo-do-basico' }, 'Básico': { className: 'level-basico' }, 'Proficiente': { className: 'level-proficiente' }, 'Avançado': { className: 'level-avancado' }, 'Muito Baixo': { className: 'level-muito-baixo' }, 'Baixo': { className: 'level-baixo' }, 'Médio': { className: 'level-medio' }, 'Alto': { className: 'level-alto' }, 'Nível 1': { className: 'level-nivel-1' }, 'Nível 2': { className: 'level-nivel-2' }, 'Nível 3': { className: 'level-nivel-3' }, 'Nível 4': { className: 'level-nivel-4' }, 'Leitor 1': { className: 'level-leitor-1' }, 'Leitor 2': { className: 'level-leitor-2' }, 'Leitor 3': { className: 'level-leitor-3' }, 'Leitor 4': { className: 'level-leitor-4' }, 'Defasado': { className: 'level-defasado' }, 'Intermediário': { className: 'level-intermediario' }, 'Adequado': { className: 'level-adequado' }, 'Iniciante': { className: 'level-iniciante-blue-2' }, 'Fluente': { className: 'level-fluente-blue-2' } };
let studentData = null; let progressionChart = null;
const elements = { studentName: document.getElementById('student-name'), studentSchool: document.getElementById('student-school'), studentYear: document.getElementById('student-year'), studentTurma: document.getElementById('student-turma'), historyTableContainer: document.getElementById('history-table-container'), mainContent: document.getElementById('main-content'), errorMessage: document.getElementById('error-message'), errorDetails: document.getElementById('error-details'), areaFilter: document.getElementById('area-filter'), totalEvaluations: document.getElementById('total-evaluations'), improvementTrend: document.getElementById('improvement-trend'), totalEvaluationsLabel: document.getElementById('total-evaluations-label'), improvementTrendLabel: document.getElementById('improvement-trend-label'), };
function toTitleCase(str) { if (!str || typeof str !== 'string') return ''; return str.toLowerCase().split(' ').map(word => ['de','da','do','dos','das','e','a','o'].includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }
function getLevelClassName(levelValue) { if (!levelValue) return 'level-sem-dados'; const style = LEVEL_STYLES[levelValue.trim()]; return style ? `level-default ${style.className}` : 'level-sem-dados'; }
function showError(message) { if (elements.mainContent) elements.mainContent.style.display = 'none'; if (elements.errorDetails) elements.errorDetails.textContent = message; if (elements.errorMessage) elements.errorMessage.style.display = 'block'; }

// --- LÓGICA PRINCIPAL ---

async function loadStudentHistory(inep) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/aluno/${inep}`);
        if (!response.ok) { if (response.status === 404) throw new Error('Aluno não encontrado com o INEP fornecido.'); throw new Error(`Erro na API: ${response.statusText}`); }
        studentData = await response.json();
        updateStudentInfo(studentData.dadosCadastrais, studentData.historicoResultados);
        populateAreaFilter(studentData.historicoResultados);
        updateVisualizations();
    } catch (error) {
        showError(error.message);
    }
}

function updateStudentInfo(dadosCadastrais, historico) {
    if (!dadosCadastrais) return;
    const nomeAluno = toTitleCase(dadosCadastrais.nome_aluno || 'Aluno');
    elements.studentName.textContent = nomeAluno;
    document.title = `Histórico de ${nomeAluno}`;
    const registroMaisRecente = historico && historico.length > 0 ? historico[historico.length - 1] : null; // Pega o último, que é o mais recente
    if (registroMaisRecente) {
        elements.studentSchool.textContent = toTitleCase(registroMaisRecente.nome_escola || 'Não informado');
        elements.studentYear.textContent = toTitleCase(registroMaisRecente.nome_etapa || 'Não informado');
        elements.studentTurma.textContent = toTitleCase(registroMaisRecente.nome_turma || 'Não informado');
    }
}

function populateAreaFilter(historico) {
    const areas = [...new Set(historico.map(item => item.etapa_de_conhecimento))];
    areas.sort().forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = toTitleCase(area);
        elements.areaFilter.appendChild(option);
    });
}

function updateVisualizations() {
    const selectedArea = elements.areaFilter.value;
    const historicoCompleto = studentData.historicoResultados || [];
    const filteredHistory = selectedArea === 'todas'
        ? historicoCompleto
        : historicoCompleto.filter(item => item.etapa_de_conhecimento === selectedArea);
    renderHistoryTable(filteredHistory);
    drawProgressionChart(filteredHistory, selectedArea);
    updateSummaryCards(filteredHistory, selectedArea); 
}

function updateSummaryCards(historico, selectedArea) {
    const areaText = selectedArea === 'todas' ? 'Geral' : `em ${toTitleCase(selectedArea)}`;
    elements.totalEvaluationsLabel.textContent = `Total de Avaliações (${areaText})`;
    elements.improvementTrendLabel.textContent = `Tendência (${areaText})`;
    elements.totalEvaluations.textContent = historico.length;
    elements.improvementTrend.innerHTML = calculateImprovementTrend(historico);
}

function calculateImprovementTrend(historico) {
    const scoredResults = historico.map(item => ({ year: item.ano_aplicacao, score: LEVEL_SCORES[item.resultado] || 0 })).filter(item => item.score > 0);
    if (scoredResults.length < 2) return 'Insuficiente';
    const firstYear = Math.min(...scoredResults.map(r => r.year));
    const lastYear = Math.max(...scoredResults.map(r => r.year));
    if (firstYear === lastYear) return 'Insuficiente';
    const firstYearScores = scoredResults.filter(r => r.year === firstYear).map(r => r.score);
    const lastYearScores = scoredResults.filter(r => r.year === lastYear).map(r => r.score);
    const firstAvg = firstYearScores.reduce((a, b) => a + b, 0) / firstYearScores.length;
    const lastAvg = lastYearScores.reduce((a, b) => a + b, 0) / lastYearScores.length;
    if (lastAvg > firstAvg) return 'Melhorando ↗️';
    if (lastAvg < firstAvg) return 'Declinando ↘️';
    return 'Estável ➡️';
}

function renderHistoryTable(historico) {
    if (!historico || historico.length === 0) { elements.historyTableContainer.innerHTML = `<div class="info-message"><span>📭</span> Não há avaliações para a área selecionada.</div>`; return; }
    let tableHTML = `<table class="history-table"><thead><tr><th>Ano</th><th>Avaliação</th><th>Área</th><th>Etapa</th><th>Turma</th><th>Resultado</th></tr></thead><tbody>`;
    // Mostra os dados na ordem que vêm da API (já cronológica)
    historico.forEach(item => { const levelClass = getLevelClassName(item.resultado); tableHTML += `<tr><td>${item.ano_aplicacao || '-'}</td><td>${toTitleCase(item.nome_avaliacao) || '-'}</td><td>${toTitleCase(item.etapa_de_conhecimento) || '-'}</td><td>${toTitleCase(item.nome_etapa) || '-'}</td><td>${toTitleCase(item.nome_turma) || '-'}</td><td class="${levelClass}">${toTitleCase(item.resultado) || '-'}</td></tr>`; });
    tableHTML += `</tbody></table>`;
    elements.historyTableContainer.innerHTML = tableHTML;
}

function drawProgressionChart(historico, selectedArea) {
    if (progressionChart) { progressionChart.destroy(); }
    const ctx = document.getElementById('progression-chart')?.getContext('2d');
    if (!ctx || !historico || historico.length === 0) return;
    
    // **CORREÇÃO PONTO 2**: Não reordena os dados, confia na ordem da API
    const chartData = historico.map(item => ({ 
        x: `${item.nome_avaliacao}`, 
        y: LEVEL_SCORES[item.resultado] || 0, 
        label: item.resultado 
    })).filter(item => item.y > 0);

    if (chartData.length === 0) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); return; }
    
    const scoreToLabelMap = {};
    chartData.forEach(d => { scoreToLabelMap[d.y] = d.label; });
    const labels = chartData.map(d => d.x.replace(/Avaliação /i, '').replace(/ de /i, '/ '));
    const dataPoints = chartData.map(d => d.y);
    const maxScore = Math.max(...dataPoints);
    
    progressionChart = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: `Progressão em ${toTitleCase(selectedArea)}`, data: dataPoints, borderColor: '#0096C7', backgroundColor: 'rgba(0, 150, 199, 0.2)', fill: true, tension: 0.1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: maxScore + 1, ticks: { stepSize: 1, callback: function(value) { return scoreToLabelMap[value] ? toTitleCase(scoreToLabelMap[value]) : ''; } } } }, plugins: { tooltip: { callbacks: { label: function(context) { const originalLabel = chartData[context.dataIndex]?.label || ''; return `Resultado: ${toTitleCase(originalLabel)}`; } } } } } });
}


// --- INICIALIZAÇÃO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const inep = params.get('inep');
    if (!inep) { showError("Nenhum INEP de aluno foi fornecido na URL."); return; }
    loadStudentHistory(inep);
    elements.areaFilter.addEventListener('change', updateVisualizations);
});