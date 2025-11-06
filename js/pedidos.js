requireAuth();

const modal = document.getElementById('pedidoModal');
let currentOrder = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadOrders();

    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', loadOrders);
    document.getElementById('statusFilter').addEventListener('change', loadOrders);
    document.getElementById('dataFilter').addEventListener('change', loadOrders);
    document.querySelector('.close').addEventListener('click', closeModal);

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Auto-refresh every 30 seconds
    setInterval(loadOrders, 30000);
});

async function loadOrders() {
    const status = document.getElementById('statusFilter').value;
    const data = document.getElementById('dataFilter').value;
    const container = document.getElementById('pedidosList');

    const params = {};
    if (status) params.status = status;
    if (data) params.data = data;

    try {
        const orders = await getOrders(params);
        
        if (orders.length === 0) {
            container.innerHTML = '<p class="loading">Nenhum pedido encontrado</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="pedido-card" onclick="viewOrder('${order._id}')">
                <div class="pedido-header">
                    <span class="pedido-numero">#${order.numero}</span>
                    <span class="badge badge-${order.statusPedido}">${getStatusLabel(order.statusPedido)}</span>
                </div>
                <p><strong>${order.cliente.nome}</strong> - ${order.cliente.telefone}</p>
                <p>${order.itens.length} itens - <strong>R$ ${order.total.toFixed(2)}</strong></p>
                <p class="text-muted">${new Date(order.dataHora).toLocaleString('pt-BR')}</p>
                ${order.formaPagamento === 'pix' && !order.pixConfirmadoPeloAdmin ? 
                    '<p style="color: #ffc107;">⚠️ Aguardando confirmação PIX</p>' : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        container.innerHTML = '<p class="loading">Erro ao carregar pedidos</p>';
    }
}

async function viewOrder(id) {
    try {
        const order = await getOrder(id);
        currentOrder = order;
        
        const detalhes = document.getElementById('pedidoDetalhes');
        detalhes.innerHTML = `
            <div class="pedido-detalhes">
                <div class="section">
                    <h3>Informações do Pedido</h3>
                    <p><strong>Número:</strong> #${order.numero}</p>
                    <p><strong>Data/Hora:</strong> ${new Date(order.dataHora).toLocaleString('pt-BR')}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${order.statusPedido}">${getStatusLabel(order.statusPedido)}</span></p>
                </div>

                <div class="section">
                    <h3>Cliente</h3>
                    <p><strong>Nome:</strong> ${order.cliente.nome}</p>
                    <p><strong>Telefone:</strong> ${order.cliente.telefone}</p>
                </div>

                <div class="section">
                    <h3>Itens</h3>
                    ${order.itens.map(item => `
                        <p>${item.quantidade}x ${item.nome} - R$ ${item.subtotal.toFixed(2)}</p>
                    `).join('')}
                    <p><strong>Total: R$ ${order.total.toFixed(2)}</strong></p>
                </div>

                ${order.observacoes ? `
                    <div class="section">
                        <h3>Observações</h3>
                        <p>${order.observacoes}</p>
                    </div>
                ` : ''}

                <div class="section">
                    <h3>Pagamento</h3>
                    <p><strong>Forma:</strong> ${order.formaPagamento.toUpperCase()}</p>
                    ${order.formaPagamento === 'pix' ? `
                        <p><strong>Cliente confirmou:</strong> ${order.pixConfirmadoPeloCliente ? '✅ Sim' : '❌ Não'}</p>
                        <p><strong>Admin validou:</strong> ${order.pixConfirmadoPeloAdmin ? '✅ Sim' : '❌ Não'}</p>
                        ${!order.pixConfirmadoPeloAdmin && order.pixConfirmadoPeloCliente ? `
                            <div style="margin-top: 10px;">
                                <button class="btn btn-success" onclick="confirmPix('${order._id}')">Confirmar Pagamento</button>
                                <button class="btn btn-danger" onclick="rejectPixPayment('${order._id}')">Recusar Pagamento</button>
                            </div>
                        ` : ''}
                    ` : ''}
                </div>

                <div class="section">
                    <h3>Atualizar Status</h3>
                    <select id="newStatus" class="form-control">
                        <option value="novo" ${order.statusPedido === 'novo' ? 'selected' : ''}>Novo</option>
                        <option value="em_preparo" ${order.statusPedido === 'em_preparo' ? 'selected' : ''}>Em Preparo</option>
                        <option value="pronto" ${order.statusPedido === 'pronto' ? 'selected' : ''}>Pronto</option>
                        <option value="entregue" ${order.statusPedido === 'entregue' ? 'selected' : ''}>Entregue</option>
                        <option value="cancelado" ${order.statusPedido === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                    <button class="btn btn-primary" style="margin-top: 10px;" onclick="updateStatus('${order._id}')">Atualizar Status</button>
                </div>
            </div>
        `;
        
        modal.classList.add('show');
    } catch (error) {
        console.error('Erro ao carregar pedido:', error);
        alert('Erro ao carregar pedido');
    }
}

async function updateStatus(id) {
    const newStatus = document.getElementById('newStatus').value;
    
    try {
        await updateOrderStatus(id, newStatus);
        alert('Status atualizado com sucesso!');
        closeModal();
        await loadOrders();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status');
    }
}

async function confirmPix(id) {
    if (!confirm('Confirmar que o pagamento PIX foi recebido?')) return;

    try {
        await confirmPixAdmin(id);
        alert('Pagamento confirmado!');
        closeModal();
        await loadOrders();
    } catch (error) {
        console.error('Erro ao confirmar PIX:', error);
        alert('Erro ao confirmar pagamento');
    }
}

async function rejectPixPayment(id) {
    if (!confirm('Tem certeza que deseja recusar este pagamento?')) return;

    try {
        await rejectPix(id);
        alert('Pagamento recusado');
        closeModal();
        await loadOrders();
    } catch (error) {
        console.error('Erro ao recusar PIX:', error);
        alert('Erro ao recusar pagamento');
    }
}

function closeModal() {
    modal.classList.remove('show');
    currentOrder = null;
}

function getStatusLabel(status) {
    const labels = {
        novo: 'Novo',
        em_preparo: 'Em Preparo',
        pronto: 'Pronto',
        entregue: 'Entregue',
        cancelado: 'Cancelado'
    };
    return labels[status] || status;
}
