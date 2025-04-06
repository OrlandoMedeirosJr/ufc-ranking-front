'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LutaForm from '@/components/LutaForm';

interface EditarLutaPageProps {
  params: {
    id: string;
    lutaId: string;
  };
}

export default function EditarLutaPage({ params }: EditarLutaPageProps) {
  const [eventoData, setEventoData] = React.useState<any>(null);
  const [lutaData, setLutaData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Desempacotar os parâmetros usando React.use
  const unwrappedParams = React.use(params);
  const eventoId = unwrappedParams.id;
  const lutaId = unwrappedParams.lutaId;
  
  console.log('Editando luta:', { eventoId, lutaId });

  const buscarDados = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Buscando evento:', eventoId);
      const eventoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/eventos/${eventoId}`);
      
      if (!eventoResponse.ok) {
        throw new Error(`Erro ao buscar evento: ${eventoResponse.status}`);
      }
      
      const eventoData = await eventoResponse.json();
      console.log('Evento carregado:', eventoData);
      setEventoData(eventoData);
      
      // Converter lutaId para número para comparação
      const lutaIdNumero = parseInt(lutaId, 10);
      console.log('Procurando luta com ID:', lutaIdNumero);
      
      // Encontrar a luta específica pelo ID
      const lutaEncontrada = eventoData.lutas.find((luta: any) => luta.id === lutaIdNumero);
      console.log('Luta encontrada:', lutaEncontrada);
      
      if (!lutaEncontrada) {
        throw new Error(`Luta com ID ${lutaId} não encontrada no evento ${eventoId}`);
      }
      
      // Processar os dados da luta para o formato esperado pelo LutaForm
      const lutaProcessada = {
        lutadorA: lutaEncontrada.lutadorA,
        lutadorB: lutaEncontrada.lutadorB,
        categoria: lutaEncontrada.categoria,
        disputaTitulo: lutaEncontrada.disputaTitulo,
        resultado: lutaEncontrada.resultado ? {
          vencedor: lutaEncontrada.resultado.vencedor,
          metodo: lutaEncontrada.resultado.metodo,
          round: lutaEncontrada.resultado.round,
          tempo: lutaEncontrada.resultado.tempo,
          bonusLuta: lutaEncontrada.resultado.bonusLuta,
          bonusPerformance: lutaEncontrada.resultado.bonusPerformance
        } : undefined
      };
      
      console.log('Dados da luta processados:', lutaProcessada);
      setLutaData(lutaProcessada);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [eventoId, lutaId]);

  React.useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  const handleSubmit = async (formData: any) => {
    try {
      console.log('Enviando dados para edição:', formData);
      setLoading(true);
      setError(null);
      
      // Preparar dados para envio à API
      const dadosParaEnviar = {
        categoria: formData.categoria,
        disputaTitulo: formData.disputaTitulo,
        vencedor: formData.resultado?.vencedor,
        metodo: formData.resultado?.metodo,
        round: formData.resultado?.round ? parseInt(formData.resultado.round, 10) : undefined,
        tempo: formData.resultado?.tempo,
        // Garantir que os valores sejam explicitamente booleanos
        bonusLuta: formData.resultado && formData.resultado.bonusLuta !== undefined ? 
                  Boolean(formData.resultado.bonusLuta) : undefined,
        bonusPerformance: formData.resultado && formData.resultado.bonusPerformance !== undefined ? 
                  Boolean(formData.resultado.bonusPerformance) : undefined
      };
      
      // Remover campos undefined ou null
      Object.keys(dadosParaEnviar).forEach(key => {
        if (dadosParaEnviar[key] === undefined || dadosParaEnviar[key] === null) {
          delete dadosParaEnviar[key];
        }
      });
      
      console.log('Dados formatados para API:', dadosParaEnviar);
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lutas/${lutaId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dadosParaEnviar),
        });

        const responseText = await response.text();
        console.log('Resposta da API (texto bruto):', responseText);
        
        let responseData;
        try {
          // Tentar converter a resposta para JSON (se for um JSON válido)
          if (responseText.trim()) {
            responseData = JSON.parse(responseText);
          } else {
            responseData = { message: 'Resposta vazia do servidor' };
          }
        } catch (jsonError) {
          console.error('Erro ao converter resposta para JSON:', jsonError);
          // Se não for JSON, usar o texto como resposta
          responseData = { message: responseText || 'Resposta não-JSON do servidor' };
        }
        
        if (!response.ok) {
          console.error('Erro da API:', responseData);
          throw new Error(
            responseData.message || 
            responseData.error || 
            `Erro HTTP ${response.status}: ${responseText || 'Sem detalhes'}`
          );
        }

        // Se chegou aqui, a solicitação foi bem-sucedida, mesmo se o servidor retornou um objeto vazio
        if (Object.keys(responseData).length === 0) {
          console.log('Servidor retornou um objeto vazio, mas a requisição foi bem-sucedida');
          responseData = { message: 'Luta atualizada com sucesso' };
        }

        console.log('Luta atualizada com sucesso:', responseData);
        
        // Redirecionar para a página do evento
        window.location.href = `/eventos/${eventoId}`;
      } catch (fetchError) {
        console.error('Erro na requisição fetch:', fetchError);
        throw new Error(`Erro na comunicação com o servidor: ${fetchError.message}`);
      }
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      setError(error instanceof Error ? error.message : JSON.stringify(error) || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Luta</h1>
      {lutaData ? (
        <LutaForm
          initialData={lutaData}
          onSubmit={handleSubmit}
          isEditing={true}
          lutadoresReadOnly={true}
        />
      ) : (
        <div className="text-red-500">Dados da luta não carregados corretamente</div>
      )}
      <div className="mt-4">
        <Link href={`/eventos/${eventoId}`} className="text-blue-500 hover:underline">
          Voltar para o evento
        </Link>
      </div>
    </div>
  );
} 