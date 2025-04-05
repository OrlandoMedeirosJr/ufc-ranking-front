'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from 'react-modal';
import React from 'react';
import LutaForm, { Luta } from '@/components/LutaForm';

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

export default function EditarEventoPage({ params }: { params: { id: string } }) {
  // Usar React.use para "unwrap" os parâmetros
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [lutadoresCadastrados, setLutadoresCadastrados] = useState<string[]>([]);
  const [lutadorEmVerificacao, setLutadorEmVerificacao] = useState<{nome: string, index: number, campo: 'lutador1' | 'lutador2'} | null>(null);
  
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

  // Carregar dados do evento e lutas
  useEffect(() => {
    const carregarEvento = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        
        // Carregar evento
        const eventoResponse = await fetch(`${API_URL}/eventos/${id}`);
        if (!eventoResponse.ok) {
          throw new Error(`Erro ao carregar evento: ${eventoResponse.status}`);
        }
        
        const eventoData = await eventoResponse.json();
        setEvento(eventoData);
        
        // Atualizar o formulário com os dados do evento
        setFormData({
          nome: eventoData.nome || '',
          data: eventoData.data ? new Date(eventoData.data).toISOString().split('T')[0] : '',
          local: eventoData.local || '',
          pais: eventoData.pais || '',
          finalizado: eventoData.finalizado || false,
          publicoTotal: eventoData.publicoTotal?.toString() || '',
          arrecadacao: eventoData.arrecadacao?.toString() || '',
          payPerView: eventoData.payPerView?.toString() || ''
        });
        
        // Carregar lutas do evento
        const lutasResponse = await fetch(`${API_URL}/eventos/${id}/lutas`);
        if (lutasResponse.ok) {
          const lutasData = await lutasResponse.json();
          setLutasOriginais(lutasData);
          
          // Converter para o formato da interface Luta
          const lutasFormatadas = lutasData.map(luta => {
            const resultado = luta.resultado?.vencedor 
              ? luta.resultado.vencedor === 'lutadorA' ? 'V1' 
              : luta.resultado.vencedor === 'lutadorB' ? 'V2'
              : luta.resultado.vencedor === 'empate' ? 'Empate'
              : 'NC'
              : '';
              
            let bonus = '';
            if (luta.resultado?.bonusLuta) bonus = 'Luta da Noite';
            else if (luta.resultado?.bonusPerformance) bonus = 'Performance da Noite';
            
            return {
              id: luta.id,
              lutador1: luta.lutadorA.nome,
              lutador2: luta.lutadorB.nome,
              resultado: resultado,
              tipo: luta.resultado?.metodo || '',
              round: luta.resultado?.round?.toString() || '1',
              titulo: luta.resultado?.titulo || false,
              bonus: bonus,
              categoria: luta.categoria || 'Não definida'
            } as Luta;
          });
          
          setLutas(lutasFormatadas);
        }
        
        // Carregar lutadores cadastrados
        const lutadoresResponse = await fetch(`${API_URL}/lutadores`);
        if (lutadoresResponse.ok) {
          const lutadoresData = await lutadoresResponse.json();
          const nomes = lutadoresData.map(lutador => lutador.nome.toLowerCase().trim());
          setLutadoresCadastrados(nomes);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    carregarEvento();
  }, [id]);

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
      bonus: '', 
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
        finalizado: formData.finalizado
      };

      // Adicionar campos opcionais se estiverem preenchidos
      if (formData.data) {
        eventoAtualizado.data = new Date(formData.data).toISOString();
      }

      if (formData.local) {
        eventoAtualizado.local = formData.local;
      }

      if (formData.pais) {
        eventoAtualizado.pais = formData.pais;
      }

      // Processar lutas para adicioná-las ao evento
      const lutasProcessadas = lutas
        .filter(luta => luta.lutador1 && luta.lutador2) // Filtra apenas lutas com dois lutadores
        .map(luta => {
          // Criar objeto base da luta
          const lutaProcessada = {
            id: luta.id, // Mantém o ID se já existir
            lutadorA: { nome: luta.lutador1 },
            lutadorB: { nome: luta.lutador2 },
            categoria: luta.categoria || "Não definida"
          };

          // Adicionar resultado se houver
          if (luta.resultado) {
            let vencedor;
            switch (luta.resultado) {
              case 'V1': vencedor = 'lutadorA'; break;
              case 'V2': vencedor = 'lutadorB'; break;
              case 'Empate': vencedor = 'empate'; break;
              case 'NC': vencedor = 'sem_resultado'; break;
              default: vencedor = undefined;
            }
            
            if (vencedor) {
              lutaProcessada.resultado = { vencedor };
              
              if (luta.tipo) lutaProcessada.resultado.metodo = luta.tipo;
              if (luta.round) lutaProcessada.resultado.round = parseInt(luta.round, 10);
              if (luta.titulo) lutaProcessada.resultado.titulo = true;
              if (luta.bonus === 'Luta da Noite') lutaProcessada.resultado.bonusLuta = true;
              if (luta.bonus === 'Performance da Noite') lutaProcessada.resultado.bonusPerformance = true;
            }
          }
          
          return lutaProcessada;
        });

      // Adicionar lutas ao evento
      eventoAtualizado.lutas = lutasProcessadas;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      
      // Enviar evento atualizado com todas as lutas
      console.log('Atualizando evento com lutas:', JSON.stringify(eventoAtualizado));
      
      const eventoResponse = await fetch(`${API_URL}/eventos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventoAtualizado)
      });

      if (!eventoResponse.ok) {
        const text = await eventoResponse.text();
        console.log('Erro ao atualizar evento:', text);
        setError(`Falha ao atualizar evento: ${eventoResponse.status} ${eventoResponse.statusText}`);
        setEnviando(false);
        return;
      }
      
      console.log('Evento atualizado com sucesso');
      
      // Sucesso! Redirecionar para a página do evento
      router.push(`/eventos/${id}`);
      router.refresh();
    } catch (err) {
      console.error('Erro:', err);
      setError(`Erro: ${err.message}`);
      setEnviando(false);
    }
  };

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
      if (!novoLutador.nome || !novoLutador.pais) {
        alert('Nome e país do lutador são obrigatórios.');
        return;
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${API_URL}/lutadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoLutador),
      });

      if (!response.ok) {
        throw new Error('Erro ao cadastrar lutador');
      }

      const data = await response.json();
      console.log('Lutador cadastrado:', data);
      
      // Adicionar o novo lutador à lista de lutadores cadastrados
      setLutadoresCadastrados(prev => [...prev, novoLutador.nome.toLowerCase().trim()]);
      
      // Se estava verificando um lutador específico, atualizar o valor na luta
      if (lutadorEmVerificacao) {
        const { index, campo } = lutadorEmVerificacao;
        setLutas(prev => {
          const newLutas = [...prev];
          // O nome já está definido, então não precisamos alterar novamente
          return newLutas;
        });
      }
      
      closeModal();
    } catch (error) {
      console.error('Erro ao cadastrar lutador:', error);
      alert('Erro ao cadastrar lutador. Tente novamente.');
    }
  };

  // Lista de países para o select
  const paises = [
    'Brasil', 'EUA', 'Canadá', 'México', 
    'Argentina', 'Reino Unido', 'França', 'Alemanha', 
    'Espanha', 'Itália', 'Portugal', 'Rússia', 
    'China', 'Japão', 'Austrália', 'Emirados Árabes Unidos'
  ].sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700">
        <h2 className="text-lg font-bold mb-2">Erro</h2>
        <p>{error}</p>
        <Link href="/eventos" className="mt-4 inline-block text-blue-600 hover:underline">
          Voltar para lista de eventos
        </Link>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-yellow-700">
        <h2 className="text-lg font-bold mb-2">Evento não encontrado</h2>
        <p>O evento solicitado não foi encontrado.</p>
        <Link href="/eventos" className="mt-4 inline-block text-blue-600 hover:underline">
          Voltar para lista de eventos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/eventos/${id}`} className="text-blue-600 hover:underline">
          ← Voltar para detalhes do evento
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-6">Editar Evento</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded border border-red-300">
          <h3 className="font-bold mb-2">Erro ao salvar alterações</h3>
          <p className="mb-2">{error}</p>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setError(null)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label className="block mb-2 font-medium" htmlFor="nome">
            Nome do Evento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Ex: UFC 310: Silva vs. Thompson"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium" htmlFor="data">
            Data
          </label>
          <input
            type="date"
            id="data"
            name="data"
            value={formData.data}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium" htmlFor="local">
            Local
          </label>
          <input
            type="text"
            id="local"
            name="local"
            value={formData.local}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Ex: T-Mobile Arena, Las Vegas"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium" htmlFor="pais">
            País
          </label>
          <select
            id="pais"
            name="pais"
            value={formData.pais}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione um país</option>
            {paises.map((pais) => (
              <option key={pais} value={pais}>
                {pais}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="finalizado"
              checked={formData.finalizado}
              onChange={handleChange}
              className="mr-2"
            />
            <span>Evento Finalizado</span>
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium" htmlFor="publicoTotal">
              Público Total
            </label>
            <input
              type="number"
              id="publicoTotal"
              name="publicoTotal"
              value={formData.publicoTotal}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Ex: 20000"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Dados estatísticos (não disponíveis no backend)</p>
          </div>
          
          <div>
            <label className="block mb-2 font-medium" htmlFor="arrecadacao">
              Arrecadação (USD)
            </label>
            <input
              type="number"
              id="arrecadacao"
              name="arrecadacao"
              value={formData.arrecadacao}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Ex: 9000000"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">Dados estatísticos (não disponíveis no backend)</p>
          </div>
          
          <div>
            <label className="block mb-2 font-medium" htmlFor="payPerView">
              Pay-per-view (vendas)
            </label>
            <input
              type="number"
              id="payPerView"
              name="payPerView"
              value={formData.payPerView}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Ex: 800000"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Dados estatísticos (não disponíveis no backend)</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Lutas do Evento</h3>
            <button 
              type="button" 
              onClick={adicionarLuta} 
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              + Adicionar Luta
            </button>
          </div>
          
          {lutas.length === 0 && (
            <p className="text-gray-500 italic">Nenhuma luta cadastrada. Clique em "Adicionar Luta" para começar.</p>
          )}
          
          <div className="lutas-section">
            {lutas.map((luta, index) => (
              <LutaForm 
                key={luta.id || index}
                luta={luta}
                index={index}
                onChange={handleLutaChange}
                onRemove={removerLuta}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={enviando}
            className={`px-4 py-2 bg-blue-600 text-white rounded ${
              enviando ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            } transition-colors`}
          >
            {enviando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          
          <Link
            href={`/eventos/${id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Cadastrar Novo Lutador"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            maxWidth: '500px',
            width: '100%'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)'
          }
        }}
      >
        <h2 className="text-xl font-bold mb-4">
          {lutadorEmVerificacao 
            ? `Cadastrar Lutador: ${lutadorEmVerificacao.nome}` 
            : 'Cadastrar Novo Lutador'
          }
        </h2>
        <div className="space-y-3">
          <input
            type="text"
            name="nome"
            value={novoLutador.nome}
            onChange={handleNovoLutadorChange}
            placeholder="Nome do Lutador"
            className="w-full p-2 border rounded"
            disabled={!!lutadorEmVerificacao}
          />
          <input
            type="text"
            name="pais"
            value={novoLutador.pais}
            onChange={handleNovoLutadorChange}
            placeholder="País"
            className="w-full p-2 border rounded"
            required
          />
          <select
            name="sexo"
            value={novoLutador.sexo}
            onChange={handleNovoLutadorChange}
            className="w-full p-2 border rounded"
          >
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleCadastrarLutador}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Cadastrar
            </button>
            <button 
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 