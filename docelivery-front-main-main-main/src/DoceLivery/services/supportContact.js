export const buildSupportTicketPayload = ({ userType, userId, assunto, mensagem, prioridade = 'media' }) => ({
  assunto: assunto || 'Contato pelo app',
  mensagem: mensagem || 'Preciso de ajuda.',
  tipoUsuario: String(userType || 'CLIENTE').toUpperCase(),
  usuarioId: userId || null,
  prioridade,
  origem: 'app',
});

export const getSupportTicketEndpoints = () => [
  '/support/tickets',
  '/tickets',
  '/suporte',
];

export const createSupportTicket = async ({ userType, userId, assunto, mensagem, prioridade = 'media' }) => {
  const payload = buildSupportTicketPayload({ userType, userId, assunto, mensagem, prioridade });

  try {
    const { default: ApiService } = await import('./api.js');

    for (const endpoint of getSupportTicketEndpoints()) {
      try {
        const response = await ApiService.post(endpoint, payload);
        if (response) {
          return response;
        }
      } catch (error) {
        if (error?.response?.status && error.response.status >= 400 && error.response.status < 500) {
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    console.warn('Não foi possível enviar o chamado de suporte:', error);
  }

  return null;
};
