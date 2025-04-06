/**
 * Configuração central da API para o frontend
 */

// URL base da API do backend - definida explicitamente
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334';

// Função auxiliar para construir URLs completas
export const buildApiUrl = (path: string): string => {
  // Remover barras duplicadas caso path já comece com '/'
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_URL}/${cleanPath}`;
};

// Configurações básicas para requisições fetch
export const defaultFetchOptions = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  mode: 'cors' as RequestMode,
  credentials: 'omit' as RequestCredentials,
  cache: 'no-store' as RequestCache
};

// Função auxiliar para requisições GET
export const apiGet = async (path: string, options = {}) => {
  try {
    const url = buildApiUrl(path);
    console.log(`[API] GET: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      ...defaultFetchOptions,
      ...options
    });
    
    return response;
  } catch (error) {
    console.error(`[API] Erro GET: ${error}`);
    throw error;
  }
};

// Função auxiliar para requisições POST
export const apiPost = async (path: string, data: any, options = {}) => {
  try {
    const url = buildApiUrl(path);
    console.log(`[API] POST: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...defaultFetchOptions,
      ...options
    });
    
    return response;
  } catch (error) {
    console.error(`[API] Erro POST: ${error}`);
    throw error;
  }
};

// Função auxiliar para requisições PUT
export const apiPut = async (path: string, data: any, options = {}) => {
  try {
    const url = buildApiUrl(path);
    console.log(`[API] PUT: ${url}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...defaultFetchOptions,
      ...options
    });
    
    return response;
  } catch (error) {
    console.error(`[API] Erro PUT: ${error}`);
    throw error;
  }
};

// Função auxiliar para requisições DELETE
export const apiDelete = async (path: string, options = {}) => {
  try {
    const url = buildApiUrl(path);
    console.log(`[API] DELETE: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      ...defaultFetchOptions,
      ...options
    });
    
    return response;
  } catch (error) {
    console.error(`[API] Erro DELETE: ${error}`);
    throw error;
  }
}; 