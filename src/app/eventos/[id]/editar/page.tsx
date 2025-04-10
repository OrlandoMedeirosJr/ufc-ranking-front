'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from 'react-modal';
import React, { use } from 'react';
import LutaForm, { Luta } from '@/components/LutaForm';
import { buildApiUrl, apiGet, apiPut, apiPost } from '@/config/api';
import { useToast } from "@/components/ui/use-toast";

interface Evento {
  id: number;
  nome: string;
  data?: string;
  local?: string;
  pais?: string;
  finalizado: boolean;
  // Campos estatísticos que aparecem no formulário mas não são enviados para o backend
  publicoTotal?: number;
  arrecadacao?: number;
  payPerView?: number;
}

// Modificado para NextJS 15 - params agora é uma Promise
export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params já que agora é uma Promise
  const unwrappedParams = await params;
  const eventIdFromParams = unwrappedParams.id;
  
  // Transformamos o componente em cliente após o await dos params
  return <EditarEventoClient eventId={eventIdFromParams} />;
}

// Componente cliente que recebe o ID já processado
function EditarEventoClient({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [lutadoresCadastrados, setLutadoresCadastrados] = useState<string[]>([]);
  const [lutadorEmVerificacao, setLutadorEmVerificacao] = useState<{nome: string, index: number, campo: 'lutador1' | 'lutador2'} | null>(null);
  const [eventoId, setEventoId] = useState<string>(eventId || "");
  const [retryButton, setRetryButton] = useState<React.ReactNode | null>(null);
  
  // Configurar Modal para acessibilidade após montagem do componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Modal.setAppElement('body');
    }
  }, []);

  const [formData, setFormData] = useState({
    nome: '',
    data: '',
    local: '',
    pais: '',
    finalizado: false,
    publicoTotal: '',
    arrecadacao: '',
    payPerView: ''
  });

  const [lutas, setLutas] = useState<Luta[]>([]);
  const [lutasOriginais, setLutasOriginais] = useState<any[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [novoLutador, setNovoLutador] = useState({ nome: '', pais: '', sexo: 'Masculino' });

  // Função utilitária para tentar múltiplas URLs da API
  const fetchWithMultipleAttempts = async (path: string, options: RequestInit) => {
    // Usar diretamente URLs explícitas para maior confiabilidade
    const baseUrl = 'http://127.0.0.1:3334';
    const url = `${baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
    
    console.log(`Tentando requisição para URL explícita (IP): ${url}`);
    
    try {
      // Adicionar opções padrão para melhorar a comunicação com a API
      const fetchOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          ...options.headers
        },
        mode: 'cors' as RequestMode,
        credentials: 'omit' as RequestCredentials,
        cache: 'no-store' as RequestCache
      };
      
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao chamar ${url}`);
      }
      return response;
    } catch (error) {
      console.error(`Erro ao chamar ${url}:`, error);
      
      // Tentar um fallback direto com localhost
      try {
        const fallbackUrl = `http://localhost:3334/${path.startsWith('/') ? path.substring(1) : path}`;
        console.log(`Tentando fallback com localhost: ${fallbackUrl}`);
        
        const fallbackResponse = await fetch(fallbackUrl, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            ...options.headers
          },
          mode: 'cors' as RequestMode,
          credentials: 'omit' as RequestCredentials,
          cache: 'no-store' as RequestCache
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Erro HTTP ${fallbackResponse.status} ao chamar fallback ${fallbackUrl}`);
        }
        
        return fallbackResponse;
      } catch (fallbackError) {
        console.error(`Erro também no fallback:`, fallbackError);
        throw fallbackError;
      }
    }
  };

  // Carregar dados do evento e lutas
  useEffect(() => {
    // Usamos o ID passado como prop
    if (eventId) {
      setEventoId(eventId);
      carregarEvento(eventId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLutaChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Atualizar o estado da luta
    setLutas(prevLutas => {
      const newLutas = [...prevLutas];
      newLutas[index] = { ...newLutas[index], [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value };
      return newLutas;
    });
    
    // Verificar se o campo alterado é de um lutador e se ele foi preenchido completamente
    if ((name === 'lutador1' || name === 'lutador2') && value.trim() !== '') {
      // Usando setTimeout para verificar o lutador após o usuário terminar de digitar
      setTimeout(() => {
        verificarLutador(value.trim(), index, name as 'lutador1' | 'lutador2');
      }, 1000);
    }
  };

  const verificarLutador = async (nome: string, index: number, campo: 'lutador1' | 'lutador2') => {
    // Verificar se o nome do lutador já está na lista de lutadores cadastrados
    const lutadorJaCadastrado = lutadoresCadastrados.some(
      lutadorNome => lutadorNome === nome.toLowerCase().trim()
    );
    
    if (!lutadorJaCadastrado) {
      // Se não estiver cadastrado, preparar para abrir o modal
      setNovoLutador({
        nome: nome,
        pais: '',
        sexo: 'Masculino'
      });
      setLutadorEmVerificacao({ nome, index, campo });
      setModalIsOpen(true);
    }
  };

  const adicionarLuta = () => {
    // Adicionar a nova luta no INÍCIO da lista para que apareça no topo
    setLutas([{ 
      lutador1: '', 
      lutador2: '', 
      resultado: '', 
      tipo: '', 
      round: '1', 
      titulo: false, 
      bonus: [], 
      categoria: '' 
    }, ...lutas]);
    
    // Rolar a tela para o topo da seção de lutas
    setTimeout(() => {
      const lutasSection = document.querySelector('.lutas-section');
      if (lutasSection) {
        lutasSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const removerLuta = (index: number) => {
    setLutas(lutas.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    // Validação básica
    if (!formData.nome) {
      setError('O nome do evento é obrigatório');
      setEnviando(false);
      return;
    }

    try {
      // Criar um objeto com os dados do evento
      const eventoAtualizado = {
        nome: formData.nome,
        data: formData.data || undefined,
        local: formData.local || undefined,
        pais: formData.pais || undefined,
        finalizado: formData.finalizado
      };

      // Atualizar o evento
      console.log('Atualizando evento com ID:', eventoId);
      console.log('Dados para atualização:', eventoAtualizado);
      
      // Usar função robusta para comunicação com a API
      const eventoResponse = await fetchWithMultipleAttempts(`eventos/${eventoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(eventoAtualizado)
      });

      // Processar as lutas
      for (const luta of lutas) {
        // Certifique-se de que os nomes dos lutadores estão corretos
        if (!luta.lutador1 || !luta.lutador2) {
          continue; // Pular lutas sem lutadores definidos
        }

        const lutaData = {
          lutador1: luta.lutador1,
          lutador2: luta.lutador2,
          eventoId: parseInt(eventoId),
          resultado: luta.resultado || undefined,
          tipo: luta.tipo || undefined,
          round: luta.round || '1',
          titulo: luta.titulo || false,
          bonus: luta.bonus || undefined,
          categoria: luta.categoria || undefined
        };

        // Criar ou atualizar a luta dependendo se ela tem ID
        if (luta.id) {
          await fetchWithMultipleAttempts(`lutas/${luta.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(lutaData)
          });
        } else {
          await fetchWithMultipleAttempts('lutas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(lutaData)
          });
        }
      }

      // Redirecionar para a página de detalhes do evento após sucesso
      toast({
        title: "Evento atualizado",
        description: "O evento foi atualizado com sucesso",
      });
      
      router.push(`/eventos/${eventoId}`);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      // Verificar o tipo de error antes de acessar a propriedade message
      setError(`Erro ao salvar o evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setEnviando(false);
    }
  };

  const buscarOuCriarLutador = async (nome: string) => {
    try {
      // Primeiro, tenta buscar o lutador pelo nome exato
      const response = await fetchWithMultipleAttempts(`lutadores/buscar?nome=${encodeURIComponent(nome)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data && data.length > 0) {
        // Lutador encontrado
        return data[0].nome;
      }
      
      return null; // Lutador não encontrado
    } catch (error) {
      console.error('Erro ao buscar lutador:', error);
      return null;
    }
  };

  const carregarLutadoresCadastrados = async () => {
    try {
      const data = await fetchWithMultipleAttempts('lutadores', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json());
      
      // Extrair apenas os nomes dos lutadores e convertê-los para minúsculas para facilitar a comparação
      const nomes = data.map((lutador: any) => lutador.nome.toLowerCase().trim());
      setLutadoresCadastrados(nomes);
      
      return data;
    } catch (error) {
      console.error('Erro ao carregar lutadores cadastrados:', error);
      setError(`Erro ao carregar lutadores: ${error.message}`);
      return [];
    }
  };

  // Função para abrir o modal
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => {
    setModalIsOpen(false);
    setLutadorEmVerificacao(null);
  };

  const handleNovoLutadorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNovoLutador(prev => ({ ...prev, [name]: value }));
  };

  const handleCadastrarLutador = async () => {
    try {
      // Validação básica
      if (!novoLutador.nome || !novoLutador.pais) {
        alert('Por favor, preencha todos os campos do lutador.');
        return;
      }

      // Enviar requisição para cadastrar o lutador
      const response = await fetchWithMultipleAttempts('lutadores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoLutador),
      });

      if (!response.ok) {
        throw new Error(`Erro ao cadastrar lutador: ${response.status}`);
      }

      const lutadorCadastrado = await response.json();
      
      // Atualizar a lista de lutadores cadastrados
      setLutadoresCadastrados(prev => [...prev, novoLutador.nome.toLowerCase().trim()]);
      
      // Se há um lutador em verificação, atualizar a luta correspondente
      if (lutadorEmVerificacao) {
        const { index, campo } = lutadorEmVerificacao;
        setLutas(prevLutas => {
          const newLutas = [...prevLutas];
          newLutas[index] = { ...newLutas[index], [campo]: novoLutador.nome };
          return newLutas;
        });
      }
      
      toast({
        title: "Lutador cadastrado",
        description: `${novoLutador.nome} foi cadastrado com sucesso`,
        duration: 3000,
      });
      
      // Fechar o modal
      closeModal();
    } catch (error) {
      console.error('Erro ao cadastrar lutador:', error);
      alert(`Erro ao cadastrar lutador: ${error.message}`);
    }
  };

  const carregarEvento = async (id: string) => {
    if (!id) {
      setError('ID do evento não encontrado');
      setLoading(false);
      return;
    }

    try {
      console.log('Carregando evento com ID:', id);
      
      // Usar abordagem simplificada com fetch direto
      const url = `${process.env.NEXT_PUBLIC_API_URL}/eventos/${id}`;
      console.log(`Fazendo requisição para URL: ${url}`);
      
      const eventoResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit'
      });
      
      if (!eventoResponse.ok) {
        throw new Error(`Erro HTTP ${eventoResponse.status} ao carregar evento`);
      }
      
      const eventoData = await eventoResponse.json();
      
      if (!eventoData) {
        throw new Error('Evento não encontrado');
      }
      
      // Configurar o estado do evento
      setEvento(eventoData);
      
      // Configurar os dados do formulário
      setFormData({
        nome: eventoData.nome || '',
        data: eventoData.data ? new Date(eventoData.data).toISOString().split('T')[0] : '',
        local: eventoData.local || '',
        pais: eventoData.pais || '',
        finalizado: eventoData.finalizado || false,
        publicoTotal: eventoData.publicoTotal || '',
        arrecadacao: eventoData.arrecadacao || '',
        payPerView: eventoData.payPerView || ''
      });
      
      console.log('Evento carregado:', eventoData);
      
      // Carregar as lutas do evento
      const lutasUrl = `${process.env.NEXT_PUBLIC_API_URL}/eventos/${id}/lutas`;
      console.log(`Fazendo requisição para lutas: ${lutasUrl}`);
      
      const lutasResponse = await fetch(lutasUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit'
      });
      
      if (!lutasResponse.ok) {
        throw new Error(`Erro HTTP ${lutasResponse.status} ao carregar lutas`);
      }
      
      const lutasData = await lutasResponse.json();
      
      console.log('Lutas carregadas:', lutasData);
      
      // Configurar o estado das lutas (reversão da ordem para mostrar as mais recentes primeiro)
      setLutas(Array.isArray(lutasData) && lutasData.length > 0 ? [...lutasData].reverse() : []);
      setLutasOriginais(Array.isArray(lutasData) ? [...lutasData] : []);
      
      // Carregar lutadores cadastrados para verificação
      await carregarLutadoresCadastrados();
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      
      try {
        // Tentar fallback com localhost
        console.log('Tentando URL alternativa com localhost...');
        
        const fallbackUrl = `http://localhost:3334/eventos/${id}`;
        console.log(`Tentando fallback: ${fallbackUrl}`);
        
        const altEventoResponse = await fetch(fallbackUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          cache: 'no-store',
          credentials: 'omit'
        });
        
        if (!altEventoResponse.ok) {
          throw new Error(`Erro HTTP ${altEventoResponse.status} ao carregar evento via URL alternativa`);
        }
        
        const eventoData = await altEventoResponse.json();
        
        if (!eventoData) {
          throw new Error('Evento não encontrado');
        }
        
        // Configurar o estado do evento
        setEvento(eventoData);
        
        // Configurar os dados do formulário
        setFormData({
          nome: eventoData.nome || '',
          data: eventoData.data ? new Date(eventoData.data).toISOString().split('T')[0] : '',
          local: eventoData.local || '',
          pais: eventoData.pais || '',
          finalizado: eventoData.finalizado || false,
          publicoTotal: eventoData.publicoTotal || '',
          arrecadacao: eventoData.arrecadacao || '',
          payPerView: eventoData.payPerView || ''
        });
        
        console.log('Evento carregado via fallback:', eventoData);
        
        // Carregar as lutas do evento
        const altLutasUrl = `http://localhost:3334/eventos/${id}/lutas`;
        console.log(`Tentando fallback para lutas: ${altLutasUrl}`);
        
        const altLutasResponse = await fetch(altLutasUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          cache: 'no-store',
          credentials: 'omit'
        });
        
        if (!altLutasResponse.ok) {
          throw new Error(`Erro HTTP ${altLutasResponse.status} ao carregar lutas via URL alternativa`);
        }
        
        const lutasData = await altLutasResponse.json();
        
        console.log('Lutas carregadas via fallback:', lutasData);
        
        // Configurar o estado das lutas (reversão da ordem para mostrar as mais recentes primeiro)
        setLutas(Array.isArray(lutasData) && lutasData.length > 0 ? [...lutasData].reverse() : []);
        setLutasOriginais(Array.isArray(lutasData) ? [...lutasData] : []);
        
        // Carregar lutadores cadastrados para verificação
        await carregarLutadoresCadastrados();
        
        setLoading(false);
      } catch (fallbackError) {
        console.error('Erro também no fallback:', fallbackError);
        setError(`Erro ao carregar o evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        setRetryButton(
          <button 
            onClick={() => carregarEvento(id)} 
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Tentar Novamente
          </button>
        );
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Carregando evento...</h1>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Erro</h1>
        <p className="text-red-500">{error}</p>
        {retryButton}
        <div className="mt-4">
          <Link href="/eventos" className="text-blue-500 hover:underline">
            Voltar para a lista de eventos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Evento</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Informações do Evento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Evento*</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
              <input
                type="text"
                name="local"
                value={formData.local}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <input
                type="text"
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                name="finalizado"
                checked={formData.finalizado}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600"
              />
              <label className="ml-2 block text-sm font-medium text-gray-700">
                Evento Finalizado
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Público Total</label>
              <input
                type="number"
                name="publicoTotal"
                value={formData.publicoTotal}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arrecadação (USD)</label>
              <input
                type="number"
                name="arrecadacao"
                value={formData.arrecadacao}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay-Per-View (USD)</label>
              <input
                type="number"
                name="payPerView"
                value={formData.payPerView}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md lutas-section">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Lutas do Evento</h2>
            <button
              type="button"
              onClick={adicionarLuta}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
            >
              Adicionar Luta
            </button>
          </div>
          
          {lutas.length === 0 ? (
            <p className="text-gray-500 italic">Nenhuma luta cadastrada para este evento.</p>
          ) : (
            <div className="space-y-6">
              {lutas.map((luta, index) => (
                <div key={index} className="border border-gray-200 p-4 rounded-md relative">
                  <button
                    type="button"
                    onClick={() => removerLuta(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    X
                  </button>
                  
                  <LutaForm 
                    luta={luta} 
                    index={index} 
                    onChange={handleLutaChange} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <Link
            href={`/eventos/${eventoId}`}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Cancelar
          </Link>
          
          <button
            type="submit"
            disabled={enviando}
            className={`${
              enviando ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
            } text-white py-2 px-4 rounded`}
          >
            {enviando ? 'Salvando...' : 'Salvar Evento'}
          </button>
        </div>
      </form>
      
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Cadastrar Novo Lutador</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                name="nome"
                value={novoLutador.nome}
                onChange={handleNovoLutadorChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <input
                type="text"
                name="pais"
                value={novoLutador.pais}
                onChange={handleNovoLutadorChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select
                name="sexo"
                value={novoLutador.sexo}
                onChange={handleNovoLutadorChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
            >
              Cancelar
            </button>
            
            <button
              type="button"
              onClick={handleCadastrarLutador}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Cadastrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 