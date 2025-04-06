'use client';

import React from 'react';

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

interface LutadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lutadorId: number | null;
  categoria: string;
  estatisticas: EstatisticasLutador | null;
  isLoading: boolean;
}

const LutadorModal: React.FC<LutadorModalProps> = ({ 
  isOpen, 
  onClose, 
  lutadorId,
  categoria,
  estatisticas,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 overflow-hidden">
        <div className="flex justify-between items-center bg-gray-800 text-white p-4">
          <h3 className="text-xl font-bold">
            {estatisticas ? estatisticas.nome : 'Carregando...'}
            <span className="ml-2 text-sm font-normal opacity-80">
              {categoria}
            </span>
          </h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : estatisticas ? (
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="text-sm text-gray-600">{estatisticas.pais}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 p-3 rounded-md">
                  <div className="text-3xl font-bold text-center">{estatisticas.totalLutas}</div>
                  <div className="text-sm text-center text-gray-600">Total de Lutas</div>
                </div>
                <div className="bg-green-100 p-3 rounded-md">
                  <div className="text-3xl font-bold text-center text-green-700">{estatisticas.vitorias}</div>
                  <div className="text-sm text-center text-gray-600">Vitórias</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-100 p-3 rounded-md">
                  <div className="text-2xl font-bold text-center">{estatisticas.nocautes}</div>
                  <div className="text-xs text-center text-gray-600">Nocautes</div>
                </div>
                <div className="bg-gray-100 p-3 rounded-md">
                  <div className="text-2xl font-bold text-center">{estatisticas.finalizacoes}</div>
                  <div className="text-xs text-center text-gray-600">Finalizações</div>
                </div>
                <div className="bg-gray-100 p-3 rounded-md">
                  <div className="text-2xl font-bold text-center">{estatisticas.decisoes}</div>
                  <div className="text-xs text-center text-gray-600">Decisões</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-100 p-3 rounded-md">
                  <div className="text-2xl font-bold text-center text-purple-700">{estatisticas.bonus}</div>
                  <div className="text-sm text-center text-gray-600">Bônus</div>
                </div>
                <div className="bg-yellow-100 p-3 rounded-md">
                  <div className="text-2xl font-bold text-center text-yellow-700">{estatisticas.vitoriasTitulo}</div>
                  <div className="text-sm text-center text-gray-600">Vitórias de Título</div>
                </div>
              </div>
              
              <div className="bg-red-100 p-3 rounded-md">
                <div className="text-3xl font-bold text-center text-red-700">{estatisticas.derrotas}</div>
                <div className="text-sm text-center text-gray-600">Derrotas</div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Não foi possível carregar as estatísticas.</p>
          )}
        </div>
        
        <div className="bg-gray-100 p-4 text-right">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LutadorModal; 