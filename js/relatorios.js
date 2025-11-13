requireAuth();

const btnGerar = document.getElementById('btnGerar');
const loading = document.getElementById('loading');
const resumo = document.getElementById('resumo');
const detalhamento = document.getElementById('detalhamento');
const semDados = document.getElementById('semDados');
const detalhesBody = document.getElementById('detalhesBody');
const tipoRelatorio = document.getElementById('tipoRelatorio');

// Set today as default date
document.getElementById('dataReferencia').valueAsDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    btnGerar.addEventListener('click', gerarRelatorio);
    tipoRelatorio.addEventListener('change', () => {
        // Limpar relatório anterior ao mudar tipo
        resumo.style.display = 'none';
        detalhamento.style.display = 'none';
        semDados.style.display = 'none';
    });
    // Generate initial report
    gerarRelatorio();
});

async function gerarRelatorio() {
    const tipo = tipoRelatorio.value;
    
    if (tipo === 'taxas') {
        await gerarRelatorioTaxas();
    } else if (tipo === 'pedidos') {
        await gerarRelatorioPedidos();
    }
}

async function gerarRelatorioTaxas() {
    const periodo = document.getElementById('periodo').value;
    const dataReferencia = document.getElementById('dataReferencia').value;
    
    if (!dataReferencia) {
        alert('Selecione uma data de referência');
        return;
    }
    
    try {
        // Show loading
        loading.style.display = 'block';
        resumo.style.display = 'none';
        detalhamento.style.display = 'none';
        semDados.style.display = 'none';
        
        // Fetch report
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}/relatorios/taxas-conveniencia?periodo=${periodo}&data=${dataReferencia}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Erro ao gerar relatório');
        }
        
        const data = await response.json();
        
        // Hide loading
        loading.style.display = 'none';
        
        // Check if there's data
        if (data.totalPedidos === 0) {
            semDados.style.display = 'block';
            return;
        }
        
        // Show summary
        resumo.style.display = 'grid';
        document.getElementById('totalPedidos').textContent = data.totalPedidos;
        document.getElementById('pedidosComTaxa').textContent = data.pedidosComTaxa;
        document.getElementById('totalTaxas').textContent = `R$ ${data.totalTaxas.toFixed(2)}`;
        document.getElementById('taxaMedia').textContent = `R$ ${data.taxaMedia.toFixed(2)}`;
        
        // Update table header for taxas
        updateTableHeader('taxas');
        
        // Show details
        if (data.detalhes && data.detalhes.length > 0) {
            detalhamento.style.display = 'block';
            renderDetalhesTaxas(data.detalhes);
        }
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        alert('Erro ao gerar relatório: ' + error.message);
        loading.style.display = 'none';
    }
}

async function gerarRelatorioPedidos() {
    const periodo = document.getElementById('periodo').value;
    const dataReferencia = document.getElementById('dataReferencia').value;
    
    if (!dataReferencia) {
        alert('Selecione uma data de referência');
        return;
    }
    
    try {
        // Show loading
        loading.style.display = 'block';
        resumo.style.display = 'none';
        detalhamento.style.display = 'none';
        semDados.style.display = 'none';
        
        // Calcular range de datas baseado no período
        const dataRef = new Date(dataReferencia);
        let dataInicio, dataFim;
        
        switch(periodo) {
            case 'diario':
                dataInicio = new Date(dataRef);
                dataFim = new Date(dataRef);
                break;
            case 'semanal':
                // Início da semana (domingo)
                dataInicio = new Date(dataRef);
                dataInicio.setDate(dataRef.getDate() - dataRef.getDay());
                // Fim da semana (sábado)
                dataFim = new Date(dataInicio);
                dataFim.setDate(dataInicio.getDate() + 6);
                break;
            case 'mensal':
                dataInicio = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1);
                dataFim = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0);
                break;
            case 'anual':
                dataInicio = new Date(dataRef.getFullYear(), 0, 1);
                dataFim = new Date(dataRef.getFullYear(), 11, 31);
                break;
        }
        
        // Fetch orders
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}/orders`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Erro ao buscar pedidos');
        }
        
        const allOrders = await response.json();
        
        // Filtrar pedidos pelo período
        const pedidosFiltrados = allOrders.filter(order => {
            const dataOrder = new Date(order.dataHora);
            return dataOrder >= dataInicio && dataOrder <= dataFim && order.statusPedido !== 'cancelado';
        });
        
        // Hide loading
        loading.style.display = 'none';
        
        // Check if there's data
        if (pedidosFiltrados.length === 0) {
            semDados.style.display = 'block';
            return;
        }
        
        // Calcular estatísticas
        const totalPedidos = pedidosFiltrados.length;
        const totalVendas = pedidosFiltrados.reduce((sum, order) => sum + order.total, 0);
        const ticketMedio = totalVendas / totalPedidos;
        
        // Contar por forma de pagamento
        const porFormaPagamento = {};
        pedidosFiltrados.forEach(order => {
            const forma = order.formaPagamento || 'Não especificado';
            porFormaPagamento[forma] = (porFormaPagamento[forma] || 0) + 1;
        });
        
        // Show summary
        resumo.style.display = 'grid';
        document.getElementById('totalPedidos').textContent = totalPedidos;
        document.getElementById('pedidosComTaxa').textContent = `R$ ${totalVendas.toFixed(2)}`;
        document.getElementById('totalTaxas').textContent = `R$ ${ticketMedio.toFixed(2)}`;
        document.getElementById('taxaMedia').textContent = Object.keys(porFormaPagamento).length;
        
        // Update labels for pedidos report
        document.querySelector('#resumo .stat-card:nth-child(2) h3').textContent = 'Total em Vendas';
        document.querySelector('#resumo .stat-card:nth-child(3) h3').textContent = 'Ticket Médio';
        document.querySelector('#resumo .stat-card:nth-child(4) h3').textContent = 'Formas de Pagamento';
        
        // Update table header for pedidos
        updateTableHeader('pedidos');
        
        // Show details
        detalhamento.style.display = 'block';
        renderDetalhesPedidos(pedidosFiltrados);
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        alert('Erro ao gerar relatório: ' + error.message);
        loading.style.display = 'none';
    }
}

function updateTableHeader(tipo) {
    const thead = document.querySelector('#detalhamento thead tr');
    
    if (tipo === 'taxas') {
        thead.innerHTML = `
            <th>Data</th>
            <th>Total de Pedidos</th>
            <th>Pedidos com Taxa</th>
            <th>Total em Taxas</th>
        `;
        document.querySelector('#detalhamento .card-header h2').textContent = 'Detalhamento por Dia';
    } else if (tipo === 'pedidos') {
        thead.innerHTML = `
            <th>Número</th>
            <th>Data/Hora</th>
            <th>Cliente</th>
            <th>Itens</th>
            <th>Forma Pagamento</th>
            <th>Total</th>
            <th>Status</th>
        `;
        document.querySelector('#detalhamento .card-header h2').textContent = 'Lista Completa de Pedidos';
    }
}

function renderDetalhesTaxas(detalhes) {
    detalhesBody.innerHTML = '';
    
    detalhes.forEach(detalhe => {
        const row = document.createElement('tr');
        
        // Format date
        const data = new Date(detalhe.data);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        
        row.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${detalhe.pedidos}</td>
            <td>${detalhe.pedidosComTaxa}</td>
            <td>R$ ${detalhe.taxas.toFixed(2)}</td>
        `;
        
        detalhesBody.appendChild(row);
    });
}

function renderDetalhesPedidos(pedidos) {
    detalhesBody.innerHTML = '';
    
    // Ordenar por data (mais recente primeiro)
    pedidos.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    
    pedidos.forEach(pedido => {
        const row = document.createElement('tr');
        
        // Format date
        const data = new Date(pedido.dataHora);
        const dataFormatada = data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Get client name
        const clienteNome = pedido.cliente?.nome || 'N/A';
        
        // Get payment method label
        const pagamentoLabels = {
            'pix': 'PIX',
            'retirada': 'Pagar na Retirada',
            'dinheiro': 'Dinheiro',
            'cartao': 'Cartão'
        };
        const pagamento = pagamentoLabels[pedido.formaPagamento] || pedido.formaPagamento;
        
        // Get status label
        const statusLabels = {
            'novo': 'Novo',
            'em_preparo': 'Em Preparo',
            'pronto': 'Pronto',
            'entregue': 'Entregue',
            'cancelado': 'Cancelado'
        };
        const status = statusLabels[pedido.statusPedido] || pedido.statusPedido;
        
        // Status color
        const statusColors = {
            'novo': '#007bff',
            'em_preparo': '#ffc107',
            'pronto': '#28a745',
            'entregue': '#6c757d',
            'cancelado': '#dc3545'
        };
        const statusColor = statusColors[pedido.statusPedido] || '#6c757d';
        
        row.innerHTML = `
            <td><strong>#${pedido.numero}</strong></td>
            <td>${dataFormatada}</td>
            <td>${clienteNome}</td>
            <td>${pedido.itens.length} itens</td>
            <td>${pagamento}</td>
            <td><strong>R$ ${pedido.total.toFixed(2)}</strong></td>
            <td><span style="color: ${statusColor}; font-weight: 500;">${status}</span></td>
        `;
        
        detalhesBody.appendChild(row);
    });
}
