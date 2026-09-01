import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`, 
  headers: {
    'Content-Type': 'application/json', // Mantém o padrão para o resto do sistema
  },
});

// --- Interceptor de Requisição ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }

  // CORREÇÃO AQUI: Se os dados da requisição forem um FormData (envio de arquivo/produto)
  // nós deletamos o Content-Type fixo para o Axios gerar o multipart/form-data correto.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- Interceptor de Resposta ---
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const hasAuthToken = !!(localStorage.getItem('userToken') || localStorage.getItem('token'));
    const isAuthRequest = /\/auth\//i.test(url) || /\/login/i.test(url) || /\/cadastro/i.test(url);

    if (status === 401 || status === 403) {
      if (!isAuthRequest && !hasAuthToken) {
        console.warn(`Acesso negado (${status}). Redirecionando para o login.`);
        window.location.href = '/docelivery/confeiteiro/login-confeiteiro';
      } else {
        console.warn(`Acesso negado (${status}). Mantendo a sessão atual para evitar logout inesperado.`);
      }
    }

    console.error('Erro na API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;