requireAuth();

let currentProductId = null;
const modal = document.getElementById('produtoModal');
const form = document.getElementById('produtoForm');

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();

    // Event listeners
    document.getElementById('novoProdutoBtn').addEventListener('click', openNewProductModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('categoriaFilter').addEventListener('change', loadProducts);
    form.addEventListener('submit', handleSubmit);

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
});

async function loadProducts() {
    const categoria = document.getElementById('categoriaFilter').value;
    const container = document.getElementById('produtosList');

    try {
        const products = await getProducts(categoria ? { categoria } : {});
        
        if (products.length === 0) {
            container.innerHTML = '<p class="loading">Nenhum produto cadastrado</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="produto-card">
                ${product.imagemUrl ? `<img src="${product.imagemUrl}" alt="${product.nome}">` : ''}
                <div class="produto-card-body">
                    <h3>${product.nome}</h3>
                    <p>${product.descricao || ''}</p>
                    <p class="preco">R$ ${product.preco.toFixed(2)}</p>
                    <div class="produto-card-actions">
                        <button class="btn btn-primary" onclick="editProduct('${product._id}')">Editar</button>
                        <button class="btn ${product.disponivel ? 'btn-secondary' : 'btn-success'}" 
                                onclick="toggleAvailability('${product._id}')">
                            ${product.disponivel ? 'Desativar' : 'Ativar'}
                        </button>
                        <button class="btn btn-danger" onclick="deleteProductConfirm('${product._id}')">Excluir</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        container.innerHTML = '<p class="loading">Erro ao carregar produtos</p>';
    }
}

function openNewProductModal() {
    currentProductId = null;
    document.getElementById('modalTitle').textContent = 'Novo Produto';
    form.reset();
    document.getElementById('disponivel').checked = true;
    modal.classList.add('show');
}

async function editProduct(id) {
    try {
        const products = await getProducts();
        const product = products.find(p => p._id === id);
        
        if (!product) return;

        currentProductId = id;
        document.getElementById('modalTitle').textContent = 'Editar Produto';
        document.getElementById('produtoId').value = id;
        document.getElementById('nome').value = product.nome;
        document.getElementById('descricao').value = product.descricao || '';
        document.getElementById('preco').value = product.preco;
        document.getElementById('categoria').value = product.categoria;
        document.getElementById('imagemUrl').value = product.imagemUrl || '';
        document.getElementById('disponivel').checked = product.disponivel;
        document.getElementById('destaque').checked = product.destaque;
        
        modal.classList.add('show');
    } catch (error) {
        console.error('Erro ao carregar produto:', error);
        alert('Erro ao carregar produto');
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const productData = {
        nome: document.getElementById('nome').value,
        descricao: document.getElementById('descricao').value,
        preco: parseFloat(document.getElementById('preco').value),
        categoria: document.getElementById('categoria').value,
        imagemUrl: document.getElementById('imagemUrl').value,
        disponivel: document.getElementById('disponivel').checked,
        destaque: document.getElementById('destaque').checked,
    };

    try {
        if (currentProductId) {
            await updateProduct(currentProductId, productData);
            alert('Produto atualizado com sucesso!');
        } else {
            await createProduct(productData);
            alert('Produto criado com sucesso!');
        }
        
        closeModal();
        await loadProducts();
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Erro ao salvar produto: ' + error.message);
    }
}

async function toggleAvailability(id) {
    try {
        await toggleProductAvailability(id);
        await loadProducts();
    } catch (error) {
        console.error('Erro ao alterar disponibilidade:', error);
        alert('Erro ao alterar disponibilidade');
    }
}

async function deleteProductConfirm(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
        await deleteProduct(id);
        alert('Produto excluído com sucesso!');
        await loadProducts();
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto');
    }
}

function closeModal() {
    modal.classList.remove('show');
    form.reset();
    currentProductId = null;
}
