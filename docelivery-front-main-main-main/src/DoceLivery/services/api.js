import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptor de Requisição ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    // O ESPAÇO depois de Bearer é obrigatório!
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Adiciona o ID do usuário se estiver disponível (X-User-Id)
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- Interceptor de Resposta ---
api.interceptors.response.use(
  (response) => {
    // O Axios coloca o corpo da resposta em .data
    // Ao retornar response.data aqui, mantemos a compatibilidade com seu código antigo
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se não for a rota de login e der 401, a sessão expirou
      if (!error.config.url.includes('/auth/login')) {
        console.warn("Sessão expirada, limpando dados...");
        localStorage.clear();
        // window.location.href = '/login'; 
      }
    }
    console.error('Erro na API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;