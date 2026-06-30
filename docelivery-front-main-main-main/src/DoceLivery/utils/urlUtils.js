const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Constrói uma URL de imagem completa e segura a partir de um caminho.
 * Lida com caminhos que já são URLs completas, caminhos absolutos (ex: /uploads/img.png),
 * ou caminhos relativos.
 * @param {string | null | undefined} imagePath O caminho da imagem vindo do back-end.
 * @returns {string | null} A URL completa da imagem ou null se o caminho for inválido.
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return null; // Retorna nulo para caminhos inválidos
  }

  // Se já for uma URL completa (http, https) ou uma URL de dados para preview (blob, data).
  if (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Garante que o caminho não tenha múltiplas barras ou '/uploads/' duplicado.
  // 1. Remove qualquer '/uploads/' ou '/' do início.
  // 2. Monta a URL final de forma segura.
  const cleanedPath = imagePath.replace(/^\/?uploads\//, '').replace(/^\//, '');

  return `${API_BASE_URL}/uploads/${cleanedPath}`;
};
