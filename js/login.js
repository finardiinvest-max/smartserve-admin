document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (isAuthenticated()) {
        window.location.href = '/dashboard.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await login(email, password);
            
            setToken(response.token);
            setUser(response.user);
            
            window.location.href = '/dashboard.html';
        } catch (error) {
            errorMessage.textContent = error.message || 'Erro ao fazer login';
            errorMessage.classList.add('show');
        }
    });
});
