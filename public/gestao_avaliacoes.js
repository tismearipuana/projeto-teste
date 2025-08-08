// Arquivo: gestao_avaliacoes.js (VERSÃO FINAL E COMPLETA)

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos Elementos
    const tableContainer = document.getElementById('avaliacoes-table-container');
    const addAvaliacaoBtn = document.getElementById('add-avaliacao-btn');
    const modal = document.getElementById('avaliacao-modal');
    const form = document.getElementById('avaliacao-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const addNivelBtn = document.getElementById('add-nivel-btn');
    const niveisContainer = document.getElementById('niveis-container');
    const escalaModeloSelect = document.getElementById('escala-modelo-select');

    // --- FUNÇÕES DE DADOS (API) ---

    async function fetchAvaliacoes() {
        try {
            const response = await fetch('http://localhost:3000/api/avaliacoes');
            if (!response.ok) throw new Error('Não foi possível buscar as avaliações.');
            return await response.json();
        } catch (error) {
            tableContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
            return [];
        }
    }
    
    async function fetchEscalaModelos() {
        try {
            const response = await fetch('http://localhost:3000/api/escalas');
            if (!response.ok) throw new Error('Não foi possível buscar os modelos de escala.');
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar modelos:', error);
            return [];
        }
    }
    
    async function fetchEscalaDetalhes(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/escalas/${id}`);
            if (!response.ok) throw new Error('Não foi possível buscar os detalhes do modelo.');
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar detalhes do modelo:', error);
            return [];
        }
    }

    async function saveAvaliacao(avaliacaoData) {
        try {
            const response = await fetch('http://localhost:3000/api/avaliacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(avaliacaoData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro desconhecido ao salvar.');
            alert('Avaliação salva com sucesso!');
            return true;
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
            return false;
        }
    }


    // --- FUNÇÕES DE UI ---

    function renderAvaliacoesTable(avaliacoes) {
        if (avaliacoes.length === 0) { tableContainer.innerHTML = '<p>Nenhuma avaliação cadastrada.</p>'; return; }
        let tableHTML = `<table class="history-table"><thead><tr><th>ID</th><th>Nome da Avaliação</th><th>Ano</th><th>Área</th><th>Ações</th></tr></thead><tbody>`;
        avaliacoes.forEach(av => {
            tableHTML += `<tr><td>${av.id_avaliacao}</td><td>${av.nome_avaliacao}</td><td>${av.ano_aplicacao}</td><td>${av.etapa_de_conhecimento || 'N/A'}</td><td><button class="button edit-btn" data-id="${av.id_avaliacao}">Editar</button></td></tr>`;
        });
        tableHTML += `</tbody></table>`;
        tableContainer.innerHTML = tableHTML;
    }

    function createNivelInputRow(nivel = {}) {
        const row = document.createElement('div');
        row.className = 'nivel-input-row';
        row.innerHTML = `
            <input type="text" placeholder="Descrição do Nível" name="nivel_descricao" required value="${nivel.descricao_resultado || ''}">
            <input type="number" placeholder="Ordem" name="nivel_ordem" required value="${nivel.ordem || ''}">
            <input type="color" name="nivel_cor" value="${nivel.cor || '#e8f5e9'}">
            <button type="button" class="remove-nivel-btn">-</button>
        `;
        niveisContainer.appendChild(row);
        
        row.querySelector('.remove-nivel-btn').addEventListener('click', () => row.remove());
    }

    async function populateEscalaSelect() {
        const modelos = await fetchEscalaModelos();
        modelos.forEach(modelo => {
            const option = document.createElement('option');
            option.value = modelo.id_escala;
            option.textContent = modelo.nome_escala;
            escalaModeloSelect.appendChild(option);
        });
    }

    function openModal() {
        form.reset();
        niveisContainer.innerHTML = '';
        createNivelInputRow();
        escalaModeloSelect.value = '';
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
    }
    
    async function refreshTable() {
        const avaliacoes = await fetchAvaliacoes();
        renderAvaliacoesTable(avaliacoes);
    }

    // --- EVENT LISTENERS ---
    
    addAvaliacaoBtn.addEventListener('click', openModal);
    cancelBtn.addEventListener('click', closeModal);
    addNivelBtn.addEventListener('click', () => createNivelInputRow());
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    escalaModeloSelect.addEventListener('change', async (e) => {
        const modeloId = e.target.value;
        if (!modeloId) {
            niveisContainer.innerHTML = '';
            createNivelInputRow();
            return;
        }
        
        const niveisDoModelo = await fetchEscalaDetalhes(modeloId);
        niveisContainer.innerHTML = '';
        if (niveisDoModelo.length > 0) {
            niveisDoModelo.forEach(nivel => createNivelInputRow(nivel));
        } else {
            createNivelInputRow();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const avaliacaoData = {
            nome_avaliacao: formData.get('nome_avaliacao'),
            ano_aplicacao: parseInt(formData.get('ano_aplicacao'), 10),
            etapa_de_conhecimento: formData.get('etapa_de_conhecimento'),
            niveis: []
        };

        const descricoes = formData.getAll('nivel_descricao');
        const ordens = formData.getAll('nivel_ordem');
        const cores = formData.getAll('nivel_cor');

        for (let i = 0; i < descricoes.length; i++) {
            if (descricoes[i]) {
                avaliacaoData.niveis.push({
                    descricao_resultado: descricoes[i],
                    ordem: parseInt(ordens[i], 10),
                    cor: cores[i]
                });
            }
        }
        
        if (avaliacaoData.niveis.length === 0) {
            alert('Você deve adicionar pelo menos um nível de desempenho.');
            return;
        }

        const success = await saveAvaliacao(avaliacaoData);
        if (success) {
            closeModal();
            refreshTable();
        }
    });

    // Carregamento inicial
    refreshTable();
    populateEscalaSelect();
});