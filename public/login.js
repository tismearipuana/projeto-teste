// Arquivo: login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const username = loginForm.username.value;
        const password = loginForm.password.value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (response.ok) {
                // Se o login for bem-sucedido, redireciona para o painel de gestão
                window.location.href = '/painel_gestao.html';
            } else {
                // Mostra a mensagem de erro da API
                errorMessage.textContent = result.error || 'Ocorreu um erro.';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            errorMessage.textContent = 'Erro de conexão. Verifique se o servidor está online.';
            errorMessage.style.display = 'block';
        }
    });
});