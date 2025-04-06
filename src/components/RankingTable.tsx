'use client';

import React, { useState } from 'react';
import LutadorModal from './LutadorModal';

interface Lutador {
  nome: string;
  apelido: string | null;
  pais: string;
  id: number;
}

interface RankingItem {
  id: number;
  lutadorId: number;
  posicao: number;
  pontos: number;
  corFundo: string;
  variacao: number;
  lutador: Lutador | null;
}

interface EstatisticasLutador {
  nome: string;
  pais: string;
  sexo: string;
  totalLutas: number;
  vitorias: number;
  derrotas: number;
  nocautes: number;
  finalizacoes: number;
  decisoes: number;
  bonus: number;
  vitoriasTitulo: number;
}

interface RankingTableProps {
  dados: RankingItem[];
  categoria: string;
  categoriaTitulo: string;
  corBackgroundMap: Record<string, string>;
}

const RankingTable: React.FC<RankingTableProps> = ({ 
  dados, 
  categoria,
  categoriaTitulo,
  corBackgroundMap 
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [lutadorSelecionado, setLutadorSelecionado] = useState<number | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasLutador | null>(null);
  const [carregando, setCarregando] = useState(false);

  const abrirModal = async (lutadorId: number) => {
    if (!lutadorId) return;
    
    setLutadorSelecionado(lutadorId);
    setEstatisticas(null);
    setCarregando(true);
    setModalAberto(true);
    
    try {
      let url = '';
      if (categoria === 'peso-por-peso') {
        // Se estiver no ranking peso-por-peso, busca estatísticas gerais
        url = `http://localhost:3333/lutadores/${lutadorId}/estatisticas`;
      } else {
        // Para outras categorias, busca estatísticas específicas da categoria
        const categoriaFormatada = categoriaTitulo;
        url = `http://localhost:3333/lutadores/${lutadorId}/estatisticas/${encodeURIComponent(categoriaFormatada)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas');
      }
      const data = await response.json();
      setEstatisticas(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setCarregando(false);
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setLutadorSelecionado(null);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Ranking: {categoriaTitulo}</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-4 py-3 text-left w-16">POS</th>
              <th className="px-4 py-3 text-left">LUTADOR</th>
              <th className="px-4 py-3 text-right w-24">PONTOS</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((item) => (
              <tr 
                key={item.id} 
                className={`border-b ${corBackgroundMap[item.corFundo] || 'bg-gray-100 hover:bg-gray-200'} cursor-pointer`}
                onClick={() => abrirModal(item.lutadorId)}
              >
                <td className="px-4 py-3 font-bold">
                  {item.posicao}
                  {item.variacao > 0 && (
                    <span className="ml-1 text-green-600 inline-flex items-center">
                      <span>↑</span>
                      <span className="text-xs">{item.variacao}</span>
                    </span>
                  )}
                  {item.variacao < 0 && (
                    <span className="ml-1 text-red-600 inline-flex items-center">
                      <span>↓</span>
                      <span className="text-xs">{Math.abs(item.variacao)}</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {item.lutador?.nome}
                  {item.lutador?.apelido && (
                    <span className="ml-1 text-gray-500">"{item.lutador.apelido}"</span>
                  )}
                  <span className="ml-2 text-xs text-gray-500">
                    {item.lutador?.pais}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {item.pontos}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {dados.length === 0 && (
        <p className="p-4 text-center bg-gray-100 rounded">
          Não há lutadores classificados nesta categoria.
        </p>
      )}

      <LutadorModal 
        isOpen={modalAberto}
        onClose={fecharModal}
        lutadorId={lutadorSelecionado}
        categoria={categoriaTitulo}
        estatisticas={estatisticas}
        isLoading={carregando}
      />
    </div>
  );
};

export default RankingTable; 