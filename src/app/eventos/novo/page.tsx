'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from 'react-modal';
import LutaForm, { Luta } from '@/components/LutaForm';

export default function NovoEventoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lutadoresCadastrados, setLutadoresCadastrados] = useState<string[]>([]);
  const [lutadorEmVerificacao, setLutadorEmVerificacao] = useState<{nome: string, index: number, campo: 'lutador1' | 'lutador2'} | null>(null);

  // Configurar o Modal após a montagem do componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Modal.setAppElement('body');
    }
  }, []);

  // Carregar lutadores já cadastrados ao iniciar
  useEffect(() => {
    const carregarLutadores = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/lutadores`);
        if (response.ok) {
          const data = await response.json();
          // Extrair apenas os nomes dos lutadores para verificação rápida
          const nomes = data.map((lutador: any) => lutador.nome.toLowerCase().trim());
          setLutadoresCadastrados(nomes);
        }
      } catch (error) {
        console.error('Erro ao carregar lutadores:', error);
      }
    };
    
    carregarLutadores();
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

  const [lutas, setLutas] = useState<Luta[]>([{ 
    lutador1: '', 
    lutador2: '', 
    resultado: '', // V1, V2, Empate, NC
    tipo: '', // Nocaute, Finalização, Decisão Unânime, Decisão Dividida, Desclassificação
    round: '1', // 1 a 5
    titulo: false, // Disputa de título? (Sim/Não)
    bonus: '', // Performance da Noite, Luta da Noite, Nenhum
    categoria: '' // Categoria da luta
  }]);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [novoLutador, setNovoLutador] = useState({ nome: '', pais: '', sexo: 'Masculino' });

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
    setLoading(true);
    setError(null);

    // Validação básica
    if (!formData.nome) {
      setError('O nome do evento é obrigatório');
      setLoading(false);
      return;
    }

    try {
      // 1. Primeiro, criar apenas o evento básico (sem lutas)
      const eventoBasico = {
        nome: formData.nome,
        finalizado: false
      };

      // Adicionar campos opcionais se estiverem preenchidos
      if (formData.data) {
        eventoBasico.data = new Date(formData.data).toISOString();
      }

      if (formData.local) {
        eventoBasico.local = formData.local;
      }

      if (formData.pais) {
        eventoBasico.pais = formData.pais;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      
      console.log('Criando evento básico:', eventoBasico);
      
      // Criar o evento básico primeiro
      const responseEvento = await fetch(`${API_URL}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventoBasico)
      });

      if (!responseEvento.ok) {
        let mensagemErro = 'Erro ao criar evento';
        try {
          const errorData = await responseEvento.json();
          mensagemErro = errorData.error || 'Erro desconhecido';
          console.error('Erro ao criar evento:', errorData);
        } catch {
          console.error('Erro ao criar evento:', responseEvento.status, responseEvento.statusText);
        }
        setError(mensagemErro);
        setLoading(false);
        return;
      }

      // 2. Se o evento foi criado com sucesso, obter o ID do evento
      const eventoResponse = await responseEvento.json();
      const eventoId = eventoResponse.evento?.id || eventoResponse.id;
      
      if (!eventoId) {
        console.error('Resposta do servidor não contém ID do evento:', eventoResponse);
        setError('Erro ao obter ID do evento criado');
        setLoading(false);
        return;
      }
      
      console.log(`Evento criado com ID: ${eventoId}`);

      // 3. Filtrar apenas lutas válidas para adicionar
      const lutasValidas = lutas.filter(luta => luta.lutador1 && luta.lutador2);
      
      // 4. Adicionar cada luta individualmente
      const lutasCriadas = [];
      const errosLutas = [];
      
      if (lutasValidas.length > 0) {
        console.log(`Adicionando ${lutasValidas.length} lutas ao evento ${eventoId}`);
        
        for (const luta of lutasValidas) {
          try {
            // Adicionar a luta ao evento
            const responseLuta = await fetch(`${API_URL}/eventos/${eventoId}/lutas`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(luta)
            });
            
            if (responseLuta.ok) {
              const lutaResponse = await responseLuta.json();
              lutasCriadas.push(lutaResponse.luta);
              console.log(`Luta adicionada com sucesso: ${lutasCriadas.length}/${lutasValidas.length}`);
            } else {
              const errorData = await responseLuta.json();
              console.error('Erro ao adicionar luta:', errorData);
              errosLutas.push({
                luta: `${luta.lutador1} vs ${luta.lutador2}`, 
                erro: errorData.error || 'Erro desconhecido'
              });
            }
          } catch (error) {
            console.error('Erro ao processar luta:', error);
            errosLutas.push({
              luta: `${luta.lutador1} vs ${luta.lutador2}`,
              erro: error.message || 'Erro desconhecido'
            });
          }
        }
      }
      
      // 5. Verificar se todas as lutas foram adicionadas com sucesso
      if (errosLutas.length > 0) {
        // Algumas lutas falharam, mas o evento foi criado
        const mensagemErro = `Evento criado, mas ${errosLutas.length} luta(s) não puderam ser adicionadas.\n\n` +
          errosLutas.map(e => `- ${e.luta}: ${e.erro}`).join('\n');
        
        setError(mensagemErro);
        setLoading(false);
        
        // Mostrar botão para continuar mesmo com erro
        if (confirm(`${mensagemErro}\n\nDeseja ir para a lista de eventos mesmo assim?`)) {
          router.push('/eventos');
          router.refresh();
        }
        return;
      }
      
      // Sucesso completo - evento criado e todas as lutas adicionadas
      console.log(`Evento criado com sucesso com ${lutasCriadas.length} lutas`);
      router.push('/eventos');
      router.refresh();

    } catch (error) {
      console.error('Erro ao processar evento:', error);
      setError(`Erro ao processar evento: ${error.message || 'Erro desconhecido'}`);
      setLoading(false);
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

  // Lista de categorias do UFC
  const categorias = [
    'Peso Mosca',
    'Peso Galo',
    'Peso Pena',
    'Peso Leve',
    'Peso Meio-Médio',
    'Peso Médio',
    'Peso Meio-Pesado',
    'Peso Pesado',
    'Peso Palha Feminino',
    'Peso Mosca Feminino',
    'Peso Galo Feminino',
    'Peso Pena Feminino',
    'Peso Leve Feminino',
    'Peso Casado'
  ];

  // Lista de resultados possíveis
  const resultados = [
    'V1', // Vitória Lutador 1
    'V2', // Vitória Lutador 2
    'Empate',
    'NC' // No Contest (Sem Resultado)
  ];

  // Tipos de vitória
  const tiposVitoria = [
    'Nocaute',
    'Finalização',
    'Decisão Unânime',
    'Decisão Dividida',
    'Desclassificação'
  ];

  // Opções de bônus
  const opcoesBonus = [
    'Performance da Noite',
    'Luta da Noite', 
    'Nenhum'
  ];

  const testarEventoSimples = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Dados mínimos de um evento
      const eventoMinimo = {
        nome: 'Evento de Teste ' + new Date().toISOString().split('T')[0],
        finalizado: false
      };
      
      console.log('Testando evento mínimo:', eventoMinimo);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${API_URL}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventoMinimo)
      });
      
      console.log('Resposta do backend - status:', response.status, response.statusText);
      
      if (!response.ok) {
        const text = await response.text();
        console.log('Resposta de erro:', text);
        setError(`Teste falhou: ${response.status} ${response.statusText} - ${text}`);
      } else {
        const data = await response.text();
        console.log('Teste bem-sucedido:', data);
        alert('Evento de teste criado com sucesso! Verifique o console para mais detalhes.');
        router.push('/eventos');
        router.refresh();
      }
    } catch (err) {
      console.error('Erro no teste:', err);
      setError(`Erro no teste: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/eventos" className="text-blue-600 hover:text-blue-800 mr-2">
          ← Voltar para eventos
        </Link>
        <h2 className="text-2xl font-bold">Cadastrar Novo Evento</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded border border-red-300">
          <h3 className="font-bold mb-2">Erro ao salvar evento</h3>
          <div className="mb-2 whitespace-pre-line">{error}</div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setError(null)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Fechar
            </button>
            <button 
              type="button"
              onClick={() => {
                window.scrollTo(0, 0);
                setError(null);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Editar e tentar novamente
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
                key={index}
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
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            } transition-colors`}
          >
            {loading ? 'Salvando...' : 'Salvar Evento'}
          </button>
          
          <Link
            href="/eventos"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
          
          <button
            type="button"
            onClick={testarEventoSimples}
            disabled={loading}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            Testar API
          </button>
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