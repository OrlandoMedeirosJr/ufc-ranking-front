'use client';

import { useState, useEffect } from "react";

interface Lutador {
  id: number;
  nome: string;
  pais: string;
  sexo: string;
}

export default function LutadoresPage() {
  const [lutadores, setLutadores] = useState<Lutador[]>([]);
  const [usandoDadosExemplo, setUsandoDadosExemplo] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [atualizacaoForcada, setAtualizacaoForcada] = useState(0);

  // Dados de exemplo para fallback
  const lutadoresExemplo: Lutador[] = [
    { id: 1, nome: "Lutador 1", pais: "Brasil", sexo: "Masculino" },
    { id: 2, nome: "Lutador 2", pais: "EUA", sexo: "Masculino" },
    { id: 3, nome: "Lutador 3", pais: "Rússia", sexo: "Masculino" },
    { id: 4, nome: "Lutador 4", pais: "Brasil", sexo: "Feminino" },
    { id: 5, nome: "Lutador 5", pais: "México", sexo: "Masculino" },
    { id: 6, nome: "Lutador 6", pais: "Nigéria", sexo: "Masculino" },
    { id: 7, nome: "Lutador 7", pais: "EUA", sexo: "Feminino" },
    { id: 8, nome: "Lutador 8", pais: "Brasil", sexo: "Masculino" },
    { id: 9, nome: "Lutador 9", pais: "Rússia", sexo: "Feminino" },
    { id: 10, nome: "Lutador 10", pais: "México", sexo: "Masculino" },
    { id: 11, nome: "Lutador 11", pais: "Brasil", sexo: "Masculino" },
    { id: 12, nome: "Lutador 12", pais: "EUA", sexo: "Feminino" },
  ];

  useEffect(() => {
    const buscarLutadores = async () => {
      setCarregando(true);
      try {
        // Tentamos buscar do backend com timeout de 3 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        try {
          console.log("Buscando lutadores do backend...");
          // Primeiro tentamos o endpoint oficial
          const res = await fetch("http://localhost:3333/lutadores", { 
            cache: "no-store",
            signal: controller.signal,
            // Forçando uma busca 100% nova, sem cache
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          clearTimeout(timeoutId);
          
          // Se conseguimos uma resposta e ela é válida
          if (res.ok) {
            const dadosDaApi = await res.json();
            console.log("Dados de lutadores recebidos da API:", dadosDaApi);
            
            if (Array.isArray(dadosDaApi)) {
              setLutadores(dadosDaApi);
              setUsandoDadosExemplo(false);
              
              if (dadosDaApi.length === 0) {
                console.log("API retornou array vazio de lutadores, sem lutadores para mostrar");
              }
            } else {
              // Usar dados de exemplo se o backend retornar algo que não é um array
              console.log("API não retornou um array válido de lutadores, usando dados de exemplo");
              setLutadores(lutadoresExemplo);
              setUsandoDadosExemplo(true);
            }
          } else {
            // Erro na resposta da API
            console.error("Erro na resposta da API de lutadores:", res.status, await res.text());
            setLutadores(lutadoresExemplo);
            setUsandoDadosExemplo(true);
          }
        } catch (fetchError) {
          // Erro ao fazer a requisição
          console.error("Erro ao fazer requisição para lutadores:", fetchError);
          setLutadores(lutadoresExemplo);
          setUsandoDadosExemplo(true);
        }
      } catch (error) {
        console.error("Erro ao tentar buscar lutadores do backend:", error);
        setLutadores(lutadoresExemplo);
        setUsandoDadosExemplo(true);
      } finally {
        setCarregando(false);
      }
    };

    buscarLutadores();
  }, [atualizacaoForcada]); // Usar atualizacaoForcada como dependência para forçar atualizações

  // Função global que pode ser chamada por outros componentes para forçar atualização
  window.atualizarLutadores = () => {
    setAtualizacaoForcada(prev => prev + 1);
  };

  if (carregando) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Carregando lutadores...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">👊 Lutadores</h2>
      
      {usandoDadosExemplo && (
        <div className="mb-4 p-3 bg-yellow-100 rounded border border-yellow-300">
          <p className="text-yellow-800">
            <strong>Nota:</strong> Mostrando dados de exemplo para demonstração.
          </p>
        </div>
      )}
      
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {lutadores.map((lutador) => (
          <li key={lutador.id} className="p-3 border rounded shadow-sm bg-white">
            <strong>{lutador.nome}</strong>
            <div className="text-sm text-gray-600">
              {lutador.pais} — {lutador.sexo}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
