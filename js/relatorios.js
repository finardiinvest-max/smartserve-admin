requireAuth();

const btnGerar = document.getElementById('btnGerar');
const loading = document.getElementById('loading');
const resumo = document.getElementById('resumo');
const detalhamento = document.getElementById('detalhamento');
const semDados = document.getElementById('semDados');
const detalhesBody = document.getElementById('detalhesBody');

// Set today as default date
document.getElementById('dataReferencia').valueAsDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    btnGerar.addEventListener('click', gerarRelatorio);
    // Generate initial report
    gerarRelatorio();
});

async function gerarRelatorio() {
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
        
        // Show details
        if (data.detalhes && data.detalhes.length > 0) {
            detalhamento.style.display = 'block';
            renderDetalhes(data.detalhes);
        }
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        alert('Erro ao gerar relatório: ' + error.message);
        loading.style.display = 'none';
    }
}

function renderDetalhes(detalhes) {
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
