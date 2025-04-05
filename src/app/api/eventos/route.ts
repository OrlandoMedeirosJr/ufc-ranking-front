import { NextRequest, NextResponse } from 'next/server';

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
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
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