import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  
  // Tentar fazer uma requisição GET para o backend
  try {
    const backendResponse = await fetch(`${API_URL}/eventos`, { 
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const backendStatus = backendResponse.status;
    const backendData = await backendResponse.text();
    
    return NextResponse.json({
      success: true,
      backendStatus,
      backendUrl: `${API_URL}/eventos`,
      backendData: backendData ? JSON.parse(backendData) : null,
      message: 'Conexão com o backend estabelecida com sucesso'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      backendUrl: `${API_URL}/eventos`,
      error: `Erro ao conectar com o backend: ${error.message}`,
      stack: error.stack
    }, { status: 500 });
  }
} 