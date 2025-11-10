requireAuth();

const form = document.getElementById('settingsForm');

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    form.addEventListener('submit', handleSubmit);
});

async function loadSettings() {
    try {
        const settings = await getSettings();
        
        document.getElementById('nomeEstabelecimento').value = settings.nomeEstabelecimento || '';
        document.getElementById('descricao').value = settings.descricao || '';
        document.getElementById('telefone').value = settings.telefone || '';
        document.getElementById('horarioFuncionamento').value = settings.horarioFuncionamento || '';
        document.getElementById('endereco').value = settings.endereco || '';
        document.getElementById('chavePix').value = settings.chavePix || '';
        document.getElementById('corPrimaria').value = settings.corPrimaria || '#FF6B35';
        document.getElementById('corSecundaria').value = settings.corSecundaria || '#004E89';
        document.getElementById('logoUrl').value = settings.logoUrl || '';
        document.getElementById('aceitaPedidos').checked = settings.aceitaPedidos !== false;
        document.getElementById('mensagemFechado').value = settings.mensagemFechado || '';
        document.getElementById('taxaHabilitada').checked = settings.taxaConveniencia?.habilitada || false;
        document.getElementById('taxaPercentual').value = settings.taxaConveniencia?.percentual || 5;
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        alert('Erro ao carregar configurações');
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const settingsData = {
        nomeEstabelecimento: document.getElementById('nomeEstabelecimento').value,
        descricao: document.getElementById('descricao').value,
        telefone: document.getElementById('telefone').value,
        horarioFuncionamento: document.getElementById('horarioFuncionamento').value,
        endereco: document.getElementById('endereco').value,
        chavePix: document.getElementById('chavePix').value,
        corPrimaria: document.getElementById('corPrimaria').value,
        corSecundaria: document.getElementById('corSecundaria').value,
        logoUrl: document.getElementById('logoUrl').value,
        aceitaPedidos: document.getElementById('aceitaPedidos').checked,
        mensagemFechado: document.getElementById('mensagemFechado').value,
        taxaConveniencia: {
            habilitada: document.getElementById('taxaHabilitada').checked,
            percentual: parseInt(document.getElementById('taxaPercentual').value)
        }
    };

    try {
        await updateSettings(settingsData);
        alert('Configurações salvas com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        alert('Erro ao salvar configurações: ' + error.message);
    }
}
