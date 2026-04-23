import React from 'react';
import { Line } from 'react-chartjs-2';

// -----------------------------------------------------
// INÍCIO DA CORREÇÃO: Importar e Registrar Componentes
// -----------------------------------------------------
import {
Chart as ChartJS, 
CategoryScale, 
LinearScale,
PointElement,
LineElement,
  Title, // Opcional, mas útil para o título do gráfico
  Tooltip, // Opcional, para mostrar informações ao passar o mouse
  Legend // Opcional, para a legenda do dataset
} from 'chart.js';

// Registrar os elementos necessários para um gráfico de Linha
ChartJS.register(
CategoryScale,
LinearScale,
PointElement,
LineElement,
Title,
Tooltip,
Legend
);
// -----------------------------------------------------
// FIM DA CORREÇÃO
// -----------------------------------------------------

const SalesChart = ({ salesData }) => {
  if (!salesData || salesData.length === 0) {
    return <p>Dados de vendas não disponíveis para o gráfico.</p>;
}
    
  const labels = salesData.map(data => data.day);

const data = {
    labels: labels,
    datasets: [
    {
        label: 'Vendas da Semana (R$)',
        data: salesData.map(data => data.total),
        fill: false,
        backgroundColor: 'rgba(139, 92, 246, 0.4)',
        borderColor: 'rgba(139, 92, 246, 1)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
    },
    ],
};

  // As opções definem o comportamento e o estilo do gráfico (opcional, mas recomendado)
const options = {
    responsive: true,
    plugins: {
    legend: {
        position: 'top',
    },
    title: {
        display: true,
        text: 'Vendas da Semana - Atualização em Tempo Real',
    },
    tooltip: {
        callbacks: {
            label: function(context) {
                return `Vendas: R$ ${context.parsed.y.toFixed(2)}`;
            }
        }
    }
    },
    scales: {
    y: {
        beginAtZero: true,
        ticks: {
            callback: function(value) {
                return 'R$ ' + value.toFixed(0);
            }
        }
    }
    }
};


return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
    <h2>Gráfico de Vendas</h2>
      {/* Passamos as opções de volta para o componente Line */}
    <Line data={data} options={options} />
    </div>
);
};

export default SalesChart;