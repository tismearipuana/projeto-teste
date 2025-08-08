// Arquivo: 01-criar-banco.js (ATUALIZADO COM TABELA E USUÁRIO PADRÃO)

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs'); // Importa a nova biblioteca de criptografia
const DB_FILE = 'database.db';

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) return console.error("Erro ao abrir o banco de dados:", err.message);
    console.log(`Conectado ao banco de dados SQLite: ${DB_FILE}`);
});

const modelosDeEscala = [
    { nome: 'Fluência - Escala Pré-Leitor', niveis: [ { desc: 'Pré Leitor 1', ordem: 1, cor: '#ffcdd2' }, { desc: 'Pré Leitor 2', ordem: 2, cor: '#ffccbc' }, { desc: 'Pré Leitor 3', ordem: 3, cor: '#ffecb3' }, { desc: 'Pré Leitor 4', ordem: 4, cor: '#dcedc8' }, { desc: 'Pré Leitor 5', ordem: 5, cor: '#c8e6c9' }, { desc: 'Pré Leitor 6', ordem: 6, cor: '#a5d6a7' }, { desc: 'Iniciante', ordem: 7, cor: '#b3e5fc' }, { desc: 'Fluente', ordem: 8, cor: '#81d4fa' } ] },
    { nome: 'Fluência - Escala Leitor', niveis: [ { desc: 'Leitor 1', ordem: 1, cor: '#ffcdd2' }, { desc: 'Leitor 2', ordem: 2, cor: '#ffecb3' }, { desc: 'Leitor 3', ordem: 3, cor: '#dcedc8' }, { desc: 'Leitor 4', ordem: 4, cor: '#a5d6a7' }, { desc: 'Iniciante', ordem: 5, cor: '#b3e5fc' }, { desc: 'Fluente', ordem: 6, cor: '#81d4fa' } ] },
    { nome: 'Fluência - Escala Nível', niveis: [ { desc: 'Nível 1', ordem: 1, cor: '#ffcdd2' }, { desc: 'Nível 2', ordem: 2, cor: '#ffecb3' }, { desc: 'Nível 3', ordem: 3, cor: '#dcedc8' }, { desc: 'Nível 4', ordem: 4, cor: '#a5d6a7' }, { desc: 'Iniciante', ordem: 5, cor: '#b3e5fc' }, { desc: 'Fluente', ordem: 6, cor: '#81d4fa' } ] },
    { nome: 'Desempenho - Somativa (4 Níveis)', niveis: [ { desc: 'Abaixo do Básico', ordem: 1, cor: '#ffebee' }, { desc: 'Básico', ordem: 2, cor: '#fffde7' }, { desc: 'Proficiente', ordem: 3, cor: '#e8f5e9' }, { desc: 'Avançado', ordem: 4, cor: '#dcedc8' } ] },
    { nome: 'Diagnóstica - Escala 1 (4 Níveis)', niveis: [ { desc: 'Muito Baixo', ordem: 1, cor: '#ffebee' }, { desc: 'Baixo', ordem: 2, cor: '#fff3e0' }, { desc: 'Médio', ordem: 3, cor: '#fffde7' }, { desc: 'Alto', ordem: 4, cor: '#e8f5e9' } ] },
    { nome: 'Diagnóstica - Escala 2 (3 Níveis)', niveis: [ { desc: 'Defasado', ordem: 1, cor: '#ffcdd2' }, { desc: 'Intermediário', ordem: 2, cor: '#fffde7' }, { desc: 'Adequado', ordem: 3, cor: '#e8f5e9' } ] }
];

