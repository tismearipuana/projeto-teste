// Arquivo: lancar_resultados.js (VERSÃO FINAL E COMPLETA)

document.addEventListener('DOMContentLoaded', () => {
    // Referências do Formulário Principal
    const form = document.getElementById('lancamento-form');
    const alunoSearchInput = document.getElementById('aluno-search-input');
    const alunoSearchResults = document.getElementById('aluno-search-results');
    const selectedAlunoIdInput = document.getElementById('selected-aluno-id');
    const evaluationStep = document.getElementById('evaluation-step');
    const escolaSelect = document.getElementById('escola-select');
    const etapaSelect = document.getElementById('etapa-select');
    const turmaSelect = document.getElementById('turma-select');
    const anoSelect = document.getElementById('ano-select');
    const avaliacaoSelect = document.getElementById('avaliacao-select');
    const resultadoSelect = document.getElementById('resultado-select');
    const beneficiarioSelect = document.getElementById('beneficiario-na-epoca');
    const transporteSelect = document.getElementById('transporte-na-epoca');
    const saveBtn = document.getElementById('save-btn');

    // Referências do Modal de Novo Aluno
    const addStudentBtn = document.getElementById('add-student-btn');
    const studentModal = document.getElementById('student-modal');
    const studentForm = document.getElementById('student-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const modalPcdSelect = document.getElementById('modal-pcd');
    const modalPcdDetailsGroup = document.getElementById('modal-pcd-details-group');
    const modalInepInput = document.getElementById('modal-inep_aluno');

    let searchTimeout;

    // --- FUNÇÕES DE API ---
    async function searchAlunos(term) { if (term.length < 3) { alunoSearchResults.innerHTML = ''; alunoSearchResults.style.display = 'none'; return []; } try { const response = await fetch(`http://localhost:3000/api/alunos?busca=${encodeURIComponent(term)}`); if (!response.ok) throw new Error('Falha na busca de alunos.'); return await response.json(); } catch (error) { console.error(error); return []; } }
    async function saveResult(data) { try { const response = await fetch('http://localhost:3000/api/resultados', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Erro desconhecido ao salvar.'); alert('Resultado salvo com sucesso!'); return true; } catch(error) { alert(`Erro ao salvar o resultado: ${error.message}`); return false; } }
    async function saveStudent(studentData) { try { const response = await fetch('http://localhost:3000/api/alunos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(studentData), }); const result = await response.json(); if (!response.ok) throw new Error(result.error); alert('Aluno salvo com sucesso!'); return result; } catch (error) { alert(`Erro ao salvar aluno: ${error.message}`); return null; } }


    // --- FUNÇÕES DE UI ---
    function populateSelect(selectElement, options, defaultText, valueKey = null, textKey = null) { selectElement.innerHTML = `<option value="">-- ${defaultText} --</option>`; options.forEach(option => { const optionElement = document.createElement('option'); if (typeof option === 'object' && valueKey && textKey) { optionElement.value = option[valueKey]; optionElement.textContent = option[textKey]; } else { optionElement.value = option; optionElement.textContent = option; } selectElement.appendChild(optionElement); }); }
    function renderSearchResults(alunos) { if (alunos.length === 0) { alunoSearchResults.innerHTML = '<div class="search-result-item">Nenhum aluno encontrado.</div>'; return; } alunoSearchResults.innerHTML = alunos.map(aluno => `<div class="search-result-item" data-id="${aluno.id_aluno}" data-name="${aluno.nome_aluno}" data-transporte="${aluno.transporte_escolar}" data-beneficio="${aluno.beneficiario_social}"> ${aluno.nome_aluno} (INEP: ${aluno.inep_aluno || 'N/A'}) </div>`).join(''); alunoSearchResults.style.display = 'block'; }
    function checkFormValidity() { saveBtn.disabled = !form.checkValidity(); }
    function openStudentModal() { studentForm.reset(); modalPcdDetailsGroup.style.display = 'none'; studentModal.style.display = 'flex'; }
    function closeStudentModal() { studentModal.style.display = 'none'; }


    // --- LÓGICA PRINCIPAL ---
    async function initializePage() {
        try {
            const [anosRes, geraisRes, escolasRes] = await Promise.all([ fetch('http://localhost:3000/api/filtros/anos'), fetch('http://localhost:3000/api/filtros/gerais'), fetch('http://localhost:3000/api/filtros/escolas') ]);
            if (!anosRes.ok || !geraisRes.ok || !escolasRes.ok) throw new Error('Falha ao carregar filtros iniciais.');
            const anos = await anosRes.json();
            const gerais = await geraisRes.json();
            const escolas = await escolasRes.json();
            populateSelect(anoSelect, anos, 'Selecione um ano');
            populateSelect(escolaSelect, escolas, 'Selecione uma escola', 'id_escola', 'nome_escola');
            populateSelect(etapaSelect, gerais.etapas, 'Selecione uma etapa', 'id_etapa', 'nome_etapa');
            turmaSelect.disabled = true;
        } catch (error) { alert(error.message); }
    }
    
    async function fetchAndPopulateTurmas() {
        const idEscola = escolaSelect.value;
        const idEtapa = etapaSelect.value;
        turmaSelect.disabled = true;
        turmaSelect.innerHTML = '<option value="">-- Carregando turmas... --</option>';
        if (idEscola && idEtapa) {
            try {
                const response = await fetch(`http://localhost:3000/api/turmas?id_escola=${idEscola}&id_etapa=${idEtapa}`);
                if(!response.ok) throw new Error('Não foi possível buscar as turmas.');
                const turmas = await response.json();
                populateSelect(turmaSelect, turmas, 'Selecione uma turma', 'id_turma', 'nome_turma');
                turmaSelect.disabled = false;
            } catch (error) { alert(error.message); populateSelect(turmaSelect, [], 'Erro ao buscar turmas'); }
        } else {
             turmaSelect.innerHTML = '<option value="">-- Escolha escola e etapa --</option>';
        }
    }

    // --- EVENT LISTENERS ---
    alunoSearchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(async () => { const alunos = await searchAlunos(alunoSearchInput.value); renderSearchResults(alunos); }, 500); });
    alunoSearchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item) {
            selectedAlunoIdInput.value = item.dataset.id;
            alunoSearchInput.value = item.dataset.name;
            beneficiarioSelect.value = item.dataset.beneficio || 'NÃO';
            transporteSelect.value = item.dataset.transporte || 'NÃO';
            alunoSearchResults.innerHTML = '';
            alunoSearchResults.style.display = 'none';
            evaluationStep.style.display = 'block';
            checkFormValidity();
        }
    });
    
    escolaSelect.addEventListener('change', fetchAndPopulateTurmas);
    etapaSelect.addEventListener('change', fetchAndPopulateTurmas);
    anoSelect.addEventListener('change', async () => { const selectedYear = anoSelect.value; avaliacaoSelect.disabled = true; resultadoSelect.disabled = true; if (!selectedYear) { avaliacaoSelect.innerHTML = '<option value="">-- Escolha um ano --</option>'; return; } try { const response = await fetch(`http://localhost:3000/api/filtros/avaliacoes-por-ano?ano=${selectedYear}`); const avaliacoes = await response.json(); populateSelect(avaliacaoSelect, avaliacoes, 'Selecione uma avaliação', 'id_avaliacao', 'nome_avaliacao'); avaliacaoSelect.disabled = false; } catch (error) { alert(error.message); } finally { checkFormValidity(); } });
    avaliacaoSelect.addEventListener('change', async () => { const selectedAvaliacaoId = avaliacaoSelect.value; resultadoSelect.disabled = true; if (!selectedAvaliacaoId) { resultadoSelect.innerHTML = '<option value="">-- Escolha uma avaliação --</option>'; return; } try { const response = await fetch(`http://localhost:3000/api/niveis-por-avaliacao?id_avaliacao=${selectedAvaliacaoId}`); const data = await response.json(); populateSelect(resultadoSelect, data, 'Selecione um resultado', 'id_nivel', 'descricao_resultado'); resultadoSelect.disabled = false; } catch (error) { alert(error.message); } finally { checkFormValidity(); } });
    form.addEventListener('change', checkFormValidity);
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = { id_aluno: parseInt(selectedAlunoIdInput.value, 10), id_avaliacao: parseInt(avaliacaoSelect.value, 10), id_turma_na_epoca: parseInt(turmaSelect.value, 10), id_nivel_resultado: parseInt(resultadoSelect.value, 10), beneficiario_na_epoca: beneficiarioSelect.value, transporte_na_epoca: transporteSelect.value, };
        const success = await saveResult(data);
        if (success) {
            alunoSearchInput.value = '';
            selectedAlunoIdInput.value = '';
            evaluationStep.style.display = 'none';
            form.reset();
            saveBtn.disabled = true;
            turmaSelect.innerHTML = '<option value="">-- Escolha escola e etapa --</option>';
            turmaSelect.disabled = true;
        }
    });
    
    // Listeners para o Modal de Novo Aluno
    addStudentBtn.addEventListener('click', openStudentModal);
    cancelBtn.addEventListener('click', closeStudentModal);
    studentModal.addEventListener('click', (e) => { if (e.target === studentModal) closeStudentModal(); });
    modalInepInput.addEventListener('input', () => { modalInepInput.value = modalInepInput.value.replace(/\D/g, ''); });
    modalPcdSelect.addEventListener('change', (e) => { modalPcdDetailsGroup.style.display = (e.target.value === 'SIM') ? 'block' : 'none'; });
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(studentForm);
        const data = Object.fromEntries(formData.entries());
        if (!/^\d{12}$/.test(data.inep_aluno)) { alert('O INEP é obrigatório e deve conter exatamente 12 números.'); return; }
        if (data.pcd_status === 'SIM') { data.pcd = data.pcd_details; } else { data.pcd = 'NÃO'; }
        delete data.pcd_status; delete data.pcd_details;
        if (data.data_nascimento) { const [year, month, day] = data.data_nascimento.split('-'); if(year && month && day) data.data_nascimento = `${day}/${month}/${year}`; }
        
        const newStudent = await saveStudent(data);
        if (newStudent && newStudent.id_aluno) {
            closeStudentModal();
            alunoSearchInput.value = data.nome_aluno;
            selectedAlunoIdInput.value = newStudent.id_aluno;
            evaluationStep.style.display = 'block';
            alunoSearchResults.style.display = 'none';
        }
    });

    // Inicia o processo
    initializePage();
});