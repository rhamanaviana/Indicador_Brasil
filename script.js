document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const dateInput = document.getElementById('date-input');
    const searchBtn = document.getElementById('search-btn');
    const mainDataCard = document.getElementById('main-data-card');
    const statusMessage = document.getElementById('status-message');
    const converterCard = document.getElementById('converter-card');
    const realInput = document.getElementById('real-input');
    const dolarOutput = document.getElementById('dolar-output');
    const graphTitle = document.getElementById('graph-title');
    const chartCanvas = document.getElementById('myChart');

    let myChart;
    let currentSerie = { code: '1', label: 'Dólar', unit: 'R$' };
    let currentExchangeRate = null;

    // Função para renderizar o gráfico
    const renderChart = (data, year) => {
        if (myChart) {
            myChart.destroy();
        }

        const labels = data.map(item => item.data);
        const values = data.map(item => parseFloat(item.valor));
        
        graphTitle.textContent = `${currentSerie.label} - Evolução em ${year}`;

        myChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${currentSerie.label} (${currentSerie.unit})`,
                    data: values,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: `Valor (${currentSerie.unit})`
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Data'
                        }
                    }
                }
            }
        });
    };

    // Função para exibir os dados de um dia específico
    const displayDailyData = (data) => {
        const value = parseFloat(data.valor).toFixed(4).replace('.', ',');
        const unit = currentSerie.unit;
        
        mainDataCard.innerHTML = `
            <h2>${currentSerie.label}</h2>
            <p class="value">${unit} ${value}</p>
            <p class="date">Dados de: ${data.data}</p>
        `;
        statusMessage.textContent = '';
    };

    // Função para buscar dados de uma data específica
    const fetchDailyData = async (date) => {
        const formattedDate = date.split('-').reverse().join('/');
        const apiUrl = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${currentSerie.code}/dados?formato=json&dataInicial=${formattedDate}&dataFinal=${formattedDate}`;

        mainDataCard.innerHTML = `<p id="status-message" class="info-message">Buscando dados para ${formattedDate}...</p>`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Falha na comunicação com a API.');
            }
            const data = await response.json();
            if (data && data.length > 0) {
                displayDailyData(data[0]);
                if (currentSerie.code === '1') {
                    currentExchangeRate = parseFloat(data[0].valor);
                    converterCard.style.display = 'block';
                } else {
                    converterCard.style.display = 'none';
                }
            } else {
                mainDataCard.innerHTML = `<p id="status-message" class="error-message">Atenção: A API do Banco Central não tem dados para finais de semana e feriados. Tente um dia útil.</p>`;
                converterCard.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro:', error);
            mainDataCard.innerHTML = `<p id="status-message" class="error-message">❌ Erro ao buscar dados. Verifique a data e sua conexão.</p>`;
            converterCard.style.display = 'none';
        }
    };
    
    // Função para buscar dados históricos para o gráfico com base no ano
    const fetchHistoricalData = async (year) => {
        const initialDate = `01/01/${year}`;
        const finalDate = `31/12/${year}`;
        
        const apiUrl = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${currentSerie.code}/dados?formato=json&dataInicial=${initialDate}&dataFinal=${finalDate}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Falha ao buscar histórico.');
            }
            const data = await response.json();
            if (data && data.length > 0) {
                renderChart(data, year);
            } else {
                graphTitle.textContent = `Dados históricos de ${year} não encontrados.`;
                if (myChart) myChart.destroy();
            }
        } catch (error) {
            console.error('Erro ao carregar o gráfico:', error);
            graphTitle.textContent = `Erro ao carregar o gráfico de ${year}. Tente novamente mais tarde.`;
            if (myChart) myChart.destroy();
        }
    };
    
    // Event listener para o botão de busca
    searchBtn.addEventListener('click', () => {
        const date = dateInput.value;
        if (date) {
            const year = date.split('-')[0];
            fetchDailyData(date);
            fetchHistoricalData(year);
        } else {
            mainDataCard.innerHTML = `<p id="status-message" class="error-message">Por favor, selecione uma data.</p>`;
        }
    });

    // Event listener para as abas
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentSerie = {
                code: tab.dataset.serie,
                label: tab.dataset.label,
                unit: tab.dataset.unit
            };

            mainDataCard.innerHTML = `<p id="status-message" class="info-message">Selecione uma data para ver os dados de ${currentSerie.label}.</p>`;
            converterCard.style.display = currentSerie.code === '1' ? 'block' : 'none';
            graphTitle.textContent = 'O gráfico da evolução histórica aparecerá aqui.';
            if (myChart) myChart.destroy();
        });
    });

    // Lógica do conversor
    realInput.addEventListener('input', () => {
        if (currentExchangeRate) {
            const realValue = parseFloat(realInput.value);
            if (!isNaN(realValue)) {
                dolarOutput.value = (realValue / currentExchangeRate).toFixed(2);
            } else {
                dolarOutput.value = '';
            }
        }
    });

    // Event listener para a tecla Enter no campo de data
    dateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
});