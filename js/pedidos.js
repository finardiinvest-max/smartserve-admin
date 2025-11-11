requireAuth();

const modal = document.getElementById('pedidoModal');
let currentOrder = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadOrders();

    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', loadOrders);
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
    const data = document.getElementById('dataFilter').value;

    const params = {};
    if (data) params.data = data;

    try {
        const orders = await getOrders(params);
        
        // Organizar pedidos por status
        const ordersByStatus = {
            novo: [],
            em_preparo: [],
            pronto: [],
            entregue: []
        };

        orders.forEach(order => {
            if (order.statusPedido !== 'cancelado' && ordersByStatus[order.statusPedido]) {
                ordersByStatus[order.statusPedido].push(order);
            }
        });

        // Renderizar cada coluna
        renderColumn('Novo', ordersByStatus.novo, 'columnNovo', 'countNovo');
        renderColumn('EmPreparo', ordersByStatus.em_preparo, 'columnEmPreparo', 'countEmPreparo');
        renderColumn('Pronto', ordersByStatus.pronto, 'columnPronto', 'countPronto');
        renderColumn('Entregue', ordersByStatus.entregue, 'columnEntregue', 'countEntregue');

    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
    }
}

function renderColumn(status, orders, columnId, countId) {
    const column = document.getElementById(columnId);
    const count = document.getElementById(countId);
    
    count.textContent = orders.length;

    if (orders.length === 0) {
        column.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhum pedido</p>';
        return;
    }

    column.innerHTML = orders.map(order => createOrderCard(order)).join('');
    
    // Adicionar event listeners para os cards
    column.querySelectorAll('.pedido-card-kanban').forEach(card => {
        card.addEventListener('click', function(e) {
            // Não abrir se clicou em um botão
            if (e.target.tagName === 'BUTTON') return;
            const orderId = this.getAttribute('data-order-id');
            viewOrder(orderId);
        });
    });
}

function createOrderCard(order) {
    const horarioRetirada = order.tipoRetirada === 'depois' && order.horarioRetirada 
        ? `<div class="horario-retirada">🕐 Retirar às ${new Date(order.horarioRetirada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>`
        : '';

    // Verificar se PIX precisa validação
    const needsPixValidation = order.formaPagamento === 'pix' && 
                               order.pixConfirmadoPeloCliente && 
                               !order.pixConfirmadoPeloAdmin;

    const pixWarning = order.formaPagamento === 'pix' && !order.pixConfirmadoPeloAdmin
        ? '<div class="pix-warning">⚠️ PIX pendente</div>'
        : '';

    const statusButtons = getStatusButtons(order, needsPixValidation);

    // Extrair nome e telefone do cliente com fallback
    let clienteNome = 'Cliente';
    let clienteTelefone = '';
    
    if (order.cliente) {
        if (order.cliente.nome) {
            clienteNome = order.cliente.nome;
        }
        if (order.cliente.telefone) {
            clienteTelefone = order.cliente.telefone;
        }
    }

    return `
        <div class="pedido-card-kanban" data-order-id="${order._id}">
            <div>
                <div class="numero">#${order.numero}</div>
                <div class="cliente"><strong>${clienteNome}</strong></div>
                <div class="info">📞 ${clienteTelefone}</div>
                <div class="info">🛒 ${order.itens.length} itens</div>
                <div class="total">R$ ${order.total.toFixed(2)}</div>
                <div class="info">🕐 ${new Date(order.dataHora).toLocaleString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}</div>
                ${horarioRetirada}
                ${pixWarning}
            </div>
            ${statusButtons}
        </div>
    `;
}

function getStatusButtons(order, needsPixValidation) {
    const status = order.statusPedido;
    let buttons = '<div class="status-buttons">';

    // Botão de validação PIX (se necessário)
    if (needsPixValidation) {
        buttons += `
            <button class="status-btn pronto" onclick="event.stopPropagation(); confirmPixQuick('${order._id}')" style="background: #17a2b8;">
                ✓ Validar PIX
            </button>
        `;
    }

    // Botões de mudança de status
    if (status === 'novo') {
        buttons += `
            <button class="status-btn preparo" onclick="event.stopPropagation(); quickUpdateStatus('${order._id}', 'em_preparo')">
                Em Preparo
            </button>
            <button class="status-btn cancelar" onclick="event.stopPropagation(); quickUpdateStatus('${order._id}', 'cancelado')">
                Cancelar
            </button>
        `;
    } else if (status === 'em_preparo') {
        buttons += `
            <button class="status-btn pronto" onclick="event.stopPropagation(); quickUpdateStatus('${order._id}', 'pronto')">
                Pronto
            </button>
        `;
    } else if (status === 'pronto') {
        buttons += `
            <button class="status-btn entregue" onclick="event.stopPropagation(); quickUpdateStatus('${order._id}', 'entregue')">
                Entregue
            </button>
        `;
    }

    buttons += '</div>';
    return buttons;
}

async function quickUpdateStatus(id, newStatus) {
    try {
        await updateOrderStatus(id, newStatus);
        await loadOrders();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status');
    }
}

async function confirmPixQuick(id) {
    if (!confirm('Confirmar que o pagamento PIX foi recebido?')) return;

    try {
        await confirmPixAdmin(id);
        alert('Pagamento PIX confirmado!');
        await loadOrders();
    } catch (error) {
        console.error('Erro ao confirmar PIX:', error);
        alert('Erro ao confirmar pagamento');
    }
}

async function viewOrder(id) {
    try {
        const order = await getOrder(id);
        currentOrder = order;
        
        const horarioRetiradaInfo = order.tipoRetirada === 'depois' && order.horarioRetirada
            ? `<p><strong>Horário de Retirada:</strong> ${new Date(order.horarioRetirada).toLocaleString('pt-BR')}</p>`
            : '<p><strong>Tipo de Retirada:</strong> Agora</p>';

        const detalhes = document.getElementById('pedidoDetalhes');
        detalhes.innerHTML = `
            <div class="pedido-detalhes">
                <div class="section">
                    <h3>Informações do Pedido</h3>
                    <p><strong>Número:</strong> #${order.numero}</p>
                    <p><strong>Data/Hora:</strong> ${new Date(order.dataHora).toLocaleString('pt-BR')}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${order.statusPedido}">${getStatusLabel(order.statusPedido)}</span></p>
                    ${horarioRetiradaInfo}
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
                    ${order.taxaConveniencia && order.taxaConveniencia.valor > 0 ? `
                        <p style="color: #999;">Subtotal: R$ ${order.subtotal.toFixed(2)}</p>
                        <p style="color: #999;">Taxa de Conveniência: R$ ${order.taxaConveniencia.valor.toFixed(2)}</p>
                    ` : ''}
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
                    <p><strong>Forma:</strong> ${getPaymentLabel(order.formaPagamento)}</p>
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

function getPaymentLabel(payment) {
    const labels = {
        pix: 'PIX',
        dinheiro: 'Dinheiro',
        cartao: 'Cartão',
        retirada: 'Pagar na Retirada'
    };
    return labels[payment] || payment.toUpperCase();
}
