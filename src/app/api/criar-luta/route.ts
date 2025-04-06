import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/config/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[API Proxy] POST /api/criar-luta - Recebendo dados:", body);
    
    const eventoId = body.eventoId;
    const lutaData = body.lutaData;
    
    if (!eventoId || !lutaData) {
      return NextResponse.json(
        { error: 'Dados inválidos: eventoId e lutaData são obrigatórios' }, 
        { status: 400 }
      );
    }
    
    const backendUrl = `${API_URL}/eventos/${eventoId}/lutas`;
    
    console.log(`[API Proxy] Encaminhando para: ${backendUrl}`);
    console.log(`[API Proxy] Dados enviados: ${JSON.stringify(lutaData)}`);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lutaData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Proxy] Erro do backend: ${response.status} ${response.statusText}`);
      console.error(`[API Proxy] Detalhes: ${errorText}`);
      
      return NextResponse.json(
        { error: 'Erro ao adicionar luta ao evento', backendError: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log("[API Proxy] Resposta do backend:", data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Erro ao processar requisição:", error);
    
    return NextResponse.json(
      { error: 'Erro interno ao processar a requisição', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}