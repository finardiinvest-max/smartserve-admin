document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (isAuthenticated()) {
        window.location.href = '/dashboard.html';
        return;
    }

    const form = document.getElementById('registerForm');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            errorMessage.textContent = 'As senhas não coincidem';
            errorMessage.classList.add('show');
            return;
        }

        try {
            const response = await register(nome, email, password);
            
            setToken(response.token);
            setUser(response.user);
            
            window.location.href = '/dashboard.html';
        } catch (error) {
            errorMessage.textContent = error.message || 'Erro ao criar conta';
            errorMessage.classList.add('show');
        }
    });
});