db.serialize(() => {
    console.log("Iniciando a criação das tabelas...");
    
    // Criação de todas as tabelas, incluindo a nova tabela Usuarios
    db.run(`CREATE TABLE IF NOT EXISTS Etapas_Ensino (id_etapa INTEGER PRIMARY KEY AUTOINCREMENT, nome_etapa TEXT NOT NULL UNIQUE)`, [], logResult('Etapas_Ensino'))
      .run(`CREATE TABLE IF NOT EXISTS Escolas (id_escola INTEGER PRIMARY KEY AUTOINCREMENT, nome_escola TEXT NOT NULL UNIQUE)`, [], logResult('Escolas'))
      .run(`CREATE TABLE IF NOT EXISTS Turmas (id_turma INTEGER PRIMARY KEY AUTOINCREMENT, nome_turma TEXT NOT NULL, id_escola INTEGER NOT NULL, id_etapa INTEGER NOT NULL, FOREIGN KEY (id_escola) REFERENCES Escolas (id_escola), FOREIGN KEY (id_etapa) REFERENCES Etapas_Ensino (id_etapa))`, [], logResult('Turmas'))
      .run(`CREATE TABLE IF NOT EXISTS Alunos (id_aluno INTEGER PRIMARY KEY AUTOINCREMENT, nome_aluno TEXT NOT NULL, data_nascimento TEXT, nome_mae TEXT, inep_aluno TEXT UNIQUE, beneficiario_social TEXT, cor_raca TEXT, pcd TEXT, transporte_escolar TEXT)`, [], logResult('Alunos'))
      .run(`CREATE TABLE IF NOT EXISTS Avaliacoes (id_avaliacao INTEGER PRIMARY KEY AUTOINCREMENT, nome_avaliacao TEXT NOT NULL, ano_aplicacao INTEGER NOT NULL, etapa_de_conhecimento TEXT, UNIQUE(nome_avaliacao, ano_aplicacao, etapa_de_conhecimento))`, [], logResult('Avaliacoes'))
      .run(`CREATE TABLE IF NOT EXISTS Niveis_Avaliacao (id_nivel INTEGER PRIMARY KEY AUTOINCREMENT, id_avaliacao INTEGER NOT NULL, descricao_resultado TEXT NOT NULL, ordem INTEGER, cor TEXT, FOREIGN KEY (id_avaliacao) REFERENCES Avaliacoes (id_avaliacao), UNIQUE(id_avaliacao, descricao_resultado))`, [], logResult('Niveis_Avaliacao'))
      .run(`CREATE TABLE IF NOT EXISTS Resultados (id_resultado INTEGER PRIMARY KEY AUTOINCREMENT, id_aluno INTEGER NOT NULL, id_avaliacao INTEGER NOT NULL, id_turma_na_epoca INTEGER, id_nivel_resultado INTEGER, beneficiario_na_epoca TEXT, transporte_na_epoca TEXT, FOREIGN KEY (id_aluno) REFERENCES Alunos (id_aluno), FOREIGN KEY (id_avaliacao) REFERENCES Avaliacoes (id_avaliacao), FOREIGN KEY (id_turma_na_epoca) REFERENCES Turmas (id_turma), FOREIGN KEY (id_nivel_resultado) REFERENCES Niveis_Avaliacao (id_nivel))`, [], logResult('Resultados'))
      .run(`CREATE TABLE IF NOT EXISTS Tipos_Escala (id_escala INTEGER PRIMARY KEY AUTOINCREMENT, nome_escala TEXT NOT NULL UNIQUE)`, [], logResult('Tipos_Escala'))
      .run(`CREATE TABLE IF NOT EXISTS Niveis_Escala (id_nivel_escala INTEGER PRIMARY KEY AUTOINCREMENT, id_escala INTEGER NOT NULL, descricao_resultado TEXT NOT NULL, ordem INTEGER NOT NULL, cor TEXT, FOREIGN KEY (id_escala) REFERENCES Tipos_Escala (id_escala))`, [], logResult('Niveis_Escala'))
      
      // **NOVA TABELA DE USUÁRIOS**
      .run(`
        CREATE TABLE IF NOT EXISTS Usuarios (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_usuario TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            permissao TEXT NOT NULL DEFAULT 'UsuarioPadrao'
        )
      `, [], function(err) {
            logResult('Usuarios').call(this, err);
            // APÓS a criação da última tabela, popula os modelos e cria o usuário padrão
            popularModelosECriaUsuario();
      });
});

function logResult(tableName) { return function(err) { if (err) console.error(`Erro ao criar tabela ${tableName}:`, err.message); else console.log(`Tabela '${tableName}' criada ou já existente.`); } }

function popularModelosECriaUsuario() {
    console.log("-----------------------------------------");
    console.log("Populando modelos de escala e criando usuário padrão...");
    
    // Lógica para popular modelos (sem alterações)
    const insertEscala = db.prepare('INSERT OR IGNORE INTO Tipos_Escala (nome_escala) VALUES (?)');
    const insertNivel = db.prepare('INSERT OR IGNORE INTO Niveis_Escala (id_escala, descricao_resultado, ordem, cor) VALUES (?, ?, ?, ?)');
    modelosDeEscala.forEach(modelo => {
        insertEscala.run(modelo.nome, function(err) {
            if (err) { if (err.message.includes('UNIQUE constraint failed')) return; return console.error(`Erro ao inserir modelo '${modelo.nome}':`, err.message); }
            const escalaId = this.lastID;
            if (escalaId) {
                modelo.niveis.forEach(nivel => {
                    insertNivel.run(escalaId, nivel.desc, nivel.ordem, nivel.cor);
                });
            }
        });
    });

    // **NOVO**: Lógica para criar o usuário padrão
    const senhaPlana = 'admin123';
    // Gera o "hash" da senha. O número 10 é o "custo" da criptografia.
    const senhaHash = bcrypt.hashSync(senhaPlana, 10);
    const usuarioStmt = db.prepare(`
        INSERT OR IGNORE INTO Usuarios (nome_usuario, senha, permissao) 
        VALUES (?, ?, ?)
    `);
    usuarioStmt.run('admin', senhaHash, 'SuperAdmin', (err) => {
        if (err) {
            console.error("Erro ao criar usuário padrão:", err.message);
        } else {
            console.log("Usuário padrão 'admin' (senha: 'admin123') criado/verificado com sucesso.");
        }
    });

    // Fecha o banco após todas as operações serem enfileiradas
    db.close((err) => {
        if (err) return console.error("Erro ao fechar o banco de dados:", err.message);
        console.log("-----------------------------------------");
        console.log("Banco de dados fechado. Estrutura, modelos e usuário padrão criados com sucesso!");
    });
}