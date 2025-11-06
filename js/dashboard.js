requireAuth();

document.addEventListener('DOMContentLoaded', async () => {
    const user = getUser();
    document.getElementById('userInfo').textContent = `Olá, ${user.nome}`;

    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        const [orders, products] = await Promise.all([
            getOrders(),
            getProducts()
        ]);

        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.dataHora.startsWith(today));
        const pendingOrders = orders.filter(o => ['novo', 'em_preparo'].includes(o.statusPedido));
        const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
        const activeProducts = products.filter(p => p.disponivel).length;

        document.getElementById('pedidosHoje').textContent = todayOrders.length;
        document.getElementById('pedidosPendentes').textContent = pendingOrders.length;
        document.getElementById('faturamentoHoje').textContent = `R$ ${todayRevenue.toFixed(2)}`;
        document.getElementById('produtosAtivos').textContent = activeProducts;

        // Show recent orders
        displayRecentOrders(orders.slice(0, 5));
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function displayRecentOrders(orders) {
    const container = document.getElementById('pedidosRecentes');
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="loading">Nenhum pedido ainda</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="pedido-card" onclick="window.location.href='/pages/pedidos.html'">
            <div class="pedido-header">
                <span class="pedido-numero">#${order.numero}</span>
                <span class="badge badge-${order.statusPedido}">${getStatusLabel(order.statusPedido)}</span>
            </div>
            <p>${order.cliente.nome} - ${order.itens.length} itens</p>
            <p><strong>R$ ${order.total.toFixed(2)}</strong></p>
        </div>
    `).join('');
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
