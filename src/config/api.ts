/**
 * Configuração central da API para o frontend
 */

// URL base da API do backend
export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3334';

// Função auxiliar para construir URLs completas
export const buildApiUrl = (path: string): string => {
  try {
    // Remover barras duplicadas caso path já comece com '/'
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_URL}/${cleanPath}`;
  } catch (error) {
    console.error('Erro ao construir URL da API:', error);
    return `http://localhost:3334/${path}`;
  }
};

// Configurações padrão para requisições fetch
export const defaultFetchOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
  cache: 'no-store' as RequestCache,
  mode: 'cors' as RequestMode,
  credentials: 'same-origin' as RequestCredentials,
  next: { revalidate: 0 }
};

// Função auxiliar para requisições GET
export const apiGet = async (path: string, options = {}) => {
  try {
    const response = await fetch(buildApiUrl(path), {
      ...defaultFetchOptions,
      ...options,
    });
    return response;
  } catch (error) {
    console.error(`Erro na requisição GET para ${path}:`, error);
    throw error;
  }
};

// Função auxiliar para requisições POST
export const apiPost = async (path: string, data: any, options = {}) => {
  try {
    const response = await fetch(buildApiUrl(path), {
      ...defaultFetchOptions,
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
    return response;
  } catch (error) {
    console.error(`Erro na requisição POST para ${path}:`, error);
    throw error;
  }
};

// Função auxiliar para requisições PUT
export const apiPut = async (path: string, data: any, options = {}) => {
  try {
    const response = await fetch(buildApiUrl(path), {
      ...defaultFetchOptions,
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
    return response;
  } catch (error) {
    console.error(`Erro na requisição PUT para ${path}:`, error);
    throw error;
  }
};

// Função auxiliar para requisições DELETE
export const apiDelete = async (path: string, options = {}) => {
  try {
    const response = await fetch(buildApiUrl(path), {
      ...defaultFetchOptions,
      method: 'DELETE',
      ...options,
    });
    return response;
  } catch (error) {
    console.error(`Erro na requisição DELETE para ${path}:`, error);
    throw error;
  }
}; 