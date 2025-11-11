requireAuth();

const form = document.getElementById('createUserForm');
const usersList = document.getElementById('usersList');

document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    form.addEventListener('submit', handleCreateUser);
});

async function loadUsers() {
    try {
        const users = await getUsers();
        renderUsers(users);
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        usersList.innerHTML = '<div class="empty-state"><h3>Erro ao carregar usuários</h3><p>' + error.message + '</p></div>';
    }
}

function renderUsers(users) {
    if (users.length === 0) {
        usersList.innerHTML = '<div class="empty-state"><h3>Nenhum usuário cadastrado</h3><p>Crie o primeiro usuário usando o formulário acima</p></div>';
        return;
    }

    usersList.innerHTML = users.map(user => `
        <div class="user-item" data-id="${user._id}">
            <div class="user-info">
                <h3>${user.nome}</h3>
                <p>📧 ${user.email}</p>
                <p style="font-size: 0.85rem; color: #999;">Criado em: ${formatDate(user.createdAt)}</p>
            </div>
            <div class="user-actions">
                <button class="btn btn-danger" onclick="deleteUser('${user._id}', '${user.email}')">
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

async function handleCreateUser(e) {
    e.preventDefault();

    const userData = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value
    };

    try {
        await createUser(userData);
        alert('Usuário criado com sucesso!');
        form.reset();
        await loadUsers();
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        alert('Erro ao criar usuário: ' + error.message);
    }
}

async function deleteUser(userId, userEmail) {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userEmail}?`)) {
        return;
    }

    try {
        await removeUser(userId);
        alert('Usuário excluído com sucesso!');
        await loadUsers();
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário: ' + error.message);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// API Functions
async function getUsers() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar usuários');
    }

    return response.json();
}

async function createUser(userData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar usuário');
    }

    return response.json();
}

async function removeUser(userId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir usuário');
    }

    return response.json();
}
