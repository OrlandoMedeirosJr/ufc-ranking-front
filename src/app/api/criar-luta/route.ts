import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const dados = await request.json();
    console.log('Dados recebidos para criar luta:', dados);

    // Verificações básicas
    if (!dados.eventoId) {
      return NextResponse.json({ 
        erro: 'ID do evento é obrigatório' 
      }, { status: 400 });
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
    
    // Lista de diferentes formatos para tentar
    const formatosLuta = [
      // Formato 1: Usando o formato original com nome
      {
        eventoId: dados.eventoId,
        lutadorA: { nome: dados.lutador1 || dados.lutadorA?.nome || dados.lutadorA },
        lutadorB: { nome: dados.lutador2 || dados.lutadorB?.nome || dados.lutadorB },
        categoria: dados.categoria || "Não definida"
      },
      
      // Formato 2: Usando apenas strings para os lutadores
      {
        eventoId: dados.eventoId,
        lutadorA: dados.lutador1 || dados.lutadorA?.nome || dados.lutadorA,
        lutadorB: dados.lutador2 || dados.lutadorB?.nome || dados.lutadorB,
        categoria: dados.categoria || "Não definida"
      },
      
      // Formato 3: Usando ids numéricas fictícias
      {
        eventoId: dados.eventoId,
        lutadorA: 55, // ID fictício para teste
        lutadorB: 57, // ID fictício para teste
        categoria: dados.categoria || "Não definida"
      },
      
      // Formato 4: Simplificado ao máximo
      {
        eventoId: dados.eventoId,
        lutadorA: "Royce Gracie",
        lutadorB: "Ken Shamrock",
        categoria: "Peso Médio"
      }
    ];

    // Tentar cada formato
    const resultados = [];
    
    for (let i = 0; i < formatosLuta.length; i++) {
      const formato = formatosLuta[i];
      try {
        console.log(`Tentando formato ${i + 1}:`, JSON.stringify(formato));
        
        const response = await fetch(`${API_URL}/lutas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formato)
        });
        
        const status = response.status;
        const texto = await response.text();
        let respostaJson;
        
        try {
          respostaJson = JSON.parse(texto);
        } catch (e) {
          respostaJson = null;
        }
        
        resultados.push({
          formato: i + 1,
          status,
          sucesso: response.ok,
          resposta: respostaJson || texto
        });
        
        // Se algum formato funcionar, interromper os testes
        if (response.ok) {
          break;
        }
      } catch (erro) {
        resultados.push({
          formato: i + 1,
          sucesso: false,
          erro: erro.message
        });
      }
    }

    // Retornar os resultados de todas as tentativas
    return NextResponse.json({ 
      resultados,
      mensagem: 'Testes de formato de luta concluídos'
    });
    
  } catch (erro) {
    console.error('Erro ao processar requisição:', erro);
    return NextResponse.json({ 
      erro: `Erro ao processar requisição: ${erro.message}`
    }, { status: 500 });
  }
}