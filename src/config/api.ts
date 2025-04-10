/**
 * Configuração central da API para o frontend
 */

// Configuração da API
export const apiConfig = {
  // API base URL - por padrão é 3002, pode ser alterado por variável de ambiente
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
  
  // Tempo limite para requisições (30 segundos)
  timeout: 30000,
  
  // Cabeçalhos padrão para requisições
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  },
  
  // Credenciais e modo CORS
  credentials: 'omit',
  mode: 'cors'
};

// Log no console para facilitar depuração
console.log('API Config:', {
  baseUrl: apiConfig.baseUrl,
  env: process.env.NODE_ENV
});

// Constrói uma URL completa para a API
export function buildApiUrl(path: string): string {
  // Remove barras iniciais redundantes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Combina com a baseUrl
  const url = `${apiConfig.baseUrl}/${cleanPath}`;
  
  console.log(`API URL construída: ${url}`);
  
  return url;
}

// Função auxiliar para fazer requisições GET
export async function apiGet(path: string, options = {}) {
  try {
    const url = buildApiUrl(path);
    console.log(`Realizando requisição GET para: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: apiConfig.headers,
      credentials: apiConfig.credentials as RequestCredentials,
      mode: apiConfig.mode as RequestMode,
      cache: 'no-store',
      next: { revalidate: 0 },
      ...options
    });

    if (!response.ok) {
      console.error(`Erro na requisição GET: ${response.status} - ${response.statusText}`);
      
      // Tentar URL alternativa se a primeira falhar
      console.log('Tentando URL alternativa após falha...');
      const alternativeUrl = url.replace('localhost:3334', 'localhost:3002')
                               .replace('localhost:3000', 'localhost:3002');
      
      if (alternativeUrl !== url) {
        console.log(`Tentando URL alternativa: ${alternativeUrl}`);
        const altResponse = await fetch(alternativeUrl, {
          method: 'GET',
          headers: apiConfig.headers,
          credentials: apiConfig.credentials as RequestCredentials,
          mode: apiConfig.mode as RequestMode,
          cache: 'no-store',
          next: { revalidate: 0 },
          ...options
        });
        
        if (altResponse.ok) {
          console.log(`URL alternativa funcionou: ${alternativeUrl}`);
          const text = await altResponse.text();
          try {
            const data = JSON.parse(text);
            return data;
          } catch (parseError) {
            console.error('Erro ao fazer parse da resposta alternativa:', parseError);
            throw new Error('Falha ao processar resposta da API alternativa');
          }
        } else {
          console.error(`URL alternativa também falhou: ${alternativeUrl}`);
        }
      }
      
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      console.log(`Resposta GET processada com sucesso para: ${url}`);
      return data;
    } catch (parseError) {
      console.error(`Erro ao fazer parse da resposta de ${url}:`, parseError);
      console.error(`Texto da resposta: ${text.substring(0, 500)}...`);
      throw new Error(`Erro ao processar resposta: ${parseError instanceof Error ? parseError.message : 'Erro de parse'}`);
    }
  } catch (error) {
    console.error(`Falha na requisição GET para: ${path}`, error);
    throw error;
  }
}

// Função auxiliar para requisições POST
export const apiPost = async (path: string, data: any, options = {}) => {
  try {
    const url = buildApiUrl(path);
    console.log(`[API] POST: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: apiConfig.headers,
      credentials: apiConfig.credentials as RequestCredentials,
      mode: apiConfig.mode as RequestMode,
      cache: 'no-store',
      next: { revalidate: 0 },
      ...options
    });
    
    return response;
  } catch (error) {
    console.error(`[API] Erro POST: ${error}`);
    // Lançar um erro mais informativo
    if (error instanceof Error) {
      throw new Error(`Falha ao enviar dados: ${error.message}`);
    }
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
      headers: apiConfig.headers,
      credentials: apiConfig.credentials as RequestCredentials,
      mode: apiConfig.mode as RequestMode,
      cache: 'no-store',
      next: { revalidate: 0 },
      ...options
    });
    
    return response;
  } catch (error) {
    console.error(`[API] Erro PUT: ${error}`);
    // Lançar um erro mais informativo
    if (error instanceof Error) {
      throw new Error(`Falha ao atualizar dados: ${error.message}`);
    }
    throw error;
  }
};

// Função auxiliar para requisições DELETE
export const apiDelete = async (path: string, options = {}) => {
  let lastError: Error | null = null;
  let tentativas = 0;
  const maxTentativas = 3;
  
  while (tentativas < maxTentativas) {
    try {
      // Construir a URL usando a função auxiliar
      const url = buildApiUrl(path);
      console.log(`[API] DELETE (tentativa ${tentativas + 1}): ${url}`);
      
      // Usar a função robusta de fetch
      const response = await fetch(url, {
        method: 'DELETE',
        headers: apiConfig.headers,
        credentials: apiConfig.credentials as RequestCredentials,
        mode: apiConfig.mode as RequestMode,
        cache: 'no-store',
        next: { revalidate: 0 },
        ...options
      });
      
      return response; // Retorna a resposta se bem-sucedido
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[API] Erro DELETE (tentativa ${tentativas + 1}): ${error}`);
      
      // Se não for a última tentativa, tente com URL direta
      if (tentativas < maxTentativas - 1) {
        try {
          // URL direta como fallback
          const directUrl = `http://localhost:3002/${path.startsWith('/') ? path.substring(1) : path}`;
          console.log(`[API] DELETE com URL direta: ${directUrl}`);
          
          const directResponse = await fetch(directUrl, {
            method: 'DELETE',
            headers: apiConfig.headers,
            credentials: apiConfig.credentials as RequestCredentials,
            mode: apiConfig.mode as RequestMode,
            cache: 'no-store',
            next: { revalidate: 0 }
          });
          
          return directResponse; // Retorna a resposta se bem-sucedido com URL direta
        } catch (directError) {
          console.error(`[API] Erro DELETE com URL direta: ${directError}`);
          // Continua para a próxima tentativa
        }
      }
      
      tentativas++;
      
      // Espera antes da próxima tentativa, exceto na última iteração
      if (tentativas < maxTentativas) {
        const tempoEspera = tentativas * 1000; // Aumenta o tempo de espera gradualmente
        console.log(`[API] Aguardando ${tempoEspera}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, tempoEspera));
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error(`[API] Todas as ${maxTentativas} tentativas de DELETE falharam. Último erro: ${lastError}`);
  throw new Error(`Falha ao excluir dados após ${maxTentativas} tentativas: ${lastError?.message || 'Erro desconhecido'}`);
}; 