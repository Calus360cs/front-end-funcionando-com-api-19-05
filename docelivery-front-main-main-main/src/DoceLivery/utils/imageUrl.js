const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Constrói uma URL de imagem completa e válida a partir de um caminho parcial.
 * Lida com caminhos que já são URLs completas, data URIs ou caminhos parciais.
 * @param {string | null | undefined} imgPath - O caminho da imagem do backend.
 * @returns {string | null} A URL completa da imagem ou nulo se o caminho for inválido.
 */
export const resolveImageUrl = (imgPath) => {
    if (!imgPath || typeof imgPath !== 'string') {
        return null;
    }

    if (imgPath.startsWith('http') || imgPath.startsWith('data:')) {
        return imgPath;
    }

    // Remove a barra inicial e/ou '/uploads/' para evitar duplicação.
    const cleanedPath = imgPath.replace(/^\/?uploads\//, '');
    
    return `${API_BASE}/uploads/${cleanedPath}`;
};
