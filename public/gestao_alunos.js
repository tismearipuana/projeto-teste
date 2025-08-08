// Arquivo: gestao_alunos.js (VERSÃO FINAL E COMPLETA)

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos
    const tableContainer = document.getElementById('alunos-table-container');
    const searchInput = document.getElementById('search-aluno-input');
    const addStudentBtn = document.getElementById('add-student-btn');
    const studentModal = document.getElementById('student-modal');
    const studentForm = document.getElementById('student-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalPcdSelect = document.getElementById('modal-pcd');
    const modalPcdDetailsGroup = document.getElementById('modal-pcd-details-group');
    const modalPcdDetailsSelect = document.getElementById('modal-pcd_details');
    const modalInepInput = document.getElementById('modal-inep_aluno');


    let searchTimeout;
    let currentEditingId = null;

    // --- FUNÇÕES DE API ---
    async function fetchAlunos(searchTerm = '') { try { const response = await fetch(`http://localhost:3000/api/alunos?busca=${encodeURIComponent(searchTerm)}`); if (!response.ok) throw new Error('Não foi possível buscar os dados dos alunos.'); return await response.json(); } catch (error) { console.error('Erro:', error); tableContainer.innerHTML = `<p style="color: red;">${error.message}</p>`; return []; } }
    async function saveStudent(studentData) { try { const response = await fetch('http://localhost:3000/api/alunos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(studentData), }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Erro desconhecido ao salvar aluno.'); alert('Aluno salvo com sucesso!'); return true; } catch (error) { alert(`Erro ao salvar: ${error.message}`); return false; } }
    async function updateStudent(id, studentData) { try { const response = await fetch(`http://localhost:3000/api/alunos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(studentData), }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Erro desconhecido ao atualizar aluno.'); alert('Aluno atualizado com sucesso!'); return true; } catch (error) { alert(`Erro ao atualizar: ${error.message}`); return false; } }


    // --- FUNÇÕES DE UI ---
    function renderAlunosTable(alunos) {
        if (alunos.length === 0) {
            tableContainer.innerHTML = '<p>Nenhum aluno encontrado.</p>';
            return;
        }
        let tableHTML = `<table class="history-table"><thead><tr><th>ID</th><th>Nome do Aluno</th><th>INEP</th><th>Ações</th></tr></thead><tbody>`;
        alunos.forEach(aluno => {
            tableHTML += `<tr><td>${aluno.id_aluno}</td><td>${aluno.nome_aluno}</td><td>${aluno.inep_aluno || 'Não informado'}</td><td><button class="button edit-btn" data-id="${aluno.id_aluno}">Editar</button></td></tr>`;
        });
        tableHTML += `</tbody></table>`;
        tableContainer.innerHTML = tableHTML;

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', handleEditClick);
        });
    }
    
    function openModal(student = null) {
        studentForm.reset();
        if (student) {
            currentEditingId = student.id_aluno;
            modalTitle.textContent = 'Editar Aluno';
            studentForm.querySelector('[type="submit"]').textContent = 'Salvar Alterações';
            
            studentForm.elements['nome_aluno'].value = student.nome_aluno || '';
            studentForm.elements['inep_aluno'].value = student.inep_aluno || '';
            
            if (student.data_nascimento) {
                const parts = student.data_nascimento.split('/');
                if(parts.length === 3) {
                    const [day, month, year] = parts;
                    studentForm.elements['data_nascimento'].value = `${year}-${month}-${day}`;
                }
            }
            
            studentForm.elements['nome_mae'].value = student.nome_mae || '';
            studentForm.elements['cor_raca'].value = student.cor_raca || 'Não Declarada';
            studentForm.elements['beneficiario_social'].value = student.beneficiario_social || 'NÃO';
            studentForm.elements['transporte_escolar'].value = student.transporte_escolar || 'NÃO';

            const pcdOptions = Array.from(modalPcdDetailsSelect.options).map(opt => opt.value);
            if (student.pcd === 'NÃO' || !student.pcd) {
                modalPcdSelect.value = 'NÃO';
                modalPcdDetailsGroup.style.display = 'none';
            } else {
                modalPcdSelect.value = 'SIM';
                modalPcdDetailsGroup.style.display = 'block';
                if (pcdOptions.includes(student.pcd)) {
                    modalPcdDetailsSelect.value = student.pcd;
                }
            }
        } else {
            currentEditingId = null;
            modalTitle.textContent = 'Adicionar Novo Aluno';
            studentForm.querySelector('[type="submit"]').textContent = 'Salvar Aluno';
            modalPcdDetailsGroup.style.display = 'none';
        }
        studentModal.style.display = 'flex';
    }

    function closeModal() {
        studentModal.style.display = 'none';
    }

    async function refreshTable() {
        const alunos = await fetchAlunos(searchInput.value);
        renderAlunosTable(alunos);
    }
    
    async function handleEditClick(event) {
        const studentId = event.target.dataset.id;
        const alunos = await fetchAlunos(); // Busca todos para encontrar o certo
        const studentToEdit = alunos.find(aluno => aluno.id_aluno == studentId);
        
        if (studentToEdit) {
            openModal(studentToEdit);
        } else {
            alert('Não foi possível encontrar os dados do aluno.');
        }
    }

    // --- EVENT LISTENERS ---
    searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { refreshTable(); }, 300); });
    addStudentBtn.addEventListener('click', () => openModal()); // Adiciona o listener
    cancelBtn.addEventListener('click', closeModal);
    studentModal.addEventListener('click', (e) => { if (e.target === studentModal) closeModal(); });
    modalInepInput.addEventListener('input', () => { modalInepInput.value = modalInepInput.value.replace(/\D/g, ''); });
    modalPcdSelect.addEventListener('change', (e) => { modalPcdDetailsGroup.style.display = (e.target.value === 'SIM') ? 'block' : 'none'; });
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(studentForm);
        const studentData = Object.fromEntries(formData.entries());
        if (!/^\d{12}$/.test(studentData.inep_aluno)) { alert('O INEP é obrigatório e deve conter exatamente 12 números.'); return; }
        if (studentData.pcd_status === 'SIM') { studentData.pcd = studentData.pcd_details; } else { studentData.pcd = 'NÃO'; }
        delete studentData.pcd_status; delete studentData.pcd_details;
        if (studentData.data_nascimento) { const [year, month, day] = studentData.data_nascimento.split('-'); if(year && month && day) { studentData.data_nascimento = `${day}/${month}/${year}`; } }
        
        let success = false;
        if (currentEditingId) {
            success = await updateStudent(currentEditingId, studentData);
        } else {
            success = await saveStudent(studentData);
        }

        if (success) { closeModal(); refreshTable(); }
    });

    // Carregamento inicial
    refreshTable();
});