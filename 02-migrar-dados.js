// Arquivo: 02-migrar-dados.js (VERSÃO FINAL E CORRETA)

const fs = require('fs');
const csv = require('csv-parser');
const Database = require('better-sqlite3');

const DB_FILE = 'database.db';
const CSV_FILE = 'Arquivo Final.csv';

const db = new Database(DB_FILE);

// Função findOrInsert corrigida para Turmas
function findOrInsert(table, pkColumn, searchColumn, searchValue, extraCols = {}) {
    if (searchValue === null || searchValue === undefined || searchValue === '') searchValue = 'N/A';
    
    let stmt, result;
    
    if (table === 'Turmas') {
        stmt = db.prepare(`SELECT ${pkColumn} FROM ${table} WHERE ${searchColumn} = ? AND id_escola = ? AND id_etapa = ?`);
        result = stmt.get(searchValue, extraCols.id_escola, extraCols.id_etapa);
    } else {
        stmt = db.prepare(`SELECT ${pkColumn} FROM ${table} WHERE ${searchColumn} = ?`);
        result = stmt.get(searchValue);
    }
    
    if (result) return result[pkColumn];

    const allCols = { ...extraCols, [searchColumn]: searchValue };
    const colNames = Object.keys(allCols).join(', ');
    const colPlaceholders = Object.keys(allCols).map(() => '?').join(', ');
    stmt = db.prepare(`INSERT INTO ${table} (${colNames}) VALUES (${colPlaceholders})`);
    return stmt.run(...Object.values(allCols)).lastInsertRowid;
}
function findOrInsertNivel(descricao, idAvaliacao) {
    if (descricao === null || descricao === undefined || descricao === '') descricao = 'N/A';
    let stmt = db.prepare(`SELECT id_nivel FROM Niveis_Avaliacao WHERE descricao_resultado = ? AND id_avaliacao = ?`);
    let result = stmt.get(descricao, idAvaliacao);
    if (result) return result.id_nivel;
    stmt = db.prepare(`INSERT INTO Niveis_Avaliacao (descricao_resultado, id_avaliacao) VALUES (?, ?)`);
    return stmt.run(descricao, idAvaliacao).lastInsertRowid;
}
function findOrInsertAluno(row) {
    const studentData = { nome_aluno: row.nome_aluno, data_nascimento: row['Data de Nascimento'], nome_mae: row['MÃE'], beneficiario_social: row['BENEFICIÁRIO SOCIAL?'], cor_raca: row['COR/RAÇA'], pcd: row['ALUNO PCD?'], transporte_escolar: row['UTILIZA TRANSPORTE ESCOLAR'] };
    if (row.INEP && row.INEP.trim() !== '') {
        return findOrInsert('Alunos', 'id_aluno', 'inep_aluno', row.INEP.trim(), { ...studentData, inep_aluno: row.INEP.trim() });
    } else {
        return findOrInsert('Alunos', 'id_aluno', 'nome_aluno', row.nome_aluno, studentData);
    }
}

function processarCSV() {
    const rows = [];
    fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => {
            console.log(`Leitura do CSV concluída. ${rows.length} linhas lidas. Iniciando migração...`);

            const insertMany = db.transaction((allRows) => {
                const insertResultadoStmt = db.prepare(`
                    INSERT INTO Resultados (id_aluno, id_avaliacao, id_turma_na_epoca, id_nivel_resultado, beneficiario_na_epoca, transporte_na_epoca)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                for (const row of allRows) {
                    const idEtapa = findOrInsert('Etapas_Ensino', 'id_etapa', 'nome_etapa', row.etapa_de_ensino);
                    const idEscola = findOrInsert('Escolas', 'id_escola', 'nome_escola', row.escola);
                    const idTurma = findOrInsert('Turmas', 'id_turma', 'nome_turma', row.turma, { id_escola: idEscola, id_etapa: idEtapa });
                    const idAluno = findOrInsertAluno(row);
                    const idAvaliacao = findOrInsert('Avaliacoes', 'id_avaliacao', 'nome_avaliacao', row.nome_avaliacao, {
                        ano_aplicacao: row.ano_aplicacao, etapa_de_conhecimento: row.etapa_de_conhecimento
                    });
                    const idNivel = findOrInsertNivel(row.resultado, idAvaliacao);
                    insertResultadoStmt.run(
                        idAluno, idAvaliacao, idTurma, idNivel,
                        row['BENEFICIÁRIO SOCIAL?'], row['UTILIZA TRANSPORTE ESCOLAR']
                    );
                }
            });
            
            insertMany(rows);
            console.log(`Migração concluída com sucesso! ${rows.length} registros processados.`);
            db.close();
        });
}

processarCSV();