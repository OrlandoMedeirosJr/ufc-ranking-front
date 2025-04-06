import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/config/api';

// Esta rota servidor apenas como proxy para o backend, mas com funcionalidade de log
// para fins de depuração

/**
 * Função GET para buscar eventos
 */
export async function GET(request: NextRequest) {
  console.log('[API Proxy] GET /api/eventos - iniciando requisição proxy para o backend');
  
  try {
    const params = request.nextUrl.searchParams;
    let queryString = '';
    
    if (params.size > 0) {
      queryString = `?${params.toString()}`;
    }
    
    // Usar a URL base da configuração centralizada
    const backendUrl = `${API_URL}/eventos${queryString}`;
    console.log(`[API Proxy] Encaminhando para: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error(`[API Proxy] Erro na resposta do backend: ${response.status} ${response.statusText}`);
      const error = await response.text();
      return NextResponse.json(
        { error: 'Erro ao comunicar com o backend', status: response.status, details: error },
        { status: 502 }
      );
    }
    
    const data = await response.json();
    console.log(`[API Proxy] Resposta recebida do backend com sucesso, ${JSON.stringify(data).length} bytes`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Proxy] Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor proxy', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Essa função processa a requisição POST para criar um evento com lutas
export async function POST(request: NextRequest) {
  try {
    // Obter os dados do corpo da requisição
    const eventoData = await request.json();
    
    console.log('[API] Recebendo dados do evento:', JSON.stringify(eventoData));
    
    // Validação básica
    if (!eventoData.nome) {
      console.log('[API] Erro: Nome do evento é obrigatório');
      return NextResponse.json(
        { error: 'Nome do evento é obrigatório' },
        { status: 400 }
      );
    }
    
    // Preparar os dados para enviar ao backend
    const dadosEvento = {
      nome: eventoData.nome,
      data: eventoData.data || undefined,
      local: eventoData.local || undefined,
      pais: eventoData.pais || undefined,
      finalizado: eventoData.finalizado || false,
      // Adicionamos lutas somente se houver
      lutas: eventoData.lutas?.map((luta: any) => ({
        lutadorA: { nome: luta.lutador1 },
        lutadorB: { nome: luta.lutador2 },
        categoria: luta.categoria,
        resultado: {
          vencedor: luta.resultado === 'V1' ? 'lutadorA' : 
                    luta.resultado === 'V2' ? 'lutadorB' : 
                    luta.resultado === 'Empate' ? 'empate' : 'sem_resultado',
          metodo: luta.tipo,
          round: parseInt(luta.round, 10) || 1,
          titulo: luta.titulo,
          bonusLuta: luta.bonus === 'Luta da Noite',
          bonusPerformance: luta.bonus === 'Performance da Noite'
        }
      }))
    };
    
    console.log('[API] Enviando dados para o backend:', JSON.stringify(dadosEvento));
    
    console.log(`[API] URL do backend: ${API_URL}/eventos`);
    
    try {
      // Enviar os dados para o backend com tratamento de erros de conexão
      const response = await fetch(`${API_URL}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEvento),
      });
      
      // Se a resposta não for bem-sucedida, lançar erro
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.log(`[API] Erro do backend: ${response.status}`, errorData);
        return NextResponse.json(
          { error: errorData.message || 'Erro ao criar evento' },
          { status: response.status }
        );
      }
      
      // Retornar os dados do evento criado
      const eventoResponse = await response.json();
      console.log('[API] Resposta de sucesso do backend:', eventoResponse);
      return NextResponse.json(eventoResponse);
    } catch (fetchError: any) {
      console.error(`[API] Erro de conexão com o backend (${API_URL}/eventos):`, fetchError);
      return NextResponse.json(
        { 
          error: `Erro de conexão com o backend: ${fetchError.message}`,
          details: `Não foi possível se conectar a ${API_URL}/eventos. Verifique se o servidor backend está rodando.`
        },
        { status: 503 }
      );
    }
    
  } catch (error: any) {
    console.error('[API] Erro ao processar requisição de criação de evento:', error);
    console.error('[API] Stack Trace:', error.stack || 'Sem stack trace disponível');
    
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message || 'Desconhecido'}` },
      { status: 500 }
    );
  }
} 